import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Search, CheckCircle, XCircle, Eye, FileText, Loader2 } from 'lucide-react';
import { FirestoreService } from '../../services/firestore.service';
import { logger } from '../../lib/logger';
import { twilioService } from '../../services/twilioService';
import type { Database } from '../../types/database';

type KYCSubmission = Database['public']['Tables']['kyc_submissions']['Row'] & {
  profiles?: Database['public']['Tables']['profiles']['Row'];
  vendors?: Database['public']['Tables']['vendors']['Row'];
};

interface KYCSubmissionDisplay {
  id: string;
  vendor_name: string;
  business_name: string;
  email: string;
  phone: string;
  document_type: string;
  submitted_date: string;
  status: 'pending' | 'approved' | 'rejected';
}

export const AdminKYCApprovalsScreen: React.FC = () => {
  const [submissions, setSubmissions] = useState<KYCSubmissionDisplay[]>([]);
  const [rawSubmissions, setRawSubmissions] = useState<KYCSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      logger.info('Loading KYC submissions');

      const submissionsData = await FirestoreService.getDocuments<any>('kyc_submissions', {
        orderBy: { field: 'submitted_at', direction: 'desc' }
      });

      if (!submissionsData || submissionsData.length === 0) {
        setRawSubmissions([]);
        setSubmissions([]);
        return;
      }

      setRawSubmissions(submissionsData);

      // Collect unique IDs for fetching related data
      const userIds = Array.from(new Set(submissionsData.map(s => s.user_id).filter(Boolean)));

      // Fetch profiles and vendors
      const profilesMap = new Map();
      const vendorsMap = new Map();

      if (userIds.length > 0) {
        // Fetch profiles
        // Note: In a real app with many users, we'd batch this or fetch individually if needed.
        // For now, fetching all profiles might be heavy if there are thousands, but filtering by IDs is better.
        // Since 'in' limit is 10, we might need to loop or fetch all if list is long.
        // Let's assume for admin dashboard we might fetch all relevant profiles or batch.
        // Simplified approach: Fetch all profiles/vendors for now as we did in other screens, 
        // or loop through chunks of 10.

        // Fetching all for simplicity in migration, optimization can come later
        const allProfiles = await FirestoreService.getDocuments('profiles');
        allProfiles.forEach(p => profilesMap.set(p.id, p));

        const allVendors = await FirestoreService.getDocuments('vendors');
        allVendors.forEach(v => vendorsMap.set(v.user_id, v));
      }

      // Map to display format
      const displayData: KYCSubmissionDisplay[] = submissionsData.map((sub: any) => {
        const profile = profilesMap.get(sub.user_id);
        const vendor = vendorsMap.get(sub.user_id);

        return {
          id: sub.id,
          vendor_name: profile?.full_name || 'Unknown',
          business_name: vendor?.business_name || 'No business name',
          email: profile?.email || 'No email',
          phone: vendor?.business_phone || 'No phone',
          document_type: sub.id_type,
          submitted_date: new Date(sub.submitted_at).toLocaleDateString(),
          status: sub.status
        };
      });

      setSubmissions(displayData);
    } catch (error) {
      logger.error('Error loading KYC submissions', error);
    } finally {
      setLoading(false);
    }
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const filteredSubmissions = submissions.filter((submission) => {
    const matchesSearch =
      submission.vendor_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      submission.business_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      submission.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || submission.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: KYCSubmission['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'approved':
        return 'bg-green-100 text-green-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-neutral-100 text-neutral-700';
    }
  };

  const handleApprove = async (id: string) => {
    try {
      setActionLoading(id);
      logger.info(`Approving KYC submission: ${id}`);

      await FirestoreService.updateDocument('kyc_submissions', id, {
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        admin_notes: 'Approved by admin'
      });

      // Update local state
      setSubmissions(
        submissions.map((sub) => (sub.id === id ? { ...sub, status: 'approved' as const } : sub))
      );

      // Send notification email
      const submission = submissions.find(s => s.id === id);
      if (submission) {
        await twilioService.sendKYCApprovalEmail(submission.email, submission.vendor_name);
      }

      logger.info(`KYC submission ${id} approved successfully`);
    } catch (error) {
      logger.error('Error approving KYC submission', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    try {
      setActionLoading(id);
      logger.info(`Rejecting KYC submission: ${id}`);

      await FirestoreService.updateDocument('kyc_submissions', id, {
        status: 'rejected',
        reviewed_at: new Date().toISOString(),
        admin_notes: 'Rejected by admin'
      });

      // Update local state
      setSubmissions(
        submissions.map((sub) => (sub.id === id ? { ...sub, status: 'rejected' as const } : sub))
      );

      logger.info(`KYC submission ${id} rejected successfully`);
    } catch (error) {
      logger.error('Error rejecting KYC submission', error);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="w-full min-h-screen bg-neutral-50">
      <div className="w-full max-w-7xl mx-auto px-3 md:px-6 py-4 md:py-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="font-heading font-bold text-2xl md:text-3xl text-neutral-900">
                KYC Approvals
              </h1>
              <p className="font-sans text-sm text-neutral-600 mt-1">
                Review and approve vendor KYC submissions
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Card className="border border-neutral-200 shadow-sm">
                <CardContent className="p-3">
                  <p className="font-sans text-xs text-neutral-600 mb-1">Pending</p>
                  <p className="font-heading font-bold text-lg text-yellow-600">
                    {submissions.filter((s) => s.status === 'pending').length}
                  </p>
                </CardContent>
              </Card>
              <Card className="border border-neutral-200 shadow-sm">
                <CardContent className="p-3">
                  <p className="font-sans text-xs text-neutral-600 mb-1">Approved</p>
                  <p className="font-heading font-bold text-lg text-green-600">
                    {submissions.filter((s) => s.status === 'approved').length}
                  </p>
                </CardContent>
              </Card>
              <Card className="border border-neutral-200 shadow-sm">
                <CardContent className="p-3">
                  <p className="font-sans text-xs text-neutral-600 mb-1">Rejected</p>
                  <p className="font-heading font-bold text-lg text-red-600">
                    {submissions.filter((s) => s.status === 'rejected').length}
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
                placeholder="Search KYC submissions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg font-sans text-sm focus:outline-none focus:ring-2 focus:ring-green-700"
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto">
              {['all', 'pending', 'approved', 'rejected'].map((status) => (
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
                        Vendor
                      </th>
                      <th className="text-left px-6 py-4 font-sans text-sm font-semibold text-neutral-700">
                        Business Name
                      </th>
                      <th className="text-left px-6 py-4 font-sans text-sm font-semibold text-neutral-700">
                        Contact
                      </th>
                      <th className="text-left px-6 py-4 font-sans text-sm font-semibold text-neutral-700">
                        Document Type
                      </th>
                      <th className="text-left px-6 py-4 font-sans text-sm font-semibold text-neutral-700">
                        Submitted
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
                    {filteredSubmissions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-neutral-500">
                          No KYC submissions found
                        </td>
                      </tr>
                    ) : (
                      filteredSubmissions.map((submission) => (
                        <tr
                          key={submission.id}
                          className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors"
                        >
                          <td className="px-6 py-4 font-sans text-sm text-neutral-900 font-medium">
                            {submission.vendor_name}
                          </td>
                          <td className="px-6 py-4 font-sans text-sm text-neutral-700">
                            {submission.business_name}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="font-sans text-xs text-neutral-700">
                                {submission.email}
                              </span>
                              <span className="font-sans text-xs text-neutral-500">
                                {submission.phone}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-sans text-sm text-neutral-700">
                            {submission.document_type}
                          </td>
                          <td className="px-6 py-4 font-sans text-sm text-neutral-700">
                            {submission.submitted_date}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                                submission.status
                              )}`}
                            >
                              {submission.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {submission.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleApprove(submission.id)}
                                    className="p-2 hover:bg-green-100 rounded-lg transition-colors"
                                  >
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                  </button>
                                  <button
                                    onClick={() => handleReject(submission.id)}
                                    className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                                  >
                                    <XCircle className="w-5 h-5 text-red-600" />
                                  </button>
                                </>
                              )}
                              <button className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
                                <FileText className="w-5 h-5 text-neutral-600" />
                              </button>
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

          <div className="md:hidden space-y-3">
            {filteredSubmissions.length === 0 ? (
              <Card className="border border-neutral-200 shadow-sm">
                <CardContent className="p-8 text-center">
                  <p className="font-sans text-sm text-neutral-500">No KYC submissions found</p>
                </CardContent>
              </Card>
            ) : (
              filteredSubmissions.map((submission) => (
                <Card key={submission.id} className="border border-neutral-200 shadow-sm">
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-sans font-semibold text-sm text-neutral-900">
                          {submission.vendor_name}
                        </h3>
                        <p className="font-sans text-xs text-neutral-600 mt-0.5">
                          {submission.business_name}
                        </p>
                        <p className="font-sans text-xs text-neutral-500 mt-1">
                          {submission.email}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ml-2 ${getStatusColor(
                          submission.status
                        )}`}
                      >
                        {submission.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 py-3 border-t border-neutral-200 mb-3">
                      <div>
                        <p className="font-sans text-xs text-neutral-600">Document</p>
                        <p className="font-sans text-sm text-neutral-900 mt-0.5">
                          {submission.document_type}
                        </p>
                      </div>
                      <div>
                        <p className="font-sans text-xs text-neutral-600">Submitted</p>
                        <p className="font-sans text-sm text-neutral-900 mt-0.5">
                          {submission.submitted_date}
                        </p>
                      </div>
                    </div>

                    {submission.status === 'pending' ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleApprove(submission.id)}
                          className="flex-1 py-2 bg-green-100 text-green-700 rounded-lg font-sans text-xs font-medium flex items-center justify-center gap-1"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(submission.id)}
                          className="flex-1 py-2 bg-red-100 text-red-700 rounded-lg font-sans text-xs font-medium flex items-center justify-center gap-1"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </button>
                        <button className="p-2 bg-neutral-100 rounded-lg">
                          <FileText className="w-4 h-4 text-neutral-600" />
                        </button>
                      </div>
                    ) : (
                      <button className="w-full py-2 bg-neutral-100 text-neutral-700 rounded-lg font-sans text-xs font-medium flex items-center justify-center gap-1">
                        <FileText className="w-4 h-4" />
                        View Documents
                      </button>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
