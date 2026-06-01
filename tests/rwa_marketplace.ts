import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { expect } from "chai";

describe("rwa_marketplace", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.RwaMarketplace as Program;
  const authority = (provider.wallet as anchor.Wallet).payer;
  const treasury = Keypair.generate();

  let marketplace: PublicKey;

  before(async () => {
    [marketplace] = PublicKey.findProgramAddressSync(
      [Buffer.from("marketplace")],
      program.programId
    );
  });

  it("initializes marketplace", async () => {
    await program.methods
      .initializeMarketplace(100) // 1% platform fee
      .accountsPartial({
        authority: authority.publicKey,
        marketplace,
        treasury: treasury.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const market = await program.account.marketplace.fetch(marketplace);
    expect(market.platformFeeBps).to.equal(100);
    expect(market.listingCounter.toNumber()).to.equal(0);
  });
});
