"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import Link from "next/link";
import { Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DEMO_PORTFOLIO } from "@/lib/demo-data";
import { ASSET_TYPES } from "@/lib/types";
import { formatApy } from "@/lib/utils";

export default function PortfolioPage() {
  const { connected, publicKey } = useWallet();

  if (!connected) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <Wallet className="h-12 w-12 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Connect Your Wallet</h1>
        <p className="text-muted-foreground max-w-md">
          View your tokenized RWA holdings, yield accrual, and redemption options.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Portfolio</h1>
        <p className="text-muted-foreground mt-1 font-mono text-sm">
          {publicKey?.toBase58()}
        </p>
      </div>

      {DEMO_PORTFOLIO.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No RWA tokens found.{" "}
            <Link href="/tokenize" className="text-primary underline">
              Tokenize an asset
            </Link>{" "}
            or browse the{" "}
            <Link href="/marketplace" className="text-primary underline">
              marketplace
            </Link>
            .
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {DEMO_PORTFOLIO.map((asset) => {
            const type = ASSET_TYPES.find((t) => t.id === asset.assetType);
            return (
              <Card key={asset.mint}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>{asset.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{asset.symbol}</p>
                  </div>
                  <Badge variant="secondary">{type?.label}</Badge>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="text-muted-foreground">Balance: </span>
                      <span className="font-semibold">{asset.balance.toLocaleString()} tokens</span>
                    </p>
                    {asset.interestRateBps > 0 && (
                      <p>
                        <span className="text-muted-foreground">Yield: </span>
                        {formatApy(asset.interestRateBps)}
                      </p>
                    )}
                  </div>
                  <Button asChild variant="outline">
                    <Link href={`/asset/${asset.mint}`}>View Details</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
