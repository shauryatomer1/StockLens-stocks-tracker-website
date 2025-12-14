export interface StockWithWatchlistStatus {

  name: string;
  symbol: string;
  isInWatchlist: boolean;
  exchange: string;
  type: string;
}

export interface PortfolioHolding {
  symbol: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  currentValue: number;
  unrealizedGain: number;
  unrealizedGainPercent: number;
  name: string;
  changePercent: number;
}

export interface PortfolioTransaction {
  _id: string;
  userId: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  totalAmount: number;
  date: string;
}

export interface PortfolioData {
  userId: string;
  balance: number;
  totalInvested: number;
  holdings: PortfolioHolding[];
  totalValue: number;
  totalEquity: number;
  dayChange: number;
  dayChangePercent: number;
}
