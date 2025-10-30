import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { SearchIcon, SlidersHorizontal, XIcon, MapPin, TrendingUp, Award } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { supabase } from '../lib/supabase';
import { googleMapsService, type PlaceResult } from '../services/googleMapsService';
import { recommendationService } from '../services/recommendationService';
import { useAuth } from '../contexts/AuthContext';

interface Product {
  id: string;
  title: string;
  price: number;
  images: string[];
  location: string;
  vendor_id: string;
  rating: number;
  status: string;
}

export const ProductSearchScreen: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([]);
  const [topVendors, setTopVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);

  const query = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const location = searchParams.get('location') || '';
  const sortBy = searchParams.get('sortBy') || 'relevance';

  useEffect(() => {
    fetchProducts();
    loadRecommendations();
  }, [query, category, minPrice, maxPrice, location, sortBy]);

  useEffect(() => {
    // Track search when user performs a search
    if (query && user?.id) {
      recommendationService.trackUserSearch(user.id, query, category, location);
    }
  }, [query, category, location, user?.id]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let queryBuilder = supabase
        .from('products')
        .select('*')
        .eq('status', 'active');

      if (query) {
        queryBuilder = queryBuilder.or(`title.ilike.%${query}%,description.ilike.%${query}%`);
      }

      if (category) {
        queryBuilder = queryBuilder.eq('category_id', category);
      }

      if (minPrice) {
        queryBuilder = queryBuilder.gte('price', parseFloat(minPrice));
      }

      if (maxPrice) {
        queryBuilder = queryBuilder.lte('price', parseFloat(maxPrice));
      }

      if (location) {
        queryBuilder = queryBuilder.ilike('location', `%${location}%`);
      }

      if (sortBy === 'price_low') {
        queryBuilder = queryBuilder.order('price', { ascending: true });
      } else if (sortBy === 'price_high') {
        queryBuilder = queryBuilder.order('price', { ascending: false });
      } else if (sortBy === 'newest') {
        queryBuilder = queryBuilder.order('created_at', { ascending: false });
      } else if (sortBy === 'rating') {
        queryBuilder = queryBuilder.order('rating', { ascending: false });
      }

      const { data, error } = await queryBuilder;

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRecommendations = async () => {
    try {
      if (user?.id) {
        // Get personalized recommendations
        const recommendations = await recommendationService.getPersonalizedRecommendations(user.id, 6);
        setRecommendedProducts(recommendations.map(r => r.product));
      }

      // Get trending products
      const trending = await recommendationService.getTrendingProducts(6);
      setTrendingProducts(trending.map(t => t.product));

      // Get top vendors
      const vendors = await recommendationService.getTopVendors(4);
      setTopVendors(vendors.map(v => v.vendor));

    } catch (error) {
      console.error('Error loading recommendations:', error);
    }
  };

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    setSearchParams(params);
  };

  const clearFilters = () => {
    setSearchParams({ q: query });
  };

  const handleLocationInputChange = async (value: string) => {
    updateFilter('location', value);

    if (value.length > 2) {
      try {
        const suggestions = await googleMapsService.getAutocompleteSuggestions(value);
        setLocationSuggestions(suggestions);
        setShowLocationSuggestions(true);
      } catch (error) {
        console.error('Error getting location suggestions:', error);
        setLocationSuggestions([]);
        setShowLocationSuggestions(false);
      }
    } else {
      setLocationSuggestions([]);
      setShowLocationSuggestions(false);
    }
  };

  const selectLocationSuggestion = (suggestion: string) => {
    updateFilter('location', suggestion);
    setShowLocationSuggestions(false);
  };

  const hasActiveFilters = category || minPrice || maxPrice || location;

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1 relative">
              <input
                type="text"
                value={query}
                onChange={(e) => updateFilter('q', e.target.value)}
                placeholder="Search products..."
                className="w-full h-12 pl-12 pr-4 rounded-lg border border-neutral-200 font-sans text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="h-12 px-4 md:px-6"
            >
              <SlidersHorizontal className="w-5 h-5 mr-2" />
              Filters
              {hasActiveFilters && (
                <Badge className="ml-2 bg-primary-500 text-white">
                  {[category, minPrice, maxPrice, location].filter(Boolean).length}
                </Badge>
              )}
            </Button>
          </div>

          {query && (
            <p className="font-sans text-neutral-600">
              {loading ? 'Searching...' : `Found ${products.length} results for "${query}"`}
            </p>
          )}

          {!query && user && (
            <div className="mb-6">
              <Button
                variant="outline"
                onClick={() => setShowRecommendations(!showRecommendations)}
                className="mb-4"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                {showRecommendations ? 'Hide' : 'Show'} Recommendations
              </Button>

              {showRecommendations && (
                <div className="space-y-6">
                  {/* Personalized Recommendations */}
                  {recommendedProducts.length > 0 && (
                    <div>
                      <h3 className="font-heading font-semibold text-lg text-neutral-900 mb-3 flex items-center gap-2">
                        <Award className="w-5 h-5 text-primary-500" />
                        Recommended for You
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {recommendedProducts.slice(0, 6).map((product) => (
                          <Card
                            key={product.id}
                            onClick={() => {
                              navigate(`/product/${product.id}`);
                              recommendationService.trackProductView(product.id, user.id);
                            }}
                            className="cursor-pointer hover:shadow-lg transition-all"
                          >
                            <CardContent className="p-0">
                              <div
                                className="w-full h-32 bg-cover bg-center rounded-t-lg"
                                style={{ backgroundImage: `url(${product.images?.[0] || '/image-1.png'})` }}
                              />
                              <div className="p-2">
                                <h4 className="font-sans text-xs font-medium text-neutral-900 line-clamp-2">
                                  {product.title}
                                </h4>
                                <p className="font-sans font-bold text-primary-500 text-sm">
                                  ₦{product.price?.toLocaleString()}
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Trending Products */}
                  {trendingProducts.length > 0 && (
                    <div>
                      <h3 className="font-heading font-semibold text-lg text-neutral-900 mb-3 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-orange-500" />
                        Trending This Week
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {trendingProducts.slice(0, 6).map((product) => (
                          <Card
                            key={product.id}
                            onClick={() => {
                              navigate(`/product/${product.id}`);
                              recommendationService.trackProductView(product.id, user.id);
                            }}
                            className="cursor-pointer hover:shadow-lg transition-all"
                          >
                            <CardContent className="p-0">
                              <div
                                className="w-full h-32 bg-cover bg-center rounded-t-lg"
                                style={{ backgroundImage: `url(${product.images?.[0] || '/image-1.png'})` }}
                              />
                              <div className="p-2">
                                <h4 className="font-sans text-xs font-medium text-neutral-900 line-clamp-2">
                                  {product.title}
                                </h4>
                                <p className="font-sans font-bold text-primary-500 text-sm">
                                  ₦{product.price?.toLocaleString()}
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Top Vendors */}
                  {topVendors.length > 0 && (
                    <div>
                      <h3 className="font-heading font-semibold text-lg text-neutral-900 mb-3 flex items-center gap-2">
                        <Award className="w-5 h-5 text-yellow-500" />
                        Top Rated Vendors
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {topVendors.slice(0, 4).map((vendor) => (
                          <Card
                            key={vendor.id}
                            onClick={() => navigate(`/vendor/${vendor.id}`)}
                            className="cursor-pointer hover:shadow-lg transition-all"
                          >
                            <CardContent className="p-4 text-center">
                              <div className="w-16 h-16 bg-neutral-100 rounded-full mx-auto mb-3 flex items-center justify-center">
                                <span className="font-heading font-bold text-lg text-neutral-700">
                                  {vendor.business_name?.charAt(0)?.toUpperCase() || 'V'}
                                </span>
                              </div>
                              <h4 className="font-sans font-medium text-neutral-900 text-sm mb-1">
                                {vendor.business_name || 'Vendor'}
                              </h4>
                              <p className="font-sans text-xs text-neutral-600">
                                {vendor.market_location || 'Location'}
                              </p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {showFilters && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading font-semibold text-lg text-neutral-900">Filters</h3>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Clear All
                  </Button>
                )}
              </div>

              <div className="grid md:grid-cols-4 gap-4">
                <div>
                  <label className="block font-sans font-medium text-sm text-neutral-700 mb-2">
                    Min Price (₦)
                  </label>
                  <input
                    type="number"
                    value={minPrice}
                    onChange={(e) => updateFilter('minPrice', e.target.value)}
                    placeholder="0"
                    className="w-full h-10 px-3 rounded-lg border border-neutral-200 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block font-sans font-medium text-sm text-neutral-700 mb-2">
                    Max Price (₦)
                  </label>
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => updateFilter('maxPrice', e.target.value)}
                    placeholder="1000000"
                    className="w-full h-10 px-3 rounded-lg border border-neutral-200 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div className="relative">
                  <label className="block font-sans font-medium text-sm text-neutral-700 mb-2">
                    Location
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => handleLocationInputChange(e.target.value)}
                      placeholder="Lagos, Abuja..."
                      className="w-full h-10 pl-10 pr-3 rounded-lg border border-neutral-200 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  {showLocationSuggestions && locationSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-10 bg-white border border-neutral-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {locationSuggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => selectLocationSuggestion(suggestion)}
                          className="w-full px-3 py-2 text-left hover:bg-neutral-50 font-sans text-sm text-neutral-700 border-b border-neutral-100 last:border-b-0"
                        >
                          <MapPin className="inline w-3 h-3 mr-2 text-neutral-400" />
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block font-sans font-medium text-sm text-neutral-700 mb-2">
                    Sort By
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => updateFilter('sortBy', e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-neutral-200 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="relevance">Relevance</option>
                    <option value="price_low">Price: Low to High</option>
                    <option value="price_high">Price: High to Low</option>
                    <option value="newest">Newest First</option>
                    <option value="rating">Highest Rated</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-0">
                  <div className="w-full h-48 bg-neutral-200" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-neutral-200 rounded" />
                    <div className="h-4 bg-neutral-200 rounded w-2/3" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <SearchIcon className="w-10 h-10 text-neutral-400" />
            </div>
            <h3 className="font-heading font-semibold text-xl text-neutral-900 mb-2">
              No products found
            </h3>
            <p className="font-sans text-neutral-600 mb-6">
              Try adjusting your search or filters
            </p>
            <Button onClick={clearFilters}>Clear Filters</Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map((product) => {
              const images = Array.isArray(product.images) ? product.images : [];
              const imageUrl = images[0] || '/image-1.png';

              return (
                <Card
                  key={product.id}
                  onClick={() => {
                    navigate(`/product/${product.id}`);
                    if (user?.id) {
                      recommendationService.trackProductView(product.id, user.id);
                    }
                  }}
                  className="cursor-pointer hover:shadow-lg hover:border-primary-200 transition-all"
                >
                  <CardContent className="p-0">
                    <div
                      className="w-full h-48 bg-cover bg-center"
                      style={{ backgroundImage: `url(${imageUrl})` }}
                    />
                    <div className="p-3 md:p-4 flex flex-col gap-2">
                      <h3 className="font-heading font-semibold text-neutral-900 text-sm md:text-base line-clamp-2">
                        {product.title}
                      </h3>
                      <div className="flex flex-col gap-1">
                        <span className="font-sans font-bold text-primary-500 text-base md:text-lg">
                          ₦{product.price.toLocaleString()}
                        </span>
                        {product.location && (
                          <span className="font-sans text-neutral-600 text-xs">
                            {product.location}
                          </span>
                        )}
                      </div>
                      {product.rating > 0 && (
                        <div className="flex items-center gap-1">
                          <span className="text-accent-yellow">★</span>
                          <span className="font-sans text-sm text-neutral-700">
                            {product.rating.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
