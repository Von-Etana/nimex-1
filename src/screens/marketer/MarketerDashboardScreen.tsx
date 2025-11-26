import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import {
    Users,
    DollarSign,
    TrendingUp,
    Copy,
    CheckCircle,
    Clock,
    XCircle,
    Share2,
    Eye,
    BarChart3
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { referralService } from '../../services/referralService';
import { logger } from '../../lib/logger';

interface MarketerStats {
    totalReferrals: number;
    activeReferrals: number;
    pendingReferrals: number;
    totalCommissionEarned: number;
    pendingCommission: number;
    paidCommission: number;
}

interface Referral {
    id: string;
    vendor_name: string;
    vendor_email: string;
    status: 'pending' | 'completed' | 'rejected';
    commission_amount: number;
    commission_paid: boolean;
    created_at: string;
    commission_paid_at: string | null;
}

interface MarketerInfo {
    id: string;
    full_name: string;
    email: string;
    phone: string;
    business_name: string | null;
    referral_code: string;
    status: 'pending' | 'active' | 'suspended' | 'inactive';
    total_referrals: number;
    total_commission_earned: number;
}

export const MarketerDashboardScreen: React.FC = () => {
    const { user } = useAuth();
    const [marketerInfo, setMarketerInfo] = useState<MarketerInfo | null>(null);
    const [stats, setStats] = useState<MarketerStats>({
        totalReferrals: 0,
        activeReferrals: 0,
        pendingReferrals: 0,
        totalCommissionEarned: 0,
        pendingCommission: 0,
        paidCommission: 0,
    });
    const [referrals, setReferrals] = useState<Referral[]>([]);
    const [loading, setLoading] = useState(true);
    const [copiedLink, setCopiedLink] = useState(false);

    useEffect(() => {
        if (user?.email) {
            loadMarketerData();
        }
    }, [user]);

    const loadMarketerData = async () => {
        try {
            setLoading(true);

            // Get marketer info
            const { data: marketer, error: marketerError } = await supabase
                .from('marketers')
                .select('*')
                .eq('email', user?.email)
                .single();

            if (marketerError) throw marketerError;

            if (!marketer) {
                logger.error('Marketer not found');
                return;
            }

            setMarketerInfo(marketer);

            // Get referrals
            const { data: referralsData, error: referralsError } = await supabase
                .from('marketer_referrals')
                .select(`
          id,
          status,
          commission_amount,
          commission_paid,
          commission_paid_at,
          created_at,
          vendors!inner(
            business_name,
            user_id
          )
        `)
                .eq('marketer_id', marketer.id)
                .order('created_at', { ascending: false });

            if (referralsError) throw referralsError;

            // Transform referrals data
            const transformedReferrals: Referral[] = (referralsData || []).map((ref: any) => ({
                id: ref.id,
                vendor_name: ref.vendors?.business_name || 'Unknown Vendor',
                vendor_email: ref.vendors?.user_id || '',
                status: ref.status,
                commission_amount: ref.commission_amount,
                commission_paid: ref.commission_paid,
                created_at: ref.created_at,
                commission_paid_at: ref.commission_paid_at,
            }));

            setReferrals(transformedReferrals);

            // Calculate stats
            const activeReferrals = transformedReferrals.filter(r => r.status === 'completed').length;
            const pendingReferrals = transformedReferrals.filter(r => r.status === 'pending').length;
            const paidCommission = transformedReferrals
                .filter(r => r.commission_paid)
                .reduce((sum, r) => sum + r.commission_amount, 0);
            const pendingCommission = transformedReferrals
                .filter(r => !r.commission_paid && r.status === 'completed')
                .reduce((sum, r) => sum + r.commission_amount, 0);

            setStats({
                totalReferrals: transformedReferrals.length,
                activeReferrals,
                pendingReferrals,
                totalCommissionEarned: marketer.total_commission_earned,
                pendingCommission,
                paidCommission,
            });

        } catch (error) {
            logger.error('Error loading marketer data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCopyReferralLink = async () => {
        if (!marketerInfo?.referral_code) return;

        const link = referralService.generateReferralLink(marketerInfo.referral_code);

        try {
            await navigator.clipboard.writeText(link);
            setCopiedLink(true);
            setTimeout(() => setCopiedLink(false), 2000);
        } catch (error) {
            logger.error('Error copying link:', error);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        <CheckCircle className="w-3 h-3" />
                        Completed
                    </span>
                );
            case 'pending':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                        <Clock className="w-3 h-3" />
                        Pending
                    </span>
                );
            case 'rejected':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                        <XCircle className="w-3 h-3" />
                        Rejected
                    </span>
                );
            default:
                return null;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (!marketerInfo) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-6">
                <h1 className="text-2xl font-bold text-neutral-900 mb-4">Marketer Profile Not Found</h1>
                <p className="text-neutral-600 mb-6">Please contact support if you believe this is an error.</p>
            </div>
        );
    }

    if (marketerInfo.status === 'pending') {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-6">
                <div className="max-w-md w-full text-center">
                    <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Clock className="w-12 h-12 text-yellow-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-neutral-900 mb-4">Application Pending</h1>
                    <p className="text-neutral-600 mb-6">
                        Your marketer application is currently under review. You will receive an email once your account is approved.
                    </p>
                </div>
            </div>
        );
    }

    if (marketerInfo.status === 'suspended' || marketerInfo.status === 'inactive') {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-6">
                <div className="max-w-md w-full text-center">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <XCircle className="w-12 h-12 text-red-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-neutral-900 mb-4">Account {marketerInfo.status}</h1>
                    <p className="text-neutral-600 mb-6">
                        Your marketer account has been {marketerInfo.status}. Please contact support for more information.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-neutral-900 mb-2">
                        Welcome back, {marketerInfo.full_name}!
                    </h1>
                    <p className="text-neutral-600">
                        Track your referrals and earnings
                    </p>
                </div>

                {/* Referral Link Card */}
                <Card className="mb-8 border-2 border-primary-200 bg-gradient-to-br from-primary-50 to-white">
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h2 className="text-xl font-bold text-neutral-900 mb-1">Your Referral Link</h2>
                                <p className="text-sm text-neutral-600">Share this link to refer vendors and earn commissions</p>
                            </div>
                            <Share2 className="w-6 h-6 text-primary-600" />
                        </div>
                        <div className="flex gap-3">
                            <div className="flex-1 bg-white border border-neutral-200 rounded-lg px-4 py-3 font-mono text-sm text-neutral-700 overflow-x-auto">
                                {referralService.generateReferralLink(marketerInfo.referral_code)}
                            </div>
                            <Button
                                onClick={handleCopyReferralLink}
                                className={`${copiedLink
                                        ? 'bg-green-600 hover:bg-green-700'
                                        : 'bg-primary-600 hover:bg-primary-700'
                                    } text-white`}
                            >
                                {copiedLink ? (
                                    <>
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Copied!
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-4 h-4 mr-2" />
                                        Copy
                                    </>
                                )}
                            </Button>
                        </div>
                        <div className="mt-4 flex items-center gap-2 text-sm text-neutral-600">
                            <span className="font-semibold">Referral Code:</span>
                            <span className="font-mono bg-white px-3 py-1 rounded border border-neutral-200">
                                {marketerInfo.referral_code}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-2">
                                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <Users className="w-6 h-6 text-blue-600" />
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold text-neutral-900">{stats.totalReferrals}</h3>
                            <p className="text-sm text-neutral-600">Total Referrals</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-2">
                                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                    <CheckCircle className="w-6 h-6 text-green-600" />
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold text-neutral-900">{stats.activeReferrals}</h3>
                            <p className="text-sm text-neutral-600">Active Referrals</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-2">
                                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                                    <Clock className="w-6 h-6 text-yellow-600" />
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold text-neutral-900">{stats.pendingReferrals}</h3>
                            <p className="text-sm text-neutral-600">Pending Referrals</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-2">
                                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <DollarSign className="w-6 h-6 text-purple-600" />
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold text-neutral-900">
                                ₦{stats.totalCommissionEarned.toLocaleString()}
                            </h3>
                            <p className="text-sm text-neutral-600">Total Earned</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Commission Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                    <TrendingUp className="w-5 h-5 text-green-600" />
                                </div>
                                <h3 className="text-lg font-bold text-neutral-900">Paid Commission</h3>
                            </div>
                            <p className="text-3xl font-bold text-green-600">₦{stats.paidCommission.toLocaleString()}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                                    <BarChart3 className="w-5 h-5 text-orange-600" />
                                </div>
                                <h3 className="text-lg font-bold text-neutral-900">Pending Commission</h3>
                            </div>
                            <p className="text-3xl font-bold text-orange-600">₦{stats.pendingCommission.toLocaleString()}</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Referrals Table */}
                <Card>
                    <CardContent className="p-6">
                        <h2 className="text-xl font-bold text-neutral-900 mb-6">Recent Referrals</h2>

                        {referrals.length === 0 ? (
                            <div className="text-center py-12">
                                <Eye className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                                <p className="text-neutral-600 mb-2">No referrals yet</p>
                                <p className="text-sm text-neutral-500">Start sharing your referral link to earn commissions</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-neutral-200">
                                            <th className="text-left py-3 px-4 font-semibold text-neutral-700">Vendor</th>
                                            <th className="text-left py-3 px-4 font-semibold text-neutral-700">Date</th>
                                            <th className="text-left py-3 px-4 font-semibold text-neutral-700">Status</th>
                                            <th className="text-right py-3 px-4 font-semibold text-neutral-700">Commission</th>
                                            <th className="text-center py-3 px-4 font-semibold text-neutral-700">Payment</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {referrals.map((referral) => (
                                            <tr key={referral.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                                                <td className="py-4 px-4">
                                                    <div>
                                                        <p className="font-medium text-neutral-900">{referral.vendor_name}</p>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4 text-neutral-600">
                                                    {new Date(referral.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="py-4 px-4">
                                                    {getStatusBadge(referral.status)}
                                                </td>
                                                <td className="py-4 px-4 text-right font-semibold text-neutral-900">
                                                    ₦{referral.commission_amount.toLocaleString()}
                                                </td>
                                                <td className="py-4 px-4 text-center">
                                                    {referral.commission_paid ? (
                                                        <span className="inline-flex items-center gap-1 text-green-600 text-sm font-medium">
                                                            <CheckCircle className="w-4 h-4" />
                                                            Paid
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-orange-600 text-sm font-medium">
                                                            <Clock className="w-4 h-4" />
                                                            Pending
                                                        </span>
                                                    )}
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
