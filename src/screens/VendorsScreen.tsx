import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import {
  MapPinIcon,
  MessageSquareIcon,
  Star,
  MapIcon,
  Filter,
  X,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

const featuredVendors = [
  {
    id: 1,
    name: "Tech Haven Electronics",
    category: "Smartphones, Laptops, Accessories",
    image: "/image-1.png",
    rating: 4.8,
    reviews: 245,
    location: "12.1 km, Ikeja, Lagos",
  },
  {
    id: 2,
    name: "Mama Nkechi's Kitchen",
    category: "Authentic Nigerian Meals, Catering",
    image: "/image-4.png",
    rating: 4.9,
    reviews: 1200,
    location: "3.2 km, Lekki, Lagos",
  },
  {
    id: 3,
    name: "Fashion Finesse Boutique",
    category: "Men's & Women's Apparel, Tailoring",
    image: "/image-2.png",
    rating: 4.5,
    reviews: 890,
    location: "8.7 km, VI, Asokoro, Jabi Metropark",
  },
  {
    id: 4,
    name: "AutoFix Pro Garage",
    category: "Car Repair, Maintenance, Diagnostics",
    image: "/image-8.png",
    rating: 4.7,
    reviews: 456,
    location: "5.3 km, Ikeja, Lagos",
  },
  {
    id: 5,
    name: "Green Thumb Gardens",
    category: "Plants, Landscaping, Garden Supplies",
    image: "/image-7.png",
    rating: 4.6,
    reviews: 320,
    location: "9.2 km, Oniru, Victoria Island",
  },
  {
    id: 6,
    name: "The Bookworm Nook",
    category: "New & Used Books, Stationery",
    image: "/image-5.png",
    rating: 4.9,
    reviews: 1850,
    location: "2.4 km, Surulere, Lagos",
  },
];

interface Market {
  id: string;
  name: string;
  city: string;
  state: string;
  vendor_count: number;
}

export const VendorsScreen: React.FC = () => {
  const navigate = useNavigate();
  const [location, setLocation] = useState('');
  const [markets, setMarkets] = useState<Market[]>([]);
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);
  const [showMarketFilter, setShowMarketFilter] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadMarkets();
  }, []);

  const loadMarkets = async () => {
    try {
      const { data, error } = await supabase
        .from('markets')
        .select('*')
        .eq('is_active', true)
        .gt('vendor_count', 0)
        .order('vendor_count', { ascending: false })
        .limit(20);

      if (error) throw error;
      setMarkets(data || []);
    } catch (error) {
      console.error('Error loading markets:', error);
    }
  };

  const handleDetectLocation = () => {
    setLocation('Lagos, Nigeria');
  };

  const handleSearchVendors = () => {
    console.log('Searching vendors near:', location);
  };

  const handleVendorClick = (vendorId: number) => {
    navigate(`/vendor/${vendorId}`);
  };

  const handleMarketSelect = (marketId: string) => {
    setSelectedMarket(marketId === selectedMarket ? null : marketId);
    setShowMarketFilter(false);
  };

  const clearMarketFilter = () => {
    setSelectedMarket(null);
  };

  return (
    <div className="flex flex-col w-full min-h-screen bg-white">
      <div className="w-full max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <div className="flex flex-col items-center text-center mb-12 md:mb-16">
          <h1 className="font-heading font-bold text-neutral-900 text-3xl md:text-4xl lg:text-5xl leading-tight mb-4">
            Discover Local <span className="text-primary-500">NIMEX Vendors</span> Near You
          </h1>
          <p className="font-sans text-neutral-600 text-sm md:text-base max-w-2xl mb-8">
            Explore a curated list of trusted vendors across various categories, view their offerings, read reviews, and connect instantly. Find exactly what you need, right in your neighborhood.
          </p>

          <div className="flex flex-col md:flex-row items-center gap-3 w-full max-w-3xl">
            <div className="flex items-center gap-2 bg-white border border-neutral-200 rounded-lg px-4 py-3 flex-1 w-full">
              <MapPinIcon className="w-5 h-5 text-neutral-400" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Enter your location or address..."
                className="flex-1 font-sans text-sm text-neutral-700 outline-none"
              />
            </div>
            <Button
              onClick={handleDetectLocation}
              variant="outline"
              className="border-neutral-200 hover:bg-neutral-50 text-neutral-700 font-sans text-sm px-4 py-3 whitespace-nowrap"
            >
              Detect My Location
            </Button>
            <Button
              onClick={handleSearchVendors}
              className="bg-primary-500 hover:bg-primary-600 text-white font-sans font-semibold text-sm px-6 py-3 whitespace-nowrap"
            >
              Search Vendors
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
            <div className="relative">
              <Button
                onClick={() => setShowMarketFilter(!showMarketFilter)}
                variant="outline"
                className={`border-neutral-200 hover:bg-neutral-50 font-sans text-sm px-4 py-2 flex items-center gap-2 ${selectedMarket ? 'border-primary-500 bg-primary-50 text-primary-700' : 'text-neutral-700'}`}
              >
                <Filter className="w-4 h-4" />
                Filter by Market
                {selectedMarket && (
                  <span className="ml-1 px-2 py-0.5 bg-primary-500 text-white rounded-full text-xs">1</span>
                )}
              </Button>

              {showMarketFilter && (
                <div className="absolute z-20 mt-2 w-80 max-h-96 overflow-y-auto bg-white border border-neutral-200 rounded-lg shadow-xl">
                  <div className="p-3 border-b border-neutral-100 bg-neutral-50 flex items-center justify-between">
                    <span className="font-sans font-semibold text-sm text-neutral-900">Popular Markets</span>
                    <button
                      onClick={() => setShowMarketFilter(false)}
                      className="text-neutral-400 hover:text-neutral-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="p-2">
                    {markets.map((market) => (
                      <button
                        key={market.id}
                        onClick={() => handleMarketSelect(market.id)}
                        className={`w-full px-3 py-2 text-left rounded-lg hover:bg-neutral-50 transition-colors ${
                          selectedMarket === market.id ? 'bg-primary-50 border-l-4 border-primary-500' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="font-sans font-medium text-sm text-neutral-900">{market.name}</p>
                            <p className="font-sans text-xs text-neutral-600">
                              {market.city}, {market.state}
                            </p>
                          </div>
                          <span className="font-sans text-xs text-neutral-500 whitespace-nowrap">
                            {market.vendor_count} {market.vendor_count === 1 ? 'vendor' : 'vendors'}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {selectedMarket && (
              <div className="flex items-center gap-2 px-3 py-2 bg-primary-50 border border-primary-200 rounded-lg">
                <MapIcon className="w-4 h-4 text-primary-600" />
                <span className="font-sans text-sm text-primary-700">
                  {markets.find((m) => m.id === selectedMarket)?.name}
                </span>
                <button
                  onClick={clearMarketFilter}
                  className="text-primary-600 hover:text-primary-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col items-center mb-12 md:mb-16">
          <h2 className="font-heading font-bold text-neutral-900 text-2xl md:text-3xl mb-3 text-center">
            Vendors on the Map
          </h2>
          <p className="font-sans text-neutral-600 text-sm md:text-base text-center mb-8 max-w-2xl">
            See where NIMEX vendors are located and find the closest ones to you. Click on markers for quick details.
          </p>

          <div className="w-full max-w-4xl h-[300px] md:h-[400px] rounded-2xl overflow-hidden shadow-lg">
            <img
              src="/image.png"
              alt="Map showing vendor locations"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <div className="flex flex-col items-center">
          <h2 className="font-heading font-bold text-neutral-900 text-2xl md:text-3xl mb-3 text-center">
            Featured NIMEX Vendors
          </h2>
          <p className="font-sans text-neutral-600 text-sm md:text-base text-center mb-10 max-w-2xl">
            Browse through our top-rated vendors, offering high-quality products and services across Nigeria.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 w-full">
            {featuredVendors.map((vendor) => (
              <Card
                key={vendor.id}
                onClick={() => handleVendorClick(vendor.id)}
                className="border border-neutral-100 shadow-sm hover:shadow-md hover:border-primary-200 transition-all cursor-pointer"
              >
                <CardContent className="flex flex-col items-center text-center p-6 gap-4">
                  <img
                    src={vendor.image}
                    alt={vendor.name}
                    className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover border-4 border-neutral-100"
                  />

                  <div className="flex flex-col gap-2 w-full">
                    <h3 className="font-heading font-bold text-neutral-900 text-base md:text-lg">
                      {vendor.name}
                    </h3>
                    <p className="font-sans text-neutral-600 text-xs md:text-sm">
                      {vendor.category}
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-4 w-full">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.floor(vendor.rating)
                              ? 'fill-accent-yellow text-accent-yellow'
                              : 'text-neutral-300'
                          }`}
                        />
                      ))}
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="font-sans font-bold text-neutral-900 text-sm">
                        {vendor.rating}
                      </span>
                      <span className="font-sans text-neutral-500 text-xs">
                        ({vendor.reviews.toLocaleString()} Reviews)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-neutral-600 w-full justify-center">
                    <MapPinIcon className="w-4 h-4 text-primary-500" />
                    <span className="font-sans text-xs">{vendor.location}</span>
                  </div>

                  <Button className="w-full bg-primary-500 hover:bg-primary-600 text-white font-sans font-semibold text-sm py-2.5 rounded-lg flex items-center justify-center gap-2">
                    <MessageSquareIcon className="w-4 h-4" />
                    Chat Now
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
