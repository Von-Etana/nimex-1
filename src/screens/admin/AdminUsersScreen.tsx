import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Search, Filter, MoreVertical, Ban, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface User {
  id: string;
  full_name: string;
  email: string;
  user_type: string;
  created_at: string;
  status: 'active' | 'suspended';
}

export const AdminUsersScreen: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'buyer' | 'vendor'>('all');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, user_type, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const usersWithStatus = (data || []).map((user) => ({
        ...user,
        status: 'active' as const,
      }));

      setUsers(usersWithStatus);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'all' || user.user_type === filterType;
    return matchesSearch && matchesFilter;
  });

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
                View and manage all platform users
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button className="bg-green-700 hover:bg-green-800 text-white px-4 py-2">
                Export Users
              </Button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search users by name or email..."
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
            </div>
          </div>

          <div className="hidden md:block">
            <Card className="border border-neutral-200 shadow-sm">
              <CardContent className="p-0">
                <table className="w-full">
                  <thead className="bg-neutral-50 border-b border-neutral-200">
                    <tr>
                      <th className="text-left px-6 py-4 font-sans text-sm font-semibold text-neutral-700">
                        Name
                      </th>
                      <th className="text-left px-6 py-4 font-sans text-sm font-semibold text-neutral-700">
                        Email
                      </th>
                      <th className="text-left px-6 py-4 font-sans text-sm font-semibold text-neutral-700">
                        Type
                      </th>
                      <th className="text-left px-6 py-4 font-sans text-sm font-semibold text-neutral-700">
                        Joined
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
                          Loading users...
                        </td>
                      </tr>
                    ) : filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-neutral-500">
                          No users found
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => (
                        <tr
                          key={user.id}
                          className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors"
                        >
                          <td className="px-6 py-4 font-sans text-sm text-neutral-900 font-medium">
                            {user.full_name || 'N/A'}
                          </td>
                          <td className="px-6 py-4 font-sans text-sm text-neutral-700">
                            {user.email}
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                              {user.user_type || 'buyer'}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-sans text-sm text-neutral-700">
                            {new Date(user.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                user.status === 'active'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {user.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <button className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
                              <MoreVertical className="w-5 h-5 text-neutral-600" />
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

          <div className="md:hidden space-y-3">
            {loading ? (
              <Card className="border border-neutral-200 shadow-sm">
                <CardContent className="p-8 text-center">
                  <p className="font-sans text-sm text-neutral-500">Loading users...</p>
                </CardContent>
              </Card>
            ) : filteredUsers.length === 0 ? (
              <Card className="border border-neutral-200 shadow-sm">
                <CardContent className="p-8 text-center">
                  <p className="font-sans text-sm text-neutral-500">No users found</p>
                </CardContent>
              </Card>
            ) : (
              filteredUsers.map((user) => (
                <Card key={user.id} className="border border-neutral-200 shadow-sm">
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-sans font-semibold text-sm text-neutral-900">
                          {user.full_name || 'N/A'}
                        </h3>
                        <p className="font-sans text-xs text-neutral-600">{user.email}</p>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          user.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {user.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-neutral-200">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                          {user.user_type || 'buyer'}
                        </span>
                        <span className="text-xs text-neutral-500">
                          {new Date(user.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <button className="p-1 hover:bg-neutral-100 rounded">
                        <MoreVertical className="w-4 h-4 text-neutral-600" />
                      </button>
                    </div>
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
