"use client";

import Link from "next/link";
import { ArrowRight, MapPin, ShieldCheck, Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CoastalCanvas } from "./coastal-canvas";

const STATS = [
  { label: "Demo plots", value: "3" },
  { label: "Chain", value: "Solana" },
  { label: "Standard", value: "Token-2022" },
  { label: "Settlement", value: "USDC" },
];

export function CoastalHero() {
  return (
    <section className="relative -mx-4 md:mx-0 overflow-hidden rounded-none md:rounded-2xl border-y md:border border-border/60">
      {/* Interactive canvas layer */}
      <div className="absolute inset-0 z-0">
        <CoastalCanvas />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />
      </div>

      <div className="relative z-10 px-4 md:px-10 py-16 md:py-24">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-background/70 backdrop-blur-md px-3.5 py-1.5 text-xs font-medium text-primary shadow-sm">
            <MapPin className="h-3.5 w-3.5" />
            Greater Banjul · Kanifing · Brikama
            <span className="hidden sm:inline text-muted-foreground">·</span>
            <span className="hidden sm:inline text-muted-foreground">Devnet preview</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05]">
            Own a piece of{" "}
            <span className="relative inline-block">
              <span className="text-primary">Gambia</span>
              <span className="absolute -bottom-1 left-0 right-0 h-[3px] rounded-full bg-gradient-to-r from-primary via-[hsl(var(--sand))] to-transparent opacity-80" />
            </span>
            {" "}on-chain
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Tokenize freehold and leasehold land as compliant Token-2022 RWAs —
            AI valuation, KYC transfer hooks, and USDC marketplace escrow.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-1">
            <Button
              asChild
              size="lg"
              className="h-12 px-7 text-base shadow-lg shadow-primary/25 hover:shadow-primary/35 transition-shadow"
            >
              <Link href="/tokenize">
                Tokenize a Plot
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-12 px-7 text-base border-primary/30 bg-background/50 backdrop-blur-sm hover:bg-primary/10"
            >
              <Link href="/explore">Browse Listings</Link>
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 pt-2 text-xs sm:text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              SPV economic interest
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Landmark className="h-3.5 w-3.5 text-[hsl(var(--sand))]" />
              Title stays off-chain
            </span>
          </div>
        </div>

        {/* Stats strip */}
        <div className="mt-14 md:mt-16 max-w-3xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px rounded-xl overflow-hidden border border-border/70 bg-border/70 shadow-sm">
            {STATS.map((s) => (
              <div
                key={s.label}
                className="bg-background/80 backdrop-blur-md px-4 py-4 text-center"
              >
                <div className="text-lg md:text-xl font-bold tracking-tight text-foreground">
                  {s.value}
                </div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground mt-0.5">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
