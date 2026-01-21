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
  Settings,
  Megaphone,
  Bell,
  Shield,
  UserCheck,
  Activity as ActivityIcon
} from 'lucide-react';
import { FirestoreService } from '../../services/firestore.service';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  bgColor?: string;
  onClick?: () => void;
}

interface Activity {
  id: string;
  event: string;
  user: string;
  timestamp: string;
  status: 'New' | 'Pending' | 'Approved' | 'Rejected';
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon, bgColor = 'bg-white', onClick }) => (
  <Card
    className={`border border-neutral-200 shadow-sm ${bgColor} ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
    onClick={onClick}
  >
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
    activeSubscriptions: 0,
    monthlyRevenue: 0,
    expiredSubscriptions: 0,
    totalMarketers: 0,
    activeUsers24h: 0,
  });

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      // Fetch all necessary data in parallel
      const [
        usersCount,
        vendorsCount,
        productsCount,
        transactions,
        pendingKYCCount,
        activeSubsCount,
        expiredSubsCount,
        marketersCount,
        activeUsers
      ] = await Promise.all([
        FirestoreService.getCount('profiles'),
        FirestoreService.getCount('vendors'),
        FirestoreService.getCount('products'),
        FirestoreService.getDocuments('payment_transactions'), // Use payment_transactions for accurate financial metrics
        FirestoreService.getCount('kyc_submissions', { filters: [{ field: 'status', operator: '==', value: 'pending' }] }),
        FirestoreService.getCount('vendors', { filters: [{ field: 'subscription_status', operator: '==', value: 'active' }] }),
        FirestoreService.getCount('vendors', { filters: [{ field: 'subscription_status', operator: '==', value: 'expired' }] }),
        FirestoreService.getCount('marketers'),
        FirestoreService.getDocuments('profiles', { filters: [{ field: 'updated_at', operator: '>', value: twentyFourHoursAgo.toISOString() }] }),
      ]);

      const totalRevenue = (transactions as any[]).reduce((sum: number, tx: any) => {
        if (tx.payment_status === 'paid' && tx.type !== 'withdrawal') {
          return sum + (tx.amount || 0);
        }
        return sum;
      }, 0) || 0;

      // Calculate monthly revenue from subscriptions (This is an estimate, can be replaced by actuals if needed)
      const monthlyRevenue = activeSubsCount * 1200;

      // Calculate new listings from last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const newListingsCount = await FirestoreService.getCount('products', {
        filters: [{ field: 'created_at', operator: '>=', value: thirtyDaysAgo.toISOString() }]
      });

      setMetrics({
        totalUsers: usersCount,
        activeVendors: vendorsCount,
        totalListings: productsCount,
        pendingKYC: pendingKYCCount,
        totalTransactions: (transactions as any[]).length,
        newListings: newListingsCount,
        uptimeStatus: '99.9%',
        totalRevenue: totalRevenue,
        activeSubscriptions: activeSubsCount,
        monthlyRevenue: monthlyRevenue,
        expiredSubscriptions: expiredSubsCount,
        totalMarketers: marketersCount,
        activeUsers24h: activeUsers.length,
      });
    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);

  useEffect(() => {
    loadRecentActivities();
  }, []);

  const loadRecentActivities = async () => {
    try {
      // Fetch system logs from Firestore
      const logs = await FirestoreService.getDocuments<any>('system_logs', {
        orderBy: { field: 'created_at', direction: 'desc' },
        limitCount: 6
      });

      if (logs && logs.length > 0) {
        const activities: Activity[] = logs.map(log => ({
          id: log.id,
          event: log.event,
          user: log.metadata?.user_name || 'System',
          timestamp: new Date(log.created_at).toLocaleString(),
          status: log.metadata?.status || 'New',
        }));
        setRecentActivities(activities);
      } else {
        // No activities found
        setRecentActivities([]);
      }
    } catch (error) {
      console.error('Error loading recent activities:', error);
    }
  };

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
                    ₦{metrics.totalRevenue.toLocaleString()}
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
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
              <MetricCard
                title="Total Users"
                value={metrics.totalUsers.toLocaleString()}
                icon={<Users className="w-5 h-5 text-neutral-600" />}
                onClick={() => navigate('/admin/users')}
              />
              <MetricCard
                title="Active Vendors"
                value={metrics.activeVendors.toLocaleString()}
                icon={<Package className="w-5 h-5 text-neutral-600" />}
                onClick={() => navigate('/admin/vendors')}
              />
              <MetricCard
                title="Total Listings"
                value={metrics.totalListings.toLocaleString()}
                icon={<List className="w-5 h-5 text-neutral-600" />}
                onClick={() => navigate('/admin/listings')}
              />
              <MetricCard
                title="Pending KYC"
                value={metrics.pendingKYC}
                icon={<FileCheck className="w-5 h-5 text-neutral-600" />}
                onClick={() => navigate('/admin/kyc')}
              />
              <MetricCard
                title="Total Transactions"
                value={metrics.totalTransactions.toLocaleString()}
                icon={<DollarSign className="w-5 h-5 text-neutral-600" />}
                onClick={() => navigate('/admin/transactions')}
              />
              <MetricCard
                title="New Listings (30D)"
                value={metrics.newListings}
                icon={<TrendingUp className="w-5 h-5 text-neutral-600" />}
              />
              <MetricCard
                title="Active Users (24h)"
                value={metrics.activeUsers24h}
                icon={<ActivityIcon className="w-5 h-5 text-green-600" />}
              />
              <MetricCard
                title="Active Subscriptions"
                value={metrics.activeSubscriptions.toLocaleString()}
                icon={<CheckCircle className="w-5 h-5 text-green-600" />}
              />
              <MetricCard
                title="Marketers"
                value={metrics.totalMarketers}
                icon={<UserCheck className="w-5 h-5 text-blue-600" />}
                onClick={() => navigate('/admin/marketers')}
              />
              <MetricCard
                title="Expired Subscriptions"
                value={metrics.expiredSubscriptions}
                icon={<Clock className="w-5 h-5 text-red-600" />}
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border border-neutral-200 shadow-sm">
              <CardContent className="p-6">
                <h2 className="font-heading font-bold text-xl md:text-2xl text-neutral-900 mb-6">
                  Quick Admin Actions
                </h2>
                <div className="grid grid-cols-2 gap-4">
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

            <Card className="border border-neutral-200 shadow-sm">
              <CardContent className="p-6">
                <h2 className="font-heading font-bold text-xl md:text-2xl text-neutral-900 mb-6">
                  Platform Settings
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => navigate('/admin/settings/commissions')}
                    className="flex flex-col items-center gap-3 p-4 rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors"
                  >
                    <DollarSign className="w-8 h-8 text-green-600" />
                    <span className="font-sans text-sm font-medium text-neutral-900">
                      Commissions
                    </span>
                  </button>
                  <button
                    onClick={() => navigate('/admin/settings/banners')}
                    className="flex flex-col items-center gap-3 p-4 rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors"
                  >
                    <Megaphone className="w-8 h-8 text-yellow-500" />
                    <span className="font-sans text-sm font-medium text-neutral-900">
                      Banners & Ads
                    </span>
                  </button>
                  <button
                    onClick={() => navigate('/admin/settings/notifications')}
                    className="flex flex-col items-center gap-3 p-4 rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors"
                  >
                    <Bell className="w-8 h-8 text-blue-500" />
                    <span className="font-sans text-sm font-medium text-neutral-900">
                      Notifications
                    </span>
                  </button>
                  <button
                    onClick={() => navigate('/admin/settings/security')}
                    className="flex flex-col items-center gap-3 p-4 rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors"
                  >
                    <Shield className="w-8 h-8 text-red-500" />
                    <span className="font-sans text-sm font-medium text-neutral-900">
                      Security
                    </span>
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
