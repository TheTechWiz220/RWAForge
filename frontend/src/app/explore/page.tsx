"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ListingCard } from "@/components/marketplace/listing-card";
import { DEMO_LISTINGS, filterListings } from "@/lib/demo-data";
import { ASSET_TYPES } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function ExplorePage() {
  const [search, setSearch] = useState("");
  const [assetType, setAssetType] = useState<number | null>(null);
  const [sort, setSort] = useState<"newest" | "price-asc" | "price-desc">("newest");

  const listings = useMemo(
    () => filterListings(DEMO_LISTINGS, { search, assetType, sort }),
    [search, assetType, sort]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Explore RWAs</h1>
        <p className="text-muted-foreground mt-1">
          Browse tokenized real world assets across categories.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search assets..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          value={sort}
          onChange={(e) => setSort(e.target.value as typeof sort)}
        >
          <option value="newest">Newest</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
        </select>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setAssetType(null)}
          className={cn(
            "px-3 py-1.5 rounded-full text-sm border transition-colors",
            assetType === null ? "bg-primary text-primary-foreground border-primary" : "hover:bg-accent"
          )}
        >
          All
        </button>
        {ASSET_TYPES.map((t) => (
          <button
            key={t.id}
            onClick={() => setAssetType(t.id)}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm border transition-colors",
              assetType === t.id ? "bg-primary text-primary-foreground border-primary" : "hover:bg-accent"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {listings.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">No assets match your filters.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}
