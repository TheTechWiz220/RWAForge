"use client";

import { useMemo, useState } from "react";
import { ListingCard } from "@/components/marketplace/listing-card";
import { DEMO_LISTINGS, filterListings } from "@/lib/demo-data";
import { Input } from "@/components/ui/input";

export default function MarketplacePage() {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"newest" | "price-asc" | "price-desc">("newest");

  const listings = useMemo(
    () => filterListings(DEMO_LISTINGS, { search, sort }),
    [search, sort]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Marketplace</h1>
        <p className="text-muted-foreground mt-1">
          Buy and sell tokenized RWAs with USDC escrow settlement.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Search listings..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-sm"
        />
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {listings.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>
    </div>
  );
}
