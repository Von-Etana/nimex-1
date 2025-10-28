import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Search, CheckCircle, XCircle, Eye } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Listing {
  id: string;
  title: string;
  vendor_name: string;
  category: string;
  price: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export const AdminListingsScreen: React.FC = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  useEffect(() => {
    loadListings();
  }, []);

  const loadListings = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          title,
          category,
          price,
          created_at,
          vendor:vendors(business_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const listingsData = (data || []).map((item: any) => ({
        id: item.id,
        title: item.title,
        vendor_name: item.vendor?.business_name || 'Unknown',
        category: item.category,
        price: item.price,
        status: 'approved' as const,
        created_at: item.created_at,
      }));

      setListings(listingsData);
    } catch (error) {
      console.error('Error loading listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredListings = listings.filter((listing) => {
    const matchesSearch =
      listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.vendor_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || listing.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: Listing['status']) => {
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

  return (
    <div className="w-full min-h-screen bg-neutral-50">
      <div className="w-full max-w-7xl mx-auto px-3 md:px-6 py-4 md:py-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="font-heading font-bold text-2xl md:text-3xl text-neutral-900">
                Moderate Listings
              </h1>
              <p className="font-sans text-sm text-neutral-600 mt-1">
                Review and moderate product listings
              </p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search listings..."
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
                        Listing
                      </th>
                      <th className="text-left px-6 py-4 font-sans text-sm font-semibold text-neutral-700">
                        Vendor
                      </th>
                      <th className="text-left px-6 py-4 font-sans text-sm font-semibold text-neutral-700">
                        Category
                      </th>
                      <th className="text-left px-6 py-4 font-sans text-sm font-semibold text-neutral-700">
                        Price
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
                          Loading listings...
                        </td>
                      </tr>
                    ) : filteredListings.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-neutral-500">
                          No listings found
                        </td>
                      </tr>
                    ) : (
                      filteredListings.map((listing) => (
                        <tr
                          key={listing.id}
                          className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors"
                        >
                          <td className="px-6 py-4 font-sans text-sm text-neutral-900 font-medium">
                            {listing.title}
                          </td>
                          <td className="px-6 py-4 font-sans text-sm text-neutral-700">
                            {listing.vendor_name}
                          </td>
                          <td className="px-6 py-4 font-sans text-sm text-neutral-700">
                            {listing.category}
                          </td>
                          <td className="px-6 py-4 font-sans text-sm text-neutral-900 font-semibold">
                            ₦{listing.price.toLocaleString()}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                                listing.status
                              )}`}
                            >
                              {listing.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button className="p-2 hover:bg-green-100 rounded-lg transition-colors">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                              </button>
                              <button className="p-2 hover:bg-red-100 rounded-lg transition-colors">
                                <XCircle className="w-5 h-5 text-red-600" />
                              </button>
                              <button className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
                                <Eye className="w-5 h-5 text-neutral-600" />
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
            {loading ? (
              <Card className="border border-neutral-200 shadow-sm">
                <CardContent className="p-8 text-center">
                  <p className="font-sans text-sm text-neutral-500">Loading listings...</p>
                </CardContent>
              </Card>
            ) : filteredListings.length === 0 ? (
              <Card className="border border-neutral-200 shadow-sm">
                <CardContent className="p-8 text-center">
                  <p className="font-sans text-sm text-neutral-500">No listings found</p>
                </CardContent>
              </Card>
            ) : (
              filteredListings.map((listing) => (
                <Card key={listing.id} className="border border-neutral-200 shadow-sm">
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-sans font-semibold text-sm text-neutral-900">
                          {listing.title}
                        </h3>
                        <p className="font-sans text-xs text-neutral-600 mt-0.5">
                          {listing.vendor_name} • {listing.category}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ml-2 ${getStatusColor(
                          listing.status
                        )}`}
                      >
                        {listing.status}
                      </span>
                    </div>
                    <p className="font-sans text-base font-bold text-neutral-900 mb-3">
                      ₦{listing.price.toLocaleString()}
                    </p>
                    <div className="flex items-center gap-2">
                      <button className="flex-1 py-2 bg-green-100 text-green-700 rounded-lg font-sans text-xs font-medium">
                        Approve
                      </button>
                      <button className="flex-1 py-2 bg-red-100 text-red-700 rounded-lg font-sans text-xs font-medium">
                        Reject
                      </button>
                      <button className="p-2 bg-neutral-100 rounded-lg">
                        <Eye className="w-4 h-4 text-neutral-600" />
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
