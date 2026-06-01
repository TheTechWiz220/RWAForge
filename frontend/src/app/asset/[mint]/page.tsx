"use client";

import { useParams } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { useState } from "react";
import { ExternalLink, Shield, TrendingUp } from "lucide-react";
import { getListingByMint } from "@/lib/demo-data";
import { ASSET_TYPES } from "@/lib/types";
import { formatUsd, formatApy, truncateAddress } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading";

export default function AssetDetailPage() {
  const params = useParams();
  const mint = params.mint as string;
  const { connected, publicKey } = useWallet();
  const listing = getListingByMint(mint);
  const [buying, setBuying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!listing) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold">Asset Not Found</h1>
        <p className="text-muted-foreground mt-2">No listing for mint {truncateAddress(mint, 8)}</p>
      </div>
    );
  }

  const assetType = ASSET_TYPES.find((t) => t.id === listing.assetType);

  async function handleBuy() {
    if (!connected || !publicKey) {
      setError("Connect wallet to purchase.");
      return;
    }
    setBuying(true);
    setError(null);
    try {
      const { buyListing } = await import("@/lib/solana/marketplace");
      await buyListing(listing!, publicKey);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Purchase failed");
    } finally {
      setBuying(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap gap-2 mb-2">
            <Badge variant="secondary">{assetType?.label}</Badge>
            <Badge variant={listing.verified ? "success" : "warning"}>
              {listing.verified ? "KYC Verified" : "Pending Verification"}
            </Badge>
          </div>
          <h1 className="text-3xl font-bold">{listing.name}</h1>
          <p className="text-muted-foreground font-mono text-sm mt-1">{listing.mint}</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold">{formatUsd(listing.price)}</p>
          <p className="text-sm text-muted-foreground">{listing.amount.toLocaleString()} tokens available</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Yield
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {listing.interestRateBps > 0 ? formatApy(listing.interestRateBps) : "N/A"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <Shield className="h-4 w-4" /> Compliance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">Transfer Hook + Frozen Default State</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Seller</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-sm">{listing.seller}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Metadata & Documents</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            On-chain metadata URI with legal documents, appraisals, and ownership proofs.
          </p>
          <a
            href={listing.uri}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-primary text-sm hover:underline"
          >
            View documents <ExternalLink className="h-3 w-3" />
          </a>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ownership History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Initial Tokenization</span>
              <span>{listing.seller}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Listed on Marketplace</span>
              <span>{new Date(listing.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button size="lg" className="w-full sm:w-auto" onClick={handleBuy} disabled={buying}>
        {buying ? (
          <>
            <LoadingSpinner className="mr-2" />
            Processing...
          </>
        ) : (
          `Buy for ${formatUsd(listing.price)} USDC`
        )}
      </Button>
    </div>
  );
}
