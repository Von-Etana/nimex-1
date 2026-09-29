import {
  BabyIcon,
  BookOpenIcon,
  CarIcon,
  DumbbellIcon,
  FlaskConicalIcon,
  Flower2Icon,
  HouseIcon,
  PackageIcon,
  SearchIcon,
  ShirtIcon,
  TvIcon,
  UtensilsIcon,
  ArrowRight,
  Sparkles,
  MapPin,
  TrendingUp,
} from "lucide-react";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";
import { Card, CardContent } from "../../../../components/ui/card";
import { ProductGrid } from "./ProductGrid";
import { FirestoreService } from "../../../../services/firestore.service";
import { COLLECTIONS } from "../../../../lib/collections";
import { LocationPicker } from "../../../../components/maps/LocationPicker";
import { Loader2 } from "lucide-react";
import { calculateDistance, formatDistance } from "../../../../lib/utils";
import { DEFAULT_LOCATION_LABEL } from "../../../../lib/locationDefaults";
const categories = [
  { icon: TvIcon, title: "Electronics", id: "electronics", color: "bg-blue-500" },
  { icon: ShirtIcon, title: "Fashion", id: "fashion", color: "bg-pink-500" },
  { icon: HouseIcon, title: "Home & Office", id: "home-office", color: "bg-amber-500" },
  { icon: UtensilsIcon, title: "Groceries", id: "food-beverages", color: "bg-green-500" },
  { icon: BookOpenIcon, title: "Books", id: "books-media", color: "bg-purple-500" },
  { icon: Flower2Icon, title: "Health & Beauty", id: "health-beauty", color: "bg-rose-500" },
  { icon: CarIcon, title: "Automotive", id: "automobiles", color: "bg-slate-600" },
  { icon: DumbbellIcon, title: "Sports", id: "sports-outdoors", color: "bg-orange-500" },
  { icon: BabyIcon, title: "Baby & Kids", id: "toys-games", color: "bg-cyan-500" },
  { icon: FlaskConicalIcon, title: "Chemicals", id: "other", color: "bg-indigo-500" },
];

const stats = [
  { value: "50K+", label: "Products" },
  { value: "10K+", label: "Vendors" },
  { value: "100K+", label: "Customers" },
  { value: "₦500M+", label: "Transactions" },
];

export const HeroSection = (): JSX.Element => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("");
  const [userLocationCoords, setUserLocationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("All Categories");

  const [rawVendors, setRawVendors] = useState<any[]>([]); // Store raw vendor data
  const [nearbyVendors, setNearbyVendors] = useState<any[]>([]);
  const [freshRecommendations, setFreshRecommendations] = useState<any[]>([]);
  const [topVendorsList, setTopVendorsList] = useState<any[]>([]);
  const [electronics, setElectronics] = useState<any[]>([]);
  const [fashion, setFashion] = useState<any[]>([]);
  const [homeOffice, setHomeOffice] = useState<any[]>([]);
  const [groceries, setGroceries] = useState<any[]>([]);

  React.useEffect(() => {
    fetchHomeData();
  }, []);

  // Filter nearby vendors whenever user location or vendors list changes
  React.useEffect(() => {
    if (userLocationCoords && rawVendors.length > 0) {
      const vendorsWithDist = rawVendors.map(v => {
        const vLat = v.businessLat || v.location?.lat;
        const vLng = v.businessLng || v.location?.lng;

        let dist = Infinity;
        if (vLat && vLng) {
          dist = calculateDistance(userLocationCoords.lat, userLocationCoords.lng, vLat, vLng);
        }
        return { ...v, _distance: dist };
      });

      // Filter: < 50km
      const nearby = vendorsWithDist
        .filter(v => v._distance < 50000)
        .sort((a, b) => a._distance - b._distance)
        .slice(0, 6);

      setNearbyVendors(mapVendors(nearby).map((v, i) => ({
        ...v,
        badge: { text: formatDistance(nearby[i]._distance), variant: "blue" as const } // Overwrite badge with distance
      })));
    } else {
      setNearbyVendors([]);
    }
  }, [userLocationCoords, rawVendors]);

  const fetchHomeData = async () => {
    try {
      setLoading(true);

      // Fetch products and filter client-side to avoid composite index requirement
      const allProducts = await FirestoreService.getDocuments<any>(COLLECTIONS.PRODUCTS, {
        orderByField: 'created_at',
        orderByDirection: 'desc',
        limitCount: 100  // Fetch more to filter from
      });

      console.log('DEBUG HeroSection: All products fetched:', allProducts?.length);

      // Filter for active products: is_active=true OR status='active'
      const activeProducts = (allProducts || []).filter(p =>
        p.is_active === true || p.status === 'active'
      );

      console.log('DEBUG HeroSection: Active products after filter:', activeProducts.length);

      // Fresh recommendations (newest active products)
      setFreshRecommendations(mapProducts(activeProducts.slice(0, 6)));

      // Fetch vendors
      const allVendors = await FirestoreService.getDocuments<any>(COLLECTIONS.VENDORS, {
        limitCount: 50
      });

      const activeVendors = (allVendors || []).filter(v => v.is_active === true);
      setRawVendors(activeVendors); // Store for location filtering
      setTopVendorsList(mapVendors(activeVendors.slice(0, 6)));

      // Filter products by category
      // Note: We check both category_id (database ID) and category (legacy/fallback string)
      const filterByCategory = (id: string) => {
        return activeProducts.filter(p => {
          const catId = p.category_id || '';
          const catName = p.category || '';
          return catId.toLowerCase() === id.toLowerCase() ||
            catId.toLowerCase().includes(id.toLowerCase()) ||
            catName.toLowerCase().includes(id.toLowerCase());
        }).slice(0, 6);
      };

      setElectronics(mapProducts(filterByCategory('electronics')));
      setFashion(mapProducts(filterByCategory('fashion')));
      // Try both possible IDs for Home & Garden/Office
      const homeProducts = [
        ...filterByCategory('home-office'),
        ...filterByCategory('home-garden')
      ].slice(0, 6);
      setHomeOffice(mapProducts(homeProducts));

      // Try both possible IDs for Groceries/Food
      const foodProducts = [
        ...filterByCategory('food-beverages'),
        ...filterByCategory('groceries')
      ].slice(0, 6);
      setGroceries(mapProducts(foodProducts));

    } catch (error) {
      console.error("Error fetching home data:", error);
    } finally {
      setLoading(false);
    }
  };

  const mapProducts = (products: any[]) => {
    return products.map(p => {
      // Handle image array or string
      const image = Array.isArray(p.images) && p.images.length > 0
        ? p.images[0]
        : (p.image_url || "/image.png");

      return {
        id: p.id,
        image: image,
        title: p.name || p.title || 'Untitled Product',
        price: `₦ ${(p.price || 0).toLocaleString()}`,
        vendor: "Vendor", // We could look up vendor name if needed, but 'Vendor' is fine for now on grid
        vendorImage: "/image-1.png",
        location: DEFAULT_LOCATION_LABEL,
        views: (p.views_count || 0).toString(),
        rating: p.rating || 4.5,
        verified: true,
        badge: { text: "New", variant: "green" as const }
      };
    });
  };

  const mapVendors = (vendors: any[]) => {
    return vendors.map(v => ({
      id: v.id,
      image: v.avatar_url || v.logo_url || "/image-1.png",
      title: v.business_name || 'Vendor',
      price: "100+ Products",
      vendor: v.business_name || 'Vendor',
      vendorImage: v.avatar_url || v.logo_url || "/image-1.png",
      location: v.market_location || v.business_address || DEFAULT_LOCATION_LABEL,
      views: "1k",
      rating: v.rating || 5,
      verified: v.verification_status === 'verified',
      badge: { text: "Top Rated", variant: "yellow" as const }
    }));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (location) params.set('location', location);
    if (selectedCategory !== 'All Categories') params.set('category', selectedCategory);
    navigate(`/search?${params.toString()}`);
  };

  return (
    <section className="flex flex-col w-full bg-neutral-50">
      {/* Hero Banner (Split Layout) */}
      <div className="relative w-full bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-20 lg:py-24 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Column - Text & Search */}
          <div className="relative z-10">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-primary-50 rounded-full px-4 py-2 mb-6 shadow-sm border border-primary-100">
              <Sparkles className="w-4 h-4 text-primary-500" />
              <span className="font-sans text-sm font-medium text-primary-700">Nigeria's #1 Marketplace</span>
            </div>

            {/* Headline */}
            <h1 className="font-heading font-bold text-4xl md:text-5xl lg:text-6xl text-neutral-900 leading-tight mb-6 animate-slide-up-fade">
              Discover & Shop from <br className="hidden lg:block"/> <span className="text-gradient-primary">Local Vendors</span>
            </h1>

            {/* Subheadline */}
            <p className="font-sans text-lg md:text-xl text-neutral-600 mb-8 animate-slide-up-fade stagger-2">
              Connect with trusted vendors, find authentic Nigerian products, and enjoy seamless shopping with secure payments.
            </p>

            {/* Become a Vendor CTA (Integrated) */}
            <div className="mb-10 flex items-center gap-4 animate-slide-up-fade stagger-3">
              <span className="font-sans text-neutral-600 font-medium">Want to sell your products?</span>
              <Button onClick={() => navigate('/vendor/register')} className="bg-primary-600 hover:bg-primary-700 text-white rounded-full px-6 py-2 shadow-md hover:shadow-lg transition-all">
                Become a Vendor
              </Button>
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="animate-slide-up-fade stagger-4 relative z-20">
              <div className="bg-white rounded-2xl shadow-premium border border-neutral-100 p-2 flex flex-col md:flex-row items-stretch gap-2">
                {/* Search Input */}
                <div className="flex items-center gap-3 flex-1 px-4 py-3 border-b md:border-b-0 md:border-r border-neutral-100">
                  <SearchIcon className="w-5 h-5 text-neutral-400 flex-shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products..."
                    className="w-full font-sans text-sm md:text-base text-neutral-900 placeholder-neutral-400 outline-none bg-transparent"
                  />
                </div>

                {/* Location Input */}
                <div className="flex items-center gap-3 flex-1 px-4 py-3 border-b md:border-b-0 md:border-r border-neutral-100">
                  <LocationPicker
                    variant="search"
                    placeholder="Detecting location..."
                    initialLocation={location ? { address: location, lat: 0, lng: 0 } : undefined}
                    onLocationSelect={(loc) => {
                      setLocation(loc.address);
                      if (loc.lat && loc.lng) {
                        setUserLocationCoords({ lat: loc.lat, lng: loc.lng });
                      }
                    }}
                    className="w-full"
                  />
                </div>

                {/* Category Dropdown */}
                <div className="flex items-center gap-3 flex-1 px-4 py-3">
                  <PackageIcon className="w-5 h-5 text-neutral-400 flex-shrink-0" />
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full font-sans text-sm md:text-base text-neutral-900 outline-none bg-transparent cursor-pointer"
                  >
                    <option value="All Categories">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.title}</option>
                    ))}
                  </select>
                </div>

                {/* Search Button */}
                <Button type="submit" className="h-12 md:h-auto px-8 bg-gradient-primary text-white font-bold rounded-xl md:rounded-r-xl md:rounded-l-none text-base hover:shadow-glow transition-all duration-300">
                  Search
                </Button>
              </div>
            </form>

            {/* Quick Links */}
            <div className="flex flex-wrap items-center gap-3 mt-6 animate-slide-up-fade stagger-5">
              <span className="font-sans text-sm text-neutral-500">Popular:</span>
              {['electronics', 'fashion', 'food-beverages', 'home-office'].map((id) => (
                <button
                  key={id}
                  onClick={() => navigate(`/products?category=${id}`)}
                  className="px-4 py-1.5 bg-neutral-50 border border-neutral-200 rounded-full font-sans text-xs font-medium text-neutral-600 hover:bg-primary-50 hover:text-primary-700 hover:border-primary-200 transition-colors"
                >
                  {categories.find(c => c.id === id)?.title || id}
                </button>
              ))}
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 pt-8 border-t border-neutral-100 animate-slide-up-fade stagger-6">
              {stats.map((stat, index) => (
                <div key={index} className="text-left">
                  <p className="font-heading font-bold text-2xl text-neutral-900">{stat.value}</p>
                  <p className="font-sans text-xs text-neutral-500">{stat.label}</p>
                </div>
              ))}
            </div>

          </div>

          {/* Right Column - Image */}
          <div className="relative hidden lg:block animate-fade-in h-[600px] w-full">
            {/* Decorative background shape */}
            <div className="absolute inset-0 bg-primary-100/50 rounded-[40px] transform translate-x-6 translate-y-6"></div>
            
            <img 
              src="/hero_shopping.jpg" 
              alt="Vibrant Nigerian Marketplace" 
              className="relative z-10 w-full h-full object-cover rounded-[40px] shadow-2xl"
            />
            
            {/* Floating UI Elements */}
            <div className="absolute top-12 -left-8 z-20 bg-white p-4 rounded-xl shadow-xl animate-float">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-neutral-500 font-medium">Fastest Delivery</p>
                  <p className="font-bold text-neutral-900">Same Day</p>
                </div>
              </div>
            </div>
            
            <div className="absolute bottom-20 -right-8 z-20 bg-white p-4 rounded-xl shadow-xl animate-float" style={{ animationDelay: '1.5s' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <p className="text-xs text-neutral-500 font-medium">Local Vendors</p>
                  <p className="font-bold text-neutral-900">10,000+ Near You</p>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </div>

      {/* Categories Section */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-16">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="font-heading font-bold text-neutral-900 text-2xl md:text-3xl">Shop by Category</h2>
            <p className="font-sans text-neutral-500 mt-1">Explore products across all categories</p>
          </div>
          <Button variant="ghost" onClick={() => navigate('/categories')} className="text-primary-600 hover:text-primary-700 font-medium hidden md:flex">
            View All Categories <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {categories.map((category, index) => (
            <Card
              key={index}
              onClick={() => navigate(`/products?category=${encodeURIComponent(category.id)}`)}
              className="group cursor-pointer border border-neutral-100 shadow-sm hover:shadow-md hover:border-primary-100 transition-all duration-300 bg-white"
            >
              <CardContent className="flex flex-col items-center justify-center p-6 gap-4">
                <div className={`w-16 h-16 ${category.color} bg-opacity-10 rounded-full flex items-center justify-center group-hover:scale-110 group-hover:bg-opacity-20 transition-all duration-300`}>
                  <category.icon className={`w-8 h-8 ${category.color.replace('bg-', 'text-')}`} />
                </div>
                <h3 className="font-sans font-medium text-neutral-800 text-sm text-center group-hover:text-primary-600 transition-colors">
                  {category.title}
                </h3>
              </CardContent>
            </Card>
          ))}
        </div>
        <Button variant="outline" onClick={() => navigate('/categories')} className="w-full mt-6 text-primary-600 hover:text-primary-700 font-medium md:hidden">
            View All Categories <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      {/* Product Sections */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 pb-20">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>
        ) : (
          <div className="space-y-16">
            {nearbyVendors.length > 0 && <ProductGrid title="Vendors Near You" products={nearbyVendors} />}
            {freshRecommendations.length > 0 && <ProductGrid title="Fresh Recommendations" products={freshRecommendations} />}
            {topVendorsList.length > 0 && <ProductGrid title="Top Local Vendors" products={topVendorsList} />}
            {electronics.length > 0 && <ProductGrid title="Electronics & Gadgets" products={electronics} />}
            {fashion.length > 0 && <ProductGrid title="Fashion & Apparel" products={fashion} />}
            {homeOffice.length > 0 && <ProductGrid title="Home & Office" products={homeOffice} />}
            {groceries.length > 0 && <ProductGrid title="Groceries & Food" products={groceries} />}
          </div>
        )}
      </div>
    </section>
  );
};
