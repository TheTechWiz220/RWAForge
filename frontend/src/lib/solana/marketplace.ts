import { PublicKey } from "@solana/web3.js";
import type { RwaListing } from "@/lib/types";
import { PROGRAM_IDS } from "./config";

/**
 * Marketplace buy_listing CPI wrapper.
 * Placeholder until IDL + deployed programs are connected.
 */
export async function buyListing(
  listing: RwaListing,
  buyer: PublicKey
): Promise<string> {
  console.info("[RWAForge] Buy listing", {
    buyer: buyer.toBase58(),
    listing: listing.id,
    program: PROGRAM_IDS.marketplace.toBase58(),
  });

  throw new Error(
    "On-chain purchase requires deployed programs. Run `anchor deploy` and sync IDL first."
  );
}

export async function createListing(
  seller: PublicKey,
  rwaMint: PublicKey,
  price: number,
  amount: number
): Promise<string> {
  console.info("[RWAForge] Create listing", {
    seller: seller.toBase58(),
    rwaMint: rwaMint.toBase58(),
    price,
    amount,
  });

  throw new Error(
    "On-chain listing requires deployed programs. Run `anchor deploy` and sync IDL first."
  );
}
