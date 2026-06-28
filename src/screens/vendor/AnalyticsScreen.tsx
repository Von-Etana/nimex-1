import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  ShoppingBag, 
  BarChart2, 
  Calendar, 
  Loader2,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { FirestoreService } from '../../services/firestore.service';
import { COLLECTIONS } from '../../lib/collections';

interface Order {
  id: string;
  order_number: string;
  total_amount: number;
  subtotal: number;
  status: string;
  created_at: any;
  buyer_id: string;
}

interface TopProduct {
  productId: string;
  title: string;
  quantity: number;
  revenue: number;
  image: string;
}

export const AnalyticsScreen: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('7d');
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [metrics, setMetrics] = useState({
    revenue: 0,
    ordersCount: 0,
    customersCount: 0,
    averageOrderValue: 0,
    revenueChange: 0,
    ordersChange: 0,
  });

  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [statusBreakdown, setStatusBreakdown] = useState<Record<string, number>>({});
  const [chartData, setChartData] = useState<{ label: string; value: number }[]>([]);

  useEffect(() => {
    if (user) {
      fetchAnalyticsData();
    }
  }, [user, timeRange]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      if (!user) return;

      // 1. Resolve vendor document to get vendor ID
      const vendors = await FirestoreService.getDocuments<any>(COLLECTIONS.VENDORS, {
        filters: [{ field: 'user_id', operator: '==', value: user.uid }],
        limitCount: 1
      });

      if (vendors.length === 0) {
        setLoading(false);
        return;
      }
      const vendorId = vendors[0].id;

      // 2. Fetch all orders for this vendor
      const allOrders = await FirestoreService.getDocuments<Order>(COLLECTIONS.ORDERS, {
        filters: [{ field: 'vendor_id', operator: '==', value: vendorId }],
        orderByField: 'created_at',
        orderByDirection: 'desc'
      });

      if (!allOrders || allOrders.length === 0) {
        setOrders([]);
        setLoading(false);
        return;
      }

      // Filter orders based on time range
      const now = new Date();
      const cutoffDate = new Date();
      if (timeRange === '7d') cutoffDate.setDate(now.getDate() - 7);
      else if (timeRange === '30d') cutoffDate.setDate(now.getDate() - 30);
      else cutoffDate.setFullYear(now.getFullYear() - 10); // All time

      const filteredOrders = allOrders.filter(order => {
        const date = order.created_at?.toDate ? order.created_at.toDate() : new Date(order.created_at);
        return date >= cutoffDate;
      });

      // Filter orders for the previous period to calculate changes
      const prevCutoffDate = new Date(cutoffDate);
      if (timeRange === '7d') prevCutoffDate.setDate(cutoffDate.getDate() - 7);
      else if (timeRange === '30d') prevCutoffDate.setDate(cutoffDate.getDate() - 30);

      const prevPeriodOrders = allOrders.filter(order => {
        const date = order.created_at?.toDate ? order.created_at.toDate() : new Date(order.created_at);
        return date >= prevCutoffDate && date < cutoffDate;
      });

      setOrders(filteredOrders);

      // 3. Compute Core Metrics
      const activeStatusList = ['confirmed', 'processing', 'shipped', 'delivered', 'completed'];
      
      const computeRevenue = (orderList: Order[]) => 
        orderList
          .filter(o => activeStatusList.includes(o.status))
          .reduce((sum, o) => sum + (o.total_amount || 0), 0);

      const currentRevenue = computeRevenue(filteredOrders);
      const prevRevenue = computeRevenue(prevPeriodOrders);

      const currentOrdersCount = filteredOrders.length;
      const prevOrdersCount = prevPeriodOrders.length;

      const uniqueBuyers = new Set(filteredOrders.map(o => o.buyer_id)).size;
      const averageOrderVal = currentOrdersCount > 0 ? Math.round(currentRevenue / currentOrdersCount) : 0;

      const revenueChangePercent = prevRevenue > 0 ? ((currentRevenue - prevRevenue) / prevRevenue) * 100 : 0;
      const ordersChangePercent = prevOrdersCount > 0 ? ((currentOrdersCount - prevOrdersCount) / prevOrdersCount) * 100 : 0;

      setMetrics({
        revenue: currentRevenue,
        ordersCount: currentOrdersCount,
        customersCount: uniqueBuyers,
        averageOrderValue: averageOrderVal,
        revenueChange: Math.round(revenueChangePercent * 10) / 10,
        ordersChange: Math.round(ordersChangePercent * 10) / 10,
      });

      // 4. Compute Status Breakdown
      const statusCounts: Record<string, number> = {};
      filteredOrders.forEach(o => {
        statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
      });
      setStatusBreakdown(statusCounts);

      // 5. Generate Chart Data (grouped by date)
      const dateMap: Record<string, number> = {};
      
      // Initialize map with last N days
      const daysToGen = timeRange === '7d' ? 7 : timeRange === '30d' ? 15 : 12; // 12 months for all-time
      if (timeRange === '7d' || timeRange === '30d') {
        for (let i = daysToGen - 1; i >= 0; i--) {
          const d = new Date();
          d.setDate(now.getDate() - i);
          const key = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
          dateMap[key] = 0;
        }
        
        filteredOrders.forEach(o => {
          if (!activeStatusList.includes(o.status)) return;
          const date = o.created_at?.toDate ? o.created_at.toDate() : new Date(o.created_at);
          const key = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
          if (dateMap[key] !== undefined) {
            dateMap[key] += o.total_amount || 0;
          }
        });
      } else {
        // Group by month
        for (let i = 11; i >= 0; i--) {
          const d = new Date();
          d.setMonth(now.getMonth() - i);
          const key = d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
          dateMap[key] = 0;
        }

        filteredOrders.forEach(o => {
          if (!activeStatusList.includes(o.status)) return;
          const date = o.created_at?.toDate ? o.created_at.toDate() : new Date(o.created_at);
          const key = date.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
          if (dateMap[key] !== undefined) {
            dateMap[key] += o.total_amount || 0;
          }
        });
      }

      setChartData(Object.entries(dateMap).map(([label, value]) => ({ label, value })));

      // 6. Compute Top Products (from the recent 20 orders to optimize loads)
      const topOrdersToScan = filteredOrders.slice(0, 20);
      const productMap: Record<string, TopProduct> = {};

      for (const order of topOrdersToScan) {
        const items = await FirestoreService.getDocuments<any>(COLLECTIONS.ORDER_ITEMS, {
          filters: [{ field: 'order_id', operator: '==', value: order.id }]
        });

        if (items) {
          items.forEach(item => {
            const pId = item.product_id;
            if (!productMap[pId]) {
              productMap[pId] = {
                productId: pId,
                title: item.product_title || 'Product',
                quantity: 0,
                revenue: 0,
                image: item.product_image || '/placeholder.png'
              };
            }
            productMap[pId].quantity += item.quantity || 1;
            productMap[pId].revenue += (item.unit_price || 0) * (item.quantity || 1);
          });
        }
      }

      setTopProducts(
        Object.values(productMap)
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5)
      );

    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  // --- SVG Trend Line Generation ---
  const renderTrendLine = () => {
    if (chartData.length === 0) return null;
    const maxVal = Math.max(...chartData.map(d => d.value), 1000);
    const height = 180;
    const width = 600;
    const padding = 20;

    const points = chartData.map((d, i) => {
      const x = padding + (i / (chartData.length - 1)) * (width - padding * 2);
      const y = height - padding - (d.value / maxVal) * (height - padding * 2);
      return { x, y };
    });

    const pathD = points.length > 0 
      ? `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')
      : '';

    const areaD = points.length > 0
      ? `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`
      : '';

    return (
      <div className="w-full overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[500px] h-48 select-none">
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#006400" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#006400" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          
          {/* Grid lines */}
          <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#E5E7EB" strokeDasharray="3 3" />
          <line x1={padding} y1={(height - padding * 2) / 2 + padding} x2={width - padding} y2={(height - padding * 2) / 2 + padding} stroke="#E5E7EB" strokeDasharray="3 3" />
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#E5E7EB" />

          {/* Area Fill */}
          {areaD && <path d={areaD} fill="url(#chartGradient)" />}
          
          {/* Line */}
          {pathD && <path d={pathD} fill="none" stroke="#006400" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
          
          {/* Data Points */}
          {points.map((p, i) => (
            <g key={i} className="group cursor-pointer">
              <circle cx={p.x} cy={p.y} r="5" fill="#FFFFFF" stroke="#006400" strokeWidth="2.5" />
              <circle cx={p.x} cy={p.y} r="8" fill="#006400" opacity="0" className="hover:opacity-20 transition-opacity" />
              <title>{chartData[i].label}: ₦{chartData[i].value.toLocaleString()}</title>
            </g>
          ))}

          {/* Labels */}
          {chartData.map((d, i) => {
            const x = padding + (i / (chartData.length - 1)) * (width - padding * 2);
            // Render labels for start, end, and middle points to prevent crowding
            const shouldRender = chartData.length <= 7 || i % Math.floor(chartData.length / 5) === 0 || i === chartData.length - 1;
            if (!shouldRender) return null;
            return (
              <text key={i} x={x} y={height - 2} textAnchor="middle" className="font-sans text-[10px] fill-neutral-500 font-medium">
                {d.label}
              </text>
            );
          })}
        </svg>
      </div>
    );
  };

  if (loading && orders.length === 0) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary-500 mx-auto mb-4" />
          <p className="font-sans text-neutral-600 font-medium">Loading your insights...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto px-3 md:px-6 py-4 md:py-8">
        
        {/* Header & Date controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-heading font-bold text-2xl md:text-3xl text-neutral-900">
              Analytics & Insights
            </h1>
            <p className="font-sans text-xs md:text-sm text-neutral-600">
              Real-time sales performance and customer actions.
            </p>
          </div>
          
          <div className="flex items-center gap-1.5 bg-white border border-neutral-200 p-1 rounded-lg shadow-sm">
            {(['7d', '30d', 'all'] as const).map(range => (
              <Button
                key={range}
                variant="ghost"
                onClick={() => setTimeRange(range)}
                className={`h-8 px-3 text-xs font-sans font-medium capitalize rounded-md transition-all ${
                  timeRange === range 
                    ? 'bg-primary-500 text-white hover:bg-primary-600 hover:text-white' 
                    : 'text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                {range === '7d' ? 'Last 7 Days' : range === '30d' ? 'Last 30 Days' : 'All Time'}
              </Button>
            ))}
          </div>
        </div>

        {/* 4 Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          
          {/* Revenue */}
          <Card className="border border-neutral-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5 md:p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center border border-green-100">
                  <DollarSign className="w-5 h-5 text-green-700" />
                </div>
                {metrics.revenueChange !== 0 && (
                  <span className={`flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${
                    metrics.revenueChange > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                  }`}>
                    {metrics.revenueChange > 0 ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
                    {Math.abs(metrics.revenueChange)}%
                  </span>
                )}
              </div>
              <p className="font-sans text-xs text-neutral-500 font-semibold uppercase tracking-wider mb-1">Revenue</p>
              <h3 className="font-heading font-bold text-2xl text-neutral-900">
                ₦{metrics.revenue.toLocaleString()}
              </h3>
            </CardContent>
          </Card>

          {/* Orders */}
          <Card className="border border-neutral-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5 md:p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100">
                  <ShoppingBag className="w-5 h-5 text-blue-700" />
                </div>
                {metrics.ordersChange !== 0 && (
                  <span className={`flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${
                    metrics.ordersChange > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                  }`}>
                    {metrics.ordersChange > 0 ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
                    {Math.abs(metrics.ordersChange)}%
                  </span>
                )}
              </div>
              <p className="font-sans text-xs text-neutral-500 font-semibold uppercase tracking-wider mb-1">Orders</p>
              <h3 className="font-heading font-bold text-2xl text-neutral-900">
                {metrics.ordersCount}
              </h3>
            </CardContent>
          </Card>

          {/* Unique Customers */}
          <Card className="border border-neutral-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5 md:p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center border border-purple-100">
                  <Users className="w-5 h-5 text-purple-700" />
                </div>
              </div>
              <p className="font-sans text-xs text-neutral-500 font-semibold uppercase tracking-wider mb-1">Customers</p>
              <h3 className="font-heading font-bold text-2xl text-neutral-900">
                {metrics.customersCount}
              </h3>
            </CardContent>
          </Card>

          {/* Average Order Value (AOV) */}
          <Card className="border border-neutral-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5 md:p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 bg-yellow-50 rounded-xl flex items-center justify-center border border-yellow-100">
                  <TrendingUp className="w-5 h-5 text-yellow-700" />
                </div>
              </div>
              <p className="font-sans text-xs text-neutral-500 font-semibold uppercase tracking-wider mb-1">Avg. Order Value</p>
              <h3 className="font-heading font-bold text-2xl text-neutral-900">
                ₦{metrics.averageOrderValue.toLocaleString()}
              </h3>
            </CardContent>
          </Card>
        </div>

        {/* Chart & Status Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          {/* SVG Sales Trend */}
          <Card className="lg:col-span-2 border border-neutral-200 shadow-sm bg-white">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="font-heading font-bold text-lg text-neutral-900">Sales Trend</h3>
                  <p className="font-sans text-xs text-neutral-500">Visual trend of order revenue</p>
                </div>
                <Calendar className="w-4 h-4 text-neutral-400" />
              </div>
              
              {chartData.length > 0 ? (
                renderTrendLine()
              ) : (
                <div className="h-48 flex items-center justify-center bg-neutral-50 rounded-lg">
                  <p className="font-sans text-sm text-neutral-500">Not enough active sales in this period</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Status Breakdown */}
          <Card className="border border-neutral-200 shadow-sm bg-white">
            <CardContent className="p-6">
              <h3 className="font-heading font-bold text-lg text-neutral-900 mb-2">Order Statuses</h3>
              <p className="font-sans text-xs text-neutral-500 mb-6">Split of orders by delivery status</p>
              
              {Object.keys(statusBreakdown).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(statusBreakdown).map(([status, count]) => {
                    const total = orders.length;
                    const percent = Math.round((count / total) * 100);
                    
                    const barColor = 
                      status === 'delivered' || status === 'completed' ? 'bg-success' :
                      status === 'cancelled' ? 'bg-error' :
                      status === 'pending' ? 'bg-yellow-400' : 'bg-primary-500';

                    return (
                      <div key={status} className="space-y-1.5">
                        <div className="flex justify-between text-sm font-sans">
                          <span className="capitalize text-neutral-700 font-medium">{status}</span>
                          <span className="text-neutral-500">{count} ({percent}%)</span>
                        </div>
                        <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
                          <div className={`h-full ${barColor}`} style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center bg-neutral-50 rounded-lg">
                  <p className="font-sans text-sm text-neutral-500">No status distributions</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top Products */}
        <Card className="border border-neutral-200 shadow-sm bg-white">
          <CardContent className="p-6">
            <h3 className="font-heading font-bold text-lg text-neutral-900 mb-1">Top Products</h3>
            <p className="font-sans text-xs text-neutral-500 mb-6">Top performing products by revenue (scanned from recent orders)</p>
            
            {topProducts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-100 text-left">
                      <th className="pb-3 font-sans text-sm font-semibold text-neutral-600">Product</th>
                      <th className="pb-3 font-sans text-sm font-semibold text-neutral-600 text-center">Items Sold</th>
                      <th className="pb-3 font-sans text-sm font-semibold text-neutral-600 text-right">Revenue Generated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topProducts.map((p) => (
                      <tr key={p.productId} className="border-b border-neutral-50 last:border-0 hover:bg-neutral-50 transition-colors">
                        <td className="py-4 flex items-center gap-3">
                          <div className="w-12 h-12 bg-neutral-100 rounded-lg overflow-hidden border border-neutral-200">
                            <img src={p.image} alt={p.title} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <p className="font-sans font-semibold text-neutral-900 text-sm">{p.title}</p>
                          </div>
                        </td>
                        <td className="py-4 font-sans text-neutral-700 text-center text-sm">{p.quantity}</td>
                        <td className="py-4 font-sans font-bold text-neutral-950 text-right text-sm">
                          ₦{p.revenue.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center bg-neutral-50 rounded-lg">
                <p className="font-sans text-sm text-neutral-500">No products sold in this period yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
