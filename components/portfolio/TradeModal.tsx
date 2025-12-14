'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatPrice } from '@/lib/utils';
import { buyStock, sellStock } from '@/lib/actions/portfolio.actions';
import { toast } from 'sonner';

interface TradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    symbol: string;
    companyName: string;
    currentPrice: number;
    onSuccess?: () => void;
}

export default function TradeModal({
    isOpen,
    onClose,
    symbol,
    companyName,
    currentPrice,
    onSuccess,
}: TradeModalProps) {
    const [type, setType] = useState<'BUY' | 'SELL'>('BUY');
    const [quantity, setQuantity] = useState<string>('1');
    const [loading, setLoading] = useState(false);

    const cleanQty = Math.max(1, parseInt(quantity) || 0);
    const total = cleanQty * currentPrice;

    const handleTrade = async () => {
        setLoading(true);
        try {
            const action = type === 'BUY' ? buyStock : sellStock;
            const result = await action(symbol, cleanQty, currentPrice);

            if (result.success) {
                toast.success(result.message);
                onSuccess?.();
                onClose();
            } else {
                toast.error(result.error);
            }
        } catch {
            toast.error('Transaction failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className='bg-[#1a1a1a] border-gray-800 text-white sm:max-w-md'>
                <DialogHeader>
                    <DialogTitle>Trade {companyName} ({symbol})</DialogTitle>
                </DialogHeader>

                <div className='flex gap-2 mb-4 p-1 bg-gray-800 rounded-lg'>
                    <button
                        className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${type === 'BUY' ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white'
                            }`}
                        onClick={() => setType('BUY')}
                    >
                        Buy
                    </button>
                    <button
                        className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${type === 'SELL' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'
                            }`}
                        onClick={() => setType('SELL')}
                    >
                        Sell
                    </button>
                </div>

                <div className='space-y-4'>
                    <div className='flex justify-between text-sm text-gray-400'>
                        <span>Current Price</span>
                        <span className='text-white'>{formatPrice(currentPrice)}</span>
                    </div>

                    <div className='space-y-2'>
                        <Label>Quantity</Label>
                        <Input
                            type='number'
                            min='1'
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            className='bg-[#0F0F0F] border-gray-700 text-white'
                        />
                    </div>

                    <div className='flex justify-between text-sm pt-2 border-t border-gray-800'>
                        <span className='text-gray-400'>Total Estimated {type === 'BUY' ? 'Cost' : 'Proceeds'}</span>
                        <span className='text-xl font-bold'>{formatPrice(total)}</span>
                    </div>

                    <Button
                        className={`w-full ${type === 'BUY' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                        onClick={handleTrade}
                        disabled={loading}
                    >
                        {loading ? 'Processing...' : `${type} ${symbol}`}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
