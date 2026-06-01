import { PublicKey } from "@solana/web3.js";

export const NETWORK = process.env.NEXT_PUBLIC_SOLANA_NETWORK ?? "devnet";
export const RPC_URL =
  process.env.NEXT_PUBLIC_RPC_URL ?? "https://api.devnet.solana.com";

/** Valid dev placeholders until `anchor deploy` — replace via .env.local */
const DEFAULT_PROGRAM_IDS = {
  tokenization: "11111111111111111111111111111112",
  marketplace: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
  transferHook: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
} as const;

function programId(
  envValue: string | undefined,
  fallback: string,
  label: string
): PublicKey {
  const trimmed = envValue?.trim();
  if (trimmed) {
    try {
      return new PublicKey(trimmed);
    } catch {
      if (typeof window === "undefined") {
        console.warn(
          `[RWAForge] Invalid ${label} program id "${trimmed}" — using dev placeholder. Update frontend/.env.local after anchor deploy.`
        );
      }
    }
  }
  return new PublicKey(fallback);
}

export const PROGRAM_IDS = {
  tokenization: programId(
    process.env.NEXT_PUBLIC_RWA_TOKENIZATION_PROGRAM_ID,
    DEFAULT_PROGRAM_IDS.tokenization,
    "tokenization"
  ),
  marketplace: programId(
    process.env.NEXT_PUBLIC_RWA_MARKETPLACE_PROGRAM_ID,
    DEFAULT_PROGRAM_IDS.marketplace,
    "marketplace"
  ),
  transferHook: programId(
    process.env.NEXT_PUBLIC_RWA_TRANSFER_HOOK_PROGRAM_ID,
    DEFAULT_PROGRAM_IDS.transferHook,
    "transfer hook"
  ),
};

export const USDC_MINT = programId(
  process.env.NEXT_PUBLIC_USDC_MINT,
  "4zMMC9srt5Ri5X14G2XhfaJVjQwpNwgkZUtZYHj6jGrt",
  "USDC mint"
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

export function getHookConfigPda(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("hook_config")],
    PROGRAM_IDS.transferHook
  );
}

export function getMintCompliancePda(mint: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("mint_compliance"), mint.toBuffer()],
    PROGRAM_IDS.transferHook
  );
}

export function getExtraAccountMetasPda(mint: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("extra-account-metas"), mint.toBuffer()],
    PROGRAM_IDS.transferHook
  );
}
