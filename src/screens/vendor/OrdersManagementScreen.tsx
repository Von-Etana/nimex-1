import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Search, ChevronDown } from 'lucide-react';

import { useAuth } from '../../contexts/AuthContext';
import { FirestoreService } from '../../services/firestore.service';
import { COLLECTIONS } from '../../lib/collections';
import { Loader2 } from 'lucide-react';

interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  created_at: any;
  total_amount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'disputed';
  items?: any[];
  customer_name?: string; // Enriched field
}

type FilterStatus = 'all' | 'pending' | 'in_progress' | 'completed' | 'disputed';

// Removed mockOrders

export const OrdersManagementScreen: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      if (!user) return;

      // Get vendor ID - use the same pattern as CreateProductScreen.tsx
      const vendors = await FirestoreService.getDocuments<any>(COLLECTIONS.VENDORS, {
        filters: [{ field: 'user_id', operator: '==', value: user.uid }],
        limitCount: 1
      });

      if (vendors.length === 0) {
        console.log('DEBUG OrdersManagement - No vendor found for user');
        setOrders([]);
        setLoading(false);
        return;
      }

      const vendor = vendors[0];
      const vendorId = vendor.id;

      const ordersData = await FirestoreService.getDocuments<Order>(COLLECTIONS.ORDERS, {
        filters: [{ field: 'vendor_id', operator: '==', value: vendorId }],
        orderByField: 'created_at',
        orderByDirection: 'desc'
      });

      // Enrich with customer names (optional, if needed for display)
      // For now, we'll just use the ID or a placeholder if name isn't directly on order
      // Ideally, the order document should snapshot the customer name.

      setOrders(ordersData);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-neutral-200 text-neutral-700';
      case 'in_progress':
        return 'bg-yellow-500 text-neutral-900';
      case 'completed':
        return 'bg-green-600 text-white';
      case 'disputed':
        return 'bg-red-500 text-white';
      default:
        return 'bg-neutral-200 text-neutral-700';
    }
  };

  const getStatusLabel = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'in_progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'disputed':
        return 'Disputed';
      default:
        return status;
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesFilter = activeFilter === 'all' || order.status === activeFilter;
    const matchesSearch =
      order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.customer_name || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const filters: { label: string; value: FilterStatus }[] = [
    { label: 'All', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'In Progress', value: 'in_progress' },
    { label: 'Completed', value: 'completed' },
    { label: 'Disputed', value: 'disputed' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full min-h-screen bg-neutral-50">
      <div className="w-full max-w-7xl mx-auto px-3 md:px-6 py-4 md:py-8">
        <div className="flex flex-col gap-4 md:gap-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <h1 className="font-heading font-bold text-neutral-900 text-lg md:text-3xl">
              Orders
            </h1>

            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 md:pl-10 pr-3 md:pr-4 py-2 border border-neutral-200 rounded-lg font-sans text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-green-700 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3 overflow-x-auto pb-2 -mx-3 px-3 md:mx-0 md:px-0">
            {filters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setActiveFilter(filter.value)}
                className={`px-3 md:px-6 py-1.5 md:py-2 rounded-lg font-sans text-xs md:text-sm font-medium transition-colors whitespace-nowrap ${activeFilter === filter.value
                  ? 'bg-green-700 text-white'
                  : 'bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-50'
                  }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="hidden md:block">
            <Card className="border border-neutral-200 shadow-sm">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-neutral-50 border-b border-neutral-200">
                      <tr>
                        <th className="text-left px-6 py-4 font-sans text-sm font-semibold text-neutral-700">
                          Order ID
                        </th>
                        <th className="text-left px-6 py-4 font-sans text-sm font-semibold text-neutral-700">
                          Customer
                        </th>
                        <th className="text-left px-6 py-4 font-sans text-sm font-semibold text-neutral-700">
                          Date
                        </th>
                        <th className="text-left px-6 py-4 font-sans text-sm font-semibold text-neutral-700">
                          Items
                        </th>
                        <th className="text-left px-6 py-4 font-sans text-sm font-semibold text-neutral-700">
                          Total
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
                      {filteredOrders.length === 0 ? (
                        <tr>
                          <td
                            colSpan={7}
                            className="px-6 py-12 text-center text-neutral-500 font-sans text-sm"
                          >
                            No orders found
                          </td>
                        </tr>
                      ) : (
                        filteredOrders.map((order) => (
                          <tr
                            key={order.id}
                            className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors"
                          >
                            <td className="px-6 py-4">
                              <span className="font-sans text-sm text-neutral-900 font-medium">
                                {order.order_number}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="font-sans text-sm text-neutral-900">
                                {order.customer_name || 'Customer'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="font-sans text-sm text-neutral-700">
                                {order.created_at?.toDate ? order.created_at.toDate().toLocaleDateString() : new Date(order.created_at).toLocaleDateString()}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="font-sans text-sm text-neutral-700">
                                {order.items?.length || 0}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="font-sans text-sm text-neutral-900 font-semibold">
                                ₦{order.total_amount.toLocaleString()}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`px-4 py-1.5 rounded-full text-xs font-semibold ${getStatusColor(
                                  order.status
                                )}`}
                              >
                                {getStatusLabel(order.status)}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <button className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
                                <ChevronDown className="w-5 h-5 text-neutral-600" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="md:hidden space-y-3">
            {filteredOrders.length === 0 ? (
              <Card className="border border-neutral-200 shadow-sm">
                <CardContent className="p-8 text-center">
                  <p className="font-sans text-sm text-neutral-500">No orders found</p>
                </CardContent>
              </Card>
            ) : (
              filteredOrders.map((order) => (
                <Card key={order.id} className="border border-neutral-200 shadow-sm">
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-sans font-semibold text-sm text-neutral-900">
                          {order.order_number}
                        </h3>
                        <p className="font-sans text-xs text-neutral-600 mt-0.5">
                          {order.customer_name || 'Customer'}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {getStatusLabel(order.status)}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 py-3 border-t border-neutral-200">
                      <div>
                        <p className="font-sans text-xs text-neutral-600">Date</p>
                        <p className="font-sans text-sm text-neutral-900 mt-0.5">
                          {order.created_at?.toDate ? order.created_at.toDate().toLocaleDateString() : new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="font-sans text-xs text-neutral-600">Items</p>
                        <p className="font-sans text-sm text-neutral-900 mt-0.5">
                          {order.items?.length || 0}
                        </p>
                      </div>
                      <div>
                        <p className="font-sans text-xs text-neutral-600">Total</p>
                        <p className="font-sans text-sm font-semibold text-neutral-900 mt-0.5">
                          ₦{order.total_amount.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <button className="w-full mt-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 rounded-lg font-sans text-sm transition-colors">
                      View Details
                    </button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {filteredOrders.length > 0 && (
            <div className="flex items-center justify-between">
              <p className="font-sans text-xs md:text-sm text-neutral-600">
                Showing {filteredOrders.length} of {orders.length} orders
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
