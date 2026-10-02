import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Search, Eye, CheckCircle, XCircle, AlertTriangle, MessageSquare, Loader2, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { FirestoreService } from '../../services/firestore.service';
import { orderService } from '../../services/orderService';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { logger } from '../../lib/logger';
import { COLLECTIONS } from '../../lib/collections';

interface Dispute {
  id: string;
  order_id: string;
  filed_by_type: 'buyer' | 'vendor';
  dispute_type: string;
  description: string;
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  resolution?: string;
  resolution_outcome?: 'refund_buyer' | 'release_vendor' | 'closed_no_action';
  evidence_urls?: string[];
  resolved_by?: string;
  created_at: string;
  resolved_at?: string;
  order?: {
    order_number: string;
    buyer_id: string;
    vendor_id: string;
    total_amount: number;
  };
  profiles?: {
    full_name: string;
    email: string;
  };
  vendors?: {
    business_name: string;
  };
}

export const AdminDisputesScreen: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'investigating' | 'resolved' | 'closed'>('all');
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [resolution, setResolution] = useState('');
  const [resolutionOutcome, setResolutionOutcome] = useState<'refund_buyer' | 'release_vendor' | 'closed_no_action'>('refund_buyer');

  useEffect(() => {
    loadDisputes();
  }, []);

  const loadDisputes = async () => {
    try {
      setLoading(true);
      logger.info('Loading disputes');

      const disputesData = await FirestoreService.getDocuments<any>('disputes', {
        orderBy: { field: 'created_at', direction: 'desc' }
      });

      if (!disputesData || disputesData.length === 0) {
        setDisputes([]);
        return;
      }

      // Collect IDs for related data
      const orderIds = Array.from(new Set(disputesData.map(d => d.order_id).filter(Boolean)));
      const filedByIds = Array.from(new Set(disputesData.map(d => d.filed_by).filter(Boolean)));

      const ordersMap = new Map();
      const profilesMap = new Map();
      const vendorsMap = new Map();

      // Fetch Orders
      if (orderIds.length > 0) {
        const allOrders = await FirestoreService.getDocuments('orders');
        allOrders.forEach(o => ordersMap.set(o.id, o));

        // From orders, get vendor IDs
        const vendorIds = Array.from(new Set(Array.from(ordersMap.values()).map((o: any) => o.vendor_id).filter(Boolean)));

        if (vendorIds.length > 0) {
          const allVendors = await FirestoreService.getDocuments('vendors');
          allVendors.forEach(v => vendorsMap.set(v.id, v));
        }
      }

      // Fetch Profiles (filed_by)
      if (filedByIds.length > 0) {
        const allProfiles = await FirestoreService.getDocuments('profiles');
        allProfiles.forEach(p => profilesMap.set(p.id, p));
      }

      const mappedDisputes = disputesData.map((d: any) => {
        const order = ordersMap.get(d.order_id);
        const vendor = order ? vendorsMap.get(order.vendor_id) : undefined;
        const profile = profilesMap.get(d.filed_by);

        return {
          ...d,
          order: order ? {
            order_number: order.order_number,
            buyer_id: order.buyer_id,
            vendor_id: order.vendor_id,
            total_amount: order.total_amount
          } : undefined,
          profiles: profile ? {
            full_name: profile.full_name,
            email: profile.email
          } : undefined,
          vendors: vendor ? {
            business_name: vendor.business_name
          } : undefined
        };
      });

      setDisputes(mappedDisputes);
    } catch (error) {
      logger.error('Error loading disputes', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (disputeId: string, newStatus: Dispute['status']) => {
    try {
      setActionLoading(disputeId);
      logger.info(`Updating dispute ${disputeId} status to ${newStatus}`);

      await FirestoreService.updateDocument('disputes', disputeId, {
        status: newStatus,
        updated_at: new Date().toISOString()
      });

      setDisputes(prev => prev.map(d =>
        d.id === disputeId ? { ...d, status: newStatus } : d
      ));

      if (selectedDispute && selectedDispute.id === disputeId) {
        setSelectedDispute(prev => prev ? { ...prev, status: newStatus } : null);
      }

      toast.success(`Dispute marked as ${newStatus}.`);
    } catch (err: any) {
      logger.error('Failed to update dispute status', err);
      toast.error(err.message || 'Could not update status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleResolveDispute = async (disputeId: string) => {
    if (!resolution.trim() || !selectedDispute) return;

    try {
      setActionLoading(disputeId);
      logger.info(`Resolving dispute: ${disputeId} with outcome: ${resolutionOutcome}`);

      // 1. Process escrow release or refund if financial outcome
      if (resolutionOutcome === 'refund_buyer' && selectedDispute.order_id) {
        try {
          await orderService.refundEscrow(selectedDispute.order_id, resolution.trim());
        } catch (apiErr) {
          logger.warn('orderService.refundEscrow API error, falling back to direct Firestore update', apiErr);
          await FirestoreService.updateDocument(COLLECTIONS.ORDERS, selectedDispute.order_id, {
            status: 'refunded',
            dispute_status: 'resolved_refunded'
          });
        }
      } else if (resolutionOutcome === 'release_vendor' && selectedDispute.order_id) {
        try {
          await orderService.releaseEscrow({
            orderId: selectedDispute.order_id,
            releaseType: 'dispute_resolution',
            releaseBy: user?.uid || 'admin',
            notes: resolution.trim()
          });
        } catch (apiErr) {
          logger.warn('orderService.releaseEscrow API error, falling back to direct Firestore update', apiErr);
          await FirestoreService.updateDocument(COLLECTIONS.ORDERS, selectedDispute.order_id, {
            status: 'completed',
            dispute_status: 'resolved_released'
          });
        }
      }

      // 2. Mark Dispute doc resolved
      const resolvedAt = new Date().toISOString();
      await FirestoreService.updateDocument('disputes', disputeId, {
        status: 'resolved',
        resolution: resolution.trim(),
        resolution_outcome: resolutionOutcome,
        resolved_by: user?.uid || 'admin',
        resolved_at: resolvedAt
      });

      // Update local state
      setDisputes(prev => prev.map(d =>
        d.id === disputeId ? {
          ...d,
          status: 'resolved',
          resolution: resolution.trim(),
          resolution_outcome: resolutionOutcome,
          resolved_at: resolvedAt
        } : d
      ));

      toast.success(`Dispute resolved with outcome: ${resolutionOutcome.replace(/_/g, ' ')}.`);

      setSelectedDispute(null);
      setResolution('');
      logger.info(`Dispute ${disputeId} resolved successfully`);
    } catch (error: any) {
      logger.error('Error resolving dispute', error);
      toast.error(error.message || 'Failed to resolve dispute');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredDisputes = disputes.filter((dispute) => {
    const matchesSearch =
      dispute.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dispute.order?.order_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dispute.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dispute.vendors?.business_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || dispute.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: Dispute['status']) => {
    switch (status) {
      case 'open':
        return 'bg-red-100 text-red-700';
      case 'investigating':
        return 'bg-yellow-100 text-yellow-700';
      case 'resolved':
        return 'bg-green-100 text-green-700';
      case 'closed':
        return 'bg-neutral-100 text-neutral-700';
      default:
        return 'bg-neutral-100 text-neutral-700';
    }
  };

  const getDisputeTypeLabel = (type: string) => {
    const labels = {
      non_delivery: 'Non-Delivery',
      wrong_item: 'Wrong Item',
      damaged_item: 'Damaged Item',
      quality_issue: 'Quality Issue',
      other: 'Other'
    };
    return labels[type as keyof typeof labels] || type;
  };

  return (
    <div className="w-full min-h-screen bg-neutral-50">
      <div className="w-full max-w-7xl mx-auto px-3 md:px-6 py-4 md:py-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="font-heading font-bold text-2xl md:text-3xl text-neutral-900">
                Dispute Management
              </h1>
              <p className="font-sans text-sm text-neutral-600 mt-1">
                Review and resolve disputes between buyers and sellers
              </p>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <Card className="border border-neutral-200 shadow-sm">
                <CardContent className="p-3">
                  <p className="font-sans text-xs text-neutral-600 mb-1">Open</p>
                  <p className="font-heading font-bold text-lg text-red-600">
                    {disputes.filter((d) => d.status === 'open').length}
                  </p>
                </CardContent>
              </Card>
              <Card className="border border-neutral-200 shadow-sm">
                <CardContent className="p-3">
                  <p className="font-sans text-xs text-neutral-600 mb-1">Investigating</p>
                  <p className="font-heading font-bold text-lg text-yellow-600">
                    {disputes.filter((d) => d.status === 'investigating').length}
                  </p>
                </CardContent>
              </Card>
              <Card className="border border-neutral-200 shadow-sm">
                <CardContent className="p-3">
                  <p className="font-sans text-xs text-neutral-600 mb-1">Resolved</p>
                  <p className="font-heading font-bold text-lg text-green-600">
                    {disputes.filter((d) => d.status === 'resolved').length}
                  </p>
                </CardContent>
              </Card>
              <Card className="border border-neutral-200 shadow-sm">
                <CardContent className="p-3">
                  <p className="font-sans text-xs text-neutral-600 mb-1">Closed</p>
                  <p className="font-heading font-bold text-lg text-neutral-600">
                    {disputes.filter((d) => d.status === 'closed').length}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search disputes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg font-sans text-sm focus:outline-none focus:ring-2 focus:ring-green-700"
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto">
              {['all', 'open', 'investigating', 'resolved', 'closed'].map((status) => (
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

          <div className="hidden md:block">
            <Card className="border border-neutral-200 shadow-sm">
              <CardContent className="p-0">
                <table className="w-full">
                  <thead className="bg-neutral-50 border-b border-neutral-200">
                    <tr>
                      <th className="text-left px-6 py-4 font-sans text-sm font-semibold text-neutral-700">
                        Order
                      </th>
                      <th className="text-left px-6 py-4 font-sans text-sm font-semibold text-neutral-700">
                        Filed By
                      </th>
                      <th className="text-left px-6 py-4 font-sans text-sm font-semibold text-neutral-700">
                        Type
                      </th>
                      <th className="text-left px-6 py-4 font-sans text-sm font-semibold text-neutral-700">
                        Description
                      </th>
                      <th className="text-left px-6 py-4 font-sans text-sm font-semibold text-neutral-700">
                        Status
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
                          Loading disputes...
                        </td>
                      </tr>
                    ) : filteredDisputes.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-neutral-500">
                          No disputes found
                        </td>
                      </tr>
                    ) : (
                      filteredDisputes.map((dispute) => (
                        <tr
                          key={dispute.id}
                          className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors"
                        >
                          <td className="px-6 py-4 font-sans text-sm text-neutral-900 font-medium">
                            {dispute.order?.order_number || 'N/A'}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="font-sans text-sm text-neutral-900 font-medium">
                                {dispute.filed_by_type === 'buyer' ? 'Buyer' : 'Vendor'}
                              </span>
                              <span className="font-sans text-xs text-neutral-600">
                                {dispute.filed_by_type === 'buyer'
                                  ? dispute.profiles?.full_name
                                  : dispute.vendors?.business_name}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-sans text-sm text-neutral-700">
                            {getDisputeTypeLabel(dispute.dispute_type)}
                          </td>
                          <td className="px-6 py-4">
                            <div className="max-w-xs">
                              <p className="font-sans text-sm text-neutral-700 truncate">
                                {dispute.description}
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                                dispute.status
                              )}`}
                            >
                              {dispute.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setSelectedDispute(dispute)}
                                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                                title="View details"
                              >
                                <Eye className="w-5 h-5 text-neutral-600" />
                              </button>
                              {dispute.status === 'open' && (
                                <button
                                  onClick={() => handleUpdateStatus(dispute.id, 'investigating')}
                                  className="p-2 hover:bg-yellow-100 rounded-lg transition-colors"
                                  title="Mark as Investigating"
                                >
                                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                                </button>
                              )}
                              {dispute.status === 'investigating' && (
                                <button
                                  onClick={() => handleUpdateStatus(dispute.id, 'open')}
                                  className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                                  title="Revert to Open"
                                >
                                  <AlertTriangle className="w-5 h-5 text-blue-600" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>

          {/* Mobile Disputes List */}
          <div className="md:hidden space-y-3">
            {loading ? (
              <div className="p-8 text-center text-neutral-500 font-sans text-sm">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary-600" />
                Loading disputes...
              </div>
            ) : filteredDisputes.length === 0 ? (
              <div className="p-8 text-center text-neutral-500 font-sans text-sm bg-white rounded-lg border border-neutral-200">
                No disputes found
              </div>
            ) : (
              filteredDisputes.map(dispute => (
                <Card key={dispute.id} className="border border-neutral-200 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-heading font-semibold text-sm text-neutral-900">
                        {dispute.order?.order_number || 'Order N/A'}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(dispute.status)}`}>
                        {dispute.status}
                      </span>
                    </div>
                    <div className="text-xs text-neutral-600 space-y-1 mb-3">
                      <p>
                        <span className="font-medium text-neutral-800">Filed by:</span>{' '}
                        {dispute.filed_by_type === 'buyer' ? (dispute.profiles?.full_name || 'Buyer') : (dispute.vendors?.business_name || 'Vendor')}
                      </p>
                      <p>
                        <span className="font-medium text-neutral-800">Issue:</span> {getDisputeTypeLabel(dispute.dispute_type)}
                      </p>
                      <p className="line-clamp-2 text-neutral-700">
                        {dispute.description}
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
                      <span className="font-sans text-xs font-semibold text-neutral-900">
                        ₦{dispute.order?.total_amount?.toLocaleString() || '0'}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedDispute(dispute)}
                        className="text-xs"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        Review
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Dispute Details Modal */}
          {selectedDispute && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-heading font-bold text-xl text-neutral-900">
                      Dispute Arbitration
                    </h2>
                    <button
                      onClick={() => setSelectedDispute(null)}
                      className="p-2 hover:bg-neutral-100 rounded-lg"
                    >
                      <XCircle className="w-5 h-5 text-neutral-600" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 bg-neutral-50 p-3 rounded-lg border border-neutral-200">
                      <div>
                        <label className="font-sans text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                          Order Number
                        </label>
                        <p className="font-sans text-sm font-bold text-neutral-900">
                          {selectedDispute.order?.order_number || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <label className="font-sans text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                          Escrow Amount
                        </label>
                        <p className="font-sans text-sm font-bold text-primary-700">
                          ₦{selectedDispute.order?.total_amount?.toLocaleString() || 'N/A'}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="font-sans text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                          Filed By
                        </label>
                        <p className="font-sans text-sm text-neutral-900 font-medium">
                          {selectedDispute.filed_by_type === 'buyer' ? 'Buyer' : 'Vendor'}: {' '}
                          {selectedDispute.filed_by_type === 'buyer'
                            ? selectedDispute.profiles?.full_name
                            : selectedDispute.vendors?.business_name}
                        </p>
                      </div>
                      <div>
                        <label className="font-sans text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                          Dispute Type
                        </label>
                        <p className="font-sans text-sm text-neutral-900 font-medium">
                          {getDisputeTypeLabel(selectedDispute.dispute_type)}
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="font-sans text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                        Description / Claim
                      </label>
                      <p className="font-sans text-sm text-neutral-800 mt-1 p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                        {selectedDispute.description}
                      </p>
                    </div>

                    {/* Evidence Gallery */}
                    {selectedDispute.evidence_urls && selectedDispute.evidence_urls.length > 0 && (
                      <div>
                        <label className="font-sans text-xs font-semibold text-neutral-500 uppercase tracking-wider block mb-2">
                          Evidence Uploaded ({selectedDispute.evidence_urls.length} files)
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {selectedDispute.evidence_urls.map((url, i) => (
                            <a
                              key={i}
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="group relative rounded-lg border border-neutral-200 overflow-hidden bg-neutral-100 block aspect-video shadow-sm"
                            >
                              <img
                                src={url}
                                alt={`Evidence #${i + 1}`}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                              <div className="absolute inset-0 bg-neutral-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-medium gap-1">
                                <span>Inspect Full</span>
                                <ExternalLink className="w-3 h-3" />
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedDispute.status === 'open' || selectedDispute.status === 'investigating' ? (
                      <div className="border-t pt-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <label className="font-sans text-sm font-semibold text-neutral-800">
                            Arbitration Ruling & Action
                          </label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUpdateStatus(
                              selectedDispute.id,
                              selectedDispute.status === 'open' ? 'investigating' : 'open'
                            )}
                            className="text-xs text-yellow-700 hover:bg-yellow-50"
                          >
                            {selectedDispute.status === 'open' ? 'Mark Investigating' : 'Revert to Open'}
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <label className={`p-3 border rounded-lg cursor-pointer text-xs transition-colors ${
                            resolutionOutcome === 'refund_buyer' ? 'border-green-600 bg-green-50 ring-1 ring-green-600' : 'border-neutral-200 hover:bg-neutral-50'
                          }`}>
                            <input
                              type="radio"
                              name="outcome"
                              value="refund_buyer"
                              checked={resolutionOutcome === 'refund_buyer'}
                              onChange={() => setResolutionOutcome('refund_buyer')}
                              className="sr-only"
                            />
                            <p className="font-bold text-neutral-900">Refund Buyer</p>
                            <p className="text-neutral-500 mt-0.5">Return escrow to buyer</p>
                          </label>

                          <label className={`p-3 border rounded-lg cursor-pointer text-xs transition-colors ${
                            resolutionOutcome === 'release_vendor' ? 'border-green-600 bg-green-50 ring-1 ring-green-600' : 'border-neutral-200 hover:bg-neutral-50'
                          }`}>
                            <input
                              type="radio"
                              name="outcome"
                              value="release_vendor"
                              checked={resolutionOutcome === 'release_vendor'}
                              onChange={() => setResolutionOutcome('release_vendor')}
                              className="sr-only"
                            />
                            <p className="font-bold text-neutral-900">Release to Vendor</p>
                            <p className="text-neutral-500 mt-0.5">Disburse escrow to vendor</p>
                          </label>

                          <label className={`p-3 border rounded-lg cursor-pointer text-xs transition-colors ${
                            resolutionOutcome === 'closed_no_action' ? 'border-green-600 bg-green-50 ring-1 ring-green-600' : 'border-neutral-200 hover:bg-neutral-50'
                          }`}>
                            <input
                              type="radio"
                              name="outcome"
                              value="closed_no_action"
                              checked={resolutionOutcome === 'closed_no_action'}
                              onChange={() => setResolutionOutcome('closed_no_action')}
                              className="sr-only"
                            />
                            <p className="font-bold text-neutral-900">Close Case</p>
                            <p className="text-neutral-500 mt-0.5">Mutual settlement / no payout</p>
                          </label>
                        </div>

                        <div>
                          <label className="font-sans text-xs font-semibold text-neutral-700 block mb-1">
                            Ruling Rationale & Explanatory Notes *
                          </label>
                          <textarea
                            value={resolution}
                            onChange={(e) => setResolution(e.target.value)}
                            placeholder="State rationale for ruling and settlement details..."
                            className="w-full p-3 border border-neutral-200 rounded-lg font-sans text-sm focus:outline-none focus:ring-2 focus:ring-green-700"
                            rows={3}
                          />
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                          <Button
                            onClick={() => setSelectedDispute(null)}
                            variant="outline"
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={() => handleResolveDispute(selectedDispute.id)}
                            disabled={!resolution.trim() || actionLoading === selectedDispute.id}
                            className="bg-green-700 hover:bg-green-800 text-white"
                          >
                            {actionLoading === selectedDispute.id ? (
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                              <CheckCircle className="w-4 h-4 mr-2" />
                            )}
                            Execute Ruling & Close Dispute
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="border-t pt-4">
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <span className="font-sans text-sm font-semibold text-green-900 block">
                              This dispute has been resolved
                            </span>
                            {selectedDispute.resolution_outcome && (
                              <p className="font-sans text-xs text-green-800 mt-0.5">
                                Final Outcome: <span className="font-bold capitalize">{selectedDispute.resolution_outcome.replace(/_/g, ' ')}</span>
                              </p>
                            )}
                            {selectedDispute.resolution && (
                              <p className="font-sans text-xs text-neutral-700 mt-2 bg-white/80 p-2.5 rounded border border-green-200">
                                {selectedDispute.resolution}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
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