"use client";

import { useState } from "react";
import { Sparkles, AlertTriangle, Shield, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading";
import { Badge } from "@/components/ui/badge";
import type { AiAnalysisResult, TokenizeFormData } from "@/lib/types";
import { formatUsd, formatApy } from "@/lib/utils";

interface AiValuationPanelProps {
  formData: Pick<TokenizeFormData, "name" | "assetType" | "description" | "documentsUri">;
  onApplySuggestions?: (result: AiAnalysisResult) => void;
}

export function AiValuationPanel({ formData, onApplySuggestions }: AiValuationPanelProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AiAnalysisResult | null>(null);

  async function runAnalysis() {
    if (!formData.description.trim()) {
      setError("Please provide an asset description for AI analysis.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Analysis failed");
      }

      const data = (await res.json()) as AiAnalysisResult;
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Valuation Engine
        </CardTitle>
        <CardDescription>
          Generate valuation, risk assessment, and token pricing suggestions from your asset data.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={runAnalysis} disabled={loading} className="w-full sm:w-auto">
          {loading ? (
            <>
              <LoadingSpinner className="mr-2" />
              Analyzing asset...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Run AI Analysis
            </>
          )}
        </Button>

        {error && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        {result && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="grid gap-3 sm:grid-cols-3">
              <Metric label="Est. Valuation" value={formatUsd(result.valuationUsd)} icon={TrendingUp} />
              <Metric label="Token Price" value={formatUsd(result.suggestedTokenPrice)} icon={Sparkles} />
              <Metric label="Suggested Yield" value={formatApy(result.suggestedYieldBps)} icon={TrendingUp} />
            </div>

            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="text-sm font-medium">Risk Score:</span>
              <Badge
                variant={
                  result.riskLevel === "low"
                    ? "success"
                    : result.riskLevel === "medium"
                      ? "warning"
                      : "destructive"
                }
              >
                {result.riskScore}/100 — {result.riskLevel}
              </Badge>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">{result.summary}</p>

            {result.keyRisks.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Key Risks</p>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  {result.keyRisks.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </div>
            )}

            {result.complianceNotes.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Compliance Notes</p>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  {result.complianceNotes.map((n) => (
                    <li key={n}>{n}</li>
                  ))}
                </ul>
              </div>
            )}

            {onApplySuggestions && (
              <Button variant="secondary" onClick={() => onApplySuggestions(result)}>
                Apply AI Suggestions
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Metric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}
