import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { expect } from "chai";

describe("rwa_transfer_hook", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.RwaTransferHook as Program;
  const authority = (provider.wallet as anchor.Wallet).payer;

  let hookConfig: PublicKey;
  const mint = Keypair.generate().publicKey;
  const wallet = Keypair.generate().publicKey;

  before(() => {
    [hookConfig] = PublicKey.findProgramAddressSync(
      [Buffer.from("hook_config")],
      program.programId
    );
  });

  it("initializes hook config", async () => {
    await program.methods
      .initializeConfig()
      .accountsPartial({
        authority: authority.publicKey,
        hookConfig,
        complianceOfficer: authority.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const config = await program.account.hookConfig.fetch(hookConfig);
    expect(config.authority.toBase58()).to.equal(authority.publicKey.toBase58());
    expect(config.globalPause).to.be.false;
  });

  it("initializes mint compliance", async () => {
    const [mintCompliance] = PublicKey.findProgramAddressSync(
      [Buffer.from("mint_compliance"), mint.toBuffer()],
      program.programId
    );

    await program.methods
      .initializeMintCompliance(1)
      .accountsPartial({
        authority: authority.publicKey,
        hookConfig,
        mint,
        mintCompliance,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const compliance = await program.account.mintCompliance.fetch(mintCompliance);
    expect(compliance.minTier).to.equal(1);
    expect(compliance.transfersEnabled).to.be.true;
  });

  it("registers KYC for wallet", async () => {
    const [kycRecord] = PublicKey.findProgramAddressSync(
      [Buffer.from("kyc"), wallet.toBuffer(), mint.toBuffer()],
      program.programId
    );

    const expiresAt = new anchor.BN(Math.floor(Date.now() / 1000) + 86400 * 365);

    await program.methods
      .registerKyc(1, 840, expiresAt)
      .accountsPartial({
        authority: authority.publicKey,
        hookConfig,
        wallet,
        mint,
        kycRecord,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const record = await program.account.kycRecord.fetch(kycRecord);
    expect(record.verified).to.be.true;
    expect(record.tier).to.equal(1);
    expect(record.jurisdiction).to.equal(840);
    expect(record.sanctionsCleared).to.be.true;
  });

  it("sets global pause", async () => {
    await program.methods
      .setGlobalPause(true)
      .accountsPartial({
        authority: authority.publicKey,
        hookConfig,
      })
      .rpc();

    const config = await program.account.hookConfig.fetch(hookConfig);
    expect(config.globalPause).to.be.true;

    await program.methods
      .setGlobalPause(false)
      .accountsPartial({
        authority: authority.publicKey,
        hookConfig,
      })
      .rpc();
  });
});
