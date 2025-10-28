import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import {
  Wallet,
  TrendingUp,
  Download,
  Plus,
  ChevronDown,
  ChevronUp,
  Save,
  Loader2,
  Edit2
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface Transaction {
  id: string;
  date: string;
  description: string;
  type: 'Sale' | 'Payout' | 'Fee';
  amount: number;
  status: 'Completed' | 'Pending';
}

interface PayoutMethod {
  id: string;
  type: string;
  details: string;
  isPrimary: boolean;
}

const mockTransactions: Transaction[] = [
  {
    id: '1',
    date: '2024-07-28',
    description: 'Sale: Handwoven Basket',
    type: 'Sale',
    amount: 15000,
    status: 'Completed',
  },
  {
    id: '2',
    date: '2024-07-27',
    description: 'Payout: Bank Transfer',
    type: 'Payout',
    amount: -20000,
    status: 'Completed',
  },
  {
    id: '3',
    date: '2024-07-26',
    description: 'Ad Fee: Featured Listing',
    type: 'Fee',
    amount: -5000,
    status: 'Completed',
  },
  {
    id: '4',
    date: '2024-07-25',
    description: 'Sale: Artisan Necklace',
    type: 'Sale',
    amount: 8500,
    status: 'Completed',
  },
  {
    id: '5',
    date: '2024-07-24',
    description: 'Payout: Mobile Money',
    type: 'Payout',
    amount: -5000,
    status: 'Pending',
  },
  {
    id: '6',
    date: '2024-07-23',
    description: 'Sale: Handmade Leather Bag',
    type: 'Sale',
    amount: 25000,
    status: 'Completed',
  },
];

const mockPayoutMethods: PayoutMethod[] = [
  {
    id: '1',
    type: 'Bank Account (Zenith Bank)',
    details: 'Account No: **** **** **** 1234',
    isPrimary: true,
  },
  {
    id: '2',
    type: 'Mobile Money (M-Pesa)',
    details: 'Phone: +234 801 567 8901',
    isPrimary: false,
  },
];

export const VendorAccountScreen: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [transactions] = useState<Transaction[]>(mockTransactions);
  const [payoutMethods] = useState<PayoutMethod[]>(mockPayoutMethods);
  const [personalInfoExpanded, setPersonalInfoExpanded] = useState(false);
  const [passwordExpanded, setPasswordExpanded] = useState(false);
  const [notificationsExpanded, setNotificationsExpanded] = useState(false);

  const [personalInfo, setPersonalInfo] = useState({
    fullName: '',
    email: '',
    phone: '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [notifications, setNotifications] = useState({
    emailSales: true,
    smsAlerts: false,
    inAppUpdates: true,
  });

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .maybeSingle();

      if (profile) {
        setPersonalInfo({
          fullName: profile.full_name || '',
          email: user?.email || '',
          phone: profile.phone || '',
        });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleSavePersonalInfo = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: personalInfo.fullName,
          phone: personalInfo.phone,
        })
        .eq('id', user?.id);

      if (error) throw error;
      alert('Personal information updated successfully!');
    } catch (error: any) {
      alert('Error updating information: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New passwords do not match!');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      });

      if (error) throw error;

      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      alert('Password changed successfully!');
    } catch (error: any) {
      alert('Error changing password: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const balance = 250500;
  const totalSales = 1500000;
  const pendingPayouts = 50000;

  return (
    <div className="w-full min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto px-3 md:px-6 py-4 md:py-8">
        <div className="flex flex-col gap-4 md:gap-6">
          <div>
            <h1 className="font-heading font-bold text-lg md:text-3xl text-neutral-900">
              Vendor Account Overview
            </h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
            <div className="lg:col-span-2">
              <Card className="border border-neutral-200 shadow-sm bg-green-50">
                <CardContent className="p-4 md:p-6">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-sans text-xs md:text-sm text-neutral-600 mb-1 md:mb-2">
                          Your available funds
                        </p>
                        <div className="flex items-center gap-2 md:gap-3">
                          <h2 className="font-heading font-bold text-2xl md:text-4xl text-neutral-900">
                            ₦{balance.toLocaleString()}.00
                          </h2>
                          <span className="px-2 md:px-3 py-1 bg-yellow-400 text-neutral-900 rounded-full text-xs font-semibold">
                            Active Status
                          </span>
                        </div>
                      </div>
                      <Wallet className="w-8 h-8 md:w-10 md:h-10 text-green-700" />
                    </div>

                    <div className="flex gap-2 md:gap-3">
                      <Button className="flex-1 h-10 md:h-12 bg-green-700 hover:bg-green-800 text-white font-sans font-semibold text-xs md:text-sm">
                        Withdraw Funds
                      </Button>
                      <Button className="flex-1 h-10 md:h-12 bg-white hover:bg-neutral-50 text-neutral-900 border border-neutral-200 font-sans font-semibold text-xs md:text-sm">
                        View Statement
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border border-neutral-200 shadow-sm">
              <CardContent className="p-4 md:p-6">
                <h3 className="font-heading font-bold text-sm md:text-lg text-neutral-900 mb-3 md:mb-4">
                  Quick Stats
                </h3>
                <div className="space-y-3 md:space-y-4">
                  <div>
                    <p className="font-sans text-xs md:text-sm text-neutral-600">
                      Total Sales this Month
                    </p>
                    <p className="font-heading font-bold text-lg md:text-2xl text-neutral-900">
                      ₦{totalSales.toLocaleString()}.00
                    </p>
                  </div>
                  <div>
                    <p className="font-sans text-xs md:text-sm text-neutral-600">
                      Pending Payouts
                    </p>
                    <p className="font-heading font-bold text-lg md:text-2xl text-neutral-900">
                      ₦{pendingPayouts.toLocaleString()}.00
                    </p>
                  </div>
                  <Button className="w-full h-9 md:h-10 bg-white hover:bg-neutral-50 text-neutral-900 border border-neutral-200 font-sans text-xs md:text-sm">
                    View all reports
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border border-neutral-200 shadow-sm">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <h2 className="font-heading font-bold text-base md:text-xl text-neutral-900">
                  Transaction History
                </h2>
                <Button className="h-8 md:h-9 px-3 md:px-4 bg-white hover:bg-neutral-50 text-neutral-900 border border-neutral-200 font-sans text-xs md:text-sm flex items-center gap-2">
                  <Download className="w-3 h-3 md:w-4 md:h-4" />
                  <span className="hidden sm:inline">Export</span>
                </Button>
              </div>

              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-neutral-50 border-b border-neutral-200">
                    <tr>
                      <th className="text-left px-4 py-3 font-sans text-sm font-semibold text-neutral-700">
                        Date
                      </th>
                      <th className="text-left px-4 py-3 font-sans text-sm font-semibold text-neutral-700">
                        Description
                      </th>
                      <th className="text-left px-4 py-3 font-sans text-sm font-semibold text-neutral-700">
                        Type
                      </th>
                      <th className="text-right px-4 py-3 font-sans text-sm font-semibold text-neutral-700">
                        Amount
                      </th>
                      <th className="text-center px-4 py-3 font-sans text-sm font-semibold text-neutral-700">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction) => (
                      <tr
                        key={transaction.id}
                        className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors"
                      >
                        <td className="px-4 py-3 font-sans text-sm text-neutral-700">
                          {transaction.date}
                        </td>
                        <td className="px-4 py-3 font-sans text-sm text-neutral-900">
                          {transaction.description}
                        </td>
                        <td className="px-4 py-3 font-sans text-sm text-neutral-700">
                          {transaction.type}
                        </td>
                        <td className={`px-4 py-3 font-sans text-sm font-semibold text-right ${
                          transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.amount > 0 ? '+' : ''}₦{Math.abs(transaction.amount).toLocaleString()}.00
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                              transaction.status === 'Completed'
                                ? 'bg-yellow-400 text-neutral-900'
                                : 'bg-neutral-200 text-neutral-700'
                            }`}
                          >
                            {transaction.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden space-y-3">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="p-3 border border-neutral-200 rounded-lg bg-white"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-sans text-sm font-semibold text-neutral-900">
                          {transaction.description}
                        </p>
                        <p className="font-sans text-xs text-neutral-600 mt-1">
                          {transaction.date} • {transaction.type}
                        </p>
                      </div>
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ml-2 ${
                          transaction.status === 'Completed'
                            ? 'bg-yellow-400 text-neutral-900'
                            : 'bg-neutral-200 text-neutral-700'
                        }`}
                      >
                        {transaction.status}
                      </span>
                    </div>
                    <p
                      className={`font-sans text-base font-bold ${
                        transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {transaction.amount > 0 ? '+' : ''}₦{Math.abs(transaction.amount).toLocaleString()}.00
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <Card className="border border-neutral-200 shadow-sm">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between mb-4 md:mb-6">
                  <h2 className="font-heading font-bold text-base md:text-xl text-neutral-900">
                    Payout Methods
                  </h2>
                  <Button className="h-8 md:h-9 px-3 md:px-4 bg-green-700 hover:bg-green-800 text-white font-sans text-xs md:text-sm flex items-center gap-1 md:gap-2">
                    <Plus className="w-3 h-3 md:w-4 md:h-4" />
                    <span className="hidden sm:inline">Add New Method</span>
                    <span className="sm:hidden">Add</span>
                  </Button>
                </div>

                <div className="space-y-3 md:space-y-4">
                  {payoutMethods.map((method) => (
                    <div
                      key={method.id}
                      className="p-3 md:p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-sans font-semibold text-sm md:text-base text-neutral-900">
                              {method.type}
                            </p>
                            {method.isPrimary && (
                              <span className="px-2 py-0.5 bg-yellow-400 text-neutral-900 rounded text-xs font-semibold">
                                Primary
                              </span>
                            )}
                          </div>
                          <p className="font-sans text-xs md:text-sm text-neutral-600 mt-1">
                            {method.details}
                          </p>
                        </div>
                        <button className="font-sans text-xs md:text-sm text-neutral-600 hover:text-neutral-900 underline">
                          Edit
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border border-neutral-200 shadow-sm">
              <CardContent className="p-4 md:p-6">
                <h2 className="font-heading font-bold text-base md:text-xl text-neutral-900 mb-4 md:mb-6">
                  Account Settings
                </h2>

                <div className="space-y-3 md:space-y-4">
                  <div className="border border-neutral-200 rounded-lg">
                    <button
                      onClick={() => setPersonalInfoExpanded(!personalInfoExpanded)}
                      className="w-full flex items-center justify-between p-3 md:p-4 hover:bg-neutral-50 transition-colors"
                    >
                      <span className="font-sans font-semibold text-sm md:text-base text-neutral-900">
                        Personal Information
                      </span>
                      {personalInfoExpanded ? (
                        <ChevronUp className="w-4 h-4 md:w-5 md:h-5 text-neutral-600" />
                      ) : (
                        <ChevronDown className="w-4 h-4 md:w-5 md:h-5 text-neutral-600" />
                      )}
                    </button>

                    {personalInfoExpanded && (
                      <div className="p-3 md:p-4 border-t border-neutral-200 space-y-3 md:space-y-4">
                        <div>
                          <label className="block font-sans font-medium text-xs md:text-sm text-neutral-700 mb-1 md:mb-2">
                            Full Name
                          </label>
                          <input
                            type="text"
                            value={personalInfo.fullName}
                            onChange={(e) =>
                              setPersonalInfo({ ...personalInfo, fullName: e.target.value })
                            }
                            className="w-full h-9 md:h-10 px-3 md:px-4 rounded-lg border border-neutral-200 font-sans text-sm md:text-base text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="Nafisah Bello"
                          />
                        </div>

                        <div>
                          <label className="block font-sans font-medium text-xs md:text-sm text-neutral-700 mb-1 md:mb-2">
                            Email Address
                          </label>
                          <input
                            type="email"
                            value={personalInfo.email}
                            disabled
                            className="w-full h-9 md:h-10 px-3 md:px-4 rounded-lg border border-neutral-200 font-sans text-sm md:text-base text-neutral-500 bg-neutral-50"
                          />
                        </div>

                        <div>
                          <label className="block font-sans font-medium text-xs md:text-sm text-neutral-700 mb-1 md:mb-2">
                            Phone Number
                          </label>
                          <input
                            type="tel"
                            value={personalInfo.phone}
                            onChange={(e) =>
                              setPersonalInfo({ ...personalInfo, phone: e.target.value })
                            }
                            className="w-full h-9 md:h-10 px-3 md:px-4 rounded-lg border border-neutral-200 font-sans text-sm md:text-base text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="+234 801 234 5678"
                          />
                        </div>

                        <Button
                          onClick={handleSavePersonalInfo}
                          disabled={saving}
                          className="w-full h-9 md:h-10 bg-green-700 hover:bg-green-800 text-white font-sans font-semibold text-xs md:text-sm"
                        >
                          {saving ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              Saving...
                            </>
                          ) : (
                            'Save Changes'
                          )}
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="border border-neutral-200 rounded-lg">
                    <button
                      onClick={() => setPasswordExpanded(!passwordExpanded)}
                      className="w-full flex items-center justify-between p-3 md:p-4 hover:bg-neutral-50 transition-colors"
                    >
                      <span className="font-sans font-semibold text-sm md:text-base text-neutral-900">
                        Password & Security
                      </span>
                      {passwordExpanded ? (
                        <ChevronUp className="w-4 h-4 md:w-5 md:h-5 text-neutral-600" />
                      ) : (
                        <ChevronDown className="w-4 h-4 md:w-5 md:h-5 text-neutral-600" />
                      )}
                    </button>

                    {passwordExpanded && (
                      <div className="p-3 md:p-4 border-t border-neutral-200 space-y-3 md:space-y-4">
                        <div>
                          <label className="block font-sans font-medium text-xs md:text-sm text-neutral-700 mb-1 md:mb-2">
                            Current Password
                          </label>
                          <input
                            type="password"
                            value={passwordData.currentPassword}
                            onChange={(e) =>
                              setPasswordData({ ...passwordData, currentPassword: e.target.value })
                            }
                            className="w-full h-9 md:h-10 px-3 md:px-4 rounded-lg border border-neutral-200 font-sans text-sm md:text-base text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="Enter current password"
                          />
                        </div>

                        <div>
                          <label className="block font-sans font-medium text-xs md:text-sm text-neutral-700 mb-1 md:mb-2">
                            New Password
                          </label>
                          <input
                            type="password"
                            value={passwordData.newPassword}
                            onChange={(e) =>
                              setPasswordData({ ...passwordData, newPassword: e.target.value })
                            }
                            className="w-full h-9 md:h-10 px-3 md:px-4 rounded-lg border border-neutral-200 font-sans text-sm md:text-base text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="Enter new password"
                          />
                        </div>

                        <div>
                          <label className="block font-sans font-medium text-xs md:text-sm text-neutral-700 mb-1 md:mb-2">
                            Confirm New Password
                          </label>
                          <input
                            type="password"
                            value={passwordData.confirmPassword}
                            onChange={(e) =>
                              setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                            }
                            className="w-full h-9 md:h-10 px-3 md:px-4 rounded-lg border border-neutral-200 font-sans text-sm md:text-base text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="Confirm new password"
                          />
                        </div>

                        <Button
                          onClick={handleChangePassword}
                          disabled={saving}
                          className="w-full h-9 md:h-10 bg-green-700 hover:bg-green-800 text-white font-sans font-semibold text-xs md:text-sm"
                        >
                          {saving ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              Changing...
                            </>
                          ) : (
                            'Change Password'
                          )}
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="border border-neutral-200 rounded-lg">
                    <button
                      onClick={() => setNotificationsExpanded(!notificationsExpanded)}
                      className="w-full flex items-center justify-between p-3 md:p-4 hover:bg-neutral-50 transition-colors"
                    >
                      <span className="font-sans font-semibold text-sm md:text-base text-neutral-900">
                        Notification Preferences
                      </span>
                      {notificationsExpanded ? (
                        <ChevronUp className="w-4 h-4 md:w-5 md:h-5 text-neutral-600" />
                      ) : (
                        <ChevronDown className="w-4 h-4 md:w-5 md:h-5 text-neutral-600" />
                      )}
                    </button>

                    {notificationsExpanded && (
                      <div className="p-3 md:p-4 border-t border-neutral-200 space-y-3 md:space-y-4">
                        <label className="flex items-center gap-2 md:gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notifications.emailSales}
                            onChange={(e) =>
                              setNotifications({ ...notifications, emailSales: e.target.checked })
                            }
                            className="w-4 h-4 md:w-5 md:h-5 rounded border-neutral-300 text-green-700 focus:ring-green-700"
                          />
                          <span className="font-sans text-xs md:text-sm text-neutral-900">
                            Email Notifications for Sales and Payouts
                          </span>
                        </label>

                        <label className="flex items-center gap-2 md:gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notifications.smsAlerts}
                            onChange={(e) =>
                              setNotifications({ ...notifications, smsAlerts: e.target.checked })
                            }
                            className="w-4 h-4 md:w-5 md:h-5 rounded border-neutral-300 text-green-700 focus:ring-green-700"
                          />
                          <span className="font-sans text-xs md:text-sm text-neutral-900">
                            SMS Alerts for Critical Account Activities
                          </span>
                        </label>

                        <label className="flex items-center gap-2 md:gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notifications.inAppUpdates}
                            onChange={(e) =>
                              setNotifications({ ...notifications, inAppUpdates: e.target.checked })
                            }
                            className="w-4 h-4 md:w-5 md:h-5 rounded border-neutral-300 text-green-700 focus:ring-green-700"
                          />
                          <span className="font-sans text-xs md:text-sm text-neutral-900">
                            In-App Notifications for Updates and Promos
                          </span>
                        </label>

                        <Button
                          onClick={() => alert('Preferences saved!')}
                          className="w-full h-9 md:h-10 bg-green-700 hover:bg-green-800 text-white font-sans font-semibold text-xs md:text-sm"
                        >
                          Save Preferences
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
