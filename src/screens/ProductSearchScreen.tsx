import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { SearchIcon, SlidersHorizontal, XIcon } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { supabase } from '../lib/supabase';

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
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const query = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const location = searchParams.get('location') || '';
  const sortBy = searchParams.get('sortBy') || 'relevance';

  useEffect(() => {
    fetchProducts();
  }, [query, category, minPrice, maxPrice, location, sortBy]);

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

                <div>
                  <label className="block font-sans font-medium text-sm text-neutral-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => updateFilter('location', e.target.value)}
                    placeholder="Lagos, Abuja..."
                    className="w-full h-10 px-3 rounded-lg border border-neutral-200 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
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
                  onClick={() => navigate(`/product/${product.id}`)}
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
