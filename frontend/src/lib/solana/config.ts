import { PublicKey } from "@solana/web3.js";

export const NETWORK = process.env.NEXT_PUBLIC_SOLANA_NETWORK ?? "devnet";
export const RPC_URL =
  process.env.NEXT_PUBLIC_RPC_URL ?? "https://api.devnet.solana.com";

export const PROGRAM_IDS = {
  tokenization: new PublicKey(
    process.env.NEXT_PUBLIC_RWA_TOKENIZATION_PROGRAM_ID ??
      "RWATkn1111111111111111111111111111111111111"
  ),
  marketplace: new PublicKey(
    process.env.NEXT_PUBLIC_RWA_MARKETPLACE_PROGRAM_ID ??
      "RWAmkt11111111111111111111111111111111111111"
  ),
  transferHook: new PublicKey(
    process.env.NEXT_PUBLIC_RWA_TRANSFER_HOOK_PROGRAM_ID ??
      "RWAHok1111111111111111111111111111111111111"
  ),
};

export const USDC_MINT = new PublicKey(
  process.env.NEXT_PUBLIC_USDC_MINT ??
    "4zMMC9srt5Ri5X14G2XhfaJVjQwpNwgkZUtZYHj6jGrt"
);

export function getPlatformConfigPda(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("platform")],
    PROGRAM_IDS.tokenization
  );
}

export function getMarketplacePda(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("marketplace")],
    PROGRAM_IDS.marketplace
  );
}

export function getRwaAssetPda(mint: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("rwa_asset"), mint.toBuffer()],
    PROGRAM_IDS.tokenization
  );
}

export function getKycRecordPda(
  wallet: PublicKey,
  mint: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("kyc"), wallet.toBuffer(), mint.toBuffer()],
    PROGRAM_IDS.transferHook
  );
}
