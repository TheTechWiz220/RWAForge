import { RwaListing, PortfolioAsset } from "@/lib/types";

/** Demo listings until on-chain indexer is connected */
export const DEMO_LISTINGS: RwaListing[] = [
  {
    id: "1",
    mint: "DemoMint1111111111111111111111111111111111",
    name: "Manhattan Office Tower",
    symbol: "MNHTN",
    assetType: 0,
    price: 12500000,
    amount: 10000,
    seller: "7xKX...9fG2",
    uri: "https://arweave.net/demo-manhattan",
    interestRateBps: 650,
    verified: true,
    createdAt: Date.now() - 86400000 * 3,
  },
  {
    id: "2",
    mint: "DemoMint2222222222222222222222222222222222",
    name: "Series A Invoice Pool",
    symbol: "INV-A",
    assetType: 1,
    price: 250000,
    amount: 5000,
    seller: "4pLm...k8Hn",
    uri: "https://arweave.net/demo-invoice",
    interestRateBps: 1200,
    verified: true,
    createdAt: Date.now() - 86400000,
  },
  {
    id: "3",
    mint: "DemoMint3333333333333333333333333333333333",
    name: "Vintage Watch Collection",
    symbol: "WATCH",
    assetType: 2,
    price: 890000,
    amount: 1000,
    seller: "9qRs...m3Jp",
    uri: "https://arweave.net/demo-watch",
    interestRateBps: 0,
    verified: false,
    createdAt: Date.now() - 3600000 * 12,
  },
];

export const DEMO_PORTFOLIO: PortfolioAsset[] = [
  {
    mint: "DemoMint1111111111111111111111111111111111",
    name: "Manhattan Office Tower",
    symbol: "MNHTN",
    balance: 250,
    assetType: 0,
    interestRateBps: 650,
    uri: "https://arweave.net/demo-manhattan",
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
