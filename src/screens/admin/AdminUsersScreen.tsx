import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Search, Ban, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface User {
  id: string;
  full_name: string | null;
  email: string;
  role: string;
  created_at: string;
  avatar_url: string | null;
  phone: string | null;
  location: string | null;
}

interface VendorInfo {
  business_name: string;
  verification_status: string;
  is_active: boolean;
}

export const AdminUsersScreen: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [vendors, setVendors] = useState<Map<string, VendorInfo>>(new Map());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'buyer' | 'vendor' | 'admin'>('all');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, [filterType]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (filterType !== 'all') {
        query = query.eq('role', filterType);
      }

      const { data: profilesData, error } = await query;

      if (error) throw error;

      if (profilesData) {
        setUsers(profilesData);

        const vendorIds = profilesData
          .filter(p => p.role === 'vendor')
          .map(p => p.id);

        if (vendorIds.length > 0) {
          const { data: vendorsData } = await supabase
            .from('vendors')
            .select('user_id, business_name, verification_status, is_active')
            .in('user_id', vendorIds);

          if (vendorsData) {
            const vendorMap = new Map<string, VendorInfo>();
            vendorsData.forEach(v => {
              vendorMap.set(v.user_id, {
                business_name: v.business_name,
                verification_status: v.verification_status,
                is_active: v.is_active,
              });
            });
            setVendors(vendorMap);
          }
        }
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuspendUser = async (userId: string) => {
    if (!confirm('Are you sure you want to suspend this user?')) return;

    setActionLoading(true);
    try {
      const user = users.find(u => u.id === userId);
      if (user?.role === 'vendor') {
        await supabase
          .from('vendors')
          .update({ is_active: false })
          .eq('user_id', userId);
      }

      await supabase.from('system_logs').insert({
        level: 'warning',
        source: 'admin',
        event: 'user_suspended',
        message: `User suspended by admin`,
        user_id: userId,
        metadata: { admin_action: true },
      });

      alert('User suspended successfully');
      loadUsers();
    } catch (error) {
      console.error('Error suspending user:', error);
      alert('Failed to suspend user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleActivateUser = async (userId: string) => {
    setActionLoading(true);
    try {
      const user = users.find(u => u.id === userId);
      if (user?.role === 'vendor') {
        await supabase
          .from('vendors')
          .update({ is_active: true })
          .eq('user_id', userId);
      }

      await supabase.from('system_logs').insert({
        level: 'info',
        source: 'admin',
        event: 'user_activated',
        message: `User activated by admin`,
        user_id: userId,
        metadata: { admin_action: true },
      });

      alert('User activated successfully');
      loadUsers();
    } catch (error) {
      console.error('Error activating user:', error);
      alert('Failed to activate user');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendors.get(user.id)?.business_name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-700';
      case 'vendor':
        return 'bg-blue-100 text-blue-700';
      case 'buyer':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-neutral-100 text-neutral-700';
    }
  };

  const getVerificationBadgeColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-neutral-100 text-neutral-700';
    }
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700 mx-auto"></div>
          <p className="mt-4 text-neutral-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-neutral-50">
      <div className="w-full max-w-7xl mx-auto px-3 md:px-6 py-4 md:py-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="font-heading font-bold text-2xl md:text-3xl text-neutral-900">
                Manage Users
              </h1>
              <p className="font-sans text-sm text-neutral-600 mt-1">
                View and manage all platform users ({filteredUsers.length} total)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => {
                  const csv = [
                    ['Name', 'Email', 'Role', 'Created At'],
                    ...filteredUsers.map(u => [
                      u.full_name || '',
                      u.email,
                      u.role,
                      new Date(u.created_at).toLocaleDateString()
                    ])
                  ].map(row => row.join(',')).join('\n');

                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `users_${new Date().toISOString().split('T')[0]}.csv`;
                  a.click();
                }}
                className="bg-green-700 hover:bg-green-800 text-white px-4 py-2"
              >
                Export Users
              </Button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search users by name, email, or business..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg font-sans text-sm focus:outline-none focus:ring-2 focus:ring-green-700"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilterType('all')}
                className={`px-4 py-2 rounded-lg font-sans text-sm font-medium transition-colors ${
                  filterType === 'all'
                    ? 'bg-green-700 text-white'
                    : 'bg-white text-neutral-700 border border-neutral-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterType('buyer')}
                className={`px-4 py-2 rounded-lg font-sans text-sm font-medium transition-colors ${
                  filterType === 'buyer'
                    ? 'bg-green-700 text-white'
                    : 'bg-white text-neutral-700 border border-neutral-200'
                }`}
              >
                Buyers
              </button>
              <button
                onClick={() => setFilterType('vendor')}
                className={`px-4 py-2 rounded-lg font-sans text-sm font-medium transition-colors ${
                  filterType === 'vendor'
                    ? 'bg-green-700 text-white'
                    : 'bg-white text-neutral-700 border border-neutral-200'
                }`}
              >
                Vendors
              </button>
              <button
                onClick={() => setFilterType('admin')}
                className={`px-4 py-2 rounded-lg font-sans text-sm font-medium transition-colors ${
                  filterType === 'admin'
                    ? 'bg-green-700 text-white'
                    : 'bg-white text-neutral-700 border border-neutral-200'
                }`}
              >
                Admins
              </button>
            </div>
          </div>

          <Card className="border border-neutral-200 shadow-sm">
            <CardContent className="p-0">
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-neutral-50 border-b border-neutral-200">
                    <tr>
                      <th className="text-left px-4 py-3 font-sans text-sm font-semibold text-neutral-700">
                        User
                      </th>
                      <th className="text-left px-4 py-3 font-sans text-sm font-semibold text-neutral-700">
                        Email
                      </th>
                      <th className="text-left px-4 py-3 font-sans text-sm font-semibold text-neutral-700">
                        Role
                      </th>
                      <th className="text-left px-4 py-3 font-sans text-sm font-semibold text-neutral-700">
                        Status
                      </th>
                      <th className="text-left px-4 py-3 font-sans text-sm font-semibold text-neutral-700">
                        Joined
                      </th>
                      <th className="text-right px-4 py-3 font-sans text-sm font-semibold text-neutral-700">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => {
                      const vendorInfo = vendors.get(user.id);
                      return (
                        <tr
                          key={user.id}
                          className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                <span className="font-heading font-bold text-green-700">
                                  {user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <p className="font-sans text-sm font-medium text-neutral-900">
                                  {user.full_name || 'No name'}
                                </p>
                                {vendorInfo && (
                                  <p className="font-sans text-xs text-neutral-600">
                                    {vendorInfo.business_name || 'No business name'}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 font-sans text-sm text-neutral-700">
                            {user.email}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getRoleBadgeColor(
                                user.role
                              )}`}
                            >
                              {user.role}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {user.role === 'vendor' && vendorInfo ? (
                              <span
                                className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getVerificationBadgeColor(
                                  vendorInfo.verification_status
                                )}`}
                              >
                                {vendorInfo.is_active ? vendorInfo.verification_status : 'suspended'}
                              </span>
                            ) : (
                              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                                Active
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 font-sans text-sm text-neutral-700">
                            {new Date(user.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-2">
                              {user.role === 'vendor' && vendorInfo && !vendorInfo.is_active ? (
                                <Button
                                  onClick={() => handleActivateUser(user.id)}
                                  disabled={actionLoading}
                                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 text-xs"
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Activate
                                </Button>
                              ) : (
                                <Button
                                  onClick={() => handleSuspendUser(user.id)}
                                  disabled={actionLoading}
                                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 text-xs"
                                >
                                  <Ban className="w-4 h-4 mr-1" />
                                  Suspend
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden space-y-3 p-4">
                {filteredUsers.map((user) => {
                  const vendorInfo = vendors.get(user.id);
                  return (
                    <div
                      key={user.id}
                      className="p-4 border border-neutral-200 rounded-lg bg-white"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="font-heading font-bold text-green-700">
                            {user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="font-sans text-sm font-semibold text-neutral-900">
                            {user.full_name || 'No name'}
                          </p>
                          <p className="font-sans text-xs text-neutral-600">{user.email}</p>
                          {vendorInfo && (
                            <p className="font-sans text-xs text-neutral-600 mt-1">
                              {vendorInfo.business_name || 'No business name'}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getRoleBadgeColor(
                            user.role
                          )}`}
                        >
                          {user.role}
                        </span>
                        {user.role === 'vendor' && vendorInfo && (
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getVerificationBadgeColor(
                              vendorInfo.verification_status
                            )}`}
                          >
                            {vendorInfo.is_active ? vendorInfo.verification_status : 'suspended'}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-sans text-xs text-neutral-600">
                          Joined {new Date(user.created_at).toLocaleDateString()}
                        </span>
                        <div className="flex gap-2">
                          {user.role === 'vendor' && vendorInfo && !vendorInfo.is_active ? (
                            <Button
                              onClick={() => handleActivateUser(user.id)}
                              disabled={actionLoading}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 text-xs"
                            >
                              Activate
                            </Button>
                          ) : (
                            <Button
                              onClick={() => handleSuspendUser(user.id)}
                              disabled={actionLoading}
                              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 text-xs"
                            >
                              Suspend
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredUsers.length === 0 && (
                <div className="p-12 text-center">
                  <p className="font-sans text-neutral-600">No users found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
