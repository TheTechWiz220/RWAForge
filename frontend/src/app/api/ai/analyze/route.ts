import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, assetType, description, documentsUri } = body;

    if (!description?.trim()) {
      return NextResponse.json({ error: "Description is required" }, { status: 400 });
    }

    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,  // Your xAI key works here
      },
      body: JSON.stringify({
        model: "grok-3-beta",   // or grok-2-1212 if available
        messages: [
          {
            role: "system",
            content: "You are an expert RWA analyst for Solana tokenization platforms. Be professional, conservative, and precise.",
          },
          {
            role: "user",
            content: `Analyze this asset for tokenization:

Name: ${name || "Unnamed Asset"}
Type: ${["Real Estate", "Invoice", "Collectible", "Commodity", "Equity", "Debt"][assetType] || "Unknown"}
Description: ${description}
Documents: ${documentsUri || "None"}

Return JSON with: valuationUsd, suggestedTokenPrice, suggestedYieldBps, riskScore, riskLevel, summary, keyRisks, complianceNotes, suggestedName, suggestedSymbol.`,
          },
        ],
        temperature: 0.6,
        max_tokens: 800,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || "Grok API error");
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("AI Analysis Error:", error);
    return NextResponse.json(
      { error: error.message || "Analysis failed" },
      { status: 500 }
    );
  }
}