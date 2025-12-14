import { auth } from '@/lib/better-auth/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getPortfolioWithMetrics, getTransactionHistory } from '@/lib/actions/portfolio.actions';
import PortfolioSummary from '@/components/portfolio/PortfolioSummary';
import HoldingsTable from '@/components/portfolio/HoldingsTable';
import TransactionHistory from '@/components/portfolio/TransactionHistory';
import PortfolioAnalysis from '@/components/portfolio/PortfolioAnalysis';

export const dynamic = 'force-dynamic';

export default async function PortfolioPage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user) {
        redirect('/sign-in');
    }

    const [portfolio, transactions] = await Promise.all([
        getPortfolioWithMetrics(),
        getTransactionHistory(),
    ]);

    // Ensure portfolio is plain object for client components
    // Mongoose documents need to be serialized, but our actions already do JSON.parse(JSON.stringify(..))
    // The getPortfolioWithMetrics returns a plain object constructed manually, so it's safe.

    return (
        <div className='min-h-screen bg-[#0F0F0F] pb-20'>
            <div className='container mx-auto px-4 pt-8'>
                <div className='flex items-center justify-between mb-8'>
                    <div>
                        <h1 className='text-3xl font-bold text-white'>Portfolio</h1>
                        <p className='text-gray-400 mt-1'>
                            Manage your virtual investments and track performance
                        </p>
                    </div>
                </div>

                <PortfolioSummary portfolio={portfolio} />

                <HoldingsTable holdings={portfolio.holdings} />

                <PortfolioAnalysis userId={session.user.id} />

                <TransactionHistory transactions={transactions} />
            </div>
        </div>
    );
}
