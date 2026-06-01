import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";
import { expect } from "chai";

describe("rwa_tokenization", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.RwaTokenization as Program;
  const hookProgram = anchor.workspace.RwaTransferHook as Program;

  const authority = (provider.wallet as anchor.Wallet).payer;
  const feeRecipient = Keypair.generate();
  const issuer = Keypair.generate();

  let platformConfig: PublicKey;
  let platformBump: number;

  before(async () => {
    for (const kp of [issuer]) {
      const sig = await provider.connection.requestAirdrop(
        kp.publicKey,
        2 * LAMPORTS_PER_SOL
      );
      await provider.connection.confirmTransaction(sig);
    }

    [platformConfig, platformBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("platform")],
      program.programId
    );
  });

  it("initializes platform config", async () => {
    await program.methods
      .initializePlatform(250) // 2.5% transfer fee
      .accountsPartial({
        authority: authority.publicKey,
        platformConfig,
        feeRecipient: feeRecipient.publicKey,
        transferHookProgram: hookProgram.programId,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const config = await program.account.platformConfig.fetch(platformConfig);
    expect(config.authority.toBase58()).to.equal(authority.publicKey.toBase58());
    expect(config.feeBasisPoints).to.equal(250);
  });

  it("registers KYC via transfer hook", async () => {
    const mint = Keypair.generate().publicKey;
    const wallet = issuer.publicKey;

    const [hookConfig] = PublicKey.findProgramAddressSync(
      [Buffer.from("hook_config")],
      hookProgram.programId
    );

    await hookProgram.methods
      .initializeConfig()
      .accountsPartial({
        authority: authority.publicKey,
        hookConfig,
        complianceOfficer: authority.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const [kycRecord] = PublicKey.findProgramAddressSync(
      [Buffer.from("kyc"), wallet.toBuffer(), mint.toBuffer()],
      hookProgram.programId
    );

    const expiresAt = new anchor.BN(Math.floor(Date.now() / 1000) + 86400 * 365);

    await hookProgram.methods
      .registerKyc(0, 840, expiresAt)
      .accountsPartial({
        authority: authority.publicKey,
        hookConfig,
        wallet,
        mint,
        kycRecord,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const record = await hookProgram.account.kycRecord.fetch(kycRecord);
    expect(record.verified).to.be.true;
  });
});
