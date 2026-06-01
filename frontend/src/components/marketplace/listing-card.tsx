import Link from "next/link";
import { ASSET_TYPES } from "@/lib/types";
import { formatUsd, formatApy } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RwaListing } from "@/lib/types";

interface ListingCardProps {
  listing: RwaListing;
}

export function ListingCard({ listing }: ListingCardProps) {
  const assetType = ASSET_TYPES.find((t) => t.id === listing.assetType);

  return (
    <Link href={`/asset/${listing.mint}`}>
      <Card className="h-full transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle className="text-lg">{listing.name}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{listing.symbol}</p>
            </div>
            <Badge variant={listing.verified ? "success" : "warning"}>
              {listing.verified ? "Verified" : "Pending"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{assetType?.label ?? "Asset"}</Badge>
            {listing.interestRateBps > 0 && (
              <Badge variant="outline">{formatApy(listing.interestRateBps)} APY</Badge>
            )}
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Price</span>
            <span className="font-semibold">{formatUsd(listing.price)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Available</span>
            <span>{listing.amount.toLocaleString()} tokens</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
