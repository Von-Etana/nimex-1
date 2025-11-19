import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Search, Eye, DollarSign, CreditCard, Truck, Shield } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { logger } from '../../lib/logger';

interface Transaction {
  id: string;
  order_id: string;
  buyer_id: string;
  vendor_id: string;
  amount: number;
  payment_status: 'pending' | 'paid' | 'refunded';
  payment_method?: string;
  payment_reference?: string;
  created_at: string;
  order?: {
    order_number: string;
    status: string;
    total_amount: number;
  };
  buyer?: {
    full_name: string;
    email: string;
  };
  vendor?: {
    business_name: string;
  };
  escrow?: {
    status: string;
    amount: number;
    platform_fee: number;
    vendor_amount: number;
  };
}

export const AdminTransactionsScreen: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'paid' | 'refunded'>('all');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      logger.info('Loading transactions');

      const { data, error } = await (supabase
        .from('payment_transactions') as any)
        .select(`
          *,
          orders:order_id (
            order_number,
            status,
            total_amount
          ),
          profiles:buyer_id (
            full_name,
            email
          ),
          vendors:vendor_id (
            business_name
          ),
          escrow_transactions:order_id (
            status,
            amount,
            platform_fee,
            vendor_amount
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error loading transactions', error);
        return;
      }

      setTransactions(data || []);
    } catch (error) {
      logger.error('Error loading transactions', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      transaction.order?.order_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.buyer?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.vendor?.business_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.payment_reference?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || transaction.payment_status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: Transaction['payment_status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'paid':
        return 'bg-green-100 text-green-700';
      case 'refunded':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-neutral-100 text-neutral-700';
    }
  };

  const getTotalRevenue = () => {
    return transactions
      .filter(t => t.payment_status === 'paid')
      .reduce((sum, t) => sum + (t.escrow?.platform_fee || 0), 0);
  };

  const getTotalVolume = () => {
    return transactions
      .filter(t => t.payment_status === 'paid')
      .reduce((sum, t) => sum + t.amount, 0);
  };

  return (
    <div className="w-full min-h-screen bg-neutral-50">
      <div className="w-full max-w-7xl mx-auto px-3 md:px-6 py-4 md:py-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="font-heading font-bold text-2xl md:text-3xl text-neutral-900">
                Transaction Management
              </h1>
              <p className="font-sans text-sm text-neutral-600 mt-1">
                View and manage transactions between buyers and sellers
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Card className="border border-neutral-200 shadow-sm">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <div>
                      <p className="font-sans text-xs text-neutral-600">Revenue</p>
                      <p className="font-heading font-bold text-lg text-green-600">
                        ₦{getTotalRevenue().toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border border-neutral-200 shadow-sm">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-blue-600" />
                    <div>
                      <p className="font-sans text-xs text-neutral-600">Volume</p>
                      <p className="font-heading font-bold text-lg text-blue-600">
                        ₦{getTotalVolume().toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border border-neutral-200 shadow-sm">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-purple-600" />
                    <div>
                      <p className="font-sans text-xs text-neutral-600">Transactions</p>
                      <p className="font-heading font-bold text-lg text-purple-600">
                        {transactions.filter(t => t.payment_status === 'paid').length}
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
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg font-sans text-sm focus:outline-none focus:ring-2 focus:ring-green-700"
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto">
              {['all', 'pending', 'paid', 'refunded'].map((status) => (
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
                          Loading transactions...
                        </td>
                      </tr>
                    ) : filteredTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-neutral-500">
                          No transactions found
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
                                ₦{transaction.amount.toLocaleString()}
                              </span>
                              {transaction.escrow && (
                                <span className="font-sans text-xs text-neutral-600">
                                  Fee: ₦{transaction.escrow.platform_fee?.toLocaleString() || '0'}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                                transaction.payment_status
                              )}`}
                            >
                              {transaction.payment_status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => setSelectedTransaction(transaction)}
                              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                              title="View details"
                            >
                              <Eye className="w-5 h-5 text-neutral-600" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>

          {/* Transaction Details Modal */}
          {selectedTransaction && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-heading font-bold text-xl text-neutral-900">
                      Transaction Details
                    </h2>
                    <button
                      onClick={() => setSelectedTransaction(null)}
                      className="p-2 hover:bg-neutral-100 rounded-lg"
                    >
                      <Eye className="w-5 h-5 text-neutral-600" />
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
                          Transaction Date
                        </label>
                        <p className="font-sans text-sm text-neutral-900">
                          {new Date(selectedTransaction.created_at).toLocaleDateString()}
                        </p>
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
                        <p className="font-sans text-xs text-neutral-600">
                          {selectedTransaction.buyer?.email}
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

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="font-sans text-sm font-semibold text-neutral-700">
                          Amount
                        </label>
                        <p className="font-sans text-lg text-neutral-900 font-semibold">
                          ₦{selectedTransaction.amount.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <label className="font-sans text-sm font-semibold text-neutral-700">
                          Status
                        </label>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                            selectedTransaction.payment_status
                          )}`}
                        >
                          {selectedTransaction.payment_status}
                        </span>
                      </div>
                    </div>

                    {selectedTransaction.escrow && (
                      <div className="border-t pt-4">
                        <h3 className="font-sans text-sm font-semibold text-neutral-700 mb-3">
                          Escrow Details
                        </h3>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="font-sans text-xs text-neutral-600">
                              Total Amount
                            </label>
                            <p className="font-sans text-sm text-neutral-900 font-semibold">
                              ₦{selectedTransaction.escrow.amount?.toLocaleString() || '0'}
                            </p>
                          </div>
                          <div>
                            <label className="font-sans text-xs text-neutral-600">
                              Platform Fee
                            </label>
                            <p className="font-sans text-sm text-neutral-900">
                              ₦{selectedTransaction.escrow.platform_fee?.toLocaleString() || '0'}
                            </p>
                          </div>
                          <div>
                            <label className="font-sans text-xs text-neutral-600">
                              Vendor Amount
                            </label>
                            <p className="font-sans text-sm text-green-700 font-semibold">
                              ₦{selectedTransaction.escrow.vendor_amount?.toLocaleString() || '0'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="border-t pt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="font-sans text-sm font-semibold text-neutral-700">
                            Payment Method
                          </label>
                          <p className="font-sans text-sm text-neutral-900">
                            {selectedTransaction.payment_method || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <label className="font-sans text-sm font-semibold text-neutral-700">
                            Reference
                          </label>
                          <p className="font-sans text-xs text-neutral-600 font-mono">
                            {selectedTransaction.payment_reference || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
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
