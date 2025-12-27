import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import {
  Users,
  Search,
  Mail,
  Phone,
  ShoppingBag,
  X,
  MessageCircle,
  Loader2,
  Calendar
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { FirestoreService } from '../../services/firestore.service';
import { COLLECTIONS } from '../../lib/collections';
import { where, orderBy } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

interface Customer {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  orderCount: number;
  totalSpent: number;
  lastOrderDate: string | null;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  created_at: any;
}

export const CustomersScreen: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Map<string, Order[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    if (user) {
      loadCustomers();
    }
  }, [user]);

  const loadCustomers = async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);

      // Get all orders for this vendor
      const ordersData = await FirestoreService.getDocuments<any>(COLLECTIONS.ORDERS, [
        where('vendor_id', '==', user.uid),
        orderBy('created_at', 'desc')
      ]);

      // Extract unique buyer IDs and aggregate order data
      const buyerStats = new Map<string, { orderCount: number; totalSpent: number; lastOrderDate: string | null; orders: Order[] }>();

      for (const order of ordersData) {
        const buyerId = order.buyer_id;
        if (!buyerId) continue;

        const existing = buyerStats.get(buyerId) || { orderCount: 0, totalSpent: 0, lastOrderDate: null, orders: [] };
        existing.orderCount += 1;
        existing.totalSpent += order.total_amount || 0;

        const orderDate = order.created_at?.toDate?.()
          ? order.created_at.toDate().toISOString()
          : order.created_at;

        if (!existing.lastOrderDate || new Date(orderDate) > new Date(existing.lastOrderDate)) {
          existing.lastOrderDate = orderDate;
        }

        existing.orders.push({
          id: order.id,
          order_number: order.order_number || order.id,
          status: order.status,
          total_amount: order.total_amount || 0,
          created_at: orderDate
        });

        buyerStats.set(buyerId, existing);
      }

      // Fetch customer profiles
      const customerProfiles: Customer[] = [];
      const ordersMap = new Map<string, Order[]>();

      for (const [buyerId, stats] of buyerStats) {
        try {
          const profile = await FirestoreService.getDocument<any>(COLLECTIONS.PROFILES, buyerId);

          if (profile) {
            customerProfiles.push({
              id: buyerId,
              full_name: profile.full_name || 'Unknown Customer',
              email: profile.email || '',
              phone: profile.phone || null,
              avatar_url: profile.avatar_url || null,
              orderCount: stats.orderCount,
              totalSpent: stats.totalSpent,
              lastOrderDate: stats.lastOrderDate
            });
            ordersMap.set(buyerId, stats.orders);
          }
        } catch (err) {
          console.error(`Error loading profile for buyer ${buyerId}:`, err);
        }
      }

      // Sort by total spent (highest first)
      customerProfiles.sort((a, b) => b.totalSpent - a.totalSpent);

      setCustomers(customerProfiles);
      setOrders(ordersMap);
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = (customerId: string) => {
    // Navigate to chat - in a real app you'd create or find existing conversation
    navigate('/chat');
  };

  const filteredCustomers = customers.filter((customer) => {
    const query = searchQuery.toLowerCase();
    return (
      customer.full_name.toLowerCase().includes(query) ||
      customer.email.toLowerCase().includes(query) ||
      (customer.phone && customer.phone.includes(query))
    );
  });

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-NG', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      case 'shipped':
      case 'in_transit':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-yellow-100 text-yellow-700';
    }
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-neutral-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-700" />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto px-3 md:px-6 py-4 md:py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="font-heading font-bold text-lg md:text-3xl text-neutral-900">
              Customers
            </h1>
            <p className="font-sans text-sm text-neutral-600 mt-1">
              {customers.length} customer{customers.length !== 1 ? 's' : ''} total
            </p>
          </div>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 pl-10 pr-4 rounded-lg border border-neutral-200 font-sans text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </CardContent>
        </Card>

        {/* Customer List */}
        {filteredCustomers.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
              <h3 className="font-heading font-semibold text-lg text-neutral-900 mb-2">
                {searchQuery ? 'No customers found' : 'No customers yet'}
              </h3>
              <p className="font-sans text-neutral-600">
                {searchQuery
                  ? 'Try adjusting your search terms'
                  : 'Customers will appear here once they place orders from your store.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block">
              <Card className="border border-neutral-200 shadow-sm">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-neutral-50 border-b border-neutral-200">
                        <tr>
                          <th className="text-left px-6 py-4 font-sans text-sm font-semibold text-neutral-700">
                            Customer
                          </th>
                          <th className="text-left px-6 py-4 font-sans text-sm font-semibold text-neutral-700">
                            Contact
                          </th>
                          <th className="text-center px-6 py-4 font-sans text-sm font-semibold text-neutral-700">
                            Orders
                          </th>
                          <th className="text-right px-6 py-4 font-sans text-sm font-semibold text-neutral-700">
                            Total Spent
                          </th>
                          <th className="text-left px-6 py-4 font-sans text-sm font-semibold text-neutral-700">
                            Last Order
                          </th>
                          <th className="text-center px-6 py-4 font-sans text-sm font-semibold text-neutral-700">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredCustomers.map((customer) => (
                          <tr
                            key={customer.id}
                            className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                  <span className="font-semibold text-green-700">
                                    {customer.full_name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <span className="font-sans text-sm font-medium text-neutral-900">
                                  {customer.full_name}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 text-sm text-neutral-700">
                                  <Mail className="w-3 h-3" />
                                  {customer.email}
                                </div>
                                {customer.phone && (
                                  <div className="flex items-center gap-2 text-sm text-neutral-600">
                                    <Phone className="w-3 h-3" />
                                    {customer.phone}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="font-sans text-sm font-semibold text-neutral-900">
                                {customer.orderCount}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className="font-sans text-sm font-semibold text-green-700">
                                ₦{customer.totalSpent.toLocaleString()}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="font-sans text-sm text-neutral-600">
                                {formatDate(customer.lastOrderDate)}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <Button
                                  onClick={() => setSelectedCustomer(customer)}
                                  variant="outline"
                                  size="sm"
                                  className="text-xs"
                                >
                                  View
                                </Button>
                                <Button
                                  onClick={() => handleStartChat(customer.id)}
                                  size="sm"
                                  className="bg-green-700 hover:bg-green-800 text-white text-xs"
                                >
                                  <MessageCircle className="w-3 h-3 mr-1" />
                                  Chat
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {filteredCustomers.map((customer) => (
                <Card key={customer.id} className="border border-neutral-200 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                          <span className="font-semibold text-green-700">
                            {customer.full_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-sans font-semibold text-sm text-neutral-900">
                            {customer.full_name}
                          </h3>
                          <p className="font-sans text-xs text-neutral-600">
                            {customer.email}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 py-3 border-t border-neutral-200">
                      <div>
                        <p className="font-sans text-xs text-neutral-600">Orders</p>
                        <p className="font-sans text-sm font-semibold text-neutral-900">
                          {customer.orderCount}
                        </p>
                      </div>
                      <div>
                        <p className="font-sans text-xs text-neutral-600">Total</p>
                        <p className="font-sans text-sm font-semibold text-green-700">
                          ₦{customer.totalSpent.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="font-sans text-xs text-neutral-600">Last Order</p>
                        <p className="font-sans text-sm text-neutral-900">
                          {formatDate(customer.lastOrderDate)}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-3">
                      <Button
                        onClick={() => setSelectedCustomer(customer)}
                        variant="outline"
                        className="flex-1 text-xs h-9"
                      >
                        View Details
                      </Button>
                      <Button
                        onClick={() => handleStartChat(customer.id)}
                        className="flex-1 bg-green-700 hover:bg-green-800 text-white text-xs h-9"
                      >
                        <MessageCircle className="w-3 h-3 mr-1" />
                        Chat
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* Customer Detail Modal */}
        {selectedCustomer && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-hidden">
              <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
                <h2 className="font-heading font-bold text-lg text-neutral-900">
                  Customer Details
                </h2>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-neutral-600" />
                </button>
              </div>

              <div className="p-4 overflow-y-auto max-h-[calc(90vh-120px)]">
                {/* Customer Info */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                    <span className="font-bold text-2xl text-green-700">
                      {selectedCustomer.full_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-sans font-semibold text-lg text-neutral-900">
                      {selectedCustomer.full_name}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-neutral-600 mt-1">
                      <Mail className="w-4 h-4" />
                      {selectedCustomer.email}
                    </div>
                    {selectedCustomer.phone && (
                      <div className="flex items-center gap-2 text-sm text-neutral-600 mt-1">
                        <Phone className="w-4 h-4" />
                        {selectedCustomer.phone}
                      </div>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-4 bg-neutral-50 rounded-lg">
                    <div className="flex items-center gap-2 text-neutral-600 mb-1">
                      <ShoppingBag className="w-4 h-4" />
                      <span className="text-xs">Total Orders</span>
                    </div>
                    <p className="font-heading font-bold text-2xl text-neutral-900">
                      {selectedCustomer.orderCount}
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2 text-green-700 mb-1">
                      <span className="text-xs">Total Spent</span>
                    </div>
                    <p className="font-heading font-bold text-2xl text-green-700">
                      ₦{selectedCustomer.totalSpent.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Order History */}
                <div>
                  <h4 className="font-sans font-semibold text-sm text-neutral-900 mb-3">
                    Order History
                  </h4>
                  <div className="space-y-2">
                    {(orders.get(selectedCustomer.id) || []).slice(0, 10).map((order) => (
                      <div
                        key={order.id}
                        className="p-3 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-sans text-sm font-medium text-neutral-900">
                            #{order.order_number}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm text-neutral-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(order.created_at)}
                          </div>
                          <span className="font-semibold text-neutral-900">
                            ₦{order.total_amount.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                    {(orders.get(selectedCustomer.id) || []).length === 0 && (
                      <p className="text-sm text-neutral-500 text-center py-4">
                        No order history available
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-neutral-200">
                <Button
                  onClick={() => handleStartChat(selectedCustomer.id)}
                  className="w-full bg-green-700 hover:bg-green-800 text-white"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Start Conversation
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
