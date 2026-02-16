import React, { useState, useEffect } from 'react';
import { DollarSign, Clock, TrendingUp, Shield, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { useAuth } from '../../contexts/AuthContext';
import { FirestoreService } from '../../services/firestore.service';
import { COLLECTIONS } from '../../lib/collections';

interface EscrowStats {
  totalHeld: number;
  pendingRelease: number;
  totalReleased: number;
  averageReleaseTime: number;
}

interface EscrowTransaction {
  id: string;
  order_number: string;
  buyer_name: string;
  amount: number;
  vendor_amount: number;
  platform_fee: number;
  status: string;
  held_at: string;
  released_at?: string;
  delivery_status?: string;
}

export const EscrowDashboardScreen: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<EscrowStats>({
    totalHeld: 0,
    pendingRelease: 0,
    totalReleased: 0,
    averageReleaseTime: 0,
  });
  const [transactions, setTransactions] = useState<EscrowTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'held' | 'released' | 'disputed'>('all');

  useEffect(() => {
    if (user) {
      loadEscrowData();
    }
  }, [user, activeFilter]);

  const loadEscrowData = async () => {
    if (!user) return;

    setLoading(true);

    try {
      // Get vendor ID
      const vendors = await FirestoreService.getDocuments<any>(COLLECTIONS.VENDORS, {
        filters: [{ field: 'user_id', operator: '==', value: user.uid }],
        limitCount: 1
      });

      if (vendors.length === 0) return;
      const vendorData = vendors[0];

      // Build filters for escrow transactions
      const filters: any[] = [{ field: 'vendor_id', operator: '==', value: vendorData.id }];
      if (activeFilter !== 'all') {
        filters.push({ field: 'status', operator: '==', value: activeFilter });
      }

      // Fetch escrow transactions
      const transactionsData = await FirestoreService.getDocuments<any>(COLLECTIONS.ESCROW_TRANSACTIONS, {
        filters,
        orderBy: { field: 'held_at', direction: 'desc' }
      });

      // Manual joins for related data
      const enrichedTransactions = await Promise.all(transactionsData.map(async (t) => {
        const [order, buyer, delivery] = await Promise.all([
          t.order_id ? FirestoreService.getDocument<any>(COLLECTIONS.ORDERS, t.order_id) : null,
          t.buyer_id ? FirestoreService.getDocument<any>(COLLECTIONS.PROFILES, t.buyer_id) : null,
          t.delivery_id ? FirestoreService.getDocument<any>(COLLECTIONS.DELIVERIES, t.delivery_id) : null
        ]);

        return {
          id: t.id,
          order_number: order?.order_number || 'N/A',
          buyer_name: buyer?.full_name || 'Unknown',
          amount: t.amount,
          vendor_amount: t.vendor_amount,
          platform_fee: t.platform_fee,
          status: t.status,
          held_at: t.held_at,
          released_at: t.released_at,
          delivery_status: delivery?.delivery_status,
        };
      }));

      setTransactions(enrichedTransactions);

      // Fetch all transactions for stats (ignoring filter)
      const allTransactions = await FirestoreService.getDocuments<any>(COLLECTIONS.ESCROW_TRANSACTIONS, {
        filters: [{ field: 'vendor_id', operator: '==', value: vendorData.id }]
      });

      if (allTransactions) {
        const totalHeld = allTransactions
          .filter((t) => t.status === 'held')
          .reduce((sum, t) => sum + t.vendor_amount, 0);

        const totalReleased = allTransactions
          .filter((t) => t.status === 'released')
          .reduce((sum, t) => sum + t.vendor_amount, 0);

        const releasedTransactions = allTransactions.filter(
          (t) => t.status === 'released' && t.held_at && t.released_at
        );

        const averageReleaseTime =
          releasedTransactions.length > 0
            ? releasedTransactions.reduce((sum, t) => {
              const heldDate = new Date(t.held_at).getTime();
              const releasedDate = new Date(t.released_at!).getTime();
              return sum + (releasedDate - heldDate) / (1000 * 60 * 60 * 24);
            }, 0) / releasedTransactions.length
            : 0;

        setStats({
          totalHeld,
          pendingRelease: allTransactions.filter((t) => t.status === 'held').length,
          totalReleased,
          averageReleaseTime: Math.round(averageReleaseTime),
        });
      }
    } catch (error) {
      console.error('Error loading escrow data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'held':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'released':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'refunded':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'disputed':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-neutral-100 text-neutral-700 border-neutral-200';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const filteredTransactions = transactions;

  return (
    <div className="flex flex-col w-full min-h-screen bg-neutral-50">
      <div className="w-full max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="font-heading font-bold text-neutral-900 text-2xl md:text-3xl mb-2">
              Escrow Dashboard
            </h1>
            <p className="font-sans text-neutral-600">
              Track your payments and escrow transactions
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                    <Clock className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
                <p className="font-sans text-sm text-neutral-600 mb-1">Held in Escrow</p>
                <p className="font-heading font-bold text-2xl text-neutral-900">
                  ₦{stats.totalHeld.toLocaleString()}
                </p>
                <p className="font-sans text-xs text-neutral-500 mt-1">
                  {stats.pendingRelease} transactions pending
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <p className="font-sans text-sm text-neutral-600 mb-1">Total Released</p>
                <p className="font-heading font-bold text-2xl text-neutral-900">
                  ₦{stats.totalReleased.toLocaleString()}
                </p>
                <p className="font-sans text-xs text-neutral-500 mt-1">Lifetime earnings</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-primary-600" />
                  </div>
                </div>
                <p className="font-sans text-sm text-neutral-600 mb-1">Avg. Release Time</p>
                <p className="font-heading font-bold text-2xl text-neutral-900">
                  {stats.averageReleaseTime} days
                </p>
                <p className="font-sans text-xs text-neutral-500 mt-1">From order to payout</p>
              </CardContent>
            </Card>

            <Card className="border-primary-200 bg-primary-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                    <Shield className="w-6 h-6 text-primary-600" />
                  </div>
                </div>
                <p className="font-sans text-sm text-neutral-700 mb-1">Escrow Protection</p>
                <p className="font-sans text-xs text-neutral-600 mt-1">
                  Your payments are secured until delivery confirmation
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-sans font-semibold text-blue-900 mb-1">
                  About Escrow Protection
                </h3>
                <p className="font-sans text-sm text-blue-800">
                  Payments are held securely in escrow and released to your wallet after successful
                  delivery confirmation. This protects both you and your customers, ensuring fair
                  transactions.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-heading font-semibold text-lg text-neutral-900">
                  Escrow Transactions
                </h2>
                <div className="flex items-center gap-2">
                  {['all', 'held', 'released', 'disputed'].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setActiveFilter(filter as typeof activeFilter)}
                      className={`px-4 py-2 rounded-lg font-sans text-sm font-medium transition-colors ${activeFilter === filter
                          ? 'bg-primary-600 text-white'
                          : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                        }`}
                    >
                      {filter.charAt(0).toUpperCase() + filter.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <DollarSign className="w-8 h-8 text-primary-500 mx-auto mb-4 animate-pulse" />
                  <p className="font-sans text-neutral-600">Loading transactions...</p>
                </div>
              ) : filteredTransactions.length === 0 ? (
                <div className="text-center py-12">
                  <Shield className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                  <h3 className="font-heading font-semibold text-lg text-neutral-900 mb-2">
                    No transactions found
                  </h3>
                  <p className="font-sans text-neutral-600">
                    {activeFilter === 'all'
                      ? 'No escrow transactions yet'
                      : `No ${activeFilter} transactions`}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-neutral-200">
                      <tr>
                        <th className="text-left px-4 py-3 font-sans text-sm font-semibold text-neutral-700">
                          Order
                        </th>
                        <th className="text-left px-4 py-3 font-sans text-sm font-semibold text-neutral-700">
                          Buyer
                        </th>
                        <th className="text-left px-4 py-3 font-sans text-sm font-semibold text-neutral-700">
                          Amount
                        </th>
                        <th className="text-left px-4 py-3 font-sans text-sm font-semibold text-neutral-700">
                          Your Share
                        </th>
                        <th className="text-left px-4 py-3 font-sans text-sm font-semibold text-neutral-700">
                          Status
                        </th>
                        <th className="text-left px-4 py-3 font-sans text-sm font-semibold text-neutral-700">
                          Delivery
                        </th>
                        <th className="text-left px-4 py-3 font-sans text-sm font-semibold text-neutral-700">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTransactions.map((transaction) => (
                        <tr key={transaction.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                          <td className="px-4 py-4">
                            <span className="font-mono text-sm text-neutral-900">
                              {transaction.order_number}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span className="font-sans text-sm text-neutral-900">
                              {transaction.buyer_name}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span className="font-sans text-sm text-neutral-900">
                              ₦{transaction.amount.toLocaleString()}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span className="font-sans text-sm font-semibold text-primary-600">
                              ₦{transaction.vendor_amount.toLocaleString()}
                            </span>
                            <p className="font-sans text-xs text-neutral-500">
                              Fee: ₦{transaction.platform_fee.toLocaleString()}
                            </p>
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                                transaction.status
                              )}`}
                            >
                              {getStatusLabel(transaction.status)}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            {transaction.delivery_status ? (
                              <span className="font-sans text-xs text-neutral-600">
                                {transaction.delivery_status
                                  .split('_')
                                  .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                                  .join(' ')}
                              </span>
                            ) : (
                              <span className="font-sans text-xs text-neutral-400">N/A</span>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <span className="font-sans text-xs text-neutral-600">
                              {new Date(transaction.held_at).toLocaleDateString('en-NG', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
