import Link from "next/link";
import { MapPin } from "lucide-react";
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
    <Link href={`/asset/${listing.mint}`} className="group block">
      <Card className="h-full overflow-hidden border-border/80 transition-all duration-200 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10">
        {/* Top accent bar */}
        <div className="h-1 w-full bg-gradient-to-r from-primary via-[hsl(var(--sand))] to-primary/40" />

        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <CardTitle className="text-lg group-hover:text-primary transition-colors truncate">
                {listing.name}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1 font-mono tracking-wide">
                {listing.symbol}
              </p>
            </div>
            <Badge variant={listing.verified ? "success" : "warning"} className="shrink-0">
              {listing.verified ? "Verified" : "Pending"}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="gap-1">
              <MapPin className="h-3 w-3" />
              {assetType?.label ?? "Asset"}
            </Badge>
            {listing.interestRateBps > 0 && (
              <Badge variant="outline">{formatApy(listing.interestRateBps)} APY</Badge>
            )}
          </div>

          <div className="space-y-2 rounded-lg bg-muted/50 px-3 py-2.5">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Price</span>
              <span className="font-semibold tabular-nums">{formatUsd(listing.price)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Available</span>
              <span className="tabular-nums">{listing.amount.toLocaleString()} tokens</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
