'use client';
import { useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { formatPrice, cn } from '@/lib/utils';
import { PortfolioHolding } from '@/lib/types';
import TradeModal from './TradeModal';

export default function HoldingsTable({ holdings }: { holdings: PortfolioHolding[] }) {
    const [selectedStock, setSelectedStock] = useState<PortfolioHolding | null>(null);

    return (
        <>
            <div className='bg-[#1a1a1a] rounded-xl border border-gray-800 overflow-hidden'>
                <div className='p-6 border-b border-gray-800'>
                    <h2 className='text-xl font-bold text-white'>Current Holdings</h2>
                </div>
                <Table>
                    <TableHeader className='bg-[#111]'>
                        <TableRow className='border-gray-800 hover:bg-transparent'>
                            <TableHead className='text-gray-400'>Symbol</TableHead>
                            <TableHead className='text-gray-400'>Qty</TableHead>
                            <TableHead className='text-gray-400'>Avg Price</TableHead>
                            <TableHead className='text-gray-400'>Current Price</TableHead>
                            <TableHead className='text-gray-400'>Market Value</TableHead>
                            <TableHead className='text-gray-400'>Total Return</TableHead>
                            <TableHead className='text-right text-gray-400'>Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {holdings.length === 0 ? (
                            <TableRow className='border-gray-800 hover:bg-transparent'>
                                <TableCell colSpan={7} className='text-center py-8 text-gray-500'>
                                    No holdings yet. Start trading!
                                </TableCell>
                            </TableRow>
                        ) : (
                            holdings.map((holding) => (
                                <TableRow key={holding.symbol} className='border-gray-800 hover:bg-[#222]'>
                                    <TableCell className='font-medium text-white'>
                                        <div>{holding.symbol}</div>
                                        <div className='text-xs text-gray-500'>{holding.name}</div>
                                    </TableCell>
                                    <TableCell className='text-gray-300'>{holding.quantity}</TableCell>
                                    <TableCell className='text-gray-300'>{formatPrice(holding.averagePrice)}</TableCell>
                                    <TableCell className='text-gray-300'>{formatPrice(holding.currentPrice)}</TableCell>
                                    <TableCell className='text-gray-300'>{formatPrice(holding.currentValue)}</TableCell>
                                    <TableCell className={cn(holding.unrealizedGain >= 0 ? 'text-green-500' : 'text-red-500')}>
                                        <div>{formatPrice(holding.unrealizedGain)}</div>
                                        <div className='text-xs'>{holding.unrealizedGainPercent.toFixed(2)}%</div>
                                    </TableCell>
                                    <TableCell className='text-right'>
                                        <Button
                                            variant='outline'
                                            size='sm'
                                            className='border-blue-600/50 text-blue-500 hover:bg-blue-600/10 hover:text-blue-400'
                                            onClick={() => setSelectedStock(holding)}
                                        >
                                            Trade
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {selectedStock && (
                <TradeModal
                    isOpen={!!selectedStock}
                    onClose={() => setSelectedStock(null)}
                    symbol={selectedStock.symbol}
                    companyName={selectedStock.name}
                    currentPrice={selectedStock.currentPrice}
                />
            )}
        </>
    );
}
