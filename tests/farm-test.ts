import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { Platform } from "../target/types/platform";
import { Farm } from "../target/types/farm";

import { getMint, createMint, getOrCreateAssociatedTokenAccount, getAccount as getTokenAccount, Account as tokenAccount, mintTo } from '@solana/spl-token';
import { assert } from "chai";
import { PublicKey } from "@solana/web3.js";

const REWARDS_PER_SECOND: number = 0.01;
const DECIMALS: number = 6;
const DECIMAL_MUL: number = 10 ** DECIMALS;

describe("farm-test", () => {
  // Configure the client to use the local cluster.
  let provider = anchor.AnchorProvider.env();
  const wallet = provider.wallet as anchor.Wallet;
  anchor.setProvider(provider);
  const program = anchor.workspace.Platform as Program<Platform>;
  const farmProgram = anchor.workspace.Farm as Program<Farm>;

  // These keys can be imported in Wallet for using in Front End ( with already established contract along with its states and accounts)
  const superUserSecret = new Uint8Array([72,200,219,228,177,245,158,117,168,230,195,191,173,23,141,179,226,177,211,144,220,75,115,80,160,89,30,193,255,199,198,113,98,242,171,155,148,1,196,189,31,59,68,255,190,238,237,36,175,180,144,110,181,172,142,32,135,204,155,88,124,228,35,93]);
  const baseUserSecret = new Uint8Array([232,204,247,3,136,186,142,99,53,249,131,141,169,213,122,60,87,246,39,107,6,212,102,213,16,43,149,28,35,136,248,208,208,154,129,101,124,42,135,241,200,41,213,62,20,10,89,168,235,20,198,201,225,187,58,161,113,139,243,94,34,80,248,96]);

  // const superUser = anchor.web3.Keypair.fromSecretKey(superUserSecret);
  // const baseUser = anchor.web3.Keypair.fromSecretKey(baseUserSecret);
  const superUser = anchor.web3.Keypair.generate();
  const baseUser = anchor.web3.Keypair.generate();

  let globalStatePda: anchor.web3.PublicKey;
  let globalStatePdaBump: number;

  let poolAccountPda: anchor.web3.PublicKey;
  let poolAccountPdaBump: number;

  let farmAccountPda: anchor.web3.PublicKey;
  let farmAccountPdaBump: number;

  let harvestSignerPda: anchor.web3.PublicKey;
  let harvestSignerPdaBump: number;

  let testTokenMint: anchor.web3.PublicKey;
  // Mint to be used for restoring already established contract along with its states and accounts
  // const testTokenMint = new PublicKey("A1ycKQ2Vy1uktK7uQTLad7Fy5PxQZCrKs28tSTfUgUrr");

  let poolTestTokenAccount: tokenAccount;
  let baseUserTestTokenAccount: tokenAccount;
  let harvestTestTokenAccount: tokenAccount;

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

    // This signer PDA will be used as owner for Harvest Token Account which will be the treasury for rewards
    const [_harvestSignerPda, _harvestSignerPdaBump] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from("harvest")],
      program.programId
    );
    harvestSignerPda = _harvestSignerPda;
    harvestSignerPdaBump = _harvestSignerPdaBump;

    console.log("Farm Program Address: ", farmProgram.programId.toString())
    console.log("Global State Account Pda: ", globalStatePda.toString())
    console.log("Pool Account Pda: ", poolAccountPda.toString())
    console.log("Farm Account Pda: ", farmAccountPda.toString())
    console.log("Harvest Signer Pda: ", harvestSignerPda.toString())
    console.log("Super User Pubkey: ", superUser.publicKey.toString())
    console.log("Super User Secret key: ", superUser.secretKey.toString())
    console.log("Base User Pubkey: ", baseUser.publicKey.toString())
    console.log("Base User Secret key: ", baseUser.secretKey.toString())

    //Funding the Base User and Super User Wallets with SOL for tx fees
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

  it("Super User Create Global State", async () => {
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
    console.log("Test Token Mint: ",testTokenMint.toString());
    let mint = await getMint(provider.connection, testTokenMint)
    assert.ok(mint.isInitialized)
  });

  it("Super-User mint testToken to Harvest Pool", async () => {
    const INITIAL_TEST_TOKEN_HARVEST = 100000000 * DECIMAL_MUL;
    harvestTestTokenAccount = await getOrCreateAssociatedTokenAccount(provider.connection, wallet.payer, testTokenMint, harvestSignerPda, true);
    await mintTo(provider.connection, wallet.payer, testTokenMint, harvestTestTokenAccount.address, superUser, INITIAL_TEST_TOKEN_HARVEST);
    harvestTestTokenAccount = await getTokenAccount(provider.connection, harvestTestTokenAccount.address);
    assert.ok(Number(harvestTestTokenAccount.amount) == INITIAL_TEST_TOKEN_HARVEST)
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

  // it("Super User mint testToken to pool", async () => {
  //   const INITIAL_TEST_TOKEN_POOL = 100 * DECIMAL_MUL;
  //   await mintTo(provider.connection, wallet.payer, testTokenMint, poolAccountPda, superUser, INITIAL_TEST_TOKEN_POOL);
  //   poolTestTokenAccount = await getTokenAccount(provider.connection, poolAccountPda);
  //   assert.ok(Number(poolTestTokenAccount.amount) == INITIAL_TEST_TOKEN_POOL)

  // });

  it("Super User mint testToken to Base User", async () => {
    const INITIAL_TEST_TOKEN_BASE_USER = 10 * DECIMAL_MUL;
    baseUserTestTokenAccount = await getOrCreateAssociatedTokenAccount(provider.connection, wallet.payer, testTokenMint, baseUser.publicKey, true);
    await mintTo(provider.connection, wallet.payer, testTokenMint, baseUserTestTokenAccount.address, superUser, INITIAL_TEST_TOKEN_BASE_USER);
    baseUserTestTokenAccount = await getTokenAccount(provider.connection, baseUserTestTokenAccount.address);
    assert.ok(Number(baseUserTestTokenAccount.amount) == INITIAL_TEST_TOKEN_BASE_USER)
  });

  it("Base user Deposits testToken to Pool", async () => {
    let depositAmount = new anchor.BN(5 * DECIMAL_MUL);
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
    assert.ok((poolTestTokenAccount.amount - poolTestTokenAccountBefore.amount) == BigInt(depositAmount.toNumber()));
    assert.ok((baseUserTestTokenAccountBefore.amount - baseUserTestTokenAccount.amount) == BigInt(depositAmount.toNumber()));
  });

  it("Base user tries to over withdraws testToken from Pool with error", async () => {
    let withdrawAmount = new anchor.BN(6 * DECIMAL_MUL);

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
      harvestSignerPdaBump,
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
    let amount_to_stake = new anchor.BN(3 * DECIMAL_MUL);

    await program.methods.stake(
      amount_to_stake
    ).accounts({
      user: baseUser.publicKey,
      farmAccount: farmAccountPda,
      harvestAccount: harvestTestTokenAccount.address,
      harvestSigner: harvestSignerPda,
      userTokenAccount: baseUserTestTokenAccount.address,
      poolAccount: poolAccountPda,
      globalStateAccount: globalStatePda,
      tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
      farmProgram: farmProgram.programId,
    }).signers([baseUser]).rpc();

    let farmAccount = await getTokenAccount(provider.connection, farmAccountPda);
    let globalStateAccount = await program.account.globalStateAccount.fetch(globalStatePda);

    assert.ok(globalStateAccount.totalStaked.eq(amount_to_stake));
    assert.ok(farmAccount.amount == BigInt(amount_to_stake.toNumber()));
    // Not checking for rewards since there was no previous stake involved
  });

  it("Harvest", async () => {
    // To test out the staking rewards for 5 seconds
    await sleep(5000);

    let globalStateAccountBefore = await program.account.globalStateAccount.fetch(globalStatePda);
    let baseUserTestTokenAccountBefore = await getTokenAccount(provider.connection, baseUserTestTokenAccount.address);

    await program.methods.harvest().accounts({
      farmAccount: farmAccountPda,
      farmProgram: farmProgram.programId,
      poolAccount: poolAccountPda,
      globalStateAccount: globalStatePda,
      harvestAccount: harvestTestTokenAccount.address,
      harvestSigner: harvestSignerPda,
      tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
      user: baseUser.publicKey,
      userTokenAccount: baseUserTestTokenAccount.address
    }).signers([baseUser]).rpc();

    // Reward Calculation
    let slotWhenHarvesting = await provider.connection.getSlot();
    let timestampWhenHarvesting = await provider.connection.getBlockTime(slotWhenHarvesting);
    let timestampWhenStaking = globalStateAccountBefore.timeOfLastHarvest.toNumber();
    let timeElapsed = timestampWhenHarvesting - timestampWhenStaking;
    let farmAccount = await getTokenAccount(provider.connection, farmAccountPda);
    let reward = calculate_reward(Number(farmAccount.amount), timeElapsed);
    console.log("Approximate Harvested Reward : ", reward / DECIMAL_MUL);
    baseUserTestTokenAccount = await getTokenAccount(provider.connection, baseUserTestTokenAccount.address);

    // Verifying the correct reward with a tolerance of 2 seconds
    let rewardForTwoSeconds = calculate_reward(Number(farmAccount.amount), 2);
    assert.ok(Math.abs(Number(baseUserTestTokenAccount.amount - baseUserTestTokenAccountBefore.amount) - reward) <= rewardForTwoSeconds);
  });

  it("Unstake", async () => {
    let amount_to_un_stake = new anchor.BN(2 * DECIMAL_MUL);
    let farmAccountBefore = await getTokenAccount(provider.connection, farmAccountPda);
    let poolTestTokenAccountBefore = await getTokenAccount(provider.connection, poolAccountPda);
    let globalStateAccountBefore = await program.account.globalStateAccount.fetch(globalStatePda);

    await program.methods.unStake(
      amount_to_un_stake
    ).accounts({
      user: baseUser.publicKey,
      farmAccount: farmAccountPda,
      harvestAccount: harvestTestTokenAccount.address,
      harvestSigner: harvestSignerPda,
      userTokenAccount: baseUserTestTokenAccount.address,
      poolAccount: poolAccountPda,
      globalStateAccount: globalStatePda,
      tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
      farmProgram: farmProgram.programId,
    }).signers([baseUser]).rpc();
    let globalStateAccount = await program.account.globalStateAccount.fetch(globalStatePda);
    let farmAccount = await getTokenAccount(provider.connection, farmAccountPda);
    poolTestTokenAccount = await getTokenAccount(provider.connection, poolAccountPda);
    baseUserTestTokenAccount = await getTokenAccount(provider.connection, baseUserTestTokenAccount.address);

    // Reward Calculation
    let slotWhenHarvesting = await provider.connection.getSlot();
    let timestampWhenHarvesting = await provider.connection.getBlockTime(slotWhenHarvesting);
    let timestampWhenStaking = globalStateAccountBefore.timeOfLastHarvest.toNumber();
    let timeElapsed = timestampWhenHarvesting - timestampWhenStaking;
    let reward = calculate_reward(Number(farmAccountBefore.amount), timeElapsed);
    console.log("Approximate Harvested Reward : ", reward / DECIMAL_MUL);
    let rewardForTwoSeconds = calculate_reward(Number(farmAccountBefore.amount), 2);

    // Final Amount available in pool should be equal to amount unstaked + harvested rewards previous stake
    let finalExpectedDepositedAmount = amount_to_un_stake.toNumber() + reward;

    // Verifying the correct reward with a tolerance of 2 seconds
    assert.ok(Math.abs((globalStateAccount.totalDeposits.sub(globalStateAccountBefore.totalDeposits)).toNumber() - finalExpectedDepositedAmount) <= rewardForTwoSeconds);
    assert.ok(Math.abs(Number(poolTestTokenAccount.amount - poolTestTokenAccountBefore.amount) - finalExpectedDepositedAmount) <= rewardForTwoSeconds);

    assert.ok((farmAccountBefore.amount - farmAccount.amount) == BigInt(amount_to_un_stake.toNumber()));
    assert.ok(globalStateAccountBefore.totalStaked.sub(globalStateAccount.totalStaked).eq(amount_to_un_stake));
  });

  it("Base user withdraws testToken from Pool ", async () => {
    let withdrawAmount = new anchor.BN(1 * DECIMAL_MUL);

    let poolTestTokenAccountBefore = await getTokenAccount(provider.connection, poolAccountPda);
    let baseUserTestTokenAccountBefore = await getTokenAccount(provider.connection, baseUserTestTokenAccount.address);

    await program.methods.withdraw(
      withdrawAmount
    ).accounts({
      user: baseUser.publicKey,
      poolAccount: poolAccountPda,
      userTokenAccount: baseUserTestTokenAccount.address,
      globalStateAccount: globalStatePda,
      tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
    }).signers([baseUser]).rpc();

    poolTestTokenAccount = await getTokenAccount(provider.connection, poolAccountPda);
    baseUserTestTokenAccount = await getTokenAccount(provider.connection, baseUserTestTokenAccount.address);
    assert.ok((poolTestTokenAccountBefore.amount - poolTestTokenAccount.amount) == BigInt(withdrawAmount.toNumber()));
    assert.ok((baseUserTestTokenAccount.amount - baseUserTestTokenAccountBefore.amount) == BigInt(withdrawAmount.toNumber()));
  });

});

// Our own sleep function.
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Function to calculate reward given staked amount and time elapsed
function calculate_reward(stakedAmount: number, timeElapsed: number) {
  let reward = stakedAmount * timeElapsed * REWARDS_PER_SECOND;
  return reward;
}