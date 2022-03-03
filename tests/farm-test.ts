import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { FarmTest } from "../target/types/farm_test";

describe("farm-test", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());

  const program = anchor.workspace.FarmTest as Program<FarmTest>;

  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.rpc.initialize({});
    console.log("Your transaction signature", tx);
  });
});
