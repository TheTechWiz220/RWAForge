export const ASSET_TYPES = [
  { id: 0, label: "Real Estate", icon: "Building2" },
  { id: 1, label: "Invoices", icon: "FileText" },
  { id: 2, label: "Collectibles", icon: "Gem" },
  { id: 3, label: "Commodities", icon: "Package" },
  { id: 4, label: "Equity", icon: "TrendingUp" },
  { id: 5, label: "Debt", icon: "Landmark" },
] as const;

export type AssetTypeId = (typeof ASSET_TYPES)[number]["id"];

export interface RwaListing {
  id: string;
  mint: string;
  name: string;
  symbol: string;
  assetType: AssetTypeId;
  price: number;
  amount: number;
  seller: string;
  uri: string;
  interestRateBps: number;
  verified: boolean;
  createdAt: number;
}

export interface PortfolioAsset {
  mint: string;
  name: string;
  symbol: string;
  balance: number;
  assetType: AssetTypeId;
  interestRateBps: number;
  uri: string;
}

export interface AiAnalysisResult {
  valuationUsd: number;
  suggestedTokenPrice: number;
  suggestedYieldBps: number;
  riskScore: number;
  riskLevel: "low" | "medium" | "high";
  summary: string;
  complianceNotes: string[];
  keyRisks: string[];
}

export interface TokenizeFormData {
  name: string;
  symbol: string;
  assetType: AssetTypeId;
  description: string;
  documentsUri: string;
  totalSupply: number;
  interestRateBps: number;
}
