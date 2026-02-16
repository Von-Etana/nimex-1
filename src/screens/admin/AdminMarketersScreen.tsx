import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { FirestoreService } from '../../services/firestore.service';
import { Users, Check, X, Eye, DollarSign } from 'lucide-react';

interface Marketer {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  business_name: string | null;
  referral_code: string;
  status: string;
  total_referrals: number;
  total_commission_earned: number;
  created_at: string;
}

export const AdminMarketersScreen: React.FC = () => {
  const [marketers, setMarketers] = useState<Marketer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'active' | 'suspended'>('all');

  useEffect(() => {
    loadMarketers();
  }, [filter]);

  const loadMarketers = async () => {
    setLoading(true);
    try {
      let options: any = {
        orderBy: { field: 'created_at', direction: 'desc' }
      };

      if (filter !== 'all') {
        options.filters = [{ field: 'status', operator: '==', value: filter }];
      }

      const marketersData = await FirestoreService.getDocuments<Marketer>('marketers', options);
      setMarketers(marketersData || []);
    } catch (error) {
      console.error('Error loading marketers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveMarketer = async (marketerId: string) => {
    try {
      await FirestoreService.updateDocument('marketers', marketerId, {
        status: 'active',
        approved_at: new Date().toISOString(),
      });
      loadMarketers();
    } catch (error) {
      console.error('Error approving marketer:', error);
    }
  };

  const handleRejectMarketer = async (marketerId: string) => {
    try {
      await FirestoreService.updateDocument('marketers', marketerId, { status: 'inactive' });
      loadMarketers();
    } catch (error) {
      console.error('Error rejecting marketer:', error);
    }
  };

  const handleSuspendMarketer = async (marketerId: string) => {
    try {
      await FirestoreService.updateDocument('marketers', marketerId, { status: 'suspended' });
      loadMarketers();
    } catch (error) {
      console.error('Error suspending marketer:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      case 'inactive':
        return 'bg-neutral-100 text-neutral-800';
      default:
        return 'bg-neutral-100 text-neutral-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading marketers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-neutral-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="font-heading font-bold text-2xl md:text-3xl text-neutral-900 mb-2">
            Marketer Management
          </h1>
          <p className="font-sans text-neutral-600">
            Manage marketer registrations, approvals, and performance
          </p>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto">
          {['all', 'pending', 'active', 'suspended'].map((status) => (
            <Button
              key={status}
              onClick={() => setFilter(status as any)}
              variant={filter === status ? 'default' : 'outline'}
              className={filter === status ? 'bg-primary-500 text-white' : ''}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>

        <Card className="border border-neutral-200 shadow-sm">
          <CardContent className="p-6">
            {marketers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                <p className="font-sans text-neutral-600 mb-2">No marketers found</p>
                <p className="font-sans text-sm text-neutral-500">
                  {filter === 'pending'
                    ? 'There are no pending marketer applications'
                    : 'No marketers match the selected filter'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-neutral-50 border-b border-neutral-200">
                    <tr>
                      <th className="text-left px-4 py-3 font-sans text-sm font-semibold text-neutral-700">
                        Marketer
                      </th>
                      <th className="text-left px-4 py-3 font-sans text-sm font-semibold text-neutral-700">
                        Referral Code
                      </th>
                      <th className="text-left px-4 py-3 font-sans text-sm font-semibold text-neutral-700">
                        Status
                      </th>
                      <th className="text-left px-4 py-3 font-sans text-sm font-semibold text-neutral-700">
                        Referrals
                      </th>
                      <th className="text-left px-4 py-3 font-sans text-sm font-semibold text-neutral-700">
                        Commission Earned
                      </th>
                      <th className="text-left px-4 py-3 font-sans text-sm font-semibold text-neutral-700">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {marketers.map((marketer) => (
                      <tr
                        key={marketer.id}
                        className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-sans text-sm font-medium text-neutral-900">
                              {marketer.full_name}
                            </p>
                            <p className="font-sans text-xs text-neutral-500">{marketer.email}</p>
                            {marketer.business_name && (
                              <p className="font-sans text-xs text-neutral-500">
                                {marketer.business_name}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <code className="font-mono text-sm text-primary-600 bg-primary-50 px-2 py-1 rounded">
                            {marketer.referral_code}
                          </code>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                              marketer.status
                            )}`}
                          >
                            {marketer.status.charAt(0).toUpperCase() + marketer.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-sans text-sm text-neutral-900">
                          {marketer.total_referrals}
                        </td>
                        <td className="px-4 py-3 font-sans text-sm text-neutral-900">
                          ₦{marketer.total_commission_earned.toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {marketer.status === 'pending' && (
                              <>
                                <Button
                                  onClick={() => handleApproveMarketer(marketer.id)}
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                  <Check className="w-4 h-4" />
                                </Button>
                                <Button
                                  onClick={() => handleRejectMarketer(marketer.id)}
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 border-red-600 hover:bg-red-50"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                            {marketer.status === 'active' && (
                              <Button
                                onClick={() => handleSuspendMarketer(marketer.id)}
                                size="sm"
                                variant="outline"
                                className="text-red-600 border-red-600 hover:bg-red-50"
                              >
                                Suspend
                              </Button>
                            )}
                            {marketer.status === 'suspended' && (
                              <Button
                                onClick={() => handleApproveMarketer(marketer.id)}
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                Reactivate
                              </Button>
                            )}
                          </div>
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
