"use server";

export interface StockSearchResult {
  symbol: string;
  description: string;
}

export const searchStocks = async (query: string = ""): Promise<StockSearchResult[]> => {
  try {
    if (!query) return [];

    const apiKey = process.env.FINNHUB_API_KEY;

    if (!apiKey) {
      console.error("❌ FINNHUB_API_KEY missing in env");
      return [];
    }

    const res = await fetch(`https://finnhub.io/api/v1/search?q=${query}&token=${apiKey}`);

    if (!res.ok) {
      console.error("Finnhub search error:", res.statusText);
      return [];
    }

    const data = await res.json();

    // Finnhub returns "result" array
    return data.result?.map((item: any) => ({
      symbol: item.symbol,
      description: item.description,
    })) || [];
  } catch (error) {
    console.error("Error searching stocks:", error);
    return [];
  }
};
