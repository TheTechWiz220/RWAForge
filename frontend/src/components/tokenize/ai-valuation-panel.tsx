"use client";

import { useState } from "react";
import { Sparkles, AlertTriangle, Shield, TrendingUp, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading";
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
    if (!formData.description?.trim()) {
      setError("Please provide a detailed asset description first.");
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
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "AI analysis failed");
      }

      const data: AiAnalysisResult = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="sticky top-6 border-primary/20 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Asset Intelligence
        </CardTitle>
        <CardDescription>
          Get professional valuation, risk analysis, and token recommendations instantly.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <Button 
          onClick={runAnalysis} 
          disabled={loading || !formData.description?.trim()} 
          className="w-full" 
          size="lg"
        >
          {loading ? (
            <>
              <LoadingSpinner className="mr-2 h-4 w-4" />
              Analyzing with AI...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Run AI Valuation
            </>
          )}
        </Button>

        {error && (
          <div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
            <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {result && (
          <div className="space-y-6 animate-in fade-in-50 duration-300">
            {/* Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <MetricCard 
                icon={TrendingUp} 
                label="Estimated Value" 
                value={formatUsd(result.valuationUsd)} 
              />
              <MetricCard 
                icon={Sparkles} 
                label="Suggested Token Price" 
                value={formatUsd(result.suggestedTokenPrice)} 
              />
              <MetricCard 
                icon={TrendingUp} 
                label="Recommended Yield" 
                value={formatApy(result.suggestedYieldBps)} 
              />
            </div>

            {/* Risk */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Risk Assessment</p>
                  <p className="text-2xl font-semibold">{result.riskScore}/100</p>
                </div>
              </div>
              <Badge 
                variant={result.riskLevel === "low" ? "default" : result.riskLevel === "medium" ? "secondary" : "destructive"}
                className="capitalize"
              >
                {result.riskLevel} Risk
              </Badge>
            </div>

            {/* Summary */}
            <div>
              <p className="text-sm font-medium mb-2">AI Summary</p>
              <p className="text-sm leading-relaxed text-muted-foreground">{result.summary}</p>
            </div>

            {/* Risks & Compliance */}
            {result.keyRisks?.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Key Risks</p>
                <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                  {result.keyRisks.map((risk, i) => (
                    <li key={i}>{risk}</li>
                  ))}
                </ul>
              </div>
            )}

            {result.complianceNotes?.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Compliance Notes</p>
                <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                  {result.complianceNotes.map((note, i) => (
                    <li key={i}>{note}</li>
                  ))}
                </ul>
              </div>
            )}

            {onApplySuggestions && (
              <Button 
                variant="secondary" 
                className="w-full" 
                onClick={() => onApplySuggestions(result)}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Apply AI Recommendations to Form
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MetricCard({ icon: Icon, label, value }: { 
  icon: React.ComponentType<{ className?: string }>; 
  label: string; 
  value: string; 
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center gap-2 text-muted-foreground mb-1">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="text-2xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}