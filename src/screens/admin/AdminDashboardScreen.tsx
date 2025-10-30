import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import {
  Users,
  Package,
  DollarSign,
  TrendingUp,
  FileCheck,
  List,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  bgColor?: string;
}

interface Activity {
  id: string;
  event: string;
  user: string;
  timestamp: string;
  status: 'New' | 'Pending' | 'Approved' | 'Rejected';
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon, bgColor = 'bg-white' }) => (
  <Card className={`border border-neutral-200 shadow-sm ${bgColor}`}>
    <CardContent className="p-4 md:p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-sans text-xs md:text-sm text-neutral-600 mb-2">{title}</p>
          <p className="font-heading font-bold text-xl md:text-2xl text-neutral-900">{value}</p>
        </div>
        <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center">
          {icon}
        </div>
      </div>
    </CardContent>
  </Card>
);

export const AdminDashboardScreen: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    activeVendors: 0,
    totalListings: 0,
    pendingKYC: 0,
    totalTransactions: 0,
    newListings: 0,
    uptimeStatus: '99.9%',
    totalRevenue: 0,
  });

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      const [usersRes, vendorsRes, productsRes, ordersRes, kycRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('vendors').select('id', { count: 'exact', head: true }),
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('total_amount'),
        supabase.from('vendors').select('kyc_status', { count: 'exact' }).eq('kyc_status', 'pending'),
      ]);

      const totalRevenue = ordersRes.data?.reduce((sum: number, order: any) => sum + (order.total_amount || 0), 0) || 0;

      // Calculate new listings from last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { count: newListingsCount } = await supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo.toISOString());

      setMetrics({
        totalUsers: usersRes.count || 0,
        activeVendors: vendorsRes.count || 0,
        totalListings: productsRes.count || 0,
        pendingKYC: kycRes.count || 0,
        totalTransactions: ordersRes.count || 0,
        newListings: newListingsCount || 0,
        uptimeStatus: '99.9%',
        totalRevenue: totalRevenue,
      });
    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const recentActivities: Activity[] = [
    {
      id: '1',
      event: 'New vendor registered',
      user: 'VendorX',
      timestamp: '2024-07-29 14:30',
      status: 'New',
    },
    {
      id: '2',
      event: 'KYC submission received',
      user: 'SellerY',
      timestamp: '2024-07-29 11:00',
      status: 'Pending',
    },
    {
      id: '3',
      event: 'Listing "Handmade Crafts" approved',
      user: 'CraftsCo',
      timestamp: '2024-07-28 16:15',
      status: 'Approved',
    },
    {
      id: '4',
      event: 'Transaction processed',
      user: 'CustomerZ',
      timestamp: '2024-07-28 10:45',
      status: 'Approved',
    },
    {
      id: '5',
      event: 'Vendor profile updated',
      user: 'VendorX',
      timestamp: '2024-07-27 09:00',
      status: 'New',
    },
    {
      id: '6',
      event: 'KYC submission rejected',
      user: 'SellerA',
      timestamp: '2024-07-27 15:00',
      status: 'Rejected',
    },
  ];

  const getStatusColor = (status: Activity['status']) => {
    switch (status) {
      case 'New':
        return 'bg-yellow-400 text-neutral-900';
      case 'Pending':
        return 'bg-neutral-200 text-neutral-700';
      case 'Approved':
        return 'bg-green-600 text-white';
      case 'Rejected':
        return 'bg-red-500 text-white';
      default:
        return 'bg-neutral-200 text-neutral-700';
    }
  };

  const chartData = {
    userGrowth: [
      { month: 'Jan', users: 1000 },
      { month: 'Feb', users: 1200 },
      { month: 'Mar', users: 1500 },
      { month: 'May', users: 1800 },
      { month: 'Jun', users: 2100 },
      { month: 'Jul', users: 2400 },
      { month: 'Aug', users: 2800 },
      { month: 'Sep', users: 3200 },
    ],
    vendorOnboarding: [
      { quarter: 'Q1', vendors: 35 },
      { quarter: 'Q2', vendors: 48 },
      { quarter: 'Q3', vendors: 55 },
      { quarter: 'Q4', vendors: 78 },
    ],
    categories: [
      { name: 'Fashion', percentage: 35, color: 'bg-green-700' },
      { name: 'Electronics', percentage: 26, color: 'bg-yellow-400' },
      { name: 'Home Goods', percentage: 17, color: 'bg-red-500' },
      { name: 'Food & Groceries', percentage: 13, color: 'bg-orange-500' },
      { name: 'Services', percentage: 9, color: 'bg-blue-500' },
    ],
  };

  return (
    <div className="w-full min-h-screen bg-neutral-50">
      <div className="w-full max-w-7xl mx-auto px-3 md:px-6 py-4 md:py-8">
        <div className="flex flex-col gap-6">
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 md:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
              <div>
                <h1 className="font-heading font-bold text-2xl md:text-4xl text-neutral-900 mb-2">
                  NIMEX Admin Dashboard
                </h1>
                <p className="font-sans text-sm md:text-base text-neutral-600 mb-4">
                  Comprehensive overview of platform performance and key operational metrics for efficient management.
                </p>
                <div className="mb-4">
                  <p className="font-sans text-sm text-yellow-600 font-semibold mb-1">
                    Platform Revenue (Last 30 Days)
                  </p>
                  <p className="font-heading font-bold text-3xl md:text-4xl text-neutral-900">
                    ₦12,500,000
                  </p>
                </div>
                <Button
                  onClick={() => navigate('/admin/transactions')}
                  className="bg-yellow-400 hover:bg-yellow-500 text-neutral-900 font-sans font-semibold px-6 py-2"
                >
                  View Full Report
                </Button>
              </div>
              <div className="hidden lg:flex items-center justify-center">
                <div className="w-full h-48 bg-gradient-to-br from-white/50 to-white/30 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-24 h-24 text-green-700 opacity-20" />
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="font-heading font-bold text-xl md:text-2xl text-neutral-900 mb-4">
              Key Metrics
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              <MetricCard
                title="Total Users"
                value={metrics.totalUsers.toLocaleString()}
                icon={<Users className="w-5 h-5 text-neutral-600" />}
              />
              <MetricCard
                title="Active Vendors"
                value={metrics.activeVendors.toLocaleString()}
                icon={<Package className="w-5 h-5 text-neutral-600" />}
              />
              <MetricCard
                title="Total Listings"
                value={metrics.totalListings.toLocaleString()}
                icon={<List className="w-5 h-5 text-neutral-600" />}
              />
              <MetricCard
                title="Pending KYC"
                value={metrics.pendingKYC}
                icon={<FileCheck className="w-5 h-5 text-neutral-600" />}
              />
              <MetricCard
                title="Total Transactions"
                value={metrics.totalTransactions.toLocaleString()}
                icon={<DollarSign className="w-5 h-5 text-neutral-600" />}
              />
              <MetricCard
                title="New Listings (30D)"
                value={metrics.newListings}
                icon={<TrendingUp className="w-5 h-5 text-neutral-600" />}
              />
              <MetricCard
                title="Uptime Status"
                value={metrics.uptimeStatus}
                icon={<CheckCircle className="w-5 h-5 text-green-600" />}
              />
              <MetricCard
                title="Total Revenue"
                value={`₦${(metrics.totalRevenue / 1000000).toFixed(1)}M`}
                icon={<TrendingUp className="w-5 h-5 text-neutral-600" />}
                bgColor="bg-green-50"
              />
            </div>
          </div>

          <div>
            <h2 className="font-heading font-bold text-xl md:text-2xl text-neutral-900 mb-4">
              Platform Trends
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              <Card className="border border-neutral-200 shadow-sm">
                <CardContent className="p-4 md:p-6">
                  <h3 className="font-heading font-bold text-base md:text-lg text-neutral-900 mb-2">
                    User Growth Over 9 Months
                  </h3>
                  <p className="font-sans text-xs md:text-sm text-neutral-600 mb-4">
                    Number of registered users per month.
                  </p>
                  <div className="h-48 flex items-end justify-between gap-2">
                    {chartData.userGrowth.map((item, index) => (
                      <div key={index} className="flex-1 flex flex-col items-center gap-2">
                        <div
                          className="w-full bg-green-700 rounded-t"
                          style={{
                            height: `${(item.users / 3200) * 100}%`,
                            minHeight: '20px',
                          }}
                        ></div>
                        <span className="text-xs text-neutral-600">{item.month}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-neutral-200 shadow-sm">
                <CardContent className="p-4 md:p-6">
                  <h3 className="font-heading font-bold text-base md:text-lg text-neutral-900 mb-2">
                    New Vendors Onboarding (Quarterly)
                  </h3>
                  <p className="font-sans text-xs md:text-sm text-neutral-600 mb-4">
                    Number of new vendors registered each quarter.
                  </p>
                  <div className="h-48 flex items-end justify-between gap-4">
                    {chartData.vendorOnboarding.map((item, index) => (
                      <div key={index} className="flex-1 flex flex-col items-center gap-2">
                        <div
                          className="w-full bg-yellow-400 rounded-t"
                          style={{
                            height: `${(item.vendors / 78) * 100}%`,
                            minHeight: '30px',
                          }}
                        ></div>
                        <span className="text-xs text-neutral-600">{item.quarter}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-neutral-200 shadow-sm">
                <CardContent className="p-4 md:p-6">
                  <h3 className="font-heading font-bold text-base md:text-lg text-neutral-900 mb-2">
                    Active Listings by Category
                  </h3>
                  <p className="font-sans text-xs md:text-sm text-neutral-600 mb-4">
                    Distribution of product listings across categories.
                  </p>
                  <div className="flex items-center justify-center mb-4">
                    <div className="relative w-48 h-48">
                      <svg viewBox="0 0 100 100" className="transform -rotate-90">
                        {chartData.categories.reduce((acc, category, index) => {
                          const prevPercentage = chartData.categories
                            .slice(0, index)
                            .reduce((sum, cat) => sum + cat.percentage, 0);
                          const strokeDasharray = `${category.percentage} ${100 - category.percentage}`;
                          const strokeDashoffset = -prevPercentage;
                          const colors: { [key: string]: string } = {
                            'bg-green-700': '#15803d',
                            'bg-yellow-400': '#facc15',
                            'bg-red-500': '#ef4444',
                            'bg-orange-500': '#f97316',
                            'bg-blue-500': '#3b82f6',
                          };
                          acc.push(
                            <circle
                              key={index}
                              cx="50"
                              cy="50"
                              r="15.9"
                              fill="none"
                              stroke={colors[category.color]}
                              strokeWidth="14"
                              strokeDasharray={strokeDasharray}
                              strokeDashoffset={strokeDashoffset}
                            />
                          );
                          return acc;
                        }, [] as JSX.Element[])}
                      </svg>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {chartData.categories.map((category, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${category.color}`}></div>
                          <span className="font-sans text-xs md:text-sm text-neutral-700">
                            {category.name}
                          </span>
                        </div>
                        <span className="font-sans text-xs md:text-sm font-semibold text-neutral-900">
                          {category.percentage}%
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-neutral-200 shadow-sm">
                <CardContent className="p-4 md:p-6">
                  <h3 className="font-heading font-bold text-base md:text-lg text-neutral-900 mb-2">
                    Weekly Transaction Volume
                  </h3>
                  <p className="font-sans text-xs md:text-sm text-neutral-600 mb-4">
                    Total transaction value over the last 5 weeks.
                  </p>
                  <div className="h-48 relative">
                    <div className="absolute inset-0 flex items-end">
                      <svg className="w-full h-full" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#15803d" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#15803d" stopOpacity="0.05" />
                          </linearGradient>
                        </defs>
                        <path
                          d="M 0 40 L 25 30 L 50 35 L 75 20 L 100 10 L 100 100 L 0 100 Z"
                          fill="url(#gradient)"
                          stroke="#15803d"
                          strokeWidth="2"
                          vectorEffect="non-scaling-stroke"
                        />
                      </svg>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2">
                      {['W1', 'W2', 'W3', 'W4', 'W5'].map((week, index) => (
                        <span key={index} className="text-xs text-neutral-600">
                          {week}
                        </span>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <Card className="border border-neutral-200 shadow-sm">
            <CardContent className="p-4 md:p-6">
              <h2 className="font-heading font-bold text-xl md:text-2xl text-neutral-900 mb-4">
                Recent Activities
              </h2>

              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-neutral-50 border-b border-neutral-200">
                    <tr>
                      <th className="text-left px-4 py-3 font-sans text-sm font-semibold text-neutral-700">
                        Event
                      </th>
                      <th className="text-left px-4 py-3 font-sans text-sm font-semibold text-neutral-700">
                        User
                      </th>
                      <th className="text-left px-4 py-3 font-sans text-sm font-semibold text-neutral-700">
                        Timestamp
                      </th>
                      <th className="text-left px-4 py-3 font-sans text-sm font-semibold text-neutral-700">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentActivities.map((activity) => (
                      <tr
                        key={activity.id}
                        className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors"
                      >
                        <td className="px-4 py-3 font-sans text-sm text-neutral-900">
                          {activity.event}
                        </td>
                        <td className="px-4 py-3 font-sans text-sm text-neutral-700">
                          {activity.user}
                        </td>
                        <td className="px-4 py-3 font-sans text-sm text-neutral-700">
                          {activity.timestamp}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                              activity.status
                            )}`}
                          >
                            {activity.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden space-y-3">
                {recentActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="p-3 border border-neutral-200 rounded-lg bg-white"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-sans text-sm font-semibold text-neutral-900">
                          {activity.event}
                        </p>
                        <p className="font-sans text-xs text-neutral-600 mt-1">
                          {activity.user} • {activity.timestamp}
                        </p>
                      </div>
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ml-2 ${getStatusColor(
                          activity.status
                        )}`}
                      >
                        {activity.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border border-neutral-200 shadow-sm">
            <CardContent className="p-6">
              <h2 className="font-heading font-bold text-xl md:text-2xl text-neutral-900 mb-6">
                Quick Admin Actions
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                  onClick={() => navigate('/admin/users')}
                  className="flex flex-col items-center gap-3 p-4 rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors"
                >
                  <Users className="w-8 h-8 text-neutral-700" />
                  <span className="font-sans text-sm font-medium text-neutral-900">
                    Manage Users
                  </span>
                </button>
                <button
                  onClick={() => navigate('/admin/listings')}
                  className="flex flex-col items-center gap-3 p-4 rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors"
                >
                  <List className="w-8 h-8 text-neutral-700" />
                  <span className="font-sans text-sm font-medium text-neutral-900">
                    Moderate Listings
                  </span>
                </button>
                <button
                  onClick={() => navigate('/admin/kyc')}
                  className="flex flex-col items-center gap-3 p-4 rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors"
                >
                  <FileCheck className="w-8 h-8 text-neutral-700" />
                  <span className="font-sans text-sm font-medium text-neutral-900">
                    Approve KYC
                  </span>
                </button>
                <button
                  onClick={() => navigate('/admin/transactions')}
                  className="flex flex-col items-center gap-3 p-4 rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors"
                >
                  <Clock className="w-8 h-8 text-neutral-700" />
                  <span className="font-sans text-sm font-medium text-neutral-900">
                    View Transactions
                  </span>
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
