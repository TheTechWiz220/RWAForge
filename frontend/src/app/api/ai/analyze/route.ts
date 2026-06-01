import { generateObject } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import { ASSET_TYPES } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const AnalysisSchema = z.object({
  valuationUsd: z.number().describe("Estimated total asset valuation in USD cents"),
  suggestedTokenPrice: z.number().describe("Suggested price per token in USD cents"),
  suggestedYieldBps: z.number().describe("Suggested annual yield in basis points"),
  riskScore: z.number().min(0).max(100),
  riskLevel: z.enum(["low", "medium", "high"]),
  summary: z.string(),
  complianceNotes: z.array(z.string()),
  keyRisks: z.array(z.string()),
});

function getModel() {
  const provider = process.env.AI_PROVIDER ?? "openai";

  switch (provider) {
    case "anthropic": {
      const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      return anthropic("claude-3-5-sonnet-20241022");
    }
    case "groq": {
      const groq = createOpenAI({
        apiKey: process.env.GROQ_API_KEY,
        baseURL: "https://api.groq.com/openai/v1",
      });
      return groq("llama-3.3-70b-versatile");
    }
    case "openai":
    default: {
      const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
      return openai("gpt-4o-mini");
    }
  }
}

function mockAnalysis(input: {
  name: string;
  assetType: number;
  description: string;
}) {
  const typeLabel = ASSET_TYPES.find((t) => t.id === input.assetType)?.label ?? "Asset";
  const baseValuation = 500_000_00 + input.description.length * 1000_00;

  return {
    valuationUsd: baseValuation,
    suggestedTokenPrice: Math.floor(baseValuation / 10000),
    suggestedYieldBps: input.assetType === 1 ? 1200 : input.assetType === 0 ? 650 : 400,
    riskScore: input.assetType === 2 ? 55 : 35,
    riskLevel: (input.assetType === 2 ? "medium" : "low") as "low" | "medium" | "high",
    summary: `Based on the provided ${typeLabel.toLowerCase()} description for "${input.name || "unnamed asset"}", our analysis estimates fair market value using comparable asset benchmarks. This is a demo analysis — connect an API key for production-grade valuation.`,
    complianceNotes: [
      "Securities regulations may apply depending on jurisdiction and investor count.",
      "KYC/AML verification required before token transfers (enforced via Transfer Hook).",
      "Accredited investor restrictions may apply for certain asset classes.",
    ],
    keyRisks: [
      "Illiquidity risk in secondary markets",
      "Regulatory classification uncertainty",
      "Off-chain asset custody and legal enforceability",
    ],
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, assetType, description, documentsUri } = body;

    if (!description?.trim()) {
      return Response.json({ error: "Description is required" }, { status: 400 });
    }

    const typeLabel = ASSET_TYPES.find((t) => t.id === assetType)?.label ?? "Unknown";
    const hasApiKey =
      (process.env.AI_PROVIDER === "anthropic" && process.env.ANTHROPIC_API_KEY) ||
      (process.env.AI_PROVIDER === "groq" && process.env.GROQ_API_KEY) ||
      (!process.env.AI_PROVIDER || process.env.AI_PROVIDER === "openai") &&
        process.env.OPENAI_API_KEY;

    if (!hasApiKey) {
      return Response.json(mockAnalysis({ name, assetType, description }));
    }

    const { object } = await generateObject({
      model: getModel(),
      schema: AnalysisSchema,
      prompt: `You are an expert RWA (Real World Asset) analyst for a Solana tokenization platform.

Analyze this asset and provide structured valuation, risk, yield, and compliance guidance.

Asset Name: ${name || "Unnamed"}
Asset Type: ${typeLabel}
Description: ${description}
Documents URI: ${documentsUri || "Not provided"}

Return valuation in USD cents (e.g. $1.25M = 125000000).
Return suggested token price in USD cents per token.
Return yield in basis points (6.5% = 650 bps).
Be conservative and note this is not financial advice.`,
    });

    return Response.json(object);
  } catch (error) {
    console.error("AI analysis error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Analysis failed" },
      { status: 500 }
    );
  }
}
