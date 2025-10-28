import React, { useState } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import {
  Plus,
  DollarSign,
  ShoppingCart,
  MessageSquare,
  Package,
  TrendingUp,
  ExternalLink,
  MessageCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Order {
  id: string;
  item: string;
  amount: string;
  status: 'delivered' | 'shipped' | 'processing' | 'pending';
  date: string;
}

interface Message {
  id: string;
  text: string;
}

interface SalesData {
  month: string;
  value: number;
}

interface TopProduct {
  name: string;
  sales: number;
  color: string;
}

const mockOrders: Order[] = [
  {
    id: 'NMX001',
    item: 'Organic Honey',
    amount: '₦5,000',
    status: 'delivered',
    date: '2024-07-28',
  },
  {
    id: 'NMX002',
    item: 'Handmade Pottery Mug',
    amount: '₦2,500',
    status: 'shipped',
    date: '2024-07-27',
  },
  {
    id: 'NMX003',
    item: 'Shea Butter Soap (Set)',
    amount: '₦7,500',
    status: 'processing',
    date: '2024-07-27',
  },
  {
    id: 'NMX004',
    item: 'Nigerian Street Food Kit',
    amount: '₦12,000',
    status: 'pending',
    date: '2024-07-26',
  },
  {
    id: 'NMX005',
    item: 'Ancestral Wooden Carving',
    amount: '₦25,000',
    status: 'delivered',
    date: '2024-07-26',
  },
];

const mockMessages: Message[] = [
  { id: '1', text: 'Customer inquiry about product availability.' },
  { id: '2', text: 'New message regarding order NMX004.' },
];

const salesData: SalesData[] = [
  { month: 'Jan', value: 8000 },
  { month: 'Feb', value: 17000 },
  { month: 'Mar', value: 21000 },
  { month: 'Apr', value: 18000 },
  { month: 'May', value: 23000 },
  { month: 'Jun', value: 28000 },
  { month: 'Jul', value: 26000 },
  { month: 'Aug', value: 30000 },
];

const topProducts: TopProduct[] = [
  { name: 'Organic Palm Oil', sales: 450, color: 'bg-green-700' },
  { name: 'Handmade Adire Fabric', sales: 380, color: 'bg-yellow-500' },
  { name: 'Spicy Suya Seasoning', sales: 320, color: 'bg-red-400' },
  { name: 'Beaded Jewellery', sales: 280, color: 'bg-yellow-600' },
];

const orderStatusData = [
  { status: 'Pending', count: 5, color: 'bg-yellow-500', percentage: 12 },
  { status: 'Processing', count: 8, color: 'bg-red-400', percentage: 20 },
  { status: 'Shipped', count: 12, color: 'bg-green-600', percentage: 30 },
  { status: 'Delivered', count: 18, color: 'bg-green-800', percentage: 45 },
  { status: 'Cancelled', count: 2, color: 'bg-purple-600', percentage: 5 },
];

export const VendorDashboardScreen: React.FC = () => {
  const navigate = useNavigate();
  const [orders] = useState<Order[]>(mockOrders);
  const [messages] = useState<Message[]>(mockMessages);

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-600 text-white';
      case 'shipped':
        return 'bg-green-600 text-white';
      case 'processing':
        return 'bg-yellow-500 text-neutral-900';
      case 'pending':
        return 'bg-neutral-200 text-neutral-700';
      default:
        return 'bg-neutral-200 text-neutral-700';
    }
  };

  const maxSales = Math.max(...salesData.map((d) => d.value));

  return (
    <div className="flex flex-col w-full min-h-screen bg-neutral-50">
      <div className="w-full max-w-7xl mx-auto px-3 md:px-6 py-4 md:py-8">
        <div className="flex flex-col gap-4 md:gap-6">
          <div className="flex items-center justify-between gap-2">
            <h1 className="font-heading font-bold text-neutral-900 text-lg md:text-3xl">
              Dashboard
            </h1>
            <Button className="bg-green-700 hover:bg-green-800 text-white px-3 py-2 md:px-6 md:py-2 rounded-lg flex items-center gap-1 md:gap-2 text-xs md:text-sm">
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
                      ₦1.5M
                    </span>
                    <span className="font-sans text-xs text-green-700">
                      +12%
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
                      <ShoppingCart className="w-3 h-3 md:w-5 md:h-5 text-neutral-700" />
                      <span className="font-sans text-xs md:text-sm text-neutral-700">
                        Orders
                      </span>
                    </div>
                    <span className="font-heading font-bold text-neutral-900 text-lg md:text-3xl">
                      45
                    </span>
                    <span className="font-sans text-xs text-neutral-600">
                      +5 today
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
                      3
                    </span>
                    <span className="font-sans text-xs text-neutral-600">
                      Urgent inquiries
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
                      <Package className="w-3 h-3 md:w-5 md:h-5 text-neutral-700" />
                      <span className="font-sans text-xs md:text-sm text-neutral-700">
                        Listings
                      </span>
                    </div>
                    <span className="font-heading font-bold text-neutral-900 text-lg md:text-3xl">
                      89
                    </span>
                    <span className="font-sans text-xs text-neutral-600">
                      +3 this week
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
                    <button className="flex items-center gap-1 md:gap-2 text-xs md:text-sm text-neutral-600 hover:text-neutral-900">
                      <span className="hidden sm:inline">View All</span>
                      <ExternalLink className="w-3 h-3 md:w-4 md:h-4" />
                    </button>
                  </div>

                  <div className="overflow-x-auto -mx-4 md:mx-0">
                    <table className="w-full min-w-[600px]">
                      <thead className="border-b border-neutral-200">
                        <tr>
                          <th className="text-left pb-2 md:pb-3 pl-4 md:pl-0 font-sans text-xs md:text-sm font-semibold text-neutral-700">
                            ID
                          </th>
                          <th className="text-left pb-2 md:pb-3 font-sans text-xs md:text-sm font-semibold text-neutral-700">
                            Item
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
                        {orders.map((order) => (
                          <tr
                            key={order.id}
                            className="border-b border-neutral-100 last:border-b-0"
                          >
                            <td className="py-3 md:py-4 pl-4 md:pl-0 font-sans text-xs md:text-sm text-neutral-900">
                              {order.id}
                            </td>
                            <td className="py-3 md:py-4 font-sans text-xs md:text-sm text-neutral-900">
                              {order.item}
                            </td>
                            <td className="py-3 md:py-4 font-sans text-xs md:text-sm text-neutral-900">
                              {order.amount}
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
                              {order.date}
                            </td>
                          </tr>
                        ))}
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
                      3 Unread
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 md:gap-3 mb-4 md:mb-6">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className="p-2 md:p-3 bg-neutral-50 rounded-lg border border-neutral-100"
                      >
                        <p className="font-sans text-xs md:text-sm text-neutral-700">
                          {message.text}
                        </p>
                      </div>
                    ))}
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
                      Monthly Sales Trend
                    </h3>
                    <p className="font-sans text-xs md:text-sm text-neutral-600">
                      Last 8 months
                    </p>
                  </div>

                  <div className="h-48 md:h-64 flex items-end gap-2 md:gap-4 mt-4 md:mt-6">
                    {salesData.map((data, index) => {
                      const height = (data.value / maxSales) * 100;
                      return (
                        <div key={index} className="flex-1 flex flex-col items-center gap-1 md:gap-2">
                          <div className="h-32 md:h-48 w-full flex items-end">
                            <div
                              className="w-full bg-green-700 rounded-t-md relative group cursor-pointer hover:bg-green-800 transition-colors"
                              style={{ height: `${height}%` }}
                            >
                              <div className="absolute -top-6 md:-top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-neutral-900 text-white text-xs px-1 md:px-2 py-0.5 md:py-1 rounded whitespace-nowrap">
                                ₦{(data.value / 1000).toFixed(1)}k
                              </div>
                            </div>
                          </div>
                          <span className="font-sans text-xs text-neutral-600">
                            {data.month}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-center gap-2 mt-4">
                    <div className="w-3 h-3 bg-green-700 rounded-sm"></div>
                    <span className="font-sans text-xs text-neutral-600">Sales</span>
                  </div>
                </CardContent>
              </Card>

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

                  <div className="flex items-center justify-center my-4 md:my-8">
                    <div className="relative w-36 h-36 md:w-48 md:h-48">
                      <svg viewBox="0 0 100 100" className="transform -rotate-90">
                        {orderStatusData.reduce((acc, item, index) => {
                          const prevPercentage = orderStatusData
                            .slice(0, index)
                            .reduce((sum, i) => sum + i.percentage, 0);
                          const startAngle = (prevPercentage / 100) * 360;
                          const endAngle = ((prevPercentage + item.percentage) / 100) * 360;

                          const startRad = (startAngle * Math.PI) / 180;
                          const endRad = (endAngle * Math.PI) / 180;

                          const x1 = 50 + 40 * Math.cos(startRad);
                          const y1 = 50 + 40 * Math.sin(startRad);
                          const x2 = 50 + 40 * Math.cos(endRad);
                          const y2 = 50 + 40 * Math.sin(endRad);

                          const largeArc = item.percentage > 50 ? 1 : 0;

                          const pathData = [
                            `M 50 50`,
                            `L ${x1} ${y1}`,
                            `A 40 40 0 ${largeArc} 1 ${x2} ${y2}`,
                            `Z`
                          ].join(' ');

                          let fillColor = '';
                          if (item.color === 'bg-yellow-500') fillColor = '#eab308';
                          else if (item.color === 'bg-red-400') fillColor = '#f87171';
                          else if (item.color === 'bg-green-600') fillColor = '#16a34a';
                          else if (item.color === 'bg-green-800') fillColor = '#166534';
                          else if (item.color === 'bg-purple-600') fillColor = '#9333ea';

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
                          {item.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <Card className="border border-neutral-200 shadow-sm">
            <CardContent className="p-6">
              <div className="mb-6">
                <h3 className="font-heading font-bold text-neutral-900 text-lg">
                  Top Selling Products
                </h3>
                <p className="font-sans text-sm text-neutral-600">
                  Your best performing products by sales volume
                </p>
              </div>

              <div className="flex flex-col gap-4">
                {topProducts.map((product, index) => {
                  const maxProduct = Math.max(...topProducts.map((p) => p.sales));
                  const percentage = (product.sales / maxProduct) * 100;

                  return (
                    <div key={index} className="flex items-center gap-4">
                      <div className="w-40 font-sans text-sm text-neutral-900">
                        {product.name}
                      </div>
                      <div className="flex-1 h-10 bg-neutral-100 rounded-lg overflow-hidden">
                        <div
                          className={`h-full ${product.color} transition-all duration-500`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
