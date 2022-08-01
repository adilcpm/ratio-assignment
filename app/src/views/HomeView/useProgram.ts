import { useEffect, useState } from "react";
import { Connection, PublicKey } from "@solana/web3.js";
import * as anchor from "@project-serum/anchor";

import PlatformIdl from "./platform.json";

const PLATFORM_PROGRAM = "9LhUyaj7hcpBMZVrigHUyrsq5tysdD47NgEzsXB9Nt4z";
const programID = new PublicKey(PLATFORM_PROGRAM);

export interface Wallet {
  signTransaction(
    tx: anchor.web3.Transaction
  ): Promise<anchor.web3.Transaction>;
  signAllTransactions(
    txs: anchor.web3.Transaction[]
  ): Promise<anchor.web3.Transaction[]>;
  publicKey: anchor.web3.PublicKey;
}

type ProgramProps = {
  connection: Connection;
  wallet: Wallet;
};

export const useProgram = ({ connection, wallet }: ProgramProps) => {
  const [program, setProgram] = useState<anchor.Program<anchor.Idl>>();

  useEffect(() => {
    updateProgram();
  }, [connection, wallet]);

  const updateProgram = () => {
    const provider = new anchor.AnchorProvider(connection, wallet, {
      preflightCommitment: "recent",
      commitment: "processed",
    });
    console.log("provider", provider);

    const program = new anchor.Program(PlatformIdl as anchor.Idl, programID, provider);

    setProgram(program);
  };

  return {
    program,
  };
};
