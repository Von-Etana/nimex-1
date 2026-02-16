import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Truck, Clock, CheckCircle, XCircle, Search } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useAuth } from '../contexts/AuthContext';
import { FirestoreService } from '../services/firestore.service';
import { COLLECTIONS } from '../lib/collections';
import { where, orderBy } from 'firebase/firestore';

interface Order {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  created_at: string;
  vendor: {
    business_name: string;
  };
  order_items: Array<{
    product_title: string;
    quantity: number;
  }>;
}

export const OrdersScreen: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user]);

  const loadOrders = async () => {
    if (!user) return;

    try {
      // 1. Fetch orders for the current user
      const ordersData = await FirestoreService.getDocuments<any>(COLLECTIONS.ORDERS, [
        where('buyer_id', '==', user.uid),
        orderBy('created_at', 'desc')
      ]);

      // 2. Manually join related data (vendors and order items)
      const formattedOrders = await Promise.all(
        ordersData.map(async (order) => {
          try {
            // Fetch vendor details
            let vendorName = 'Unknown Vendor';
            if (order.vendor_id) {
              const vendor = await FirestoreService.getDocument<any>(COLLECTIONS.VENDORS, order.vendor_id);
              if (vendor) {
                vendorName = vendor.business_name;
              }
            }

            // Fetch order items
            const orderItems = await FirestoreService.getDocuments<any>(COLLECTIONS.ORDER_ITEMS, [
              where('order_id', '==', order.id)
            ]);

            return {
              ...order,
              vendor: {
                business_name: vendorName
              },
              order_items: orderItems.map(item => ({
                product_title: item.product_title,
                quantity: item.quantity
              }))
            };
          } catch (err) {
            console.error(`Error enriching order ${order.id}:`, err);
            return {
              ...order,
              vendor: { business_name: 'Unknown Vendor' },
              order_items: []
            };
          }
        })
      );

      setOrders(formattedOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'in_transit':
      case 'shipped':
        return <Truck className="w-5 h-5 text-blue-600" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      case 'in_transit':
      case 'shipped':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-yellow-100 text-yellow-700';
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.vendor?.business_name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || order.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <Package className="w-12 h-12 text-primary-500 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
        <h1 className="font-heading font-bold text-2xl md:text-3xl text-neutral-900 mb-8">
          My Orders
        </h1>

        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search orders..."
              className="w-full h-12 pl-10 pr-4 rounded-lg border border-neutral-200 font-sans text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {['all', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-lg font-sans text-sm font-medium whitespace-nowrap transition-colors ${filterStatus === status
                    ? 'bg-primary-500 text-white'
                    : 'bg-white text-neutral-700 hover:bg-neutral-50'
                  }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
              <h3 className="font-heading font-semibold text-lg text-neutral-900 mb-2">
                {searchQuery || filterStatus !== 'all' ? 'No orders found' : 'No orders yet'}
              </h3>
              <p className="font-sans text-neutral-600 mb-6">
                {searchQuery || filterStatus !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Start shopping to see your orders here'}
              </p>
              {!searchQuery && filterStatus === 'all' && (
                <Button onClick={() => navigate('/')}>Start Shopping</Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <Card key={order.id} className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/orders/${order.id}`)}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-sans font-semibold text-neutral-900">
                          Order #{order.order_number}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </div>
                      <p className="font-sans text-sm text-neutral-600">
                        {order.vendor?.business_name || 'Unknown Vendor'}
                      </p>
                      <p className="font-sans text-xs text-neutral-500 mt-1">
                        {new Date(order.created_at).toLocaleDateString('en-NG', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    {getStatusIcon(order.status)}
                  </div>

                  <div className="mb-4">
                    <p className="font-sans text-sm text-neutral-700">
                      {order.order_items.slice(0, 2).map((item, idx) => (
                        <span key={idx}>
                          {item.product_title} (x{item.quantity})
                          {idx < Math.min(order.order_items.length, 2) - 1 && ', '}
                        </span>
                      ))}
                      {order.order_items.length > 2 && ` +${order.order_items.length - 2} more`}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
                    <span className="font-heading font-bold text-lg text-primary-600">
                      ₦{order.total_amount.toLocaleString()}
                    </span>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
