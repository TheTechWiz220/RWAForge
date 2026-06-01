"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AiValuationPanel } from "@/components/tokenize/ai-valuation-panel";
import { LoadingSpinner } from "@/components/ui/loading";
import { ASSET_TYPES, type AiAnalysisResult, type TokenizeFormData } from "@/lib/types";

const INITIAL: TokenizeFormData = {
  name: "",
  symbol: "",
  assetType: 0,
  description: "",
  documentsUri: "",
  totalSupply: 10000,
  interestRateBps: 500,
};

export default function TokenizePage() {
  const { connected, publicKey } = useWallet();
  const [form, setForm] = useState<TokenizeFormData>(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [txSig, setTxSig] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof TokenizeFormData>(key: K, value: TokenizeFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function applyAiSuggestions(result: AiAnalysisResult) {
    setForm((prev) => ({
      ...prev,
      interestRateBps: result.suggestedYieldBps,
    }));
  }

  async function handleTokenize(e: React.FormEvent) {
    e.preventDefault();
    if (!connected || !publicKey) {
      setError("Connect your wallet to tokenize an asset.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setTxSig(null);

    try {
      // Client-side Token-2022 mint creation + program CPI wired in lib/solana/tokenize.ts
      const { tokenizeAsset } = await import("@/lib/solana/tokenize");
      const sig = await tokenizeAsset(form, publicKey);
      setTxSig(sig);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Tokenization failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Tokenize Asset</h1>
        <p className="text-muted-foreground mt-1">
          Create a Token-2022 mint with RWA extensions, AI valuation, and compliance controls.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Asset Details</CardTitle>
            <CardDescription>Metadata stored on-chain via Token-2022 extensions.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleTokenize} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Asset Name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder="Manhattan Office Tower"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="symbol">Symbol</Label>
                <Input
                  id="symbol"
                  value={form.symbol}
                  onChange={(e) => update("symbol", e.target.value.toUpperCase())}
                  placeholder="MNHTN"
                  maxLength={10}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="assetType">Asset Type</Label>
                <select
                  id="assetType"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={form.assetType}
                  onChange={(e) => update("assetType", Number(e.target.value) as TokenizeFormData["assetType"])}
                >
                  {ASSET_TYPES.map((t) => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => update("description", e.target.value)}
                  placeholder="Describe the asset, location, revenue, legal structure..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="documentsUri">Documents URI (IPFS/Arweave)</Label>
                <Input
                  id="documentsUri"
                  value={form.documentsUri}
                  onChange={(e) => update("documentsUri", e.target.value)}
                  placeholder="https://arweave.net/..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="supply">Total Supply</Label>
                  <Input
                    id="supply"
                    type="number"
                    min={1}
                    value={form.totalSupply}
                    onChange={(e) => update("totalSupply", Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="yield">Yield (bps)</Label>
                  <Input
                    id="yield"
                    type="number"
                    min={0}
                    value={form.interestRateBps}
                    onChange={(e) => update("interestRateBps", Number(e.target.value))}
                  />
                </div>
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              {txSig && (
                <p className="text-sm text-emerald-600 dark:text-emerald-400 break-all">
                  Success! Tx: {txSig}
                </p>
              )}

              <Button type="submit" disabled={submitting || !connected} className="w-full">
                {submitting ? (
                  <>
                    <LoadingSpinner className="mr-2" />
                    Tokenizing...
                  </>
                ) : (
                  "Initialize Token-2022 Mint"
                )}
              </Button>

              {!connected && (
                <p className="text-xs text-muted-foreground text-center">
                  Connect wallet to submit on-chain transaction.
                </p>
              )}
            </form>
          </CardContent>
        </Card>

        <AiValuationPanel
          formData={{
            name: form.name,
            assetType: form.assetType,
            description: form.description,
            documentsUri: form.documentsUri,
          }}
          onApplySuggestions={applyAiSuggestions}
        />
      </div>
    </div>
  );
}
