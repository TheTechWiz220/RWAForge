import Link from "next/link";
import { ArrowRight, Shield, Sparkles, Zap, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ListingCard } from "@/components/marketplace/listing-card";
import { CoastalHero } from "@/components/hero/coastal-hero";
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
    <div className="space-y-20 md:space-y-28 pb-20">
      <CoastalHero />

      {/* Features */}
      <section>
        <div className="mb-10 max-w-xl">
          <p className="text-sm font-semibold tracking-wide uppercase text-primary mb-2">
            Platform
          </p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Built for land as a real-world asset
          </h2>
          <p className="mt-3 text-muted-foreground leading-relaxed">
            From title structure to on-chain compliance — designed for Gambia
            freehold, leasehold, and development plots.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => (
            <Card
              key={f.title}
              className="group relative overflow-hidden border-border/70 bg-card/90 transition-all duration-300 hover:-translate-y-1 hover:border-primary/35 hover:shadow-xl hover:shadow-primary/10"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="pb-2">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15 transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <f.icon className="h-5 w-5" />
                </div>
                <CardTitle className="text-base">{f.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {f.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Featured listings */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <p className="text-sm font-semibold tracking-wide uppercase text-primary mb-2">
              Marketplace
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Featured Gambia plots
            </h2>
            <p className="mt-2 text-muted-foreground text-sm md:text-base">
              Demo listings — Kololi, Bijilo, and Brikama. On-chain when Phase 1 is live.
            </p>
          </div>
          <Button
            asChild
            variant="outline"
            className="border-primary/25 text-primary hover:bg-primary/10 shrink-0"
          >
            <Link href="/marketplace">
              View all listings
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

      {/* Bottom CTA */}
      <section className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-[hsl(var(--sand))]/10 px-6 py-12 md:px-12 md:py-16 text-center">
        <div className="absolute inset-0 plot-grid opacity-40 pointer-events-none" />
        <div className="relative max-w-2xl mx-auto space-y-5">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
            Ready to bring your plot on-chain?
          </h2>
          <p className="text-muted-foreground">
            Start with AI-assisted valuation and a Token-2022 mint flow. Full compliance
            and marketplace settle in the next phases.
          </p>
          <Button asChild size="lg" className="shadow-md shadow-primary/20">
            <Link href="/tokenize">
              Start tokenization
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
