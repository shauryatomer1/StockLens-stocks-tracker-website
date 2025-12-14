'use server';

import { model } from "@/lib/gemini";
import Portfolio from "@/database/models/portfolio.model";
import { connectToDatabase } from "@/database/mongoose";
import { redis } from "@/lib/redis";


export async function analyzePortfolio(userId: string) {
    try {
        await connectToDatabase();

        const portfolio = await Portfolio.findOne({ userId });

        if (!portfolio || !portfolio.holdings || portfolio.holdings.length === 0) {
            return {
                success: false,
                message: "Portfolio not found or empty. Add some stocks to get an analysis.",
            };
        }

        // Create a stable cache key based on the holdings content
        // We sort the holdings to ensure order doesn't affect the key
        const holdingsSignature = JSON.stringify(
            portfolio.holdings.map((h: any) => ({
                s: h.symbol,
                q: h.quantity,
                p: h.averagePrice
            })).sort((a: any, b: any) => a.s.localeCompare(b.s))
        );

        // Simple hash/encode of the signature to keep keys reasonable
        const cacheKey = `portfolio-analysis:${userId}:${Buffer.from(holdingsSignature).toString('base64')}`;

        // 1. Try Cache
        try {
            const cachedParams = await redis.get(cacheKey);
            if (cachedParams) {
                console.log("Redis Cache HIT for portfolio analysis");
                return { success: true, analysis: JSON.parse(cachedParams), cached: true };
            }
        } catch (e) {
            console.warn("Redis get failed", e);
        }

        const holdingsSummary = portfolio.holdings
            .map(
                (h: any) =>
                    `- ${h.symbol}: ${h.quantity} shares @ $${h.averagePrice.toFixed(2)}`
            )
            .join("\n");

        const prompt = `
      You are an expert financial advisor and portfolio analyst. 
      Analyze the following stock portfolio for a retail investor:

      ${holdingsSummary}

      Current Cash Balance: $${portfolio.balance.toFixed(2)}
      Total Invested: $${portfolio.totalInvested.toFixed(2)}

      Please provide a comprehensive analysis in strict JSON format. Do not include any markdown formatting (like \`\`\`json). Just the raw JSON object.
      
      The JSON structure must be exactly:
      {
        "summary": "Brief 1-2 sentence overall summary of the portfolio status.",
        "riskLevel": "Low" | "Medium" | "High",
        "riskAnalysis": "Detailed explanation of the risk level (approx 50 words).",
        "composition": "Analysis of what they own (approx 50 words).",
        "diversification": "Analysis of sector/asset diversification (approx 50 words).",
        "suggestions": ["Suggestion 1", "Suggestion 2", "Suggestion 3"]
      }

      Keep the tone professional yet encouraging.
    `;



        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        // Clean up markdown code blocks
        text = text.replace(/```json/g, "").replace(/```/g, "").trim();

        // Validate JSON before caching
        const analysisData = JSON.parse(text);


        // 2. Save to Cache (1 day expiry)
        try {
            await redis.setex(cacheKey, 86400, JSON.stringify(analysisData));
        } catch (e) {
            console.warn("Redis set failed", e);
        }

        return { success: true, analysis: analysisData, cached: false };
    } catch (error) {
        console.error("Error analyzing portfolio:", error);
        return {
            success: false,
            message: "Failed to specific generate analysis. Please try again later.",
        };
    }
}
