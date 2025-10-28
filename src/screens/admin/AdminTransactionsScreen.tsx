import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Search, Download, Eye } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Transaction {
  id: string;
  order_id: string;
  buyer_name: string;
  vendor_name: string;
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  date: string;
}

export const AdminTransactionsScreen: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'pending' | 'failed'>('all');

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          total_amount,
          status,
          created_at,
          buyer:profiles!orders_buyer_id_fkey(full_name),
          vendor:vendors(business_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transactionsData = (data || []).map((item: any) => ({
        id: item.id,
        order_id: `NIMX-${item.id.slice(0, 5).toUpperCase()}`,
        buyer_name: item.buyer?.full_name || 'Unknown Buyer',
        vendor_name: item.vendor?.business_name || 'Unknown Vendor',
        amount: item.total_amount || 0,
        status: item.status === 'delivered' ? 'completed' : (item.status === 'pending' ? 'pending' : 'pending'),
        date: new Date(item.created_at).toLocaleDateString(),
      }));

      setTransactions(transactionsData);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      transaction.order_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.buyer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.vendor_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || transaction.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: Transaction['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'failed':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-neutral-100 text-neutral-700';
    }
  };

  const totalAmount = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="w-full min-h-screen bg-neutral-50">
      <div className="w-full max-w-7xl mx-auto px-3 md:px-6 py-4 md:py-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="font-heading font-bold text-2xl md:text-3xl text-neutral-900">
                Transactions
              </h1>
              <p className="font-sans text-sm text-neutral-600 mt-1">
                Monitor all platform transactions
              </p>
            </div>
            <Button className="bg-green-700 hover:bg-green-800 text-white px-4 py-2 flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export Report
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <Card className="border border-neutral-200 shadow-sm">
              <CardContent className="p-4">
                <p className="font-sans text-xs text-neutral-600 mb-1">Total Volume</p>
                <p className="font-heading font-bold text-xl text-neutral-900">
                  ₦{(totalAmount / 1000000).toFixed(1)}M
                </p>
              </CardContent>
            </Card>
            <Card className="border border-neutral-200 shadow-sm">
              <CardContent className="p-4">
                <p className="font-sans text-xs text-neutral-600 mb-1">Completed</p>
                <p className="font-heading font-bold text-xl text-green-600">
                  {transactions.filter((t) => t.status === 'completed').length}
                </p>
              </CardContent>
            </Card>
            <Card className="border border-neutral-200 shadow-sm">
              <CardContent className="p-4">
                <p className="font-sans text-xs text-neutral-600 mb-1">Pending</p>
                <p className="font-heading font-bold text-xl text-yellow-600">
                  {transactions.filter((t) => t.status === 'pending').length}
                </p>
              </CardContent>
            </Card>
            <Card className="border border-neutral-200 shadow-sm">
              <CardContent className="p-4">
                <p className="font-sans text-xs text-neutral-600 mb-1">Failed</p>
                <p className="font-heading font-bold text-xl text-red-600">
                  {transactions.filter((t) => t.status === 'failed').length}
                </p>
              </CardContent>
            </Card>
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
              {['all', 'completed', 'pending', 'failed'].map((status) => (
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
                        Order ID
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
                        Date
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
                        <td colSpan={7} className="px-6 py-12 text-center text-neutral-500">
                          Loading transactions...
                        </td>
                      </tr>
                    ) : filteredTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-neutral-500">
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
                            {transaction.order_id}
                          </td>
                          <td className="px-6 py-4 font-sans text-sm text-neutral-700">
                            {transaction.buyer_name}
                          </td>
                          <td className="px-6 py-4 font-sans text-sm text-neutral-700">
                            {transaction.vendor_name}
                          </td>
                          <td className="px-6 py-4 font-sans text-sm text-neutral-900 font-semibold">
                            ₦{transaction.amount.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 font-sans text-sm text-neutral-700">
                            {transaction.date}
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
                            <button className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
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

          <div className="md:hidden space-y-3">
            {loading ? (
              <Card className="border border-neutral-200 shadow-sm">
                <CardContent className="p-8 text-center">
                  <p className="font-sans text-sm text-neutral-500">Loading transactions...</p>
                </CardContent>
              </Card>
            ) : filteredTransactions.length === 0 ? (
              <Card className="border border-neutral-200 shadow-sm">
                <CardContent className="p-8 text-center">
                  <p className="font-sans text-sm text-neutral-500">No transactions found</p>
                </CardContent>
              </Card>
            ) : (
              filteredTransactions.map((transaction) => (
                <Card key={transaction.id} className="border border-neutral-200 shadow-sm">
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-sans font-semibold text-sm text-neutral-900">
                          {transaction.order_id}
                        </h3>
                        <p className="font-sans text-xs text-neutral-600 mt-0.5">
                          {transaction.buyer_name} → {transaction.vendor_name}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ml-2 ${getStatusColor(
                          transaction.status
                        )}`}
                      >
                        {transaction.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-neutral-200">
                      <div>
                        <p className="font-sans text-base font-bold text-neutral-900">
                          ₦{transaction.amount.toLocaleString()}
                        </p>
                        <p className="font-sans text-xs text-neutral-500">{transaction.date}</p>
                      </div>
                      <button className="p-2 bg-neutral-100 rounded-lg">
                        <Eye className="w-4 h-4 text-neutral-600" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
