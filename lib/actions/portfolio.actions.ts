'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '../better-auth/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { connectToDatabase } from '@/database/mongoose';
import Portfolio from '@/database/models/portfolio.model';
import Transaction from '@/database/models/transaction.model';
import { getStocksDetails } from './finnhub.actions';

export async function getPortfolio() {
    await connectToDatabase();
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) redirect('/sign-in');

    let portfolio = await Portfolio.findOne({ userId: session.user.id });

    if (!portfolio) {
        portfolio = await Portfolio.create({
            userId: session.user.id,
            balance: 100000,
            holdings: [],
        });
    }

    return JSON.parse(JSON.stringify(portfolio));
}

export async function getPortfolioWithMetrics() {
    const portfolio = await getPortfolio();

    if (!portfolio.holdings || portfolio.holdings.length === 0) {
        return {
            ...portfolio,
            totalValue: portfolio.balance,
            totalEquity: 0,
            dayChange: 0,
            dayChangePercent: 0,
            holdings: [],
        };
    }

    let totalEquity = 0;
    let dayChangeTotal = 0;

    const enrichedHoldings = await Promise.all(
        portfolio.holdings.map(async (holding: { symbol: string; quantity: number; averagePrice: number }) => {
            try {
                const details = await getStocksDetails(holding.symbol);
                const currentPrice = details.currentPrice;
                const currentValue = currentPrice * holding.quantity;
                const costBasis = holding.averagePrice * holding.quantity;
                const unrealizedGain = currentValue - costBasis;
                const unrealizedGainPercent = costBasis === 0 ? 0 : (unrealizedGain / costBasis) * 100;

                totalEquity += currentValue;

                // Calculate daily change contribution
                // details.changePercent is percentage change of price today (e.g., 1.5 for 1.5%)
                // Price Change Amount per share = CurrentPrice - (CurrentPrice / (1 + pct/100))
                const prevPrice = currentPrice / (1 + (details.changePercent / 100));
                const dailyDiffPerShare = currentPrice - prevPrice;
                dayChangeTotal += dailyDiffPerShare * holding.quantity;

                return {
                    ...holding,
                    currentPrice,
                    currentValue,
                    unrealizedGain,
                    unrealizedGainPercent,
                    name: details.company,
                    changePercent: details.changePercent
                };
            } catch (e) {
                console.error(`Failed to fetch details for ${holding.symbol}`, e);
                return {
                    ...holding,
                    currentPrice: holding.averagePrice, // Fallback
                    currentValue: holding.averagePrice * holding.quantity,
                    unrealizedGain: 0,
                    unrealizedGainPercent: 0,
                    name: holding.symbol,
                    changePercent: 0
                };
            }
        })
    );

    return {
        ...portfolio,
        holdings: enrichedHoldings,
        totalEquity,
        totalValue: portfolio.balance + totalEquity,
        dayChange: dayChangeTotal,
        // Day change percent for total value = (Total Day Change / (Start of Day Total Value)) * 100
        // Start of Day Total Value = Current Total Value - Total Day Change
        dayChangePercent: dayChangeTotal / ((portfolio.balance + totalEquity) - dayChangeTotal) * 100 || 0,
    };
}

export async function buyStock(symbol: string, quantity: number, price: number) {
    try {
        await connectToDatabase();
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user) redirect('/sign-in');

        const totalCost = quantity * price;

        const portfolio = await Portfolio.findOne({ userId: session.user.id });
        if (!portfolio) throw new Error("Portfolio not found");

        if (portfolio.balance < totalCost) {
            return { success: false, error: "Insufficient funds" };
        }

        portfolio.balance -= totalCost;
        portfolio.totalInvested += totalCost;

        const existingHoldingIndex = portfolio.holdings.findIndex((h: { symbol: string }) => h.symbol === symbol);
        if (existingHoldingIndex >= 0) {
            const holding = portfolio.holdings[existingHoldingIndex];
            const totalQty = holding.quantity + quantity;
            const totalCostBasis = (holding.quantity * holding.averagePrice) + totalCost;
            holding.quantity = totalQty;
            holding.averagePrice = totalCostBasis / totalQty;
        } else {
            portfolio.holdings.push({
                symbol,
                quantity,
                averagePrice: price
            });
        }

        await portfolio.save();

        await Transaction.create({
            userId: session.user.id,
            symbol,
            type: 'BUY',
            quantity,
            price,
            totalAmount: totalCost,
        });

        revalidatePath('/portfolio');
        return { success: true, message: `Successfully bought ${quantity} shares of ${symbol}` };
    } catch (error) {
        console.error("Buy error:", error);
        return { success: false, error: "Failed to execute buy order" };
    }
}

export async function sellStock(symbol: string, quantity: number, price: number) {
    try {
        await connectToDatabase();
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user) redirect('/sign-in');

        const portfolio = await Portfolio.findOne({ userId: session.user.id });
        if (!portfolio) throw new Error("Portfolio not found");

        const existingHoldingIndex = portfolio.holdings.findIndex((h: { symbol: string }) => h.symbol === symbol);
        if (existingHoldingIndex === -1 || portfolio.holdings[existingHoldingIndex].quantity < quantity) {
            return { success: false, error: "Insufficient shares" };
        }

        const totalProceeds = quantity * price;
        portfolio.balance += totalProceeds;

        const holding = portfolio.holdings[existingHoldingIndex];
        const costBasisOfSold = quantity * holding.averagePrice;
        portfolio.totalInvested -= costBasisOfSold;

        holding.quantity -= quantity;
        if (holding.quantity === 0) {
            portfolio.holdings.splice(existingHoldingIndex, 1);
        }

        await portfolio.save();

        await Transaction.create({
            userId: session.user.id,
            symbol,
            type: 'SELL',
            quantity,
            price,
            totalAmount: totalProceeds,
        });

        revalidatePath('/portfolio');
        return { success: true, message: `Successfully sold ${quantity} shares of ${symbol}` };
    } catch (error) {
        console.error("Sell error:", error);
        return { success: false, error: "Failed to execute sell order" };
    }
}

export async function getTransactionHistory() {
    await connectToDatabase();
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) redirect('/sign-in');

    const transactions = await Transaction.find({ userId: session.user.id }).sort({ date: -1 }).limit(50);
    return JSON.parse(JSON.stringify(transactions));
}
