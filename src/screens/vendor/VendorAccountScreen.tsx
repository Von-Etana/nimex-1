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
  Save,
  Loader2,
  Edit2,
  Trash2
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Database } from '../../types/database';
import { Modal } from '../../components/ui/modal';

type Transaction = Database['public']['Tables']['wallet_transactions']['Row'];
type Vendor = Database['public']['Tables']['vendors']['Row'];

interface PayoutMethod {
  id: string;
  type: string;
  details: string;
  isPrimary: boolean;
  bank_name?: string;
  account_number?: string;
  account_name?: string;
}

export const VendorAccountScreen: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [payoutMethods, setPayoutMethods] = useState<PayoutMethod[]>([]);

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

  // Withdrawal State
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [selectedPayoutMethodId, setSelectedPayoutMethodId] = useState('');
  const [pendingPayoutsTotal, setPendingPayoutsTotal] = useState(0);

  const [notifications, setNotifications] = useState({
    emailSales: true,
    smsAlerts: false,
    inAppUpdates: true,
  });

  // Payout Method State
  const [isAddPayoutModalOpen, setIsAddPayoutModalOpen] = useState(false);
  const [editingPayoutMethodId, setEditingPayoutMethodId] = useState<string | null>(null);
  const [newPayoutMethod, setNewPayoutMethod] = useState({
    bankName: '',
    accountNumber: '',
    accountName: '',
    isPrimary: false
  });

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load Profile
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

      // Load Vendor Data
      const { data: vendorData } = await supabase
        .from('vendors')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (vendorData) {
        setVendor(vendorData);

        // Parse payout methods from bank_account_details
        // Assuming it's stored as an array or single object in JSON
        if (vendorData.bank_account_details) {
          const details = vendorData.bank_account_details as any;
          if (Array.isArray(details)) {
            setPayoutMethods(details);
          } else if (details.account_number) {
            // Single account
            setPayoutMethods([{
              id: '1',
              type: 'Bank Account',
              details: `${details.bank_name} - ${details.account_number}`,
              isPrimary: true
            }]);
          }
        }

        // Load Notification Preferences
        if (vendorData.notification_preferences) {
          const prefs = vendorData.notification_preferences as any;
          setNotifications({
            emailSales: prefs.emailSales ?? true,
            smsAlerts: prefs.smsAlerts ?? false,
            inAppUpdates: prefs.inAppUpdates ?? true,
          });
        }

        // Load Transactions
        const { data: txData } = await supabase
          .from('wallet_transactions')
          .select('*')
          .eq('vendor_id', vendorData.id)
          .order('created_at', { ascending: false });

        if (txData) {
          setTransactions(txData);
        }

        // Load Pending Payouts
        const { data: pendingData } = await supabase
          .from('payouts')
          .select('amount')
          .eq('vendor_id', vendorData.id)
          .eq('status', 'pending');

        if (pendingData) {
          const total = pendingData.reduce((sum, item) => sum + (item.amount || 0), 0);
          setPendingPayoutsTotal(total);
        }
      }

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
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

  const handleAddPayoutMethod = async () => {
    if (!newPayoutMethod.bankName || !newPayoutMethod.accountNumber || !newPayoutMethod.accountName) {
      alert('Please fill in all fields');
      return;
    }

    setSaving(true);
    try {
      let updatedMethods: PayoutMethod[];

      if (editingPayoutMethodId) {
        // Update existing method
        updatedMethods = payoutMethods.map(m => {
          if (m.id === editingPayoutMethodId) {
            return {
              ...m,
              details: `${newPayoutMethod.bankName} - ${newPayoutMethod.accountNumber}`,
              isPrimary: newPayoutMethod.isPrimary,
              bank_name: newPayoutMethod.bankName,
              account_number: newPayoutMethod.accountNumber,
              account_name: newPayoutMethod.accountName
            };
          }
          return m;
        });
      } else {
        // Add new method
        const newMethod: PayoutMethod = {
          id: crypto.randomUUID(),
          type: 'Bank Account',
          details: `${newPayoutMethod.bankName} - ${newPayoutMethod.accountNumber}`,
          isPrimary: newPayoutMethod.isPrimary || payoutMethods.length === 0,
          bank_name: newPayoutMethod.bankName,
          account_number: newPayoutMethod.accountNumber,
          account_name: newPayoutMethod.accountName
        };
        updatedMethods = [...payoutMethods, newMethod];
      }

      // If the new/updated method is primary, make others non-primary
      if (newPayoutMethod.isPrimary) {
        updatedMethods = updatedMethods.map(m => {
          if (m.id !== (editingPayoutMethodId || updatedMethods[updatedMethods.length - 1].id)) {
            return { ...m, isPrimary: false };
          }
          return m;
        });
      }

      const { error } = await supabase
        .from('vendors')
        .update({
          bank_account_details: updatedMethods
        })
        .eq('id', vendor?.id);

      if (error) throw error;

      setPayoutMethods(updatedMethods);
      handleClosePayoutModal();
      alert(`Payout method ${editingPayoutMethodId ? 'updated' : 'added'} successfully!`);
    } catch (error: any) {
      alert(`Error ${editingPayoutMethodId ? 'updating' : 'adding'} payout method: ` + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEditPayoutMethod = (method: PayoutMethod) => {
    setEditingPayoutMethodId(method.id);
    setNewPayoutMethod({
      bankName: method.bank_name || '',
      accountNumber: method.account_number || '',
      accountName: method.account_name || '',
      isPrimary: method.isPrimary
    });
    setIsAddPayoutModalOpen(true);
  };

  const handleClosePayoutModal = () => {
    setIsAddPayoutModalOpen(false);
    setEditingPayoutMethodId(null);
    setNewPayoutMethod({
      bankName: '',
      accountNumber: '',
      accountName: '',
      isPrimary: false
    });
  };

  const handleDeletePayoutMethod = async (id: string) => {
    if (!confirm('Are you sure you want to delete this payout method?')) return;

    setSaving(true);
    try {
      const updatedMethods = payoutMethods.filter(m => m.id !== id);

      const { error } = await supabase
        .from('vendors')
        .update({
          bank_account_details: updatedMethods
        })
        .eq('id', vendor?.id);

      if (error) throw error;

      setPayoutMethods(updatedMethods);
    } catch (error: any) {
      alert('Error deleting payout method: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (amount > (vendor?.wallet_balance || 0)) {
      alert('Insufficient funds');
      return;
    }

    if (!selectedPayoutMethodId) {
      alert('Please select a payout method');
      return;
    }

    const selectedMethod = payoutMethods.find(m => m.id === selectedPayoutMethodId);
    if (!selectedMethod) return;

    setSaving(true);
    try {
      // 1. Create Payout Record
      const { data: payoutData, error: payoutError } = await supabase
        .from('payouts')
        .insert({
          vendor_id: vendor!.id,
          amount: amount,
          bank_name: (selectedMethod as any).bank_name || 'Bank', // Fallback if not in object
          account_number: (selectedMethod as any).account_number || '0000',
          account_name: (selectedMethod as any).account_name || 'Vendor',
          status: 'pending',
          reference: `PAY-${Date.now()}`
        })
        .select()
        .single();

      if (payoutError) throw payoutError;

      // 2. Create Wallet Transaction
      const { error: txError } = await supabase
        .from('wallet_transactions')
        .insert({
          vendor_id: vendor!.id,
          type: 'payout',
          amount: -amount,
          balance_after: (vendor?.wallet_balance || 0) - amount,
          description: `Withdrawal to ${selectedMethod.details}`,
          status: 'pending',
          reference: payoutData.id
        });

      if (txError) throw txError;

      // 3. Update Vendor Balance
      const { error: vendorError } = await supabase
        .from('vendors')
        .update({
          wallet_balance: (vendor?.wallet_balance || 0) - amount
        })
        .eq('id', vendor!.id);

      if (vendorError) throw vendorError;

      // Success
      alert('Withdrawal request submitted successfully!');
      setIsWithdrawModalOpen(false);
      setWithdrawAmount('');
      loadData(); // Reload all data
    } catch (error: any) {
      alert('Error processing withdrawal: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const balance = vendor?.wallet_balance || 0;
  const totalSales = vendor?.total_sales || 0;
  const pendingPayouts = pendingPayoutsTotal;

  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-700" />
      </div>
    );
  }

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
                      <Button
                        onClick={() => setIsWithdrawModalOpen(true)}
                        className="flex-1 h-10 md:h-12 bg-green-700 hover:bg-green-800 text-white font-sans font-semibold text-xs md:text-sm"
                      >
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
                      Total Sales
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
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-neutral-500">
                          No transactions found
                        </td>
                      </tr>
                    ) : (
                      transactions.map((transaction) => (
                        <tr
                          key={transaction.id}
                          className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors"
                        >
                          <td className="px-4 py-3 font-sans text-sm text-neutral-700">
                            {new Date(transaction.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 font-sans text-sm text-neutral-900">
                            {transaction.description || transaction.type}
                          </td>
                          <td className="px-4 py-3 font-sans text-sm text-neutral-700 capitalize">
                            {transaction.type}
                          </td>
                          <td className={`px-4 py-3 font-sans text-sm font-semibold text-right ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                            {transaction.amount > 0 ? '+' : ''}₦{Math.abs(transaction.amount).toLocaleString()}.00
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${transaction.status === 'completed'
                                ? 'bg-yellow-400 text-neutral-900'
                                : 'bg-neutral-200 text-neutral-700'
                                }`}
                            >
                              {transaction.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden space-y-3">
                {transactions.length === 0 ? (
                  <div className="p-4 text-center text-neutral-500">
                    No transactions found
                  </div>
                ) : (
                  transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="p-3 border border-neutral-200 rounded-lg bg-white"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-sans text-sm font-semibold text-neutral-900">
                            {transaction.description || transaction.type}
                          </p>
                          <p className="font-sans text-xs text-neutral-600 mt-1">
                            {new Date(transaction.created_at).toLocaleDateString()} • {transaction.type}
                          </p>
                        </div>
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ml-2 ${transaction.status === 'completed'
                            ? 'bg-yellow-400 text-neutral-900'
                            : 'bg-neutral-200 text-neutral-700'
                            }`}
                        >
                          {transaction.status}
                        </span>
                      </div>
                      <p
                        className={`font-sans text-base font-bold ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                          }`}
                      >
                        {transaction.amount > 0 ? '+' : ''}₦{Math.abs(transaction.amount).toLocaleString()}.00
                      </p>
                    </div>
                  ))
                )}
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
                  <Button
                    onClick={() => setIsAddPayoutModalOpen(true)}
                    className="h-8 md:h-9 px-3 md:px-4 bg-green-700 hover:bg-green-800 text-white font-sans text-xs md:text-sm flex items-center gap-1 md:gap-2"
                  >
                    <Plus className="w-3 h-3 md:w-4 md:h-4" />
                    <span className="hidden sm:inline">Add New Method</span>
                    <span className="sm:hidden">Add</span>
                  </Button>
                </div>

                <div className="space-y-3 md:space-y-4">
                  {payoutMethods.length === 0 ? (
                    <div className="text-center py-4 text-neutral-500 text-sm">
                      No payout methods added yet.
                    </div>
                  ) : (
                    payoutMethods.map((method) => (
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
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditPayoutMethod(method)}
                              className="font-sans text-xs md:text-sm text-neutral-600 hover:text-neutral-900 flex items-center gap-1"
                            >
                              <Edit2 className="w-3 h-3" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeletePayoutMethod(method.id)}
                              className="font-sans text-xs md:text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
                            >
                              <Trash2 className="w-3 h-3" />
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
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
                          onClick={async () => {
                            setSaving(true);
                            try {
                              const { error } = await supabase
                                .from('vendors')
                                .update({
                                  notification_preferences: notifications
                                })
                                .eq('id', vendor?.id);

                              if (error) throw error;
                              alert('Preferences saved!');
                            } catch (error: any) {
                              alert('Error saving preferences: ' + error.message);
                            } finally {
                              setSaving(false);
                            }
                          }}
                          disabled={saving}
                          className="w-full h-9 md:h-10 bg-green-700 hover:bg-green-800 text-white font-sans font-semibold text-xs md:text-sm"
                        >
                          {saving ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              Saving...
                            </>
                          ) : (
                            'Save Preferences'
                          )}
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
      {/* Add Payout Method Modal */}
      <Modal
        isOpen={isAddPayoutModalOpen}
        onClose={handleClosePayoutModal}
        title={editingPayoutMethodId ? "Edit Payout Method" : "Add Payout Method"}
      >
        <div className="space-y-4">
          <div>
            <label className="block font-sans font-medium text-sm text-neutral-700 mb-1">
              Bank Name
            </label>
            <input
              type="text"
              value={newPayoutMethod.bankName}
              onChange={(e) => setNewPayoutMethod({ ...newPayoutMethod, bankName: e.target.value })}
              className="w-full h-10 px-3 rounded-lg border border-neutral-200 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-green-700 focus:border-transparent"
              placeholder="e.g. Zenith Bank"
            />
          </div>
          <div>
            <label className="block font-sans font-medium text-sm text-neutral-700 mb-1">
              Account Number
            </label>
            <input
              type="text"
              value={newPayoutMethod.accountNumber}
              onChange={(e) => setNewPayoutMethod({ ...newPayoutMethod, accountNumber: e.target.value })}
              className="w-full h-10 px-3 rounded-lg border border-neutral-200 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-green-700 focus:border-transparent"
              placeholder="e.g. 0123456789"
            />
          </div>
          <div>
            <label className="block font-sans font-medium text-sm text-neutral-700 mb-1">
              Account Name
            </label>
            <input
              type="text"
              value={newPayoutMethod.accountName}
              onChange={(e) => setNewPayoutMethod({ ...newPayoutMethod, accountName: e.target.value })}
              className="w-full h-10 px-3 rounded-lg border border-neutral-200 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-green-700 focus:border-transparent"
              placeholder="e.g. John Doe"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPrimary"
              checked={newPayoutMethod.isPrimary}
              onChange={(e) => setNewPayoutMethod({ ...newPayoutMethod, isPrimary: e.target.checked })}
              className="w-4 h-4 rounded border-neutral-300 text-green-700 focus:ring-green-700"
            />
            <label htmlFor="isPrimary" className="font-sans text-sm text-neutral-700">
              Set as primary payout method
            </label>
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleClosePayoutModal}
              className="flex-1 bg-white hover:bg-neutral-50 text-neutral-900 border border-neutral-200"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddPayoutMethod}
              disabled={saving}
              className="flex-1 bg-green-700 hover:bg-green-800 text-white"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                'Save Method'
              )}
            </Button>
          </div>
        </div>
      </Modal>
      {/* Withdrawal Modal */}
      <Modal
        isOpen={isWithdrawModalOpen}
        onClose={() => setIsWithdrawModalOpen(false)}
        title="Withdraw Funds"
      >
        <div className="space-y-4">
          <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-100">
            <p className="text-sm text-neutral-600 mb-1">Available Balance</p>
            <p className="font-heading font-bold text-2xl text-neutral-900">
              ₦{balance.toLocaleString()}.00
            </p>
          </div>

          <div>
            <label className="block font-sans font-medium text-sm text-neutral-700 mb-1">
              Amount to Withdraw
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">₦</span>
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="w-full h-10 pl-8 pr-3 rounded-lg border border-neutral-200 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-green-700 focus:border-transparent"
                placeholder="0.00"
                min="0"
                max={balance}
              />
            </div>
          </div>

          <div>
            <label className="block font-sans font-medium text-sm text-neutral-700 mb-1">
              Select Payout Method
            </label>
            <select
              value={selectedPayoutMethodId}
              onChange={(e) => setSelectedPayoutMethodId(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-neutral-200 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-green-700 focus:border-transparent"
            >
              <option value="">Select a bank account</option>
              {payoutMethods.map((method) => (
                <option key={method.id} value={method.id}>
                  {method.details}
                </option>
              ))}
            </select>
            {payoutMethods.length === 0 && (
              <p className="text-xs text-red-500 mt-1">
                Please add a payout method first.
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              onClick={() => setIsWithdrawModalOpen(false)}
              className="flex-1 bg-white hover:bg-neutral-50 text-neutral-900 border border-neutral-200"
            >
              Cancel
            </Button>
            <Button
              onClick={handleWithdraw}
              disabled={saving || !selectedPayoutMethodId || !withdrawAmount}
              className="flex-1 bg-green-700 hover:bg-green-800 text-white"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                'Withdraw'
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
