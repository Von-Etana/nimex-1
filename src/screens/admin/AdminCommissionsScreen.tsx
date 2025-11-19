import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { supabase } from '../../lib/supabase';
import { DollarSign, Settings, Check, Loader2 } from 'lucide-react';
import { Modal } from '../../components/ui/modal';
import { useAuth } from '../../contexts/AuthContext';

interface CommissionSetting {
  type: string;
  commission_amount: number;
}

interface PendingCommission {
  id: string;
  referrer_name: string;
  referrer_type: 'vendor' | 'marketer';
  referrer_id: string;
  commission_amount: number;
  created_at: string;
}

export const AdminCommissionsScreen: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [settings, setSettings] = useState<CommissionSetting[]>([]);
  const [vendorAmount, setVendorAmount] = useState(5000);
  const [marketerAmount, setMarketerAmount] = useState(10000);
  const [pendingCommissions, setPendingCommissions] = useState<PendingCommission[]>([]);

  // Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedCommission, setSelectedCommission] = useState<PendingCommission | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [settingsData, vendorReferrals, marketerReferrals] = await Promise.all([
        supabase.from('commission_settings').select('*'),
        supabase
          .from('vendor_referrals')
          .select(`
            id,
            commission_amount,
            created_at,
            referrer_vendor_id,
            vendors!vendor_referrals_referrer_vendor_id_fkey (business_name)
          `)
          .eq('status', 'completed')
          .eq('commission_paid', false),
        supabase
          .from('marketer_referrals')
          .select(`
            id,
            commission_amount,
            created_at,
            marketer_id,
            marketers (full_name)
          `)
          .eq('status', 'completed')
          .eq('commission_paid', false),
      ]);

      if (settingsData.data) {
        setSettings(settingsData.data);
        settingsData.data.forEach((setting: any) => {
          if (setting.type === 'vendor_referral') {
            setVendorAmount(Number(setting.commission_amount));
          } else if (setting.type === 'marketer_referral') {
            setMarketerAmount(Number(setting.commission_amount));
          }
        });
      }

      const pending: PendingCommission[] = [];

      vendorReferrals.data?.forEach((ref: any) => {
        pending.push({
          id: ref.id,
          referrer_name: ref.vendors?.business_name || 'Unknown Vendor',
          referrer_type: 'vendor',
          referrer_id: ref.referrer_vendor_id,
          commission_amount: Number(ref.commission_amount),
          created_at: ref.created_at,
        });
      });

      marketerReferrals.data?.forEach((ref: any) => {
        pending.push({
          id: ref.id,
          referrer_name: ref.marketers?.full_name || 'Unknown Marketer',
          referrer_type: 'marketer',
          referrer_id: ref.marketer_id,
          commission_amount: Number(ref.commission_amount),
          created_at: ref.created_at,
        });
      });

      setPendingCommissions(pending.sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSettings = async () => {
    try {
      await Promise.all([
        supabase
          .from('commission_settings')
          .update({ commission_amount: vendorAmount })
          .eq('type', 'vendor_referral'),
        supabase
          .from('commission_settings')
          .update({ commission_amount: marketerAmount })
          .eq('type', 'marketer_referral'),
      ]);

      alert('Commission settings updated successfully');
    } catch (error) {
      console.error('Error updating settings:', error);
      alert('Failed to update settings');
    }
  };

  const handleOpenPaymentModal = (commission: PendingCommission) => {
    setSelectedCommission(commission);
    setPaymentMethod('');
    setReferenceNumber('');
    setPaymentNotes('');
    setIsPaymentModalOpen(true);
  };

  const handleConfirmPayment = async () => {
    if (!selectedCommission || !paymentMethod) {
      alert('Please select a payment method');
      return;
    }

    setProcessing(true);
    try {
      // 1. Record the payment
      const { error: paymentError } = await supabase
        .from('commission_payments')
        .insert({
          recipient_type: selectedCommission.referrer_type,
          recipient_id: selectedCommission.referrer_id,
          amount: selectedCommission.commission_amount,
          payment_method: paymentMethod,
          reference_number: referenceNumber || null,
          status: 'completed',
          referral_ids: [selectedCommission.id], // Storing as array for potential batch payments
          notes: paymentNotes || null,
          processed_by: user?.id,
          processed_at: new Date().toISOString(),
        });

      if (paymentError) throw paymentError;

      // 2. Update the referral status
      if (selectedCommission.referrer_type === 'vendor') {
        await supabase
          .from('vendor_referrals')
          .update({
            commission_paid: true,
            commission_paid_at: new Date().toISOString(),
          })
          .eq('id', selectedCommission.id);
      } else {
        await supabase
          .from('marketer_referrals')
          .update({
            commission_paid: true,
            commission_paid_at: new Date().toISOString(),
          })
          .eq('id', selectedCommission.id);
      }

      setIsPaymentModalOpen(false);
      loadData();
      alert('Commission marked as paid successfully');
    } catch (error: any) {
      console.error('Error processing payment:', error);
      alert('Failed to process payment: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const totalPending = pendingCommissions.reduce(
    (sum, comm) => sum + comm.commission_amount,
    0
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading commission data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-neutral-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="font-heading font-bold text-2xl md:text-3xl text-neutral-900 mb-2">
            Commission Management
          </h1>
          <p className="font-sans text-neutral-600">
            Configure commission rates and manage pending payments
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card className="border border-neutral-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Settings className="w-6 h-6 text-green-600" />
                </div>
                <h2 className="font-heading font-bold text-xl text-neutral-900">
                  Commission Settings
                </h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block font-sans font-medium text-neutral-700 mb-2">
                    Vendor Referral Commission (₦)
                  </label>
                  <input
                    type="number"
                    value={vendorAmount}
                    onChange={(e) => setVendorAmount(Number(e.target.value))}
                    className="w-full h-12 px-4 rounded-lg border border-neutral-200 font-sans text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block font-sans font-medium text-neutral-700 mb-2">
                    Marketer Referral Commission (₦)
                  </label>
                  <input
                    type="number"
                    value={marketerAmount}
                    onChange={(e) => setMarketerAmount(Number(e.target.value))}
                    className="w-full h-12 px-4 rounded-lg border border-neutral-200 font-sans text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <Button
                  onClick={handleUpdateSettings}
                  className="w-full bg-primary-500 hover:bg-primary-600 text-white"
                >
                  Update Commission Settings
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-neutral-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-yellow-600" />
                </div>
                <h2 className="font-heading font-bold text-xl text-neutral-900">
                  Pending Payments
                </h2>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-neutral-50 rounded-lg">
                  <p className="font-sans text-sm text-neutral-600 mb-1">
                    Total Pending Commission
                  </p>
                  <p className="font-heading font-bold text-3xl text-neutral-900">
                    ₦{totalPending.toLocaleString()}
                  </p>
                  <p className="font-sans text-sm text-neutral-500 mt-1">
                    {pendingCommissions.length} pending payment{pendingCommissions.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border border-neutral-200 shadow-sm">
          <CardContent className="p-6">
            <h2 className="font-heading font-bold text-xl text-neutral-900 mb-4">
              Pending Commission Payments
            </h2>

            {pendingCommissions.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                <p className="font-sans text-neutral-600 mb-2">No pending payments</p>
                <p className="font-sans text-sm text-neutral-500">
                  All commissions have been paid
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-neutral-50 border-b border-neutral-200">
                    <tr>
                      <th className="text-left px-4 py-3 font-sans text-sm font-semibold text-neutral-700">
                        Recipient
                      </th>
                      <th className="text-left px-4 py-3 font-sans text-sm font-semibold text-neutral-700">
                        Type
                      </th>
                      <th className="text-left px-4 py-3 font-sans text-sm font-semibold text-neutral-700">
                        Amount
                      </th>
                      <th className="text-left px-4 py-3 font-sans text-sm font-semibold text-neutral-700">
                        Date
                      </th>
                      <th className="text-left px-4 py-3 font-sans text-sm font-semibold text-neutral-700">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingCommissions.map((commission) => (
                      <tr
                        key={`${commission.referrer_type}-${commission.id}`}
                        className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors"
                      >
                        <td className="px-4 py-3 font-sans text-sm text-neutral-900">
                          {commission.referrer_name}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${commission.referrer_type === 'vendor'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-green-100 text-green-800'
                              }`}
                          >
                            {commission.referrer_type === 'vendor' ? 'Vendor' : 'Marketer'}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-sans text-sm font-medium text-neutral-900">
                          ₦{commission.commission_amount.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 font-sans text-sm text-neutral-600">
                          {new Date(commission.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <Button
                            onClick={() => handleOpenPaymentModal(commission)}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                          >
                            <Check className="w-4 h-4" />
                            Mark as Paid
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      {/* Payment Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="Process Commission Payment"
      >
        <div className="space-y-4">
          <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-100">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-neutral-600">Recipient:</span>
              <span className="font-semibold text-neutral-900">{selectedCommission?.referrer_name}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-neutral-600">Type:</span>
              <span className="capitalize text-neutral-900">{selectedCommission?.referrer_type}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-neutral-600">Amount:</span>
              <span className="font-heading font-bold text-xl text-green-600">
                ₦{selectedCommission?.commission_amount.toLocaleString()}
              </span>
            </div>
          </div>

          <div>
            <label className="block font-sans font-medium text-sm text-neutral-700 mb-1">
              Payment Method <span className="text-red-500">*</span>
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-neutral-200 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Select method</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Cash">Cash</option>
              <option value="Cheque">Cheque</option>
              <option value="Wallet Transfer">Wallet Transfer</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block font-sans font-medium text-sm text-neutral-700 mb-1">
              Reference Number (Optional)
            </label>
            <input
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="e.g., TRX-123456789"
              className="w-full h-10 px-3 rounded-lg border border-neutral-200 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block font-sans font-medium text-sm text-neutral-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
              placeholder="Any additional details..."
              className="w-full h-24 px-3 py-2 rounded-lg border border-neutral-200 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              onClick={() => setIsPaymentModalOpen(false)}
              className="flex-1 bg-white hover:bg-neutral-50 text-neutral-900 border border-neutral-200"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmPayment}
              disabled={processing || !paymentMethod}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                'Confirm Payment'
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
