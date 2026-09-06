import Link from "next/link";
import { ArrowRight, Shield, Sparkles, Zap, Building2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ListingCard } from "@/components/marketplace/listing-card";
import { DEMO_LISTINGS } from "@/lib/demo-data";

const FEATURES = [
  {
    icon: Sparkles,
    title: "AI Valuation",
    description:
      "Instant valuation reports, risk scoring, and yield suggestions tuned for Gambia land markets.",
  },
  {
    icon: Shield,
    title: "Compliance Built-In",
    description:
      "Token-2022 transfer hooks, KYC registry, and permanent delegate controls for regulated RWAs.",
  },
  {
    icon: Zap,
    title: "Token-2022 Native",
    description:
      "Metadata, interest-bearing, transfer fees, and hooks — all on a single mint.",
  },
  {
    icon: Building2,
    title: "Marketplace Escrow",
    description:
      "List, buy, and settle land-backed tokens with USDC escrow and automated platform fees.",
  },
];

export default function HomePage() {
  const featured = DEMO_LISTINGS.slice(0, 3);

  return (
    <div className="space-y-20 pb-16">
      {/* Hero */}
      <section className="hero-horizon relative -mx-4 px-4 md:-mx-0 md:px-0">
        <div className="text-center space-y-7 py-12 md:py-20 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1.5 text-xs font-medium text-primary">
            <MapPin className="h-3.5 w-3.5" />
            Solana · Gambia Real Estate · Token-2022
          </div>

          <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.1]">
            Tokenize Gambia Land into{" "}
            <span className="text-primary">On-Chain Ownership</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Turn freehold and leasehold plots into compliant Token-2022 assets —
            with AI valuation, KYC transfer hooks, and a USDC marketplace.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button asChild size="lg" className="shadow-md shadow-primary/20">
              <Link href="/tokenize">
                Tokenize a Plot
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-primary/25 hover:bg-primary/5">
              <Link href="/explore">Explore Listings</Link>
            </Button>
          </div>

          {/* Trust strip */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              SPV-backed economic interest
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--sand))]" />
              KYC transfer compliance
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-primary/60" />
              Devnet preview
            </span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section>
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-sm font-medium text-primary mb-1">Platform</p>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Built for land RWAs</h2>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <Card
              key={f.title}
              className="border-border/80 bg-card/80 transition-all hover:border-primary/30 hover:shadow-md hover:shadow-primary/5"
            >
              <CardHeader className="pb-2">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <CardTitle className="text-base">{f.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Featured listings */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-sm font-medium text-primary mb-1">Marketplace</p>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Featured Gambia plots</h2>
          </div>
          <Button asChild variant="ghost" className="text-primary hover:text-primary hover:bg-primary/10">
            <Link href="/marketplace">
              View all
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </section>
    </div>
  );
}
