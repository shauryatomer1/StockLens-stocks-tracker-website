'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import TradeModal from './TradeModal';

export default function TradeButton({
    symbol,
    companyName,
    currentPrice
}: {
    symbol: string;
    companyName: string;
    currentPrice: number;
}) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <Button
                onClick={() => setIsOpen(true)}
                className="bg-green-600 hover:bg-green-700 text-white h-12 rounded-lg text-base font-semibold px-8"
            >
                Trade
            </Button>

            <TradeModal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                symbol={symbol}
                companyName={companyName}
                currentPrice={currentPrice}
            />
        </>
    );
}
