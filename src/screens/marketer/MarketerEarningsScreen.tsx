import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import {
    DollarSign,
    TrendingUp,
    Clock,
    CheckCircle,
    Download,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    Loader2
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { FirestoreService } from '../../services/firestore.service';
import { COLLECTIONS } from '../../lib/collections';

interface Transaction {
    id: string;
    type: string;
    amount: number;
    status: string;
    description: string;
    created_at: string;
}

interface EarningsStats {
    totalEarned: number;
    pendingPayout: number;
    paidOut: number;
    thisMonth: number;
}

export const MarketerEarningsScreen: React.FC = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<EarningsStats>({
        totalEarned: 0,
        pendingPayout: 0,
        paidOut: 0,
        thisMonth: 0
    });
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [filterPeriod, setFilterPeriod] = useState<string>('all');

    useEffect(() => {
        if (user?.uid) {
            loadEarnings();
        }
    }, [user]);

    const loadEarnings = async () => {
        try {
            setLoading(true);

            if (!user?.uid) return;

            // Get marketer info using user ID (document ID = user ID)
            const marketer = await FirestoreService.getDocument<any>(
                COLLECTIONS.MARKETERS,
                user.uid
            );

            if (!marketer) return;

            // Get referrals to calculate earnings
            const referrals = await FirestoreService.getDocuments<any>(
                COLLECTIONS.MARKETER_REFERRALS,
                {
                    filters: [{ field: 'marketer_id', operator: '==', value: marketer.id }],
                    orderByField: 'created_at',
                    orderByDirection: 'desc'
                }
            );

            // Calculate stats
            const now = new Date();
            const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

            let totalEarned = 0;
            let pendingPayout = 0;
            let paidOut = 0;
            let thisMonth = 0;

            const transactionList: Transaction[] = [];

            referrals.forEach((ref: any) => {
                const amount = ref.commission_amount || 0;
                const createdAt = ref.created_at?.toDate?.() || new Date();

                if (ref.status === 'completed') {
                    totalEarned += amount;

                    if (ref.commission_paid) {
                        paidOut += amount;
                        transactionList.push({
                            id: ref.id,
                            type: 'payout',
                            amount: amount,
                            status: 'completed',
                            description: 'Commission payout',
                            created_at: createdAt.toISOString()
                        });
                    } else {
                        pendingPayout += amount;
                    }

                    if (createdAt >= thisMonthStart) {
                        thisMonth += amount;
                    }
                }

                transactionList.push({
                    id: `ref-${ref.id}`,
                    type: 'commission',
                    amount: amount,
                    status: ref.status,
                    description: `Referral commission - ${ref.status}`,
                    created_at: createdAt.toISOString()
                });
            });

            setStats({
                totalEarned,
                pendingPayout,
                paidOut,
                thisMonth
            });

            setTransactions(transactionList);
        } catch (error) {
            console.error('Error loading earnings:', error);
        } finally {
            setLoading(false);
        }
    };

    const getFilteredTransactions = () => {
        if (filterPeriod === 'all') return transactions;

        const now = new Date();
        let startDate: Date;

        switch (filterPeriod) {
            case 'week':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            default:
                return transactions;
        }

        return transactions.filter(t => new Date(t.created_at) >= startDate);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-neutral-900 mb-2">Earnings</h1>
                        <p className="text-neutral-600">Track your commission earnings</p>
                    </div>
                    <Button
                        variant="outline"
                        className="flex items-center gap-2"
                        onClick={() => alert('Export feature coming soon!')}
                    >
                        <Download className="w-4 h-4" />
                        Export
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-2">
                                <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                                    <DollarSign className="w-6 h-6 text-white" />
                                </div>
                                <ArrowUpRight className="w-5 h-5 text-green-600" />
                            </div>
                            <p className="text-sm text-green-700 mb-1">Total Earned</p>
                            <p className="text-2xl font-bold text-green-900">₦{stats.totalEarned.toLocaleString()}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-2">
                                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                                    <Clock className="w-6 h-6 text-yellow-600" />
                                </div>
                            </div>
                            <p className="text-sm text-neutral-600 mb-1">Pending Payout</p>
                            <p className="text-2xl font-bold text-neutral-900">₦{stats.pendingPayout.toLocaleString()}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-2">
                                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <CheckCircle className="w-6 h-6 text-blue-600" />
                                </div>
                            </div>
                            <p className="text-sm text-neutral-600 mb-1">Paid Out</p>
                            <p className="text-2xl font-bold text-neutral-900">₦{stats.paidOut.toLocaleString()}</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-2">
                                <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                                    <TrendingUp className="w-6 h-6 text-white" />
                                </div>
                                <ArrowUpRight className="w-5 h-5 text-purple-600" />
                            </div>
                            <p className="text-sm text-purple-700 mb-1">This Month</p>
                            <p className="text-2xl font-bold text-purple-900">₦{stats.thisMonth.toLocaleString()}</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Transaction History */}
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-neutral-900">Transaction History</h2>
                            <div className="flex gap-2">
                                {['all', 'week', 'month', 'year'].map((period) => (
                                    <button
                                        key={period}
                                        onClick={() => setFilterPeriod(period)}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterPeriod === period
                                            ? 'bg-primary-600 text-white'
                                            : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                                            }`}
                                    >
                                        {period.charAt(0).toUpperCase() + period.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {getFilteredTransactions().length === 0 ? (
                            <div className="text-center py-12">
                                <DollarSign className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                                <p className="text-neutral-600">No transactions found</p>
                                <p className="text-sm text-neutral-500">Start referring vendors to earn commissions</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {getFilteredTransactions().map((transaction) => (
                                    <div
                                        key={transaction.id}
                                        className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${transaction.type === 'payout' ? 'bg-blue-100' : 'bg-green-100'
                                                }`}>
                                                {transaction.type === 'payout' ? (
                                                    <ArrowDownRight className="w-5 h-5 text-blue-600" />
                                                ) : (
                                                    <ArrowUpRight className="w-5 h-5 text-green-600" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-medium text-neutral-900">{transaction.description}</p>
                                                <div className="flex items-center gap-2 text-sm text-neutral-500">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(transaction.created_at).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`font-semibold ${transaction.type === 'payout' ? 'text-blue-600' : 'text-green-600'
                                                }`}>
                                                {transaction.type === 'payout' ? '-' : '+'}₦{transaction.amount.toLocaleString()}
                                            </p>
                                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${transaction.status === 'completed'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {transaction.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
