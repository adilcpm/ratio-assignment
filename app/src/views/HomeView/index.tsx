import { FC, useEffect, useState } from "react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { AnchorWallet, useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { IdlAccounts } from "@project-serum/anchor";

import { Loader, SelectAndConnectWalletButton } from "components";
import * as anchor from "@project-serum/anchor";

import styles from "./index.module.css";
import { useProgram } from "./useProgram";

import { getAssociatedTokenAddress, getAccount as getTokenAccount, Account as tokenAccount } from '@solana/spl-token';
import { PublicKey } from "@solana/web3.js";

import { Platform } from "./platform";

type globalStateAccount = IdlAccounts<Platform>['globalStateAccount'];

// Input to these 5 Public Key's are printed when unit testing inside anchor
const farmProgramAddress = new PublicKey("6mMVWS9wvoME4hg3DdytZGVMQT7f6hX2KKPQMRMhe7iv");
const globalStateAccountPda = new PublicKey("8W8QrjEh7VT7WfveXy1npeqjrXC1LjL1ozaXEUTyZ6YA");
const poolAccountPda = new PublicKey("Af4h85VYU5CETEMVcsJEj3aFoYqXxs8muFQvL6MJgymb");
const farmAccountPda = new PublicKey("5eYWoZN8Nveky9tfeF3WuP4yQNwc8V6qQLxq2JwZsRXR");
const mintAddress = new PublicKey("A1ycKQ2Vy1uktK7uQTLad7Fy5PxQZCrKs28tSTfUgUrr");

const harvestSignerPda = new PublicKey("3HiMB8G7x3LCf8uCTxxV94XzdgwWNF2qSNPXTkjAC4So");
const endpoint = "https://api.devnet.solana.com";
const DECIMALS: number = 6;
const DECIMAL_MUL: number = 10 ** DECIMALS;

const connection = new anchor.web3.Connection(endpoint);

export const HomeView: FC = ({ }) => {
  const [userTokenAccount, setUserTokenAccount] = useState<tokenAccount>();
  const [refreshValue, setRefreshValue] = useState<number>(0);
  const wallet = useAnchorWallet();
  

  useEffect(() => {
    getUserTokenAccount();
  }, [wallet, refreshValue]);

  const getUserTokenAccount = async () => {
    if (wallet) {
      let userTokenAccountAddress = await getAssociatedTokenAddress(mintAddress, wallet?.publicKey);
      let userTokenAccount = await getTokenAccount(connection, userTokenAccountAddress);
      setUserTokenAccount(userTokenAccount);
    }
  }

  const refresh = () => {
    console.log("Refreshing !");
    let value = refreshValue;
    setRefreshValue(value! + 1);
  }

  return (
    <div className="container mx-auto max-w-6xl p-8 2xl:px-0">
      <div className={styles.container}>
        <div className="navbar mb-2 shadow-lg bg-neutral text-neutral-content rounded-box">
          <div className="flex-none">
            <button onClick={refresh}className="btn btn-ghost">
              {wallet ? <span className="text-2xl"> Account Balance : {(Number(userTokenAccount?.amount) / DECIMAL_MUL).toFixed(2)} </span> : null}
            </button>
          </div>
          <div className="flex-1 px-2 mx-2">
          </div>

          <div className="flex-none">
            <WalletMultiButton className="btn btn-ghost" />
          </div>
        </div>

        <div className="text-center pt-2">
          <div className="hero min-h-16 pt-4">
            <div className="text-center hero-content">
              <div className="max-w-lg">
                <h1 className="mb-5 text-5xl">
                  Farm and Stake by Adi
                </h1>
                {wallet ? <p>Your wallet address: {wallet.publicKey.toBase58()}</p> : null}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 flex items-center justify-center">
          {!wallet ? (
            <SelectAndConnectWalletButton onUseWalletClick={() => { }} />
          ) : (
            <FarmAndStakeScreen refresh={refresh} refreshValue={refreshValue} />
          )}
        </div>
      </div>
    </div>
  );
};

const FarmAndStakeScreen = (props: any) => {
  const wallet: AnchorWallet = useAnchorWallet()!;
  const { program } = useProgram({ connection, wallet });
  const [globalStateAccount, setGlobalStateAccount] = useState<globalStateAccount>();
  const [approxReward, setApproxReward] = useState<number>();
  const [amount, setAmount] = useState<number>();

  useEffect(() => {
    getGlobalStateAccount();
    rewardCalc();
  }, [wallet, props.refreshValue]);

  useEffect(() => {
    rewardCalc();
  }, [globalStateAccount]);

  const getGlobalStateAccount = async () => {
    if (wallet) {
      let account = await program?.account.globalStateAccount.fetch(globalStateAccountPda);
      setGlobalStateAccount(account as globalStateAccount);
    }
  }

  const rewardCalc = async () => {
    let slotWhenHarvesting = await connection.getSlot();
    let timestampWhenHarvesting = await connection.getBlockTime(slotWhenHarvesting);
    let timestampWhenStaking = globalStateAccount?.timeOfLastHarvest.toNumber();

    //Last Harvest would be 0 if user has never staked
    if (timestampWhenStaking == 0) {
      return 0
    }

    let totalStaked = globalStateAccount?.totalStaked.toNumber();
    let timeElapsed = timestampWhenHarvesting! - timestampWhenStaking!;
    let approxReward = totalStaked! * timeElapsed * globalStateAccount?.rewardsPerSeconds!;
    setApproxReward(approxReward);
  }

  const deposit = async () => {
    let amountToDeposit = new anchor.BN(amount! * DECIMAL_MUL);
    let userTokenAccountAddress = await getAssociatedTokenAddress(mintAddress, wallet?.publicKey);
    await program?.methods.deposit(
      amountToDeposit
    ).accounts({
      user: wallet.publicKey,
      poolAccount: poolAccountPda,
      userTokenAccount: userTokenAccountAddress,
      globalStateAccount: globalStateAccountPda,
      tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
    }).rpc();
    setAmount(undefined);
    props.refresh();
  }

  const withdraw = async () => {
    let amountToWithdraw = new anchor.BN(amount! * DECIMAL_MUL);
    let userTokenAccountAddress = await getAssociatedTokenAddress(mintAddress, wallet?.publicKey);
    await program?.methods.withdraw(
      amountToWithdraw
    ).accounts({
      user: wallet.publicKey,
      poolAccount: poolAccountPda,
      userTokenAccount: userTokenAccountAddress,
      globalStateAccount: globalStateAccountPda,
      tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
    }).rpc();
    setAmount(undefined);
    props.refresh();
  }

  const stake = async () => {
    let amountToStake = new anchor.BN(amount! * DECIMAL_MUL);
    let userTokenAccountAddress = await getAssociatedTokenAddress(mintAddress, wallet?.publicKey);
    let harvestTokenAccountAddress = await getAssociatedTokenAddress(mintAddress, harvestSignerPda, true);
    await program?.methods.stake(
      amountToStake
    ).accounts({
      user: wallet.publicKey,
      farmAccount: farmAccountPda,
      harvestAccount: harvestTokenAccountAddress,
      harvestSigner: harvestSignerPda,
      userTokenAccount: userTokenAccountAddress,
      poolAccount: poolAccountPda,
      globalStateAccount: globalStateAccountPda,
      tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
      farmProgram: farmProgramAddress,
    }).rpc();
    setAmount(undefined);
    props.refresh();
  }

  const unstake = async () => {
    let amountToUnstake = new anchor.BN(amount! * DECIMAL_MUL);
    let userTokenAccountAddress = await getAssociatedTokenAddress(mintAddress, wallet?.publicKey);
    let harvestTokenAccountAddress = await getAssociatedTokenAddress(mintAddress, harvestSignerPda, true);

    await program?.methods.unStake(
      amountToUnstake
    ).accounts({
      user: wallet.publicKey,
      farmAccount: farmAccountPda,
      harvestAccount: harvestTokenAccountAddress,
      harvestSigner: harvestSignerPda,
      userTokenAccount: userTokenAccountAddress,
      poolAccount: poolAccountPda,
      globalStateAccount: globalStateAccountPda,
      tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
      farmProgram: farmProgramAddress,
    }).rpc();
    setAmount(undefined);
    props.refresh();
  }

  const harvest = async () => {
    let userTokenAccountAddress = await getAssociatedTokenAddress(mintAddress, wallet?.publicKey);
    let harvestTokenAccountAddress = await getAssociatedTokenAddress(mintAddress, harvestSignerPda, true);
    await program?.methods.harvest().accounts({
      farmAccount: farmAccountPda,
      farmProgram: farmProgramAddress,
      poolAccount: poolAccountPda,
      globalStateAccount: globalStateAccountPda,
      harvestAccount: harvestTokenAccountAddress,
      harvestSigner: harvestSignerPda,
      tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
      user: wallet.publicKey,
      userTokenAccount: userTokenAccountAddress
    }).rpc();
    setAmount(undefined);
    props.refresh();
  }

  return (
    <div className="p-4 w-80 h-auto bg-purple-700 rounded-lg shadow flex flex-col text-base">
      <div className="rounded-xl mb-2 p-2 h-14 bg-black w-full flex flex-row justify-between items-center">
        <div className="ml-2">Rewards Per Second :</div>
        <div className="mr-2"> {globalStateAccount?.rewardsPerSeconds!.toFixed(4)} </div>
      </div>
      <div className="rounded-xl mb-2 p-2 h-14 bg-black w-full flex flex-row justify-between items-center">
        <div className="ml-2">Total Deposited :</div>
        <div className="mr-2"> {(globalStateAccount?.totalDeposits.toNumber()!) / DECIMAL_MUL} </div>
      </div>
      <div className="rounded-xl mb-2 p-2 h-14 bg-black w-full flex flex-row justify-between items-center">
        <div className="ml-2">Total Staked :</div>
        <div className="mr-2"> {(globalStateAccount?.totalStaked.toNumber()!) / DECIMAL_MUL} </div>
      </div>
      <div className="rounded-xl mb-2 p-2 h-14 bg-black w-full flex flex-row justify-between items-center">
        <div className="ml-2">Rewards Pending :</div>
        <div className="mr-2"> {(approxReward! / DECIMAL_MUL).toFixed(2)} </div>
      </div>
      <div className=" mt-2 mb-2 h-14 w-full flex flex-row justify-between items-center">
        <input
          type="number"
          name="amount"
          id="amount"
          onChange={event => setAmount(Number(event.target.value))}
          value={amount || ''}
          className="mr-2 text-black text-xl rounded-xl p-2 h-14 focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 pr-12 border-gray-300"
          placeholder="Amount"
        />
        <div onClick={props.refresh} className="btn btn-ghost px-4 h-14 w-14">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" /></svg>
        </div>
      </div>
      <div className="mt-2 mb-2 py-2.5 p-1 rounded-xl border-2 border-purple-300 w-full flex flex-row justify-around items-center">
        <button onClick={deposit} className="btn w-32">DEPOSIT</button>
        <button onClick={withdraw} className="btn w-32">WITHDRAW</button>
      </div>
      <div className="mt-2 mb-2 py-2.5 p-1 rounded-xl border-2 border-purple-300 w-full flex flex-row justify-around items-center">
        <button onClick={stake} className="btn w-20">STAKE</button>
        <button onClick={unstake}className="btn w-20">UNSTAKE</button>
        <button onClick={harvest}className="btn w-20">HARVEST</button>
      </div>
    </div>

  );

};
