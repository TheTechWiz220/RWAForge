import { RwaListing, PortfolioAsset } from "@/lib/types";

/** Demo listings — Gambia-focused placeholders until on-chain indexer is connected */
export const DEMO_LISTINGS: RwaListing[] = [
  {
    id: "1",
    mint: "DemoMint1111111111111111111111111111111111",
    name: "Kololi Beachfront Plot",
    symbol: "KOLOLI",
    assetType: 0,
    price: 185000,
    amount: 10000,
    seller: "7xKX...9fG2",
    uri: "https://arweave.net/demo-kololi",
    interestRateBps: 0,
    verified: true,
    createdAt: Date.now() - 86400000 * 5,
  },
  {
    id: "2",
    mint: "DemoMint2222222222222222222222222222222222",
    name: "Bijilo Coastal Leasehold",
    symbol: "BIJILO",
    assetType: 0,
    price: 320000,
    amount: 8000,
    seller: "4pLm...k8Hn",
    uri: "https://arweave.net/demo-bijilo",
    interestRateBps: 0,
    verified: true,
    createdAt: Date.now() - 86400000 * 2,
  },
  {
    id: "3",
    mint: "DemoMint3333333333333333333333333333333333",
    name: "Brikama Development Plot",
    symbol: "BRIKAMA",
    assetType: 0,
    price: 95000,
    amount: 15000,
    seller: "9qRs...m3Jp",
    uri: "https://arweave.net/demo-brikama",
    interestRateBps: 0,
    verified: false,
    createdAt: Date.now() - 3600000 * 18,
  },
];

export const DEMO_PORTFOLIO: PortfolioAsset[] = [
  {
    mint: "DemoMint1111111111111111111111111111111111",
    name: "Kololi Beachfront Plot",
    symbol: "KOLOLI",
    balance: 250,
    assetType: 0,
    interestRateBps: 0,
    uri: "https://arweave.net/demo-kololi",
  },
];

export function getListingByMint(mint: string): RwaListing | undefined {
  return DEMO_LISTINGS.find((l) => l.mint === mint);
}

export function filterListings(
  listings: RwaListing[],
  opts: {
    assetType?: number | null;
    search?: string;
    sort?: "price-asc" | "price-desc" | "newest";
  }
): RwaListing[] {
  let result = [...listings];

  if (opts.assetType != null) {
    result = result.filter((l) => l.assetType === opts.assetType);
  }

  if (opts.search) {
    const q = opts.search.toLowerCase();
    result = result.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.symbol.toLowerCase().includes(q)
    );
  }

  switch (opts.sort) {
    case "price-asc":
      result.sort((a, b) => a.price - b.price);
      break;
    case "price-desc":
      result.sort((a, b) => b.price - a.price);
      break;
    case "newest":
    default:
      result.sort((a, b) => b.createdAt - a.createdAt);
  }

  return result;
}
