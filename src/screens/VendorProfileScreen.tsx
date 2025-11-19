import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import {
  Mail,
  Phone,
  Star,
  ShoppingBag,
  Clock,
  Package,
  TrendingUp,
  Users,
  MapPin,
  CheckCircle,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';
import { TABLES, COLUMNS } from '../services/constants';
import type { Database } from '../types/database';

type VendorWithProfile = Database['public']['Tables']['vendors']['Row'] & {
  profile?: Database['public']['Tables']['profiles']['Row'];
  review_count?: number;
  reviews?: Array<{
    id: string;
    customer_name: string;
    rating: number;
    comment: string;
    created_at: string;
  }>;
};

export const VendorProfileScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [vendor, setVendor] = useState<VendorWithProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadVendorProfile(id);
    }
  }, [id]);

  const loadVendorProfile = async (vendorId: string) => {
    try {
      setLoading(true);
      setError(null);
      logger.info(`Loading vendor profile for ID: ${vendorId}`);

      // Fetch vendor with profile and reviews
      const { data: vendorData, error: vendorError } = await (supabase
        .from(TABLES.VENDORS) as any)
        .select(`
          *,
          profiles:user_id (
            id,
            email,
            full_name
          )
        `)
        .eq(COLUMNS.VENDORS.ID, vendorId)
        .eq(COLUMNS.VENDORS.IS_ACTIVE, true)
        .not(COLUMNS.VENDORS.BUSINESS_NAME, 'is', null)
        .neq(COLUMNS.VENDORS.BUSINESS_NAME, '')
        .single();

      if (vendorError) {
        logger.error('Error fetching vendor', vendorError);
        setError('Vendor not found or unavailable');
        return;
      }

      if (!vendorData) {
        setError('Vendor not found');
        return;
      }

      // Fetch recent reviews
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select(`
          id,
          rating,
          review_text,
          created_at,
          profiles:buyer_id (
            full_name
          )
        `)
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false })
        .limit(10);

      const vendorWithReviews: VendorWithProfile = {
        ...vendorData,
        review_count: reviewsData?.length || 0,
        reviews: reviewsData?.map(review => ({
          id: review.id,
          customer_name: (review as any).profiles?.full_name || 'Anonymous',
          rating: review.rating,
          comment: review.review_text || '',
          created_at: review.created_at
        })) || []
      };

      setVendor(vendorWithReviews);
    } catch (error) {
      logger.error('Error loading vendor profile', error);
      setError('Failed to load vendor profile');
    } finally {
      setLoading(false);
    }
  };

  const handleContactVendor = () => {
    navigate(`/chat?vendor=${id}`);
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${i < rating
              ? 'text-accent-yellow fill-accent-yellow'
              : 'text-neutral-300 fill-neutral-300'
              }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col w-full min-h-screen bg-neutral-50">
        <div className="w-full max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-neutral-200 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-64 bg-neutral-200 rounded"></div>
                <div className="h-48 bg-neutral-200 rounded"></div>
              </div>
              <div className="h-96 bg-neutral-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="flex flex-col w-full min-h-screen bg-neutral-50">
        <div className="w-full max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
          <div className="text-center">
            <h1 className="font-heading font-bold text-neutral-900 text-2xl mb-4">
              Vendor Not Found
            </h1>
            <p className="font-sans text-neutral-600 mb-6">
              {error || "The vendor profile you're looking for is not available."}
            </p>
            <Button
              onClick={() => navigate('/vendors')}
              className="bg-primary-500 hover:bg-primary-600 text-white"
            >
              Browse Vendors
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full min-h-screen bg-neutral-50">
      <div className="w-full max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          <div className="lg:col-span-2 flex flex-col gap-6">
            <Card className="border border-neutral-200 shadow-sm">
              <CardContent className="p-6 md:p-8">
                <div className="flex flex-col sm:flex-row items-start gap-6">
                  <div className="flex-shrink-0">
                    <img
                      src="/image-1.png" // Default vendor image
                      alt={vendor.business_name}
                      className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"
                    />
                  </div>

                  <div className="flex-1 flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="font-heading font-bold text-neutral-900 text-2xl md:text-3xl">
                          {vendor.business_name}
                        </h1>
                        {vendor.verification_status === 'verified' && (
                          <CheckCircle className="w-6 h-6 text-primary-500" />
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {renderStars(vendor.rating)}
                        <span className="font-sans text-sm text-neutral-600">
                          ({vendor.review_count || 0} reviews)
                        </span>
                      </div>
                    </div>

                    <p className="font-sans text-neutral-700 text-sm leading-relaxed">
                      {vendor.business_description || 'No description available.'}
                    </p>

                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-sm text-neutral-600">
                        <Mail className="w-4 h-4 text-primary-500" />
                        <span>{vendor.profile?.email || 'No email available'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-neutral-600">
                        <Phone className="w-4 h-4 text-primary-500" />
                        <span>{vendor.business_phone || 'No phone available'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <Button
                        onClick={handleContactVendor}
                        className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-2 rounded-lg font-sans font-semibold"
                      >
                        Contact Vendor
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-neutral-200 shadow-sm">
              <CardContent className="p-6 md:p-8">
                <h2 className="font-heading font-bold text-neutral-900 text-xl mb-6">
                  Business Information
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-2 p-4 bg-neutral-50 rounded-lg border border-neutral-100">
                    <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                      <ShoppingBag className="w-5 h-5 text-primary-500" />
                    </div>
                    <span className="font-sans text-xs text-neutral-600">
                      Total Sales
                    </span>
                    <span className="font-heading font-bold text-neutral-900 text-2xl">
                      ₦{vendor.total_sales?.toLocaleString() || '0'}
                    </span>
                  </div>

                  <div className="flex flex-col gap-2 p-4 bg-neutral-50 rounded-lg border border-neutral-100">
                    <div className="w-10 h-10 rounded-lg bg-accent-yellow/20 flex items-center justify-center">
                      <Star className="w-5 h-5 text-accent-yellow" />
                    </div>
                    <span className="font-sans text-xs text-neutral-600">
                      Customer Rating
                    </span>
                    <span className="font-heading font-bold text-neutral-900 text-2xl">
                      {vendor.rating.toFixed(1)}/5
                    </span>
                  </div>

                  <div className="flex flex-col gap-2 p-4 bg-neutral-50 rounded-lg border border-neutral-100">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-blue-500" />
                    </div>
                    <span className="font-sans text-xs text-neutral-600">
                      Response Time
                    </span>
                    <span className="font-heading font-bold text-neutral-900 text-2xl">
                      {vendor.response_time || 0}h
                    </span>
                  </div>

                  <div className="flex flex-col gap-2 p-4 bg-neutral-50 rounded-lg border border-neutral-100">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                      <Package className="w-5 h-5 text-purple-500" />
                    </div>
                    <span className="font-sans text-xs text-neutral-600">
                      Subscription
                    </span>
                    <span className="font-heading font-bold text-neutral-900 text-lg">
                      {vendor.subscription_plan}
                    </span>
                  </div>

                  <div className="flex flex-col gap-2 p-4 bg-neutral-50 rounded-lg border border-neutral-100">
                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    </div>
                    <span className="font-sans text-xs text-neutral-600">
                      Verification
                    </span>
                    <span className="font-heading font-bold text-neutral-900 text-lg">
                      {vendor.verification_status}
                    </span>
                  </div>

                  <div className="flex flex-col gap-2 p-4 bg-neutral-50 rounded-lg border border-neutral-100">
                    <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                      <Users className="w-5 h-5 text-orange-500" />
                    </div>
                    <span className="font-sans text-xs text-neutral-600">
                      Member Since
                    </span>
                    <span className="font-heading font-bold text-neutral-900 text-sm">
                      {new Date(vendor.created_at).getFullYear()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-neutral-200 shadow-sm">
              <CardContent className="p-6 md:p-8">
                <h2 className="font-heading font-bold text-neutral-900 text-xl mb-6">
                  Business Location
                </h2>

                <div className="flex flex-col gap-4">
                  <div className="w-full h-64 rounded-lg overflow-hidden">
                    <img
                      src="/image.png"
                      alt="Business location"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex items-start gap-2">
                    <MapPin className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                    <span className="font-sans text-sm text-neutral-700">
                      {vendor.business_address || vendor.market_location || 'Location not specified'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="border border-neutral-200 shadow-sm sticky top-20">
              <CardContent className="p-6 md:p-8">
                <h2 className="font-heading font-bold text-neutral-900 text-xl mb-6">
                  Customer Reviews
                </h2>

                <div className="flex flex-col gap-4">
                  {vendor.reviews && vendor.reviews.length > 0 ? (
                    vendor.reviews.map((review) => (
                      <div
                        key={review.id}
                        className="flex flex-col gap-2 pb-4 border-b border-neutral-100 last:border-b-0 last:pb-0"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-sans font-semibold text-neutral-900 text-sm">
                            {review.customer_name}
                          </span>
                          {renderStars(review.rating)}
                        </div>

                        <p className="font-sans text-neutral-700 text-xs leading-relaxed">
                          {review.comment}
                        </p>

                        <span className="font-sans text-neutral-500 text-xs">
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="font-sans text-neutral-600 text-sm text-center py-4">
                      No reviews yet.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
