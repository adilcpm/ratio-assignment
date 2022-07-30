import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { Platform } from "../target/types/platform";
import { Farm } from "../target/types/farm";

import { getMint, createMint, getOrCreateAssociatedTokenAccount, getAccount as getTokenAccount, Account as tokenAccount, mintTo } from '@solana/spl-token';
import { assert } from "chai";

const REWARDS_PER_SECOND: number = new anchor.BN(0.01);
const DECIMALS : number = 6;

describe("farm-test", () => {
  // Configure the client to use the local cluster.
  let provider = anchor.AnchorProvider.env();
  const wallet = provider.wallet as anchor.Wallet;
  anchor.setProvider(provider);
  const program = anchor.workspace.Platform as Program<Platform>;
  const farmProgram = anchor.workspace.Farm as Program<Farm>;

  const superUser = anchor.web3.Keypair.generate();
  const baseUser = anchor.web3.Keypair.generate();

  let globalStatePda: anchor.web3.PublicKey;
  let globalStatePdaBump: number;

  let poolAccountPda: anchor.web3.PublicKey;
  let poolAccountPdaBump: number;

  let farmAccountPda: anchor.web3.PublicKey;
  let farmAccountPdaBump: number;

  let testTokenMint: anchor.web3.PublicKey;

  let poolTestTokenAccount: tokenAccount;
  let baseUserTestTokenAccount: tokenAccount;

  let slotWhenStaking: number, timestampWhenStaking: number;
  let slotWhenHarvesting: number, timestampWhenHarvesting: number;
  

  it("BOILER PLATE: Funding and Pda", async () => {
    const [_globalStatePda, _globalStatePdaBump] = await anchor.web3.PublicKey.findProgramAddress(
      [superUser.publicKey.toBuffer(), baseUser.publicKey.toBuffer()],
      program.programId
    );
    globalStatePda = _globalStatePda;
    globalStatePdaBump = _globalStatePdaBump;

    const [_poolAccountPda, _poolAccountPdaBump] = await anchor.web3.PublicKey.findProgramAddress(
      [globalStatePda.toBuffer()],
      program.programId
    );
    poolAccountPda = _poolAccountPda;
    poolAccountPdaBump = _poolAccountPdaBump;

    const [_farmAccountPda, _farmAccountPdaBump] = await anchor.web3.PublicKey.findProgramAddress(
      [poolAccountPda.toBuffer()],
      program.programId
    );
    farmAccountPda = _farmAccountPda;
    farmAccountPdaBump = _farmAccountPdaBump;

    console.log("Global State Account Pda: ", globalStatePda.toString())
    console.log("Pool Account Pda: ", poolAccountPda.toString())
    console.log("Farm Account Pda: ", farmAccountPda.toString())
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
      globalStatePdaBump,
    ).accounts(
      {
        authority: superUser.publicKey,
        user: baseUser.publicKey,
        globalStateAccount: globalStatePda,
        systemProgram: anchor.web3.SystemProgram.programId
      }
    ).signers([superUser]).rpc();

    let globalStateAccount = await program.account.globalStateAccount.fetch(globalStatePda);
    assert.ok(globalStateAccount.totalDeposits.toNumber() == 0);
    assert.ok(globalStateAccount.authority.equals(superUser.publicKey));
    assert.ok(globalStateAccount.user.equals(baseUser.publicKey));
  });

  it("Super-User Create Token Mint", async () => {
    testTokenMint = await createMint(provider.connection, wallet.payer, superUser.publicKey, superUser.publicKey, DECIMALS);
    let mint = await getMint(provider.connection, testTokenMint)
    assert.ok(mint.isInitialized)
  });

  it("Super-User Create Pool", async () => {
    await program.methods.createPool(
      poolAccountPdaBump,
    ).accounts(
      {
        authority: superUser.publicKey,
        globalStateAccount: globalStatePda,
        poolAccount: poolAccountPda,
        mintTestToken: testTokenMint,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId
      }
    ).signers([superUser]).rpc();

    poolTestTokenAccount = await getTokenAccount(provider.connection, poolAccountPda);
    assert.ok(poolTestTokenAccount.owner.equals(globalStatePda));
  });

  it("Super User mint testToken to pool", async () => {
    const INITIAL_TEST_TOKEN_POOL = 100 * ((10) ** DECIMALS);
    await mintTo(provider.connection, wallet.payer, testTokenMint, poolAccountPda, superUser, INITIAL_TEST_TOKEN_POOL);
    poolTestTokenAccount = await getTokenAccount(provider.connection, poolAccountPda);
    assert.ok(Number(poolTestTokenAccount.amount) == INITIAL_TEST_TOKEN_POOL)

  });

  it("Super User mint testToken to Base User", async () => {
    const INITIAL_TEST_TOKEN_BASE_USER = 10 * ((10) ** DECIMALS);
    baseUserTestTokenAccount = await getOrCreateAssociatedTokenAccount(provider.connection, wallet.payer, testTokenMint, baseUser.publicKey, true);
    await mintTo(provider.connection, wallet.payer, testTokenMint, baseUserTestTokenAccount.address, superUser, INITIAL_TEST_TOKEN_BASE_USER);
    baseUserTestTokenAccount = await getTokenAccount(provider.connection, baseUserTestTokenAccount.address);
    assert.ok(Number(baseUserTestTokenAccount.amount) == INITIAL_TEST_TOKEN_BASE_USER)
  });

  it("Base user Deposits testToken to Pool", async () => {
    let depositAmount = new anchor.BN(5 * ((10) ** DECIMALS));
    let poolTestTokenAccountBefore = await getTokenAccount(provider.connection, poolAccountPda);
    let baseUserTestTokenAccountBefore = await getTokenAccount(provider.connection, baseUserTestTokenAccount.address);
    await program.methods.deposit(
      depositAmount
    ).accounts({
      user: baseUser.publicKey,
      poolAccount: poolAccountPda,
      userTokenAccount: baseUserTestTokenAccount.address,
      globalStateAccount: globalStatePda,
      tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
    }).signers([baseUser]).rpc();

    poolTestTokenAccount = await getTokenAccount(provider.connection, poolAccountPda);
    baseUserTestTokenAccount = await getTokenAccount(provider.connection, baseUserTestTokenAccount.address);
    assert.ok((poolTestTokenAccount.amount - poolTestTokenAccountBefore.amount) == BigInt(depositAmount));
    assert.ok((baseUserTestTokenAccountBefore.amount - baseUserTestTokenAccount.amount) == BigInt(depositAmount));
  });

  it("Base user tries to over withdraws testToken from Pool with error", async () => {
    let withdrawAmount = new anchor.BN(6 * ((10) ** DECIMALS));

    try {
      await program.methods.withdraw(
        withdrawAmount
      ).accounts({
        user: baseUser.publicKey,
        poolAccount: poolAccountPda,
        userTokenAccount: baseUserTestTokenAccount.address,
        globalStateAccount: globalStatePda,
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

  it("Create Farm Account", async () => {
    await program.methods.createFarm(
      farmAccountPdaBump,
      REWARDS_PER_SECOND
    ).accounts({
      authority: superUser.publicKey,
      farmAccount: farmAccountPda,
      globalStateAccount: globalStatePda,
      poolAccount: poolAccountPda,
      mintTestToken: testTokenMint,
      systemProgram: anchor.web3.SystemProgram.programId,
      tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      farmProgram: farmProgram.programId,
    }).signers([superUser]).rpc();

    let farmAccount = await getTokenAccount(provider.connection, farmAccountPda);
    assert.ok(farmAccount.mint.equals(testTokenMint));
    assert.ok(farmAccount.amount == BigInt(0));
  });

  it("Stake", async () => {
    let amount_to_stake = new anchor.BN(3 * ((10) ** DECIMALS));
    
    await program.methods.stake(
      amount_to_stake
    ).accounts({
      user: baseUser.publicKey,
      farmAccount: farmAccountPda,
      poolAccount: poolAccountPda,
      globalStateAccount: globalStatePda,
      tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
      farmProgram: farmProgram.programId,
    }).signers([baseUser]).rpc();
    slotWhenStaking = await provider.connection.getSlot();
    timestampWhenStaking = await provider.connection.getBlockTime(slotWhenStaking);

    let farmAccount = await getTokenAccount(provider.connection, farmAccountPda);
    let globalStateAccount = await program.account.globalStateAccount.fetch(globalStatePda);
    assert.ok(globalStateAccount.totalStaked == BigInt(amount_to_stake.toNumber()));
    assert.ok(farmAccount.amount == BigInt(amount_to_stake.toNumber()));
  });

  it("Harvest", async () => {
    await sleep(5000);
  
    let baseUserTestTokenAccountBefore = await getTokenAccount(provider.connection, baseUserTestTokenAccount.address);
    await program.methods.harvest().accounts({
      farmAccount: farmAccountPda,
      farmProgram: farmProgram.programId,
      globalStateAccount: globalStatePda,
      poolAccount: poolAccountPda,
      tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
      user: baseUser.publicKey,
      userTokenAccount: baseUserTestTokenAccount.address
    }).signers([baseUser]).rpc();

    // Reward Calculation
    slotWhenHarvesting = await provider.connection.getSlot();
    timestampWhenHarvesting = await provider.connection.getBlockTime(slotWhenHarvesting);
    let timeElapsed = timestampWhenHarvesting - timestampWhenStaking;
    let farmAccount = await getTokenAccount(provider.connection, farmAccountPda);
    let reward = calculate_reward(Number(farmAccount.amount),timeElapsed);
    console.log("Approximate Harvested Reward : ",reward);
    baseUserTestTokenAccount = await getTokenAccount(provider.connection, baseUserTestTokenAccount.address);
    
    // Verifying the correct reward with a tolerance of 2 seconds
    let rewardForTwoSeconds = calculate_reward(Number(farmAccount.amount),2);

    assert.ok(Math.abs(Number(baseUserTestTokenAccount.amount - baseUserTestTokenAccountBefore.amount) - reward) <= rewardForTwoSeconds);
  });


});

// Our own sleep function.
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function calculate_reward(stakedAmount: number, timeElapsed: number){
  let reward = stakedAmount * timeElapsed * REWARDS_PER_SECOND;
  return reward;
}