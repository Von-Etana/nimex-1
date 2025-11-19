import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Search, Eye, Shield, DollarSign, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { logger } from '../../lib/logger';

interface EscrowTransaction {
  id: string;
  order_id: string;
  buyer_id: string;
  vendor_id: string;
  amount: number;
  platform_fee: number;
  vendor_amount: number;
  status: 'held' | 'released' | 'refunded' | 'disputed';
  released_at?: string;
  release_reason?: string;
  created_at: string;
  order?: {
    order_number: string;
    status: string;
  };
  buyer?: {
    full_name: string;
    email: string;
  };
  vendor?: {
    business_name: string;
  };
  deliveries?: {
    delivery_status: string;
    actual_delivery_date?: string;
  };
}

export const AdminEscrowScreen: React.FC = () => {
  const [escrowTransactions, setEscrowTransactions] = useState<EscrowTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'held' | 'released' | 'refunded' | 'disputed'>('all');
  const [selectedTransaction, setSelectedTransaction] = useState<EscrowTransaction | null>(null);
  const [releaseReason, setReleaseReason] = useState('');

  useEffect(() => {
    loadEscrowTransactions();
  }, []);

  const loadEscrowTransactions = async () => {
    try {
      setLoading(true);
      logger.info('Loading escrow transactions');

      const { data, error } = await (supabase
        .from('escrow_transactions') as any)
        .select(`
          *,
          orders:order_id (
            order_number,
            status
          ),
          profiles:buyer_id (
            full_name,
            email
          ),
          vendors:vendor_id (
            business_name
          ),
          deliveries:order_id (
            delivery_status,
            actual_delivery_date
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error loading escrow transactions', error);
        return;
      }

      setEscrowTransactions(data || []);
    } catch (error) {
      logger.error('Error loading escrow transactions', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReleaseEscrow = async (transactionId: string) => {
    if (!releaseReason.trim()) return;

    try {
      setActionLoading(transactionId);
      logger.info(`Releasing escrow for transaction: ${transactionId}`);

      const { error } = await (supabase
        .from('escrow_transactions') as any)
        .update({
          status: 'released',
          released_at: new Date().toISOString(),
          release_reason: releaseReason.trim()
        })
        .eq('id', transactionId);

      if (error) {
        logger.error('Error releasing escrow', error);
        return;
      }

      // Update local state
      setEscrowTransactions(transactions =>
        transactions.map(t =>
          t.id === transactionId ? {
            ...t,
            status: 'released',
            released_at: new Date().toISOString(),
            release_reason: releaseReason.trim()
          } : t
        )
      );

      setSelectedTransaction(null);
      setReleaseReason('');
      logger.info(`Escrow released for transaction ${transactionId}`);
    } catch (error) {
      logger.error('Error releasing escrow', error);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredTransactions = escrowTransactions.filter((transaction) => {
    const matchesSearch =
      transaction.order?.order_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.buyer?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.vendor?.business_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || transaction.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: EscrowTransaction['status']) => {
    switch (status) {
      case 'held':
        return 'bg-yellow-100 text-yellow-700';
      case 'released':
        return 'bg-green-100 text-green-700';
      case 'refunded':
        return 'bg-blue-100 text-blue-700';
      case 'disputed':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-neutral-100 text-neutral-700';
    }
  };

  const getTotalHeldAmount = () => {
    return escrowTransactions
      .filter(t => t.status === 'held')
      .reduce((sum, t) => sum + t.vendor_amount, 0);
  };

  const getTotalReleasedAmount = () => {
    return escrowTransactions
      .filter(t => t.status === 'released')
      .reduce((sum, t) => sum + t.vendor_amount, 0);
  };

  return (
    <div className="w-full min-h-screen bg-neutral-50">
      <div className="w-full max-w-7xl mx-auto px-3 md:px-6 py-4 md:py-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="font-heading font-bold text-2xl md:text-3xl text-neutral-900">
                Escrow Management
              </h1>
              <p className="font-sans text-sm text-neutral-600 mt-1">
                Manage escrow funds and release conditions
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Card className="border border-neutral-200 shadow-sm">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-yellow-600" />
                    <div>
                      <p className="font-sans text-xs text-neutral-600">Held Funds</p>
                      <p className="font-heading font-bold text-lg text-yellow-600">
                        ₦{getTotalHeldAmount().toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border border-neutral-200 shadow-sm">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <div>
                      <p className="font-sans text-xs text-neutral-600">Released</p>
                      <p className="font-heading font-bold text-lg text-green-600">
                        ₦{getTotalReleasedAmount().toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border border-neutral-200 shadow-sm">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <div>
                      <p className="font-sans text-xs text-neutral-600">Active Escrows</p>
                      <p className="font-heading font-bold text-lg text-blue-600">
                        {escrowTransactions.filter(t => t.status === 'held').length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search escrow transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg font-sans text-sm focus:outline-none focus:ring-2 focus:ring-green-700"
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto">
              {['all', 'held', 'released', 'refunded', 'disputed'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status as any)}
                  className={`px-4 py-2 rounded-lg font-sans text-sm font-medium transition-colors whitespace-nowrap ${
                    filterStatus === status
                      ? 'bg-green-700 text-white'
                      : 'bg-white text-neutral-700 border border-neutral-200'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="hidden md:block">
            <Card className="border border-neutral-200 shadow-sm">
              <CardContent className="p-0">
                <table className="w-full">
                  <thead className="bg-neutral-50 border-b border-neutral-200">
                    <tr>
                      <th className="text-left px-6 py-4 font-sans text-sm font-semibold text-neutral-700">
                        Order
                      </th>
                      <th className="text-left px-6 py-4 font-sans text-sm font-semibold text-neutral-700">
                        Buyer
                      </th>
                      <th className="text-left px-6 py-4 font-sans text-sm font-semibold text-neutral-700">
                        Vendor
                      </th>
                      <th className="text-left px-6 py-4 font-sans text-sm font-semibold text-neutral-700">
                        Amount
                      </th>
                      <th className="text-left px-6 py-4 font-sans text-sm font-semibold text-neutral-700">
                        Status
                      </th>
                      <th className="text-left px-6 py-4 font-sans text-sm font-semibold text-neutral-700">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-neutral-500">
                          Loading escrow transactions...
                        </td>
                      </tr>
                    ) : filteredTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-neutral-500">
                          No escrow transactions found
                        </td>
                      </tr>
                    ) : (
                      filteredTransactions.map((transaction) => (
                        <tr
                          key={transaction.id}
                          className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors"
                        >
                          <td className="px-6 py-4 font-sans text-sm text-neutral-900 font-medium">
                            {transaction.order?.order_number || 'N/A'}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="font-sans text-sm text-neutral-900 font-medium">
                                {transaction.buyer?.full_name || 'Unknown'}
                              </span>
                              <span className="font-sans text-xs text-neutral-600">
                                {transaction.buyer?.email}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-sans text-sm text-neutral-700">
                            {transaction.vendor?.business_name || 'Unknown'}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="font-sans text-sm text-neutral-900 font-semibold">
                                ₦{transaction.vendor_amount.toLocaleString()}
                              </span>
                              <span className="font-sans text-xs text-neutral-600">
                                Fee: ₦{transaction.platform_fee.toLocaleString()}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                                transaction.status
                              )}`}
                            >
                              {transaction.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setSelectedTransaction(transaction)}
                                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                                title="View details"
                              >
                                <Eye className="w-5 h-5 text-neutral-600" />
                              </button>
                              {transaction.status === 'held' && (
                                <button
                                  onClick={() => {
                                    const confirmRelease = window.confirm(
                                      `Are you sure you want to manually release ₦${transaction.vendor_amount.toLocaleString()} to the vendor?`
                                    );
                                    if (confirmRelease) {
                                      setSelectedTransaction(transaction);
                                    }
                                  }}
                                  className="p-2 hover:bg-green-100 rounded-lg transition-colors"
                                  title="Release funds"
                                >
                                  <CheckCircle className="w-5 h-5 text-green-600" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>

          {/* Escrow Details Modal */}
          {selectedTransaction && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-heading font-bold text-xl text-neutral-900">
                      Escrow Details
                    </h2>
                    <button
                      onClick={() => setSelectedTransaction(null)}
                      className="p-2 hover:bg-neutral-100 rounded-lg"
                    >
                      <XCircle className="w-5 h-5 text-neutral-600" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="font-sans text-sm font-semibold text-neutral-700">
                          Order Number
                        </label>
                        <p className="font-sans text-sm text-neutral-900">
                          {selectedTransaction.order?.order_number || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <label className="font-sans text-sm font-semibold text-neutral-700">
                          Escrow Status
                        </label>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                            selectedTransaction.status
                          )}`}
                        >
                          {selectedTransaction.status}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="font-sans text-sm font-semibold text-neutral-700">
                          Buyer
                        </label>
                        <p className="font-sans text-sm text-neutral-900">
                          {selectedTransaction.buyer?.full_name || 'Unknown'}
                        </p>
                      </div>
                      <div>
                        <label className="font-sans text-sm font-semibold text-neutral-700">
                          Vendor
                        </label>
                        <p className="font-sans text-sm text-neutral-900">
                          {selectedTransaction.vendor?.business_name || 'Unknown'}
                        </p>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h3 className="font-sans text-sm font-semibold text-neutral-700 mb-3">
                        Fund Breakdown
                      </h3>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="font-sans text-xs text-neutral-600">
                            Total Amount
                          </label>
                          <p className="font-sans text-lg text-neutral-900 font-semibold">
                            ₦{selectedTransaction.amount.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <label className="font-sans text-xs text-neutral-600">
                            Platform Fee (5%)
                          </label>
                          <p className="font-sans text-sm text-neutral-900">
                            ₦{selectedTransaction.platform_fee.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <label className="font-sans text-xs text-neutral-600">
                            Vendor Amount
                          </label>
                          <p className="font-sans text-lg text-green-700 font-semibold">
                            ₦{selectedTransaction.vendor_amount.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    {selectedTransaction.deliveries && (
                      <div className="border-t pt-4">
                        <h3 className="font-sans text-sm font-semibold text-neutral-700 mb-3">
                          Delivery Status
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className="font-sans text-sm text-neutral-900">
                            {selectedTransaction.deliveries.delivery_status}
                          </span>
                          {selectedTransaction.deliveries.actual_delivery_date && (
                            <span className="font-sans text-xs text-neutral-600">
                              (Delivered: {new Date(selectedTransaction.deliveries.actual_delivery_date).toLocaleDateString()})
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {selectedTransaction.status === 'held' && (
                      <div className="border-t pt-4">
                        <label className="font-sans text-sm font-semibold text-neutral-700 block mb-2">
                          Release Reason
                        </label>
                        <textarea
                          value={releaseReason}
                          onChange={(e) => setReleaseReason(e.target.value)}
                          placeholder="Enter reason for manual escrow release..."
                          className="w-full p-3 border border-neutral-200 rounded-lg font-sans text-sm focus:outline-none focus:ring-2 focus:ring-green-700"
                          rows={3}
                        />
                        <div className="flex justify-end gap-2 mt-4">
                          <Button
                            onClick={() => setSelectedTransaction(null)}
                            variant="outline"
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={() => handleReleaseEscrow(selectedTransaction.id)}
                            disabled={!releaseReason.trim() || actionLoading === selectedTransaction.id}
                            className="bg-green-700 hover:bg-green-800 text-white"
                          >
                            {actionLoading === selectedTransaction.id ? (
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                              <CheckCircle className="w-4 h-4 mr-2" />
                            )}
                            Release Funds
                          </Button>
                        </div>
                      </div>
                    )}

                    {selectedTransaction.release_reason && (
                      <div className="border-t pt-4">
                        <label className="font-sans text-sm font-semibold text-neutral-700">
                          Release Reason
                        </label>
                        <p className="font-sans text-sm text-neutral-900 mt-1">
                          {selectedTransaction.release_reason}
                        </p>
                        {selectedTransaction.released_at && (
                          <p className="font-sans text-xs text-neutral-600 mt-1">
                            Released on {new Date(selectedTransaction.released_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};