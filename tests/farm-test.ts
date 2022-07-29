import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { Platform } from "../target/types/platform";

import { getMint, createMint, getOrCreateAssociatedTokenAccount, getAccount as getTokenAccount, Account as tokenAccount, mintTo } from '@solana/spl-token';
import { assert } from "chai";

describe("farm-test", () => {
  // Configure the client to use the local cluster.
  let provider = anchor.AnchorProvider.env();
  const wallet = provider.wallet as anchor.Wallet;
  anchor.setProvider(provider);

  const program = anchor.workspace.Platform as Program<Platform>;

  const superUser = anchor.web3.Keypair.generate();
  const baseUser = anchor.web3.Keypair.generate();

  let globalStatePDA: anchor.web3.PublicKey;
  let globalStatePDABump: number;

  let poolAccountPDA: anchor.web3.PublicKey;
  let poolAccountPDABump: number;

  let testTokenMint: anchor.web3.PublicKey;
  let poolTestTokenAccount: tokenAccount;
  let baseUserTestTokenAccount: tokenAccount;

  let initialTestTokenPool = 40000000;
  let initialTestTokenBaseUser = 10000000;

  it("BOILER PLATE: Funding and PDA", async () => {
    const [_globalStatePDA, _globalStatePDABump] = await anchor.web3.PublicKey.findProgramAddress(
      [superUser.publicKey.toBuffer()],
      program.programId
    );
    globalStatePDA = _globalStatePDA;
    globalStatePDABump = _globalStatePDABump;

    const [_poolAccountPDA, _poolAccountPDABump] = await anchor.web3.PublicKey.findProgramAddress(
      [globalStatePDA.toBuffer()],
      program.programId
    );
    poolAccountPDA = _poolAccountPDA;
    poolAccountPDABump = _poolAccountPDABump;

    console.log("Global State Account PDA: ", globalStatePDA.toString())
    console.log("Pool Account PDA: ", poolAccountPDA.toString())
    console.log("Super User Pubkey: ", superUser.publicKey.toString())
    console.log("Base User Pubkey: ", baseUser.publicKey.toString())

    let transaction = new anchor.web3.Transaction();
    transaction.add(
      anchor.web3.SystemProgram.transfer({
        fromPubkey: provider.wallet.publicKey,
        toPubkey: superUser.publicKey,
        lamports: anchor.web3.LAMPORTS_PER_SOL / 10,
      })
    );
    transaction.add(
      anchor.web3.SystemProgram.transfer({
        fromPubkey: provider.wallet.publicKey,
        toPubkey: baseUser.publicKey,
        lamports: anchor.web3.LAMPORTS_PER_SOL / 100,
      })
    )
    await provider.sendAndConfirm(transaction);
  });

  it("Create Global State", async () => {
    await program.methods.initializeGlobalState(
      globalStatePDABump,
    ).accounts(
      {
        authority: superUser.publicKey,
        globalStateAccount: globalStatePDA,
        systemProgram: anchor.web3.SystemProgram.programId
      }
    ).signers([superUser]).rpc();

    let globalStateAccount = await program.account.globalStateAccount.fetch(globalStatePDA);
    assert.ok(globalStateAccount.totalDeposits.toNumber() == 0);
    assert.ok(globalStateAccount.authority.equals(superUser.publicKey));
  });

  it("Super-User Create Token Mint", async () => {
    testTokenMint = await createMint(provider.connection, wallet.payer, superUser.publicKey, superUser.publicKey, 6);
    let mint = await getMint(provider.connection, testTokenMint)
    assert.ok(mint.isInitialized)
  });

  it("Super-User Create Pool", async () => {
    await program.methods.createPool(
      poolAccountPDABump,
    ).accounts(
      {
        authority: superUser.publicKey,
        globalStateAccount: globalStatePDA,
        poolAccount: poolAccountPDA,
        mintTestToken: testTokenMint,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId
      }
    ).signers([superUser]).rpc();

    poolTestTokenAccount = await getTokenAccount(provider.connection, poolAccountPDA);
    assert.ok(poolTestTokenAccount.owner.equals(globalStatePDA));
  });

  it("Super User mint testToken to pool", async () => {
    await mintTo(provider.connection, wallet.payer, testTokenMint, poolAccountPDA, superUser, initialTestTokenPool);
    poolTestTokenAccount = await getTokenAccount(provider.connection, poolAccountPDA);
    assert.ok(Number(poolTestTokenAccount.amount) == initialTestTokenPool)
  });

  it("Super User mint testToken to Base User", async () => {
    baseUserTestTokenAccount = await getOrCreateAssociatedTokenAccount(provider.connection, wallet.payer, testTokenMint, baseUser.publicKey, true);
    await mintTo(provider.connection, wallet.payer, testTokenMint, baseUserTestTokenAccount.address, superUser, initialTestTokenBaseUser);
    baseUserTestTokenAccount = await getTokenAccount(provider.connection, baseUserTestTokenAccount.address);
    assert.ok(Number(baseUserTestTokenAccount.amount) == initialTestTokenBaseUser)
  });

  it("Base user Deposits testToken to Pool", async () => {
    let depositAmount = new anchor.BN(1000000);
    let poolTestTokenAccountBefore = await getTokenAccount(provider.connection, poolAccountPDA);
    let baseUserTestTokenAccountBefore = await getTokenAccount(provider.connection, baseUserTestTokenAccount.address);
    await program.methods.deposit(
      depositAmount
    ).accounts({
      baseUser: baseUser.publicKey,
      poolAccount: poolAccountPDA,
      baseUserTestTokenAccount: baseUserTestTokenAccount.address,
      globalStateAccount: globalStatePDA,
      tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
    }).signers([baseUser]).rpc();

    poolTestTokenAccount = await getTokenAccount(provider.connection, poolAccountPDA);
    baseUserTestTokenAccount = await getTokenAccount(provider.connection, baseUserTestTokenAccount.address);
    assert.ok((poolTestTokenAccount.amount - poolTestTokenAccountBefore.amount) == BigInt(depositAmount));
    assert.ok((baseUserTestTokenAccountBefore.amount - baseUserTestTokenAccount.amount) == BigInt(depositAmount));
  });

  it("Base user tries to over withdraws testToken from Pool with error", async () => {
    let withdrawAmount = new anchor.BN(2000000);
    
    try {
      await program.methods.withdraw(
        withdrawAmount
      ).accounts({
        baseUser: baseUser.publicKey,
        poolAccount: poolAccountPDA,
        baseUserTestTokenAccount: baseUserTestTokenAccount.address,
        globalStateAccount: globalStatePDA,
        tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
      }).signers([baseUser]).rpc();
      assert.ok(false);
    } catch (_err) {
      assert.isTrue(_err instanceof anchor.AnchorError);
      const err: anchor.AnchorError = _err;
      assert.strictEqual(err.error.errorCode.number, 6000);
      assert.strictEqual(
        err.program.toString(),
        program.programId.toString()
      );
    }
  });

});
