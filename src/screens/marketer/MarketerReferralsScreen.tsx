import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import {
    Users,
    Clock,
    CheckCircle,
    XCircle,
    Search,
    Calendar,
    Copy,
    Check,
    Loader2
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { FirestoreService } from '../../services/firestore.service';
import { COLLECTIONS } from '../../lib/collections';
import { referralService } from '../../services/referralService';

interface Referral {
    id: string;
    vendor_id: string;
    vendor_name: string;
    status: 'pending' | 'completed' | 'rejected';
    commission_amount: number;
    commission_paid: boolean;
    created_at: string;
}

export const MarketerReferralsScreen: React.FC = () => {
    const { user } = useAuth();
    const [referrals, setReferrals] = useState<Referral[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [referralCode, setReferralCode] = useState('');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (user?.uid) {
            loadReferrals();
        }
    }, [user]);

    const loadReferrals = async () => {
        try {
            setLoading(true);

            if (!user?.uid) return;

            // Get marketer info using user ID (document ID = user ID)
            const marketer = await FirestoreService.getDocument<any>(
                COLLECTIONS.MARKETERS,
                user.uid
            );

            if (!marketer) return;

            setReferralCode(marketer.referral_code || '');

            // Get referrals
            const referralsData = await FirestoreService.getDocuments<any>(
                COLLECTIONS.MARKETER_REFERRALS,
                {
                    filters: [{ field: 'marketer_id', operator: '==', value: marketer.id }],
                    orderByField: 'created_at',
                    orderByDirection: 'desc'
                }
            );

            // Enrich with vendor details
            const enrichedReferrals = await Promise.all(
                referralsData.map(async (ref: any) => {
                    let vendorName = 'Unknown Vendor';

                    if (ref.vendor_id) {
                        const vendor = await FirestoreService.getDocument<any>(COLLECTIONS.VENDORS, ref.vendor_id);
                        if (vendor) {
                            vendorName = vendor.business_name || 'Unknown Vendor';
                        }
                    }

                    return {
                        id: ref.id,
                        vendor_id: ref.vendor_id,
                        vendor_name: vendorName,
                        status: ref.status,
                        commission_amount: ref.commission_amount || 0,
                        commission_paid: ref.commission_paid || false,
                        created_at: ref.created_at?.toDate?.()?.toISOString() || new Date().toISOString()
                    };
                })
            );

            setReferrals(enrichedReferrals);
        } catch (error) {
            console.error('Error loading referrals:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCopyLink = async () => {
        const link = referralService.generateReferralLink(referralCode);
        try {
            await navigator.clipboard.writeText(link);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
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

    const filteredReferrals = referrals.filter((ref) => {
        const matchesSearch = ref.vendor_name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filterStatus === 'all' || ref.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    const stats = {
        total: referrals.length,
        completed: referrals.filter(r => r.status === 'completed').length,
        pending: referrals.filter(r => r.status === 'pending').length,
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-neutral-900 mb-2">My Referrals</h1>
                    <p className="text-neutral-600">Track all your vendor referrals</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-neutral-600">Total Referrals</p>
                                    <p className="text-2xl font-bold text-neutral-900">{stats.total}</p>
                                </div>
                                <Users className="w-8 h-8 text-blue-500" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-neutral-600">Completed</p>
                                    <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                                </div>
                                <CheckCircle className="w-8 h-8 text-green-500" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-neutral-600">Pending</p>
                                    <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                                </div>
                                <Clock className="w-8 h-8 text-yellow-500" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Referral Link */}
                <Card className="mb-6 border-2 border-primary-200 bg-gradient-to-br from-primary-50 to-white">
                    <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h3 className="font-semibold text-neutral-900">Your Referral Link</h3>
                                <p className="text-sm text-neutral-600">Share to earn commissions</p>
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={referralService.generateReferralLink(referralCode)}
                                    readOnly
                                    className="flex-1 md:w-80 px-3 py-2 border border-neutral-200 rounded-lg bg-white text-sm"
                                />
                                <Button onClick={handleCopyLink} className="bg-primary-600 hover:bg-primary-700 text-white">
                                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Filters */}
                <Card className="mb-6">
                    <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                                <input
                                    type="text"
                                    placeholder="Search vendors..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full h-10 pl-10 pr-4 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                            </div>
                            <div className="flex gap-2">
                                {['all', 'completed', 'pending', 'rejected'].map((status) => (
                                    <button
                                        key={status}
                                        onClick={() => setFilterStatus(status)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterStatus === status
                                            ? 'bg-primary-600 text-white'
                                            : 'bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-50'
                                            }`}
                                    >
                                        {status.charAt(0).toUpperCase() + status.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Referrals List */}
                <Card>
                    <CardContent className="p-0">
                        {filteredReferrals.length === 0 ? (
                            <div className="text-center py-12">
                                <Users className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                                <p className="text-neutral-600">No referrals found</p>
                                <p className="text-sm text-neutral-500">Start sharing your referral link to earn commissions</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-neutral-50 border-b border-neutral-200">
                                        <tr>
                                            <th className="text-left px-6 py-4 text-sm font-semibold text-neutral-700">Vendor</th>
                                            <th className="text-left px-6 py-4 text-sm font-semibold text-neutral-700">Date</th>
                                            <th className="text-left px-6 py-4 text-sm font-semibold text-neutral-700">Status</th>
                                            <th className="text-right px-6 py-4 text-sm font-semibold text-neutral-700">Commission</th>
                                            <th className="text-center px-6 py-4 text-sm font-semibold text-neutral-700">Payment</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredReferrals.map((referral) => (
                                            <tr key={referral.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                                                <td className="px-6 py-4">
                                                    <p className="font-medium text-neutral-900">{referral.vendor_name}</p>
                                                </td>
                                                <td className="px-6 py-4 text-neutral-600">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-4 h-4" />
                                                        {new Date(referral.created_at).toLocaleDateString()}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(referral.status)}`}>
                                                        {getStatusIcon(referral.status)}
                                                        {referral.status.charAt(0).toUpperCase() + referral.status.slice(1)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right font-semibold text-neutral-900">
                                                    ₦{referral.commission_amount.toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${referral.commission_paid
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                        {referral.commission_paid ? 'Paid' : 'Pending'}
                                                    </span>
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
