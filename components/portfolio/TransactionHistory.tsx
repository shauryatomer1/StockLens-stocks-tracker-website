import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { formatPrice } from '@/lib/utils';
import { PortfolioTransaction } from '@/lib/types';

export default function TransactionHistory({ transactions }: { transactions: PortfolioTransaction[] }) {
    return (
        <div className='bg-[#1a1a1a] rounded-xl border border-gray-800 overflow-hidden mt-8'>
            <div className='p-6 border-b border-gray-800'>
                <h2 className='text-xl font-bold text-white'>Transaction History</h2>
            </div>
            <Table>
                <TableHeader className='bg-[#111]'>
                    <TableRow className='border-gray-800 hover:bg-transparent'>
                        <TableHead className='text-gray-400'>Date</TableHead>
                        <TableHead className='text-gray-400'>Symbol</TableHead>
                        <TableHead className='text-gray-400'>Type</TableHead>
                        <TableHead className='text-gray-400'>Qty</TableHead>
                        <TableHead className='text-gray-400'>Price</TableHead>
                        <TableHead className='text-right text-gray-400'>Total Amount</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {transactions.length === 0 ? (
                        <TableRow className='border-gray-800 hover:bg-transparent'>
                            <TableCell colSpan={6} className='text-center py-8 text-gray-500'>
                                No transactions yet.
                            </TableCell>
                        </TableRow>
                    ) : (
                        transactions.map((txn) => (
                            <TableRow key={txn._id} className='border-gray-800 hover:bg-[#222]'>
                                <TableCell className='text-gray-400'>
                                    {new Date(txn.date).toLocaleDateString()} {new Date(txn.date).toLocaleTimeString()}
                                </TableCell>
                                <TableCell className='text-white font-medium'>{txn.symbol}</TableCell>
                                <TableCell className={txn.type === 'BUY' ? 'text-green-500' : 'text-red-500'}>
                                    {txn.type}
                                </TableCell>
                                <TableCell className='text-gray-300'>{txn.quantity}</TableCell>
                                <TableCell className='text-gray-300'>{formatPrice(txn.price)}</TableCell>
                                <TableCell className='text-right text-gray-300'>{formatPrice(txn.totalAmount)}</TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
