import { formatPrice } from '@/lib/utils';
import { PortfolioData } from '@/lib/types';

export default function PortfolioSummary({ portfolio }: { portfolio: PortfolioData }) {
    const { balance, totalEquity, totalValue, dayChange, dayChangePercent } = portfolio;
    const isPositive = dayChange >= 0;

    return (
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-8'>
            <div className='bg-[#1a1a1a] p-6 rounded-xl border border-gray-800'>
                <h3 className='text-gray-400 text-sm font-medium mb-2'>Total Portfolio Value</h3>
                <div className='text-3xl font-bold text-white'>{formatPrice(totalValue)}</div>
                <div className={`text-sm mt-1 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                    {isPositive ? '+' : ''}{formatPrice(dayChange)} ({dayChangePercent.toFixed(2)}%) Today
                </div>
            </div>

            <div className='bg-[#1a1a1a] p-6 rounded-xl border border-gray-800'>
                <h3 className='text-gray-400 text-sm font-medium mb-2'>Cash Balance</h3>
                <div className='text-3xl font-bold text-white'>{formatPrice(balance)}</div>
                <div className='text-sm mt-1 text-gray-500'>Available Buying Power</div>
            </div>

            <div className='bg-[#1a1a1a] p-6 rounded-xl border border-gray-800'>
                <h3 className='text-gray-400 text-sm font-medium mb-2'>Total Equity</h3>
                <div className='text-3xl font-bold text-white'>{formatPrice(totalEquity)}</div>
                <div className='text-sm mt-1 text-gray-500'>Assets held in stocks</div>
            </div>
        </div>
    );
}
