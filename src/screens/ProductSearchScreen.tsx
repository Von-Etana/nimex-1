import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { SearchIcon, SlidersHorizontal, MapPin, TrendingUp, Award, Navigation, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { where, orderBy } from 'firebase/firestore';
import { FirestoreService } from '../services/firestore.service';
import { COLLECTIONS } from '../lib/collections';
import { googleMapsService } from '../services/googleMapsService';
import { recommendationService } from '../services/recommendationService';
import { useAuth } from '../contexts/AuthContext';
import { CATEGORIES } from '../lib/categories';
import { LocationPicker } from '../components/maps/LocationPicker';

interface Product {
  id: string;
  title: string;
  price: number;
  images: string[];
  location: string;
  vendor_id: string;
  rating: number;
  status: string;
  category_id: string;
  description: string;
  created_at?: any;
}

interface LocationState {
  lat: number;
  lng: number;
  address: string;
  city: string;
  state: string;
  area: string;
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

  // Location State
  const [userLocation, setUserLocation] = useState<LocationState | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [marker, setMarker] = useState<google.maps.Marker | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLocating, setIsLocating] = useState(false);

  const query = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const locationFilter = searchParams.get('location') || '';
  const sortBy = searchParams.get('sortBy') || 'relevance';

  // Initialize Map and Geolocation
  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return;

    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.onload = () => initializeMap();
      document.head.appendChild(script);
    } else {
      initializeMap();
    }
  }, []);

  // Update products when filters change
  useEffect(() => {
    fetchProducts();
    loadRecommendations();
  }, [query, category, minPrice, maxPrice, locationFilter, sortBy, userLocation?.city]); // trigger on userLocation city change too

  useEffect(() => {
    if (query && user?.id) {
      recommendationService.trackUserSearch(user.id, query, category, locationFilter);
    }
  }, [query, category, locationFilter, user?.id]);

  const initializeMap = () => {
    if (mapRef.current && !map) {
      const defaultCenter = { lat: 6.5244, lng: 3.3792 }; // Lagos
      const newMap = new google.maps.Map(mapRef.current, {
        center: defaultCenter,
        zoom: 13,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true,
      });

      const newMarker = new google.maps.Marker({
        position: defaultCenter,
        map: newMap,
        draggable: true,
        animation: google.maps.Animation.DROP,
      });

      newMarker.addListener('dragend', () => handleMarkerDrag(newMarker));

      setMap(newMap);
      setMarker(newMarker);

      // Auto-detect location on load if no location filter is set
      // Only if we don't have a location filter in URL already
      if (!locationFilter) {
        detectUserLocation(newMap, newMarker);
      }
    }
  };

  const detectUserLocation = (currentMap = map, currentMarker = marker) => {
    if (!navigator.geolocation) return;

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        if (currentMap && currentMarker) {
          const newPos = { lat, lng };
          currentMap.setCenter(newPos);
          currentMap.setZoom(15);
          currentMarker.setPosition(newPos);

          await reverseGeocode(lat, lng);
        }
        setIsLocating(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setIsLocating(false);
        alert('Unable to retrieve your location. Please check your browser permissions.');
      }
    );
  };

  const handleMarkerDrag = async (markerInstance: google.maps.Marker) => {
    const position = markerInstance.getPosition();
    if (position) {
      await reverseGeocode(position.lat(), position.lng());
    }
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const geocoder = new google.maps.Geocoder();
      const result = await geocoder.geocode({ location: { lat, lng } });

      if (result.results[0]) {
        const addressDetails = parseAddressComponents(result.results[0].address_components);
        const newState = {
          lat,
          lng,
          address: result.results[0].formatted_address,
          ...addressDetails
        };

        setUserLocation(newState);

        // Update URL filter to use City or Area for relevance, defaulting to City
        const locationTerm = addressDetails.area || addressDetails.city || addressDetails.state;
        if (locationTerm) {
          updateFilter('location', locationTerm);
        }
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
  };

  const parseAddressComponents = (components: google.maps.GeocoderAddressComponent[]) => {
    let city = '';
    let state = '';
    let area = '';

    components.forEach((component) => {
      const types = component.types;
      if (types.includes('locality')) {
        city = component.long_name;
      }
      if (types.includes('administrative_area_level_1')) {
        state = component.long_name;
      }
      if (types.includes('sublocality') || types.includes('neighborhood')) {
        area = component.long_name;
      }
    });

    return { city, state, area };
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const constraints: any[] = [
        where('status', '==', 'active')
      ];

      if (category) {
        constraints.push(where('category_id', '==', category));
      }

      if (minPrice) constraints.push(where('price', '>=', parseFloat(minPrice)));
      if (maxPrice) constraints.push(where('price', '<=', parseFloat(maxPrice)));

      if (sortBy === 'price_low') constraints.push(orderBy('price', 'asc'));
      else if (sortBy === 'price_high') constraints.push(orderBy('price', 'desc'));
      else if (sortBy === 'newest') constraints.push(orderBy('created_at', 'desc'));
      else if (sortBy === 'rating') constraints.push(orderBy('rating', 'desc'));

      let fetchedProducts = await FirestoreService.getDocuments<Product>(COLLECTIONS.PRODUCTS, constraints);

      // Populate Location from Vendors
      // We need to fetch vendors to know their location
      if (fetchedProducts.length > 0) {
        const vendorIds = [...new Set(fetchedProducts.map(p => p.vendor_id))];
        // Fetch vendors in batches of 10 or just fetch all active vendors (caching might be better, but for now simple fetch)
        // Since where('in') limits to 10, if we have many vendors we might need multiple queries. 
        // For simplicity/robustness, we can fetch all active vendors if list is small, or loop.
        // Let's assume we can fetch by IDs in chunks.

        const vendorMap = new Map<string, string>();

        // Split vendorIds into chunks of 10
        const chunks = [];
        for (let i = 0; i < vendorIds.length; i += 10) {
          chunks.push(vendorIds.slice(i, i + 10));
        }

        await Promise.all(chunks.map(async (chunk) => {
          const vendors = await FirestoreService.getDocuments<any>(COLLECTIONS.VENDORS, [
            where('user_id', 'in', chunk) // user_id is the document ID for vendors in this schema? No, vendor doc ID is usually user_id or separate.
            // Checking firestore.ts: Vendor extends FirestoreDocument. user_id is a field. 
            // Ideally vendor ID in product refers to the Vendor Document ID.
          ]);
          // Note: FirestoreService.getDocuments behaves such that if we query by document ID we usually use fetch by doc ID. 
          // But here we are querying a collection. 
          // If 'vendor_id' in product matches 'id' of Vendor doc, we can't use 'in' query on documentId with getDocuments constraints easily unless we use documentId().
          // Actually, standard practice: fetch specific docs.
          // Let's use getDocument for each or 'in' user_id if that's what vendor_id is.
          // Assuming product.vendor_id === vendor.id.
        }));

        // Alternative: Fetch all active vendors and cache them? Might be too heavy.
        // Better: Just traverse fetchedProducts and fetch vendors individually (cached promises).

        // Let's try a different approach: Fetch vendors by user_id if that's the link, or ID.
        // Assuming vendor_id is the document ID.
        const vendors = await Promise.all(vendorIds.map(id => FirestoreService.getDocument<any>(COLLECTIONS.VENDORS, id)));
        vendors.forEach(v => {
          if (v) vendorMap.set(v.id, v.market_location || v.business_address || '');
        });

        fetchedProducts = fetchedProducts.map(p => ({
          ...p,
          location: vendorMap.get(p.vendor_id) || ''
        }));
      }

      // Advanced Filtering
      if (query) {
        const searchLower = query.toLowerCase();
        fetchedProducts = fetchedProducts.filter(product =>
          product.title?.toLowerCase().includes(searchLower) ||
          product.description?.toLowerCase().includes(searchLower)
        );
      }

      if (locationFilter) {
        const locationLower = locationFilter.toLowerCase();
        fetchedProducts = fetchedProducts.filter(product =>
          product.location?.toLowerCase().includes(locationLower)
        );
      }

      setProducts(fetchedProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRecommendations = async () => {
    try {
      if (user?.id) {
        const recommendations = await recommendationService.getPersonalizedRecommendations(user.id, 6);
        setRecommendedProducts(recommendations.map(r => r.product));
      }
      const trending = await recommendationService.getTrendingProducts(6);
      setTrendingProducts(trending.map(t => t.product));

      const vendors = await recommendationService.getTopVendors(4);
      setTopVendors(vendors.map(v => v.vendor));
    } catch (error) {
      console.error('Error loading recommendations:', error);
    }
  };

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);
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

  const hasActiveFilters = category || minPrice || maxPrice || locationFilter;

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      {/* Map Hero Section */}
      <div className="relative w-full h-[40vh] md:h-[50vh] bg-neutral-200">
        <div ref={mapRef} className="w-full h-full" />

        {/* Overlay Search Box (Floating) */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[90%] md:w-[600px] z-10">
          <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm">
            <CardContent className="p-4 flex gap-2 items-center">
              <div className="flex-1 relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => updateFilter('q', e.target.value)}
                  placeholder="What are you looking for?"
                  className="w-full pl-10 pr-4 py-2 bg-transparent border-none focus:ring-0 font-sans text-neutral-900 placeholder:text-neutral-500 h-10"
                />
              </div>
              <div className="w-[1px] h-8 bg-neutral-200 mx-2 hidden md:block"></div>
              <div className="flex-1 relative hidden md:block">
                <LocationPicker
                  variant="search"
                  placeholder="Location..."
                  className="w-full"
                  initialLocation={locationFilter ? { address: locationFilter, lat: 0, lng: 0 } : undefined}
                  onLocationSelect={(loc) => {
                    handleLocationInputChange(loc.address);
                    // Also center map if we have coordinates
                    if (map && loc.lat && loc.lng) {
                      map.setCenter({ lat: loc.lat, lng: loc.lng });
                      map.setZoom(13);
                    }
                  }}
                />
              </div>
              <Button
                onClick={() => detectUserLocation()}
                variant="ghost"
                size="icon"
                className="text-primary-600 hover:text-primary-700 hover:bg-primary-50"
                title="Use my location"
              >
                {isLocating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Navigation className="w-5 h-5" />}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Location Info Pill */}
        {userLocation && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-md flex items-center gap-2 text-sm font-medium text-neutral-800 pointer-events-none">
            <MapPin className="w-4 h-4 text-green-600" />
            <span>
              {userLocation.area ? `${userLocation.area}, ` : ''}
              {userLocation.city}, {userLocation.state}
            </span>
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8 w-full flex-1">
        {/* Filters & Content */}
        <div className="mb-6">
          <div className="flex items-center justify-between gap-4 mb-4">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="h-10 px-4"
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Filters
              {hasActiveFilters && (
                <Badge className="ml-2 bg-primary-500 text-white hover:bg-primary-600">
                  {[category, minPrice, maxPrice, locationFilter].filter(Boolean).length}
                </Badge>
              )}
            </Button>
            <p className="font-sans text-neutral-600 text-sm">
              {loading ? 'Searching...' : `Found ${products.length} products ${locationFilter ? `near ${locationFilter}` : ''}`}
            </p>
          </div>

          {showFilters && (
            <Card className="mb-6 animate-in slide-in-from-top-2">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-heading font-semibold text-lg text-neutral-900">Refine Search</h3>
                  {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="text-red-500 hover:text-red-600 hover:bg-red-50">
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
                      className="w-full h-10 px-3 rounded-lg border border-neutral-200 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
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
                      placeholder="Max"
                      className="w-full h-10 px-3 rounded-lg border border-neutral-200 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
                    />
                  </div>

                </div>

                <div>
                  <label className="block font-sans font-medium text-sm text-neutral-700 mb-2">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => updateFilter('category', e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-neutral-200 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                  >
                    <option value="">All Categories</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-sans font-medium text-sm text-neutral-700 mb-2">
                    Sort By
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => updateFilter('sortBy', e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-neutral-200 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                  >
                    <option value="relevance">Relevance</option>
                    <option value="price_low">Price: Low to High</option>
                    <option value="price_high">Price: High to Low</option>
                    <option value="newest">Newest First</option>
                    <option value="rating">Highest Rated</option>
                  </select>
                </div>

                {/* Mobile Location Input (visible only on mobile if not provided in hero) */}
                <div className="md:hidden">
                  <label className="block font-sans font-medium text-sm text-neutral-700 mb-2">
                    Location
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                      type="text"
                      value={locationFilter}
                      onChange={(e) => handleLocationInputChange(e.target.value)}
                      placeholder="City, State..."
                      className="w-full pl-9 pr-3 h-10 rounded-lg border border-neutral-200 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

              </CardContent>
            </Card>
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
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                  {/* Personalized Recommendations */}
                  {recommendedProducts.length > 0 && (
                    <div>
                      <h3 className="font-heading font-semibold text-lg text-neutral-900 mb-3 flex items-center gap-2">
                        <Award className="w-5 h-5 text-primary-500" />
                        Recommended for You
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {recommendedProducts.slice(0, 6).map((product) => (
                          <ProductCard key={product.id} product={product} navigate={navigate} user={user} />
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
                          <ProductCard key={product.id} product={product} navigate={navigate} user={user} />
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
                            className="cursor-pointer hover:shadow-lg transition-all border-neutral-100 hover:border-primary-100 group"
                          >
                            <CardContent className="p-4 text-center">
                              <div className="w-16 h-16 bg-neutral-100 rounded-full mx-auto mb-3 flex items-center justify-center group-hover:bg-primary-50 transition-colors">
                                <span className="font-heading font-bold text-lg text-neutral-700 group-hover:text-primary-600">
                                  {vendor.business_name?.charAt(0)?.toUpperCase() || 'V'}
                                </span>
                              </div>
                              <h4 className="font-sans font-medium text-neutral-900 text-sm mb-1 truncate">
                                {vendor.business_name || 'Vendor'}
                              </h4>
                              <p className="font-sans text-xs text-neutral-500 truncate">
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
          {/* Results Grid */}
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {[...Array(8)].map((_, i) => (
                <Card key={i} className="animate-pulse border-none shadow-sm bg-white">
                  <CardContent className="p-0">
                    <div className="w-full h-48 bg-neutral-100 rounded-t-lg" />
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-neutral-100 rounded w-3/4" />
                      <div className="h-4 bg-neutral-100 rounded w-1/2" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-lg border border-neutral-100 shadow-sm">
              <div className="w-20 h-20 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <SearchIcon className="w-8 h-8 text-neutral-300" />
              </div>
              <h3 className="font-heading font-semibold text-xl text-neutral-900 mb-2">
                No products found
              </h3>
              <p className="font-sans text-neutral-500 mb-6 max-w-sm mx-auto">
                We couldn't find any products matching your search criteria. Try adjusting your search or filters.
              </p>
              <Button onClick={clearFilters} variant="outline">Clear Filters</Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} navigate={navigate} user={user} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper component for Product Cards to reduce repetition
const ProductCard = ({ product, navigate, user }: { product: Product, navigate: any, user: any }) => {
  const imageUrl = Array.isArray(product.images) && product.images[0] ? product.images[0] : '/image-1.png';
  return (
    <Card
      onClick={() => {
        navigate(`/product/${product.id}`);
        if (user?.id) recommendationService.trackProductView(product.id, user.id);
      }}
      className="cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-neutral-100 hover:border-primary-100 overflow-hidden group"
    >
      <CardContent className="p-0">
        <div className="w-full h-48 bg-neutral-100 relative overflow-hidden">
          <div
            className="w-full h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
            style={{ backgroundImage: `url(${imageUrl})` }}
          />
          {product.status !== 'active' && (
            <div className="absolute top-2 right-2 bg-neutral-900/70 text-white text-[10px] px-2 py-1 rounded-full uppercase font-bold tracking-wider">
              {product.status}
            </div>
          )}
        </div>
        <div className="p-3 md:p-4 flex flex-col gap-2">
          <h3 className="font-heading font-semibold text-neutral-900 text-sm md:text-base line-clamp-2 h-10 md:h-12 leading-tight">
            {product.title}
          </h3>
          <div className="flex flex-col gap-1 mt-auto">
            <span className="font-sans font-bold text-primary-600 text-base md:text-lg">
              ₦{product.price.toLocaleString()}
            </span>
            {product.location && (
              <span className="font-sans text-neutral-500 text-xs flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {product.location}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
