'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '../better-auth/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { connectToDatabase } from '@/database/mongoose';
import { Watchlist } from '@/database/models/watchlist.model';
import { getStocksDetails } from '@/lib/actions/finnhub.actions';

type WatchlistItem = {
  userId: string;
  symbol: string;
  company: string;
  addedAt: Date;
};

// Add stock to watchlist
export const addToWatchlist = async (symbol: string, company: string) => {
  try {
    await connectToDatabase();
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user) redirect('/sign-in');

    const upperSymbol = symbol.toUpperCase().trim();

    // Check if stock already exists in watchlist
    const existingItem = await Watchlist.findOne({
      userId: session.user.id,
      symbol: upperSymbol,
    });

    if (existingItem) {
      return { success: false, error: 'Stock already in watchlist' };
    }

    const newItem = new Watchlist({
      userId: session.user.id,
      symbol: upperSymbol,
      company: company.trim(),
    });

    await newItem.save();
    revalidatePath('/watchlist');

    return { success: true, message: 'Stock added to watchlist' };
  } catch (error) {
    console.error('Error adding to watchlist:', error);
    throw new Error('Failed to add stock to watchlist');
  }
};

export const getWatchlistSymbolsByEmail = async (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _email: string
): Promise<string[]> => {
  // If you later add a User model and store userId in Watchlist,
  // you can implement:
  // 1. const user = await User.findOne({ email });
  // 2. const items = await Watchlist.find({ userId: user._id }).lean();
  // 3. return items.map(i => i.symbol);
  return [];
};

// Remove stock from watchlist
export const removeFromWatchlist = async (symbol: string) => {
  try {
    await connectToDatabase();
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user) redirect('/sign-in');

    const upperSymbol = symbol.toUpperCase().trim();

    await Watchlist.deleteOne({
      userId: session.user.id,
      symbol: upperSymbol,
    });
    revalidatePath('/watchlist');

    return { success: true, message: 'Stock removed from watchlist' };
  } catch (error) {
    console.error('Error removing from watchlist:', error);
    throw new Error('Failed to remove stock from watchlist');
  }
};

// Get user's raw watchlist
export const getUserWatchlist = async () => {
  try {
    await connectToDatabase();
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user) redirect('/sign-in');

    const watchlist = await Watchlist.find<WatchlistItem>({
      userId: session.user.id,
    })
      .sort({ addedAt: -1 })
      .lean();

    return JSON.parse(JSON.stringify(watchlist));
  } catch (error) {
    console.error('Error fetching watchlist:', error);
    throw new Error('Failed to fetch watchlist');
  }
};

// Get user's watchlist with stock data
export const getWatchlistWithData = async () => {
  try {
    await connectToDatabase();
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user) redirect('/sign-in');

    const watchlist = await Watchlist.find<WatchlistItem>({
      userId: session.user.id,
    })
      .sort({ addedAt: -1 })
      .lean();

    if (watchlist.length === 0) return [];

    const stocksWithData = await Promise.all(
      watchlist.map(async (item: WatchlistItem) => {
        const stockData = await getStocksDetails(item.symbol);

        if (!stockData) {
          console.warn(`Failed to fetch data for ${item.symbol}`);
          return item; // fallback to raw item
        }

        return {
          company: stockData.company,
          symbol: stockData.symbol,
          currentPrice: stockData.currentPrice,
          priceFormatted: stockData.priceFormatted,
          changeFormatted: stockData.changeFormatted,
          changePercent: stockData.changePercent,
          marketCap: stockData.marketCapFormatted,
          peRatio: stockData.peRatio,
        };
      })
    );

    return JSON.parse(JSON.stringify(stocksWithData));
  } catch (error) {
    console.error('Error loading watchlist:', error);
    throw new Error('Failed to fetch watchlist');
  }
};
