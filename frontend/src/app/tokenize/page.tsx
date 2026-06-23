"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import dynamic from "next/dynamic";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AiValuationPanel } from "@/components/tokenize/ai-valuation-panel";
import { LoadingSpinner } from "@/components/ui/loading";
import { ASSET_TYPES, type AiAnalysisResult, type TokenizeFormData } from "@/lib/types";
import { AlertCircle } from "lucide-react";

// Dynamic Wallet Button (prevents hydration mismatch)
const WalletMultiButton = dynamic(
  () => import("@solana/wallet-adapter-react-ui").then((mod) => mod.WalletMultiButton),
  { ssr: false }
);

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
      name: result.suggestedName || prev.name,
      symbol: result.suggestedSymbol || prev.symbol,
      interestRateBps: result.suggestedYieldBps || prev.interestRateBps,
      description: result.summary || prev.description,
    }));
  }

  async function handleTokenize(e: React.FormEvent) {
    e.preventDefault();
    if (!connected || !publicKey) {
      setError("Please connect your wallet to continue.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setTxSig(null);

    try {
      const { tokenizeAsset } = await import("@/lib/solana/tokenize");
      const sig = await tokenizeAsset(form, publicKey);
      setTxSig(sig);
    } catch (err: any) {
      setError(err.message || "Tokenization failed. Please try again.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Tokenize Real World Asset</h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Create compliant fractional ownership tokens powered by AI
          </p>
        </div>
        <WalletMultiButton />
      </div>

      {!connected && (
        <Card className="mb-8 border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="h-5 w-5 text-orange-600" />
            <p className="text-sm text-orange-700 dark:text-orange-400">
              Connect your wallet to tokenize assets and interact with the blockchain.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-8 lg:grid-cols-5">
        {/* Form */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Asset Information</CardTitle>
              <CardDescription>
                All data will be stored on-chain using Token-2022 extensions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleTokenize} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Asset Name</Label>
                    <Input
                      id="name"
                      value={form.name}
                      onChange={(e) => update("name", e.target.value)}
                      placeholder="e.g. Banjul Commercial Property"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="symbol">Symbol</Label>
                    <Input
                      id="symbol"
                      value={form.symbol}
                      onChange={(e) => update("symbol", e.target.value.toUpperCase())}
                      placeholder="BJLPROP"
                      maxLength={10}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assetType">Asset Type</Label>
                  <select
                    id="assetType"
                    className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={form.assetType}
                    onChange={(e) => update("assetType", Number(e.target.value))}
                  >
                    {ASSET_TYPES.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={form.description}
                    onChange={(e) => update("description", e.target.value)}
                    placeholder="Detailed description, location, revenue model..."
                    rows={5}
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
                      value={form.totalSupply}
                      onChange={(e) => update("totalSupply", Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="yield">Annual Yield (bps)</Label>
                    <Input
                      id="yield"
                      type="number"
                      value={form.interestRateBps}
                      onChange={(e) => update("interestRateBps", Number(e.target.value))}
                    />
                  </div>
                </div>

                {error && <p className="text-red-500 text-sm">{error}</p>}

                {txSig && (
                  <p className="text-green-600 text-sm break-all">
                    ✅ Transaction successful! Signature: {txSig.slice(0, 12)}...
                  </p>
                )}

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={submitting || !connected} 
                  size="lg"
                >
                  {submitting ? (
                    <>
                      <LoadingSpinner className="mr-2 h-4 w-4" />
                      Creating Token-2022 Mint...
                    </>
                  ) : (
                    "🚀 Tokenize Asset on Solana"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* AI Panel */}
        <div className="lg:col-span-2">
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
    </div>
  );
}