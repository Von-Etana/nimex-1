import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Search, Eye, CheckCircle, XCircle, AlertTriangle, MessageSquare, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { logger } from '../../lib/logger';

interface Dispute {
  id: string;
  order_id: string;
  filed_by_type: 'buyer' | 'vendor';
  dispute_type: string;
  description: string;
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  resolution?: string;
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
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'investigating' | 'resolved' | 'closed'>('all');
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [resolution, setResolution] = useState('');

  useEffect(() => {
    loadDisputes();
  }, []);

  const loadDisputes = async () => {
    try {
      setLoading(true);
      logger.info('Loading disputes');

      const { data, error } = await (supabase
        .from('disputes') as any)
        .select(`
          *,
          orders:order_id (
            order_number,
            buyer_id,
            vendor_id,
            total_amount
          ),
          profiles:filed_by (
            full_name,
            email
          ),
          vendors!orders(vendor_id) (
            business_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error loading disputes', error);
        return;
      }

      setDisputes(data || []);
    } catch (error) {
      logger.error('Error loading disputes', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveDispute = async (disputeId: string) => {
    if (!resolution.trim()) return;

    try {
      setActionLoading(disputeId);
      logger.info(`Resolving dispute: ${disputeId}`);

      const { error } = await (supabase
        .from('disputes') as any)
        .update({
          status: 'resolved',
          resolution: resolution.trim(),
          resolved_at: new Date().toISOString()
        })
        .eq('id', disputeId);

      if (error) {
        logger.error('Error resolving dispute', error);
        return;
      }

      // Update local state
      setDisputes(disputes.map(d =>
        d.id === disputeId ? {
          ...d,
          status: 'resolved',
          resolution: resolution.trim(),
          resolved_at: new Date().toISOString()
        } : d
      ));

      setSelectedDispute(null);
      setResolution('');
      logger.info(`Dispute ${disputeId} resolved successfully`);
    } catch (error) {
      logger.error('Error resolving dispute', error);
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
                  className={`px-4 py-2 rounded-lg font-sans text-sm font-medium transition-colors whitespace-nowrap ${
                    filterStatus === status
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
                                  onClick={() => {
                                    const newStatus = dispute.status === 'open' ? 'investigating' : 'open';
                                    // Update status logic would go here
                                  }}
                                  className="p-2 hover:bg-yellow-100 rounded-lg transition-colors"
                                  title="Start investigation"
                                >
                                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
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

          {/* Dispute Details Modal */}
          {selectedDispute && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-heading font-bold text-xl text-neutral-900">
                      Dispute Details
                    </h2>
                    <button
                      onClick={() => setSelectedDispute(null)}
                      className="p-2 hover:bg-neutral-100 rounded-lg"
                    >
                      <XCircle className="w-5 h-5 text-neutral-600" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="font-sans text-sm font-semibold text-neutral-700">
                          Order Number
                        </label>
                        <p className="font-sans text-sm text-neutral-900">
                          {selectedDispute.order?.order_number || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <label className="font-sans text-sm font-semibold text-neutral-700">
                          Amount
                        </label>
                        <p className="font-sans text-sm text-neutral-900">
                          ₦{selectedDispute.order?.total_amount?.toLocaleString() || 'N/A'}
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="font-sans text-sm font-semibold text-neutral-700">
                        Filed By
                      </label>
                      <p className="font-sans text-sm text-neutral-900">
                        {selectedDispute.filed_by_type === 'buyer' ? 'Buyer' : 'Vendor'}: {' '}
                        {selectedDispute.filed_by_type === 'buyer'
                          ? selectedDispute.profiles?.full_name
                          : selectedDispute.vendors?.business_name}
                      </p>
                    </div>

                    <div>
                      <label className="font-sans text-sm font-semibold text-neutral-700">
                        Dispute Type
                      </label>
                      <p className="font-sans text-sm text-neutral-900">
                        {getDisputeTypeLabel(selectedDispute.dispute_type)}
                      </p>
                    </div>

                    <div>
                      <label className="font-sans text-sm font-semibold text-neutral-700">
                        Description
                      </label>
                      <p className="font-sans text-sm text-neutral-900 mt-1">
                        {selectedDispute.description}
                      </p>
                    </div>

                    {selectedDispute.resolution && (
                      <div>
                        <label className="font-sans text-sm font-semibold text-neutral-700">
                          Resolution
                        </label>
                        <p className="font-sans text-sm text-neutral-900 mt-1">
                          {selectedDispute.resolution}
                        </p>
                      </div>
                    )}

                    {selectedDispute.status === 'open' || selectedDispute.status === 'investigating' ? (
                      <div className="border-t pt-4">
                        <label className="font-sans text-sm font-semibold text-neutral-700 block mb-2">
                          Resolution
                        </label>
                        <textarea
                          value={resolution}
                          onChange={(e) => setResolution(e.target.value)}
                          placeholder="Enter resolution details..."
                          className="w-full p-3 border border-neutral-200 rounded-lg font-sans text-sm focus:outline-none focus:ring-2 focus:ring-green-700"
                          rows={4}
                        />
                        <div className="flex justify-end gap-2 mt-4">
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
                            Resolve Dispute
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="border-t pt-4">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <span className="font-sans text-sm text-green-700">
                            This dispute has been resolved
                          </span>
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