import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import {
  Plus,
  DollarSign,
  ShoppingCart,
  MessageSquare,
  Package,
  ExternalLink,
  MessageCircle,
  Loader2,
  Wallet,
  ArrowDownCircle,
  TrendingUp
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FirestoreService } from '../../services/firestore.service';
import { COLLECTIONS } from '../../lib/collections';

interface Order {
  id: string;
  order_number: string;
  total_amount: number;
  status: 'delivered' | 'shipped' | 'processing' | 'pending' | 'cancelled' | 'disputed';
  created_at: any; // Timestamp or string
}

interface Message {
  id: string;
  last_message: string;
  unread_vendor: number;
}

interface DashboardMetrics {
  earnings: number;
  totalOrders: number;
  unreadMessages: number;
  totalProducts: number;
}

export const VendorDashboardScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    earnings: 0,
    totalOrders: 0,
    unreadMessages: 0,
    totalProducts: 0,
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [unreadMessagesList, setUnreadMessagesList] = useState<Message[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [orderStatusCounts, setOrderStatusCounts] = useState<Record<string, number>>({});
  const [dailySales, setDailySales] = useState<{ date: string; amount: number; orders: number }[]>([]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      if (!user) return;

      // Get vendor ID - try direct lookup first, then by user_id field
      let vendorId = user.uid;
      let walletBalance = 0;
      const vendor = await FirestoreService.getDocument<any>(COLLECTIONS.VENDORS, user.uid);

      if (vendor) {
        vendorId = vendor.id || user.uid;
        walletBalance = vendor.wallet_balance || 0;
      } else {
        // Try to find vendor by user_id field
        const vendorsByUserId = await FirestoreService.getDocuments<any>(COLLECTIONS.VENDORS, {
          filters: [{ field: 'user_id', operator: '==', value: user.uid }],
          limitCount: 1
        });
        if (vendorsByUserId.length > 0) {
          vendorId = vendorsByUserId[0].id || user.uid;
          walletBalance = vendorsByUserId[0].wallet_balance || 0;
        }
      }

      // Fetch Orders
      const orders = await FirestoreService.getDocuments<Order>(COLLECTIONS.ORDERS, {
        filters: [{ field: 'vendor_id', operator: '==', value: vendorId }],
        orderByField: 'created_at',
        orderByDirection: 'desc'
      });

      // Fetch Products Count & Top Viewed
      const products = await FirestoreService.getDocuments<any>(COLLECTIONS.PRODUCTS, {
        filters: [{ field: 'vendor_id', operator: '==', value: vendorId }],
        orderByField: 'views_count',
        orderByDirection: 'desc',
        limitCount: 5
      });

      const productsCount = await FirestoreService.getCount(COLLECTIONS.PRODUCTS, {
        filters: [{ field: 'vendor_id', operator: '==', value: vendorId }]
      });

      // Fetch Unread Messages
      const conversations = await FirestoreService.getDocuments<Message>(COLLECTIONS.CHAT_CONVERSATIONS, {
        filters: [
          { field: 'vendor_id', operator: '==', value: vendorId },
          { field: 'unread_vendor', operator: '>', value: 0 }
        ],
        limitCount: 3
      });

      // Process Data
      const statusCounts = orders.reduce((acc: any, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      }, {}) || {};

      setMetrics({
        earnings: walletBalance,
        totalOrders: orders.length || 0,
        unreadMessages: conversations.length || 0,
        totalProducts: productsCount || 0,
      });

      setRecentOrders(orders.slice(0, 5) || []);
      setUnreadMessagesList(conversations || []);
      setTopProducts(products || []);
      setOrderStatusCounts(statusCounts);

      // Calculate 7-day sales trend
      const last7Days: { date: string; amount: number; orders: number }[] = [];
      const now = new Date();
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });

        const dayOrders = orders.filter(order => {
          const orderDate = order.created_at?.toDate?.() || new Date(order.created_at);
          return orderDate.toISOString().split('T')[0] === dateStr;
        });

        const dayAmount = dayOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
        last7Days.push({ date: dayName, amount: dayAmount, orders: dayOrders.length });
      }
      setDailySales(last7Days);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-600 text-white';
      case 'shipped': return 'bg-blue-600 text-white';
      case 'processing': return 'bg-yellow-500 text-neutral-900';
      case 'pending': return 'bg-neutral-200 text-neutral-700';
      case 'cancelled': return 'bg-red-500 text-white';
      default: return 'bg-neutral-200 text-neutral-700';
    }
  };

  const orderStatusData = [
    { status: 'Pending', count: orderStatusCounts['pending'] || 0, color: 'bg-yellow-500' },
    { status: 'Processing', count: orderStatusCounts['processing'] || 0, color: 'bg-blue-400' },
    { status: 'Shipped', count: orderStatusCounts['shipped'] || 0, color: 'bg-indigo-500' },
    { status: 'Delivered', count: orderStatusCounts['delivered'] || 0, color: 'bg-green-600' },
    { status: 'Cancelled', count: orderStatusCounts['cancelled'] || 0, color: 'bg-red-500' },
  ].filter(item => item.count > 0);

  const totalOrdersForChart = orderStatusData.reduce((sum, item) => sum + item.count, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full min-h-screen bg-neutral-50">
      <div className="w-full max-w-7xl mx-auto px-3 md:px-6 py-4 md:py-8">
        <div className="flex flex-col gap-4 md:gap-6">
          <div className="flex items-center justify-between gap-2">
            <h1 className="font-heading font-bold text-neutral-900 text-lg md:text-3xl">
              Dashboard
            </h1>
            <Button
              onClick={() => navigate('/vendor/products/create')}
              className="bg-green-700 hover:bg-green-800 text-white px-3 py-2 md:px-6 md:py-2 rounded-lg flex items-center gap-1 md:gap-2 text-xs md:text-sm"
            >
              <Plus className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Create New Listing</span>
              <span className="sm:hidden">New</span>
            </Button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <Card className="border border-neutral-200 shadow-sm bg-green-50">
              <CardContent className="p-3 md:p-6">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col gap-1 md:gap-2">
                    <div className="flex items-center gap-1 md:gap-2">
                      <DollarSign className="w-3 h-3 md:w-5 md:h-5 text-neutral-700" />
                      <span className="font-sans text-xs md:text-sm text-neutral-700">
                        Earnings
                      </span>
                    </div>
                    <span className="font-heading font-bold text-neutral-900 text-lg md:text-3xl">
                      ₦{metrics.earnings.toLocaleString()}
                    </span>
                  </div>
                  <Wallet className="w-6 h-6 md:w-8 md:h-8 text-green-700" />
                </div>
                <div className="flex gap-2 mt-3 md:mt-4">
                  <Button
                    onClick={() => navigate('/vendor/wallet')}
                    size="sm"
                    className="flex-1 bg-green-700 hover:bg-green-800 text-white text-xs"
                  >
                    <ArrowDownCircle className="w-3 h-3 mr-1" />
                    Withdraw
                  </Button>
                  <Button
                    onClick={() => navigate('/vendor/wallet')}
                    size="sm"
                    variant="outline"
                    className="flex-1 border-green-700 text-green-700 hover:bg-green-50 text-xs"
                  >
                    View Wallet
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-neutral-200 shadow-sm bg-white">
              <CardContent className="p-3 md:p-6">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col gap-1 md:gap-2">
                    <div className="flex items-center gap-1 md:gap-2">
                      <ShoppingCart className="w-3 h-3 md:w-5 md:h-5 text-neutral-700" />
                      <span className="font-sans text-xs md:text-sm text-neutral-700">
                        Orders
                      </span>
                    </div>
                    <span className="font-heading font-bold text-neutral-900 text-lg md:text-3xl">
                      {metrics.totalOrders}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-neutral-200 shadow-sm bg-white">
              <CardContent className="p-3 md:p-6">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col gap-1 md:gap-2">
                    <div className="flex items-center gap-1 md:gap-2">
                      <MessageSquare className="w-3 h-3 md:w-5 md:h-5 text-neutral-700" />
                      <span className="font-sans text-xs md:text-sm text-neutral-700">
                        Messages
                      </span>
                    </div>
                    <span className="font-heading font-bold text-neutral-900 text-lg md:text-3xl">
                      {metrics.unreadMessages}
                    </span>
                    {metrics.unreadMessages > 0 && (
                      <span className="font-sans text-xs text-red-600">
                        Unread
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-neutral-200 shadow-sm bg-white">
              <CardContent className="p-3 md:p-6">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col gap-1 md:gap-2">
                    <div className="flex items-center gap-1 md:gap-2">
                      <Package className="w-3 h-3 md:w-5 md:h-5 text-neutral-700" />
                      <span className="font-sans text-xs md:text-sm text-neutral-700">
                        Listings
                      </span>
                    </div>
                    <span className="font-heading font-bold text-neutral-900 text-lg md:text-3xl">
                      {metrics.totalProducts}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
            <div className="lg:col-span-2">
              <Card className="border border-neutral-200 shadow-sm">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-between mb-4 md:mb-6">
                    <h2 className="font-heading font-bold text-neutral-900 text-base md:text-xl">
                      Recent Orders
                    </h2>
                    <button
                      onClick={() => navigate('/vendor/orders')}
                      className="flex items-center gap-1 md:gap-2 text-xs md:text-sm text-neutral-600 hover:text-neutral-900"
                    >
                      <span className="hidden sm:inline">View All</span>
                      <ExternalLink className="w-3 h-3 md:w-4 md:h-4" />
                    </button>
                  </div>

                  <div className="overflow-x-auto -mx-4 md:mx-0">
                    <table className="w-full min-w-[600px]">
                      <thead className="border-b border-neutral-200">
                        <tr>
                          <th className="text-left pb-2 md:pb-3 pl-4 md:pl-0 font-sans text-xs md:text-sm font-semibold text-neutral-700">
                            Order #
                          </th>
                          <th className="text-left pb-2 md:pb-3 font-sans text-xs md:text-sm font-semibold text-neutral-700">
                            Amount
                          </th>
                          <th className="text-left pb-2 md:pb-3 font-sans text-xs md:text-sm font-semibold text-neutral-700">
                            Status
                          </th>
                          <th className="text-left pb-2 md:pb-3 pr-4 md:pr-0 font-sans text-xs md:text-sm font-semibold text-neutral-700">
                            Date
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentOrders.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-8 text-center text-neutral-500 text-sm">
                              No orders yet
                            </td>
                          </tr>
                        ) : (
                          recentOrders.map((order) => (
                            <tr
                              key={order.id}
                              className="border-b border-neutral-100 last:border-b-0"
                            >
                              <td className="py-3 md:py-4 pl-4 md:pl-0 font-sans text-xs md:text-sm text-neutral-900">
                                {order.order_number}
                              </td>
                              <td className="py-3 md:py-4 font-sans text-xs md:text-sm text-neutral-900">
                                ₦{order.total_amount.toLocaleString()}
                              </td>
                              <td className="py-3 md:py-4">
                                <span
                                  className={`px-2 py-0.5 md:px-3 md:py-1 rounded-md text-xs font-medium ${getStatusColor(
                                    order.status
                                  )}`}
                                >
                                  {order.status.charAt(0).toUpperCase() +
                                    order.status.slice(1)}
                                </span>
                              </td>
                              <td className="py-3 md:py-4 pr-4 md:pr-0 font-sans text-xs md:text-sm text-neutral-600">
                                {order.created_at?.toDate ? order.created_at.toDate().toLocaleDateString() : new Date(order.created_at).toLocaleDateString()}
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

            <div className="lg:col-span-1">
              <Card className="border border-neutral-200 shadow-sm">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-between mb-3 md:mb-4">
                    <h2 className="font-heading font-bold text-neutral-900 text-base md:text-xl">
                      Messages
                    </h2>
                    <MessageCircle className="w-4 h-4 md:w-5 md:h-5 text-yellow-500" />
                  </div>

                  <div className="mb-4 md:mb-6">
                    <div className="text-green-700 font-heading font-bold text-2xl md:text-4xl mb-1 md:mb-2">
                      {metrics.unreadMessages} Unread
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 md:gap-3 mb-4 md:mb-6">
                    {unreadMessagesList.length === 0 ? (
                      <p className="text-sm text-neutral-500">No new messages</p>
                    ) : (
                      unreadMessagesList.map((message) => (
                        <div
                          key={message.id}
                          className="p-2 md:p-3 bg-neutral-50 rounded-lg border border-neutral-100"
                        >
                          <p className="font-sans text-xs md:text-sm text-neutral-700 truncate">
                            {message.last_message || 'New message'}
                          </p>
                        </div>
                      ))
                    )}
                  </div>

                  <Button
                    onClick={() => navigate('/vendor/messages')}
                    className="w-full bg-white hover:bg-neutral-50 text-neutral-900 border border-neutral-200 text-xs md:text-sm py-2"
                  >
                    View Messages
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          <div>
            <h2 className="font-heading font-bold text-neutral-900 text-base md:text-2xl mb-4 md:mb-6">
              Performance Analytics
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              <Card className="border border-neutral-200 shadow-sm">
                <CardContent className="p-4 md:p-6">
                  <div className="mb-3 md:mb-4">
                    <h3 className="font-heading font-bold text-neutral-900 text-sm md:text-lg">
                      Order Status Distribution
                    </h3>
                    <p className="font-sans text-xs md:text-sm text-neutral-600">
                      Current order statuses
                    </p>
                  </div>

                  {totalOrdersForChart > 0 ? (
                    <>
                      <div className="flex items-center justify-center my-4 md:my-8">
                        <div className="relative w-36 h-36 md:w-48 md:h-48">
                          <svg viewBox="0 0 100 100" className="transform -rotate-90">
                            {orderStatusData.reduce((acc, item, index) => {
                              const percentage = (item.count / totalOrdersForChart) * 100;
                              const prevPercentage = orderStatusData
                                .slice(0, index)
                                .reduce((sum, i) => sum + (i.count / totalOrdersForChart) * 100, 0);

                              const startAngle = (prevPercentage / 100) * 360;
                              const endAngle = ((prevPercentage + percentage) / 100) * 360;

                              const startRad = (startAngle * Math.PI) / 180;
                              const endRad = (endAngle * Math.PI) / 180;

                              const x1 = 50 + 40 * Math.cos(startRad);
                              const y1 = 50 + 40 * Math.sin(startRad);
                              const x2 = 50 + 40 * Math.cos(endRad);
                              const y2 = 50 + 40 * Math.sin(endRad);

                              const largeArc = percentage > 50 ? 1 : 0;

                              // If only one item, draw full circle
                              const pathData = orderStatusData.length === 1
                                ? `M 50 10 a 40 40 0 1 0 0 80 a 40 40 0 1 0 0 -80`
                                : `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`;

                              let fillColor = '';
                              if (item.color === 'bg-yellow-500') fillColor = '#eab308';
                              else if (item.color === 'bg-blue-400') fillColor = '#60a5fa';
                              else if (item.color === 'bg-indigo-500') fillColor = '#6366f1';
                              else if (item.color === 'bg-green-600') fillColor = '#16a34a';
                              else if (item.color === 'bg-red-500') fillColor = '#ef4444';
                              else fillColor = '#9ca3af';

                              acc.push(
                                <path
                                  key={index}
                                  d={pathData}
                                  fill={fillColor}
                                  className="hover:opacity-80 transition-opacity"
                                />
                              );
                              return acc;
                            }, [] as JSX.Element[])}
                            <circle cx="50" cy="50" r="20" fill="white" />
                          </svg>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {orderStatusData.map((item, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-sm ${item.color}`}></div>
                            <span className="font-sans text-xs text-neutral-700">
                              {item.status} ({item.count})
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="h-48 flex items-center justify-center text-neutral-500 text-sm">
                      No order data available
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border border-neutral-200 shadow-sm">
                <CardContent className="p-6">
                  <div className="mb-6">
                    <h3 className="font-heading font-bold text-neutral-900 text-lg">
                      Most Viewed Products
                    </h3>
                    <p className="font-sans text-sm text-neutral-600">
                      Your top products by view count
                    </p>
                  </div>

                  <div className="flex flex-col gap-4">
                    {topProducts.length === 0 ? (
                      <p className="text-sm text-neutral-500">No products found</p>
                    ) : (
                      topProducts.map((product, index) => {
                        const maxViews = Math.max(...topProducts.map((p) => p.views_count || 0));
                        const percentage = maxViews > 0 ? ((product.views_count || 0) / maxViews) * 100 : 0;
                        const colors = ['bg-green-700', 'bg-yellow-500', 'bg-red-400', 'bg-blue-500', 'bg-purple-500'];

                        return (
                          <div key={index} className="flex items-center gap-4">
                            <div className="w-40 font-sans text-sm text-neutral-900 truncate">
                              {product.title}
                            </div>
                            <div className="flex-1 h-10 bg-neutral-100 rounded-lg overflow-hidden relative">
                              <div
                                className={`h-full ${colors[index % colors.length]} transition-all duration-500`}
                                style={{ width: `${percentage}%` }}
                              ></div>
                              <span className="absolute inset-0 flex items-center justify-end px-2 text-xs font-medium text-neutral-600">
                                {product.views_count || 0} views
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* 7-Day Sales Trend */}
              <Card className="border border-neutral-200 shadow-sm lg:col-span-2">
                <CardContent className="p-4 md:p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-heading font-bold text-neutral-900 text-sm md:text-lg flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-green-600" />
                        7-Day Sales Trend
                      </h3>
                      <p className="font-sans text-xs md:text-sm text-neutral-600">
                        Daily order totals for the past week
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-heading font-bold text-lg text-green-700">
                        ₦{dailySales.reduce((sum, d) => sum + d.amount, 0).toLocaleString()}
                      </p>
                      <p className="text-xs text-neutral-500">Total this week</p>
                    </div>
                  </div>

                  {dailySales.some(d => d.amount > 0) ? (
                    <div className="flex items-end justify-between gap-2 h-40 mt-4">
                      {dailySales.map((day, index) => {
                        const maxAmount = Math.max(...dailySales.map(d => d.amount), 1);
                        const heightPercent = (day.amount / maxAmount) * 100;

                        return (
                          <div key={index} className="flex-1 flex flex-col items-center gap-2">
                            <div className="w-full flex-1 flex items-end">
                              <div
                                className="w-full bg-gradient-to-t from-green-600 to-green-400 rounded-t-lg hover:from-green-700 hover:to-green-500 transition-all cursor-pointer relative group"
                                style={{ height: `${Math.max(heightPercent, 5)}%`, minHeight: '8px' }}
                              >
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-neutral-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                  ₦{day.amount.toLocaleString()} ({day.orders} orders)
                                </div>
                              </div>
                            </div>
                            <span className="text-xs text-neutral-600 font-medium">{day.date}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="h-40 flex items-center justify-center text-neutral-500 text-sm">
                      No sales data for the past 7 days
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
