import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Search, CheckCircle, XCircle, Eye, Loader2 } from 'lucide-react';
import { FirestoreService } from '../../services/firestore.service';
import { logger } from '../../lib/logger';

interface Listing {
  id: string;
  title: string;
  vendor_name: string;
  category: string;
  price: number;
  status: 'active' | 'inactive' | 'moderation' | 'suspended' | 'pending_review';
  created_at: string;
}

export const AdminListingsScreen: React.FC = () => {
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'moderation' | 'suspended' | 'pending_review'>('all');

  useEffect(() => {
    loadListings();
  }, []);

  const loadListings = async () => {
    try {
      setLoading(true);
      logger.info('Loading product listings');

      const products = await FirestoreService.getDocuments<any>('products', {
        orderBy: { field: 'created_at', direction: 'desc' }
      });

      if (!products) {
        setListings([]);
        return;
      }

      // Fetch vendor details
      // Collect unique vendor IDs
      const vendorIds = Array.from(new Set(products.map(p => p.vendor_id).filter(Boolean)));

      const vendorMap = new Map<string, string>();

      if (vendorIds.length > 0) {
        // Fetch all vendors since we can't filter by document ID using 'in' query
        // The 'id' is the document ID, not a field, so filters: [{ field: 'id', operator: 'in', value: vendorIds }] won't work
        const vendors = await FirestoreService.getDocuments<any>('vendors');

        vendors.forEach(v => {
          vendorMap.set(v.id, v.business_name || 'Unknown Vendor');
        });
      }

      const listingsData = products.map((item: any) => ({
        id: item.id,
        title: item.title,
        vendor_name: vendorMap.get(item.vendor_id) || 'Unknown',
        category: item.category_id || 'Uncategorized', // Note: category might be ID or string in schema, assuming ID or string
        price: item.price,
        status: item.status,
        created_at: item.created_at,
      }));

      setListings(listingsData);
    } catch (error) {
      logger.error('Error loading listings', error);
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
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'inactive':
        return 'bg-neutral-100 text-neutral-700';
      case 'moderation':
        return 'bg-yellow-100 text-yellow-700';
      case 'pending_review':
        return 'bg-orange-100 text-orange-700';
      case 'suspended':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-neutral-100 text-neutral-700';
    }
  };

  const handleApprove = async (id: string) => {
    try {
      setActionLoading(id);
      logger.info(`Approving product listing: ${id}`);

      // Set status to active and is_active to true so product appears on buyer dashboard
      await FirestoreService.updateDocument('products', id, {
        status: 'active',
        is_active: true,
        verification_status: 'approved',
        approved_at: new Date().toISOString()
      });

      // Update local state
      setListings(listings.map(listing =>
        listing.id === id ? { ...listing, status: 'active' } : listing
      ));

      logger.info(`Product listing ${id} approved successfully`);
    } catch (error) {
      logger.error('Error approving product listing', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    try {
      setActionLoading(id);
      logger.info(`Suspending product listing: ${id}`);

      await FirestoreService.updateDocument('products', id, {
        status: 'suspended',
        is_active: false,
        verification_status: 'rejected'
      });

      // Update local state
      setListings(listings.map(listing =>
        listing.id === id ? { ...listing, status: 'suspended' } : listing
      ));

      logger.info(`Product listing ${id} suspended successfully`);
    } catch (error) {
      logger.error('Error suspending product listing', error);
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
              {['all', 'pending_review', 'active', 'inactive', 'moderation', 'suspended'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status as any)}
                  className={`px-4 py-2 rounded-lg font-sans text-sm font-medium transition-colors whitespace-nowrap ${filterStatus === status
                    ? 'bg-green-700 text-white'
                    : 'bg-white text-neutral-700 border border-neutral-200'
                    }`}
                >
                  {status === 'pending_review' ? 'Pending Review' : status.charAt(0).toUpperCase() + status.slice(1)}
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
                              {actionLoading === listing.id ? (
                                <Loader2 className="w-5 h-5 animate-spin text-neutral-600" />
                              ) : (
                                <>
                                  {listing.status !== 'active' && (
                                    <button
                                      onClick={() => handleApprove(listing.id)}
                                      className="p-2 hover:bg-green-100 rounded-lg transition-colors"
                                      title="Approve listing"
                                    >
                                      <CheckCircle className="w-5 h-5 text-green-600" />
                                    </button>
                                  )}
                                  {listing.status !== 'suspended' && (
                                    <button
                                      onClick={() => handleReject(listing.id)}
                                      className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                                      title="Suspend listing"
                                    >
                                      <XCircle className="w-5 h-5 text-red-600" />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => navigate(`/product/${listing.id}`)}
                                    className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                                    title="View details"
                                  >
                                    <Eye className="w-5 h-5 text-neutral-600" />
                                  </button>
                                </>
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
                      {actionLoading === listing.id ? (
                        <div className="flex-1 flex items-center justify-center py-2">
                          <Loader2 className="w-4 h-4 animate-spin text-neutral-600" />
                        </div>
                      ) : (
                        <>
                          {listing.status !== 'active' && (
                            <button
                              onClick={() => handleApprove(listing.id)}
                              className="flex-1 py-2 bg-green-100 text-green-700 rounded-lg font-sans text-xs font-medium hover:bg-green-200 transition-colors"
                            >
                              Approve
                            </button>
                          )}
                          {listing.status !== 'suspended' && (
                            <button
                              onClick={() => handleReject(listing.id)}
                              className="flex-1 py-2 bg-red-100 text-red-700 rounded-lg font-sans text-xs font-medium hover:bg-red-200 transition-colors"
                            >
                              Reject
                            </button>
                          )}
                          <button
                            onClick={() => navigate(`/product/${listing.id}`)}
                            className="p-2 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors"
                          >
                            <Eye className="w-4 h-4 text-neutral-600" />
                          </button>
                        </>
                      )}
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
