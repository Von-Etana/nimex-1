import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import {
  Users,
  TrendingUp,
  DollarSign,
  Copy,
  Check,
  Share2,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { referralService, type ReferralStats, type VendorReferral } from '../../services/referralService';
import { FirestoreService } from '../../services/firestore.service';
import { COLLECTIONS } from '../../lib/collections';

export const ReferralsScreen: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ReferralStats>({
    totalReferrals: 0,
    completedReferrals: 0,
    pendingReferrals: 0,
    totalCommissionEarned: 0,
    pendingCommission: 0,
  });
  const [referrals, setReferrals] = useState<VendorReferral[]>([]);
  const [referralCode, setReferralCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [vendorId, setVendorId] = useState<string | null>(null);

  useEffect(() => {
    loadReferralData();
  }, [user]);

  const loadReferralData = async () => {
    if (!user) return;

    try {
      // Get vendor ID - use the same pattern as CreateProductScreen.tsx
      const vendors = await FirestoreService.getDocuments<any>(COLLECTIONS.VENDORS, {
        filters: [{ field: 'user_id', operator: '==', value: user.uid }],
        limitCount: 1
      });

      if (vendors.length > 0) {
        const vendor = vendors[0];
        setVendorId(vendor.id);
        setReferralCode(vendor.referral_code);

        const [statsData, referralsData] = await Promise.all([
          referralService.getVendorReferralStats(vendor.id),
          referralService.getVendorReferrals(vendor.id),
        ]);

        setStats(statsData);
        setReferrals(referralsData);
      }
    } catch (error) {
      console.error('Error loading referral data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    const success = await referralService.copyReferralLink(referralCode);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareLink = async () => {
    const link = referralService.generateReferralLink(referralCode);
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join NIMEX as a Vendor',
          text: 'Sign up using my referral code and start selling!',
          url: link,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      handleCopyLink();
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-neutral-100 text-neutral-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading referral data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-neutral-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="font-heading font-bold text-2xl md:text-3xl text-neutral-900 mb-2">
            Referral Program
          </h1>
          <p className="font-sans text-neutral-600">
            Invite other vendors to join NIMEX and earn commissions
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card className="border border-neutral-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <p className="font-sans text-sm text-neutral-600 mb-1">Total Referrals</p>
              <p className="font-heading font-bold text-3xl text-neutral-900">
                {stats.totalReferrals}
              </p>
              <div className="mt-2 flex items-center gap-2 text-xs">
                <span className="text-green-600">{stats.completedReferrals} completed</span>
                <span className="text-neutral-400">•</span>
                <span className="text-yellow-600">{stats.pendingReferrals} pending</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-neutral-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <p className="font-sans text-sm text-neutral-600 mb-1">Commission Earned</p>
              <p className="font-heading font-bold text-3xl text-neutral-900">
                ₦{stats.totalCommissionEarned.toLocaleString()}
              </p>
              <p className="font-sans text-xs text-neutral-500 mt-2">
                From {stats.completedReferrals} completed referrals
              </p>
            </CardContent>
          </Card>

          <Card className="border border-neutral-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-yellow-100 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
              <p className="font-sans text-sm text-neutral-600 mb-1">Pending Commission</p>
              <p className="font-heading font-bold text-3xl text-neutral-900">
                ₦{stats.pendingCommission.toLocaleString()}
              </p>
              <p className="font-sans text-xs text-neutral-500 mt-2">
                Awaiting payment approval
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="border border-neutral-200 shadow-sm mb-6">
          <CardContent className="p-6">
            <h2 className="font-heading font-bold text-xl text-neutral-900 mb-4">
              Your Referral Link
            </h2>
            <div className="bg-neutral-50 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="font-sans text-sm text-neutral-600">Referral Code:</span>
                <code className="font-mono text-lg font-bold text-primary-600">
                  {referralCode}
                </code>
              </div>
              <div className="flex items-center gap-2 p-3 bg-white border border-neutral-200 rounded-lg">
                <input
                  type="text"
                  value={referralService.generateReferralLink(referralCode)}
                  readOnly
                  className="flex-1 font-sans text-sm text-neutral-700 bg-transparent outline-none"
                />
                <Button
                  onClick={handleCopyLink}
                  size="sm"
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </div>
            <Button
              onClick={handleShareLink}
              className="w-full md:w-auto bg-primary-500 hover:bg-primary-600 text-white flex items-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              Share Referral Link
            </Button>
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="font-sans text-sm text-blue-900">
                <strong>How it works:</strong> Share your referral link with other vendors. When they
                sign up using your link and complete their registration, you'll earn a commission!
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-neutral-200 shadow-sm">
          <CardContent className="p-6">
            <h2 className="font-heading font-bold text-xl text-neutral-900 mb-4">
              Referral History
            </h2>

            {referrals.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                <p className="font-sans text-neutral-600 mb-2">No referrals yet</p>
                <p className="font-sans text-sm text-neutral-500">
                  Start sharing your referral link to earn commissions
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-neutral-50 border-b border-neutral-200">
                    <tr>
                      <th className="text-left px-4 py-3 font-sans text-sm font-semibold text-neutral-700">
                        Vendor
                      </th>
                      <th className="text-left px-4 py-3 font-sans text-sm font-semibold text-neutral-700">
                        Status
                      </th>
                      <th className="text-left px-4 py-3 font-sans text-sm font-semibold text-neutral-700">
                        Commission
                      </th>
                      <th className="text-left px-4 py-3 font-sans text-sm font-semibold text-neutral-700">
                        Payment Status
                      </th>
                      <th className="text-left px-4 py-3 font-sans text-sm font-semibold text-neutral-700">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {referrals.map((referral) => (
                      <tr
                        key={referral.id}
                        className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-sans text-sm font-medium text-neutral-900">
                              {referral.referredVendorName}
                            </p>
                            <p className="font-sans text-xs text-neutral-500">
                              {referral.referredVendorEmail}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(referral.status)}
                            <span
                              className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                                referral.status
                              )}`}
                            >
                              {referral.status.charAt(0).toUpperCase() + referral.status.slice(1)}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-sans text-sm text-neutral-900">
                          ₦{referral.commissionAmount.toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${referral.commissionPaid
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                              }`}
                          >
                            {referral.commissionPaid ? 'Paid' : 'Pending'}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-sans text-sm text-neutral-600">
                          {new Date(referral.createdAt).toLocaleDateString()}
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
    </div>
  );
};
