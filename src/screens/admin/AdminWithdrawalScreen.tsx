import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Search, Eye, DollarSign, Clock, CheckCircle, XCircle, Loader2, ArrowUpRight, Building } from 'lucide-react';
import { FirestoreService } from '../../services/firestore.service';
import { logger } from '../../lib/logger';

interface Payout {
    id: string;
    vendor_id: string;
    amount: number;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    bank_code?: string;
    bank_name?: string;
    account_number?: string;
    account_name?: string;
    transfer_reference?: string;
    created_at: string;
    completed_at?: string;
    failed_at?: string;
    failure_reason?: string;
    vendor?: {
        business_name: string;
        email?: string;
    };
}

export const AdminWithdrawalsScreen: React.FC = () => {
    const [payouts, setPayouts] = useState<Payout[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'processing' | 'completed' | 'failed'>('all');
    const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null);

    useEffect(() => {
        loadPayouts();
    }, []);

    const loadPayouts = async () => {
        try {
            setLoading(true);
            logger.info('Loading payouts');

            const payoutsData = await FirestoreService.getDocuments<any>('payouts', {
                orderBy: { field: 'created_at', direction: 'desc' }
            });

            if (!payoutsData || payoutsData.length === 0) {
                setPayouts([]);
                return;
            }

            // Fetch vendor info
            const vendorIds = Array.from(new Set(payoutsData.map(p => p.vendor_id).filter(Boolean)));
            const vendorsMap = new Map();

            if (vendorIds.length > 0) {
                const allVendors = await FirestoreService.getDocuments('vendors');
                allVendors.forEach(v => vendorsMap.set(v.id, v));
            }

            const mappedPayouts = payoutsData.map((p: any) => ({
                ...p,
                vendor: vendorsMap.get(p.vendor_id) ? {
                    business_name: vendorsMap.get(p.vendor_id).business_name,
                    email: vendorsMap.get(p.vendor_id).email
                } : undefined
            }));

            setPayouts(mappedPayouts);
        } catch (error) {
            logger.error('Error loading payouts', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredPayouts = payouts.filter((payout) => {
        const matchesSearch =
            payout.vendor?.business_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            payout.transfer_reference?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            payout.account_number?.includes(searchQuery);
        const matchesFilter = filterStatus === 'all' || payout.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    const getStatusColor = (status: Payout['status']) => {
        switch (status) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-700';
            case 'processing':
                return 'bg-blue-100 text-blue-700';
            case 'completed':
                return 'bg-green-100 text-green-700';
            case 'failed':
                return 'bg-red-100 text-red-700';
            default:
                return 'bg-neutral-100 text-neutral-700';
        }
    };

    const getStatusIcon = (status: Payout['status']) => {
        switch (status) {
            case 'pending':
                return <Clock className="w-4 h-4" />;
            case 'processing':
                return <Loader2 className="w-4 h-4 animate-spin" />;
            case 'completed':
                return <CheckCircle className="w-4 h-4" />;
            case 'failed':
                return <XCircle className="w-4 h-4" />;
            default:
                return null;
        }
    };

    const getTotalPending = () => {
        return payouts
            .filter(p => p.status === 'pending' || p.status === 'processing')
            .reduce((sum, p) => sum + p.amount, 0);
    };

    const getTotalCompleted = () => {
        return payouts
            .filter(p => p.status === 'completed')
            .reduce((sum, p) => sum + p.amount, 0);
    };

    const getPendingCount = () => {
        return payouts.filter(p => p.status === 'pending' || p.status === 'processing').length;
    };

    return (
        <div className="w-full min-h-screen bg-neutral-50">
            <div className="w-full max-w-7xl mx-auto px-3 md:px-6 py-4 md:py-8">
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h1 className="font-heading font-bold text-2xl md:text-3xl text-neutral-900">
                                Withdrawal Management
                            </h1>
                            <p className="font-sans text-sm text-neutral-600 mt-1">
                                Monitor and manage vendor payout requests
                            </p>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <Card className="border border-neutral-200 shadow-sm">
                                <CardContent className="p-3">
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-yellow-600" />
                                        <div>
                                            <p className="font-sans text-xs text-neutral-600">Pending</p>
                                            <p className="font-heading font-bold text-lg text-yellow-600">
                                                ₦{getTotalPending().toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="border border-neutral-200 shadow-sm">
                                <CardContent className="p-3">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4 text-green-600" />
                                        <div>
                                            <p className="font-sans text-xs text-neutral-600">Completed</p>
                                            <p className="font-heading font-bold text-lg text-green-600">
                                                ₦{getTotalCompleted().toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="border border-neutral-200 shadow-sm">
                                <CardContent className="p-3">
                                    <div className="flex items-center gap-2">
                                        <ArrowUpRight className="w-4 h-4 text-purple-600" />
                                        <div>
                                            <p className="font-sans text-xs text-neutral-600">Queue</p>
                                            <p className="font-heading font-bold text-lg text-purple-600">
                                                {getPendingCount()}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                            <input
                                type="text"
                                placeholder="Search by vendor, reference..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg font-sans text-sm focus:outline-none focus:ring-2 focus:ring-green-700"
                            />
                        </div>
                        <div className="flex items-center gap-2 overflow-x-auto">
                            {['all', 'pending', 'processing', 'completed', 'failed'].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setFilterStatus(status as any)}
                                    className={`px-4 py-2 rounded-lg font-sans text-sm font-medium transition-colors whitespace-nowrap ${filterStatus === status
                                        ? 'bg-green-700 text-white'
                                        : 'bg-white text-neutral-700 border border-neutral-200'
                                        }`}
                                >
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Desktop Table */}
                    <div className="hidden md:block">
                        <Card className="border border-neutral-200 shadow-sm">
                            <CardContent className="p-0">
                                <table className="w-full">
                                    <thead className="bg-neutral-50 border-b border-neutral-200">
                                        <tr>
                                            <th className="text-left px-6 py-4 font-sans text-sm font-semibold text-neutral-700">
                                                Vendor
                                            </th>
                                            <th className="text-left px-6 py-4 font-sans text-sm font-semibold text-neutral-700">
                                                Bank Details
                                            </th>
                                            <th className="text-left px-6 py-4 font-sans text-sm font-semibold text-neutral-700">
                                                Amount
                                            </th>
                                            <th className="text-left px-6 py-4 font-sans text-sm font-semibold text-neutral-700">
                                                Status
                                            </th>
                                            <th className="text-left px-6 py-4 font-sans text-sm font-semibold text-neutral-700">
                                                Date
                                            </th>
                                            <th className="text-left px-6 py-4 font-sans text-sm font-semibold text-neutral-700">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-12 text-center text-neutral-500">
                                                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                                                    Loading withdrawals...
                                                </td>
                                            </tr>
                                        ) : filteredPayouts.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-12 text-center text-neutral-500">
                                                    <DollarSign className="w-8 h-8 mx-auto mb-2 text-neutral-300" />
                                                    No withdrawals found
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredPayouts.map((payout) => (
                                                <tr
                                                    key={payout.id}
                                                    className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors"
                                                >
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="font-sans text-sm text-neutral-900 font-medium">
                                                                {payout.vendor?.business_name || 'Unknown Vendor'}
                                                            </span>
                                                            <span className="font-sans text-xs text-neutral-500">
                                                                ID: {payout.vendor_id?.slice(0, 8)}...
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="font-sans text-sm text-neutral-900">
                                                                {payout.bank_name || 'N/A'}
                                                            </span>
                                                            <span className="font-sans text-xs text-neutral-600">
                                                                {payout.account_number || 'N/A'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="font-sans text-sm text-neutral-900 font-semibold">
                                                            ₦{payout.amount.toLocaleString()}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span
                                                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                                                                payout.status
                                                            )}`}
                                                        >
                                                            {getStatusIcon(payout.status)}
                                                            {payout.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 font-sans text-sm text-neutral-700">
                                                        {new Date(payout.created_at).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <button
                                                            onClick={() => setSelectedPayout(payout)}
                                                            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                                                            title="View details"
                                                        >
                                                            <Eye className="w-5 h-5 text-neutral-600" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Mobile Cards */}
                    <div className="md:hidden space-y-3">
                        {loading ? (
                            <Card className="border border-neutral-200 shadow-sm">
                                <CardContent className="p-8 text-center">
                                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                                    <p className="font-sans text-sm text-neutral-500">Loading withdrawals...</p>
                                </CardContent>
                            </Card>
                        ) : filteredPayouts.length === 0 ? (
                            <Card className="border border-neutral-200 shadow-sm">
                                <CardContent className="p-8 text-center">
                                    <DollarSign className="w-8 h-8 mx-auto mb-2 text-neutral-300" />
                                    <p className="font-sans text-sm text-neutral-500">No withdrawals found</p>
                                </CardContent>
                            </Card>
                        ) : (
                            filteredPayouts.map((payout) => (
                                <Card key={payout.id} className="border border-neutral-200 shadow-sm">
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <h3 className="font-sans font-semibold text-sm text-neutral-900">
                                                    {payout.vendor?.business_name || 'Unknown Vendor'}
                                                </h3>
                                                <p className="font-sans text-xs text-neutral-600">
                                                    {payout.bank_name} - {payout.account_number}
                                                </p>
                                            </div>
                                            <span
                                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(
                                                    payout.status
                                                )}`}
                                            >
                                                {getStatusIcon(payout.status)}
                                                {payout.status}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <p className="font-sans text-lg font-bold text-neutral-900">
                                                ₦{payout.amount.toLocaleString()}
                                            </p>
                                            <p className="font-sans text-xs text-neutral-500">
                                                {new Date(payout.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setSelectedPayout(payout)}
                                            className="w-full mt-3 py-2 bg-neutral-100 hover:bg-neutral-200 rounded-lg font-sans text-sm font-medium text-neutral-700 transition-colors"
                                        >
                                            View Details
                                        </button>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>

                    {/* Payout Details Modal */}
                    {selectedPayout && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                            <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="font-heading font-bold text-xl text-neutral-900">
                                            Withdrawal Details
                                        </h2>
                                        <button
                                            onClick={() => setSelectedPayout(null)}
                                            className="p-2 hover:bg-neutral-100 rounded-lg"
                                        >
                                            <XCircle className="w-5 h-5 text-neutral-600" />
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        {/* Vendor Info */}
                                        <div className="p-4 bg-neutral-50 rounded-lg">
                                            <div className="flex items-center gap-3 mb-2">
                                                <Building className="w-5 h-5 text-neutral-500" />
                                                <span className="font-sans font-semibold text-neutral-900">
                                                    {selectedPayout.vendor?.business_name || 'Unknown Vendor'}
                                                </span>
                                            </div>
                                            <p className="font-sans text-xs text-neutral-600 ml-8">
                                                Vendor ID: {selectedPayout.vendor_id}
                                            </p>
                                        </div>

                                        {/* Amount & Status */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="font-sans text-sm font-semibold text-neutral-700">
                                                    Amount
                                                </label>
                                                <p className="font-sans text-2xl text-neutral-900 font-bold">
                                                    ₦{selectedPayout.amount.toLocaleString()}
                                                </p>
                                            </div>
                                            <div>
                                                <label className="font-sans text-sm font-semibold text-neutral-700">
                                                    Status
                                                </label>
                                                <span
                                                    className={`inline-flex items-center gap-1.5 px-3 py-1 mt-1 rounded-full text-xs font-semibold ${getStatusColor(
                                                        selectedPayout.status
                                                    )}`}
                                                >
                                                    {getStatusIcon(selectedPayout.status)}
                                                    {selectedPayout.status}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Bank Details */}
                                        <div className="border-t pt-4">
                                            <h3 className="font-sans text-sm font-semibold text-neutral-700 mb-3">
                                                Bank Details
                                            </h3>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="font-sans text-xs text-neutral-600">Bank</label>
                                                    <p className="font-sans text-sm text-neutral-900">
                                                        {selectedPayout.bank_name || 'N/A'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <label className="font-sans text-xs text-neutral-600">Account Number</label>
                                                    <p className="font-sans text-sm text-neutral-900">
                                                        {selectedPayout.account_number || 'N/A'}
                                                    </p>
                                                </div>
                                                <div className="col-span-2">
                                                    <label className="font-sans text-xs text-neutral-600">Account Name</label>
                                                    <p className="font-sans text-sm text-neutral-900">
                                                        {selectedPayout.account_name || 'N/A'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Transfer Details */}
                                        <div className="border-t pt-4">
                                            <h3 className="font-sans text-sm font-semibold text-neutral-700 mb-3">
                                                Transfer Details
                                            </h3>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="font-sans text-xs text-neutral-600">Reference</label>
                                                    <p className="font-sans text-xs text-neutral-900 font-mono">
                                                        {selectedPayout.transfer_reference || 'N/A'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <label className="font-sans text-xs text-neutral-600">Requested</label>
                                                    <p className="font-sans text-sm text-neutral-900">
                                                        {new Date(selectedPayout.created_at).toLocaleString()}
                                                    </p>
                                                </div>
                                                {selectedPayout.completed_at && (
                                                    <div>
                                                        <label className="font-sans text-xs text-neutral-600">Completed</label>
                                                        <p className="font-sans text-sm text-green-700">
                                                            {new Date(selectedPayout.completed_at).toLocaleString()}
                                                        </p>
                                                    </div>
                                                )}
                                                {selectedPayout.failed_at && (
                                                    <div className="col-span-2">
                                                        <label className="font-sans text-xs text-neutral-600">Failed</label>
                                                        <p className="font-sans text-sm text-red-600">
                                                            {new Date(selectedPayout.failed_at).toLocaleString()}
                                                        </p>
                                                        {selectedPayout.failure_reason && (
                                                            <p className="font-sans text-xs text-red-500 mt-1">
                                                                Reason: {selectedPayout.failure_reason}
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
