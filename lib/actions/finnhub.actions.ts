'use server';

import { cache } from 'react';
import { auth } from '../better-auth/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { connectToDatabase } from '@/database/mongoose';
import { Watchlist } from '@/database/models/watchlist.model';

// If these are defined elsewhere already, keep your original imports instead:
import {
  FINNHUB_BASE_URL,
  POPULAR_STOCK_SYMBOLS,
} from '@/lib/constants';
import {
  fetchJSON,
  formatPrice,
  formatChangePercent,
  formatMarketCapValue,
} from '@/lib/utils';




/**
 * Helper to get all watchlist symbols for the current user.
 * We query by userId from the session so we don't need a separate action.
 */
const getUserWatchlistSymbols = async (userId: string): Promise<string[]> => {
  const docs = await Watchlist.find({ userId }).lean();
  return docs.map((doc) => String(doc.symbol).toUpperCase());
};

const FINNHUB_TOKEN =
  process.env.FINNHUB_API_KEY ?? process.env.NEXT_PUBLIC_FINNHUB_API_KEY ?? '';

export const searchStocks = cache(
  async (query?: string): Promise<StockWithWatchlistStatus[]> => {
    try {
      const session = await auth.api.getSession({
        headers: await headers(),
      });
      if (!session?.user) redirect('/sign-in');

      await connectToDatabase();

      const userWatchlistSymbols = await getUserWatchlistSymbols(
        session.user.id
      );

      if (!FINNHUB_TOKEN) {
        console.error(
          'Error in stock search:',
          new Error('FINNHUB API key is not configured')
        );
        return [];
      }

      const trimmed = typeof query === 'string' ? query.trim() : '';

      let results: FinnhubSearchResult[] = [];

      if (!trimmed) {
        // Fetch top 10 popular symbols' profiles
        const top = POPULAR_STOCK_SYMBOLS.slice(0, 10);
        const profiles = await Promise.all(
          top.map(async (sym) => {
            try {
              const url = `${FINNHUB_BASE_URL}/stock/profile2?symbol=${encodeURIComponent(
                sym
              )}&token=${FINNHUB_TOKEN}`;
              // Revalidate every hour
              const profile = await fetchJSON<unknown>(url, 3600);
              return { sym, profile } as { sym: string; profile: unknown };
            } catch (e) {
              console.error('Error fetching profile2 for', sym, e);
              return { sym, profile: null } as { sym: string; profile: unknown };
            }
          })
        );

        results = profiles
          .map(({ sym, profile }) => {
            const symbol = sym.toUpperCase();
            const p = profile as { name?: string; ticker?: string; exchange?: string };
            const name: string | undefined =
              p?.name || p?.ticker || undefined;
            const exchange: string | undefined = p?.exchange || undefined;
            if (!name) return undefined;
            const r: FinnhubSearchResult = {
              symbol,
              description: name,
              displaySymbol: symbol,
              type: 'Common Stock',
            };
            (r as unknown as { __exchange: string | undefined }).__exchange = exchange; // internal only
            return r;
          })
          .filter((x): x is FinnhubSearchResult => Boolean(x));
      } else {
        const url = `${FINNHUB_BASE_URL}/search?q=${encodeURIComponent(
          trimmed
        )}&token=${FINNHUB_TOKEN}`;
        const data = await fetchJSON<FinnhubSearchResponse>(url, 1800);
        results = Array.isArray(data?.result) ? data.result : [];
      }

      const mapped: StockWithWatchlistStatus[] = results
        .map((r) => {
          const upper = (r.symbol || '').toUpperCase();
          const name = r.description || upper;

          const exchangeFromDisplay =
            (r.displaySymbol as string | undefined) || undefined;
          const exchangeFromProfile = (r as unknown as { __exchange: string }).__exchange as
            | string
            | undefined;
          const exchange = exchangeFromDisplay || exchangeFromProfile || 'US';

          const type = r.type || 'Stock';

          const item: StockWithWatchlistStatus = {
            // make sure your type includes these fields (+id if you need)
            symbol: upper,
            name,
            exchange,
            type,
            isInWatchlist: userWatchlistSymbols.includes(upper),
          };
          return item;
        })
        .slice(0, 15);

      return mapped;
    } catch (err) {
      console.error('Error in stock search:', err);
      return [];
    }
  }
);

// Fetch stock details by symbol
export const getStocksDetails = cache(async (symbol: string) => {
  const cleanSymbol = symbol.trim().toUpperCase();

  if (!FINNHUB_TOKEN) {
    throw new Error('FINNHUB API key is not configured');
  }

  try {
    const [quote, profile, financials] = await Promise.all([
      fetchJSON(
        // Price data - minimal caching for accuracy
        `${FINNHUB_BASE_URL}/quote?symbol=${cleanSymbol}&token=${FINNHUB_TOKEN}`
      ),
      fetchJSON(
        // Company info - cache 1hr (rarely changes)
        `${FINNHUB_BASE_URL}/stock/profile2?symbol=${cleanSymbol}&token=${FINNHUB_TOKEN}`,
        3600
      ),
      fetchJSON(
        // Financial metrics (P/E, etc.) - cache 30min
        `${FINNHUB_BASE_URL}/stock/metric?symbol=${cleanSymbol}&metric=all&token=${FINNHUB_TOKEN}`,
        1800
      ),
    ]);

    const quoteData = quote as QuoteData;
    const profileData = profile as ProfileData;
    const financialsData = financials as FinancialsData;

    if (!quoteData?.c || !profileData?.name)
      throw new Error('Invalid stock data received from API');

    const changePercent = quoteData.dp || 0;
    const peRatio = financialsData?.metric?.peNormalizedAnnual || null;

    return {
      symbol: cleanSymbol,
      company: profileData?.name,
      currentPrice: quoteData.c,
      changePercent,
      priceFormatted: formatPrice(quoteData.c),
      changeFormatted: formatChangePercent(changePercent),
      peRatio: peRatio?.toFixed(1) || '—',
      marketCapFormatted: formatMarketCapValue(
        profileData?.marketCapitalization || 0
      ),
    };
  } catch (error) {
    console.error(`Error fetching details for ${cleanSymbol}:`, error);
    throw new Error('Failed to fetch stock details');
  }
});
// Fetch market news; optionally for specific symbols
export const getNews = async (symbols?: string[]): Promise<MarketNewsArticle[]> => {
  if (!FINNHUB_TOKEN) {
    console.error('FINNHUB API key is not configured for getNews');
    return [];
  }

  try {
    // If we have watchlist symbols, use the first one to fetch company-specific news
    if (symbols && symbols.length > 0) {
      const symbol = symbols[0].toUpperCase();

      // Last 7 days range
      const now = new Date();
      const from = new Date(now);
      from.setDate(now.getDate() - 7);

      const fromStr = from.toISOString().slice(0, 10);
      const toStr = now.toISOString().slice(0, 10);

      const url = `${FINNHUB_BASE_URL}/company-news?symbol=${encodeURIComponent(
        symbol
      )}&from=${fromStr}&to=${toStr}&token=${FINNHUB_TOKEN}`;

      const data = await fetchJSON<MarketNewsArticle[]>(url, 900);
      return Array.isArray(data) ? data : [];
    }

    // Fallback: general market news
    const url = `${FINNHUB_BASE_URL}/news?category=general&token=${FINNHUB_TOKEN}`;
    const data = await fetchJSON<MarketNewsArticle[]>(url, 900);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching news from Finnhub:', error);
    return [];
  }
};
