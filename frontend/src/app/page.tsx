import Link from "next/link";
import { ArrowRight, Shield, Sparkles, Zap, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ListingCard } from "@/components/marketplace/listing-card";
import { DEMO_LISTINGS } from "@/lib/demo-data";

const FEATURES = [
  {
    icon: Sparkles,
    title: "AI Valuation",
    description: "Instant valuation reports, risk scoring, and yield suggestions powered by configurable LLMs.",
  },
  {
    icon: Shield,
    title: "Compliance Built-In",
    description: "Token-2022 transfer hooks, KYC registry, frozen default state, and permanent delegate controls.",
  },
  {
    icon: Zap,
    title: "Token-2022 Native",
    description: "Metadata, interest-bearing, transfer fees, and hooks — all on a single mint.",
  },
  {
    icon: Building2,
    title: "Marketplace Escrow",
    description: "List, buy, and settle RWAs with USDC escrow and automated platform fees.",
  },
];

export default function HomePage() {
  const featured = DEMO_LISTINGS.slice(0, 3);

  return (
    <div className="space-y-16">
      <section className="text-center space-y-6 py-8 md:py-16">
        <div className="inline-flex items-center rounded-full border px-3 py-1 text-xs text-muted-foreground">
          Solana Token-2022 · AI-Powered · Production Ready
        </div>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight max-w-3xl mx-auto">
          Forge Real World Assets into{" "}
          <span className="text-primary">On-Chain Yield</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          RWAForge tokenizes real estate, invoices, collectibles, and more with
          compliance-first Token-2022 extensions and AI-driven valuation.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild size="lg">
            <Link href="/tokenize">
              Tokenize an Asset
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/explore">Explore Marketplace</Link>
          </Button>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-6">Platform Features</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <Card key={f.title}>
              <CardHeader>
                <f.icon className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-base">{f.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{f.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Featured Listings</h2>
          <Button asChild variant="ghost">
            <Link href="/marketplace">View all</Link>
          </Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </section>
    </div>
  );
}
