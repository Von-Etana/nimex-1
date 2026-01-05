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
import { Loader2 } from "lucide-react";

const categories = [
  { icon: TvIcon, title: "Electronics", color: "bg-blue-500" },
  { icon: ShirtIcon, title: "Fashion", color: "bg-pink-500" },
  { icon: HouseIcon, title: "Home & Office", color: "bg-amber-500" },
  { icon: UtensilsIcon, title: "Groceries", color: "bg-green-500" },
  { icon: BookOpenIcon, title: "Books", color: "bg-purple-500" },
  { icon: Flower2Icon, title: "Health & Beauty", color: "bg-rose-500" },
  { icon: CarIcon, title: "Automotive", color: "bg-slate-600" },
  { icon: DumbbellIcon, title: "Sports", color: "bg-orange-500" },
  { icon: BabyIcon, title: "Baby & Kids", color: "bg-cyan-500" },
  { icon: FlaskConicalIcon, title: "Chemicals", color: "bg-indigo-500" },
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
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [freshRecommendations, setFreshRecommendations] = useState<any[]>([]);
  const [topVendorsList, setTopVendorsList] = useState<any[]>([]);
  const [electronics, setElectronics] = useState<any[]>([]);
  const [fashion, setFashion] = useState<any[]>([]);
  const [homeOffice, setHomeOffice] = useState<any[]>([]);
  const [groceries, setGroceries] = useState<any[]>([]);

  React.useEffect(() => {
    fetchHomeData();
  }, []);

  const fetchHomeData = async () => {
    try {
      setLoading(true);

      // Fetch Fresh Recommendations
      const fresh = await FirestoreService.getDocuments<any>(COLLECTIONS.PRODUCTS, {
        filters: [{ field: 'is_active', operator: '==', value: true }],
        orderByField: 'created_at',
        orderByDirection: 'desc',
        limitCount: 6
      });
      setFreshRecommendations(mapProducts(fresh));

      // Fetch Top Vendors
      const vendors = await FirestoreService.getDocuments<any>(COLLECTIONS.VENDORS, {
        filters: [{ field: 'is_active', operator: '==', value: true }],
        limitCount: 6
      });
      setTopVendorsList(mapVendors(vendors));

      setElectronics(mapProducts(fresh));
      setFashion(mapProducts(fresh));
      setHomeOffice(mapProducts(fresh));
      setGroceries(mapProducts(fresh));

    } catch (error) {
      console.error("Error fetching home data:", error);
    } finally {
      setLoading(false);
    }
  };

  const mapProducts = (products: any[]) => {
    return products.map(p => ({
      image: p.image_url || "https://via.placeholder.com/150",
      title: p.name,
      price: `₦ ${p.price.toLocaleString()}`,
      vendor: "Vendor",
      vendorImage: "https://via.placeholder.com/50",
      location: "Lagos",
      views: "100",
      rating: 4.5,
      verified: true,
      badge: { text: "New", variant: "green" as const }
    }));
  };

  const mapVendors = (vendors: any[]) => {
    return vendors.map(v => ({
      image: v.logo_url || "https://via.placeholder.com/150",
      title: v.business_name,
      price: "100+ Products",
      vendor: v.business_name,
      vendorImage: v.logo_url || "https://via.placeholder.com/50",
      location: v.market_location || "Lagos",
      views: "1k",
      rating: 5,
      verified: true,
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
    <section className="flex flex-col w-full">
      {/* Hero Banner */}
      <div className="relative w-full bg-gradient-hero bg-gradient-mesh overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-20 right-20 w-72 h-72 bg-primary-200/30 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-green-200/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-1/4 w-4 h-4 bg-primary-500 rounded-full animate-pulse" />
        <div className="absolute top-1/3 left-1/4 w-3 h-3 bg-amber-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
        <div className="absolute bottom-1/3 right-1/3 w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />

        <div className="relative max-w-7xl mx-auto px-4 md:px-6 py-16 md:py-24 lg:py-32">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 mb-6 shadow-sm border border-primary-100">
              <Sparkles className="w-4 h-4 text-primary-500" />
              <span className="font-sans text-sm font-medium text-primary-700">Nigeria's #1 Marketplace</span>
            </div>

            {/* Headline */}
            <h1 className="font-heading font-bold text-4xl md:text-5xl lg:text-6xl xl:text-7xl text-neutral-900 leading-tight mb-6 animate-slide-up-fade">
              Discover & Shop from{" "}
              <span className="text-gradient-primary">Local Vendors</span>
            </h1>

            {/* Subheadline */}
            <p className="font-sans text-lg md:text-xl text-neutral-600 mb-10 max-w-2xl mx-auto animate-slide-up-fade stagger-2">
              Connect with trusted vendors, find authentic Nigerian products, and enjoy seamless shopping with secure payments
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="animate-slide-up-fade stagger-3">
              <div className="bg-white rounded-2xl md:rounded-full shadow-premium-lg p-2 flex flex-col md:flex-row items-stretch md:items-center gap-2 max-w-4xl mx-auto">
                {/* Search Input */}
                <div className="flex items-center gap-3 flex-1 px-4 py-3 border-b md:border-b-0 md:border-r border-neutral-100">
                  <SearchIcon className="w-5 h-5 text-primary-500 flex-shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for products..."
                    className="w-full font-sans text-sm md:text-base text-neutral-900 placeholder-neutral-400 outline-none bg-transparent"
                  />
                </div>

                {/* Location Input */}
                <div className="flex items-center gap-3 flex-1 px-4 py-3 border-b md:border-b-0 md:border-r border-neutral-100">
                  <MapPin className="w-5 h-5 text-primary-500 flex-shrink-0" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Location"
                    className="w-full font-sans text-sm md:text-base text-neutral-900 placeholder-neutral-400 outline-none bg-transparent"
                  />
                </div>

                {/* Category Select */}
                <div className="flex items-center gap-3 flex-1 px-4 py-3">
                  <PackageIcon className="w-5 h-5 text-primary-500 flex-shrink-0" />
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full font-sans text-sm md:text-base text-neutral-900 outline-none bg-transparent cursor-pointer"
                  >
                    <option>All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat.title}>{cat.title}</option>
                    ))}
                  </select>
                </div>

                {/* Search Button */}
                <Button
                  type="submit"
                  className="h-12 md:h-14 px-8 bg-gradient-primary text-white font-sans font-bold rounded-xl md:rounded-full text-base shadow-lg hover:shadow-glow transition-all duration-300 flex-shrink-0 btn-shine"
                >
                  <SearchIcon className="w-5 h-5 mr-2" />
                  Search
                </Button>
              </div>
            </form>

            {/* Quick Links */}
            <div className="flex flex-wrap items-center justify-center gap-3 mt-8 animate-slide-up-fade stagger-4">
              <span className="font-sans text-sm text-neutral-500">Popular:</span>
              {['Electronics', 'Fashion', 'Groceries', 'Home'].map((term) => (
                <button
                  key={term}
                  onClick={() => navigate(`/products?category=${term}`)}
                  className="px-4 py-2 bg-white/80 backdrop-blur-sm border border-neutral-200 rounded-full font-sans text-sm font-medium text-neutral-700 hover:bg-primary-50 hover:border-primary-200 hover:text-primary-700 transition-all duration-200"
                >
                  {term}
                </button>
              ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mt-16 animate-slide-up-fade stagger-5">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <p className="font-heading font-bold text-2xl md:text-3xl text-neutral-900">{stat.value}</p>
                  <p className="font-sans text-sm text-neutral-500 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Categories Section */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-heading font-bold text-neutral-900 text-2xl md:text-3xl">
              Shop by Category
            </h2>
            <p className="font-sans text-neutral-500 mt-1">Explore products across all categories</p>
          </div>
          <Button
            variant="ghost"
            onClick={() => navigate('/categories')}
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            View All
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        <div className="grid grid-cols-5 md:grid-cols-10 gap-3">
          {categories.map((category, index) => (
            <Card
              key={index}
              onClick={() => navigate(`/products?category=${encodeURIComponent(category.title)}`)}
              className="group cursor-pointer border-0 shadow-sm hover:shadow-premium hover:-translate-y-1 transition-all duration-300"
            >
              <CardContent className="flex flex-col items-center justify-center p-4 gap-2">
                <div className={`w-12 h-12 ${category.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  <category.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-sans font-medium text-neutral-700 text-[10px] md:text-xs text-center line-clamp-2 group-hover:text-primary-600 transition-colors">
                  {category.title}
                </h3>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Featured CTA Banner */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 pb-12">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-primary p-8 md:p-12">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl" />

          <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <h3 className="font-heading font-bold text-white text-2xl md:text-3xl mb-2">
                Become a Vendor Today
              </h3>
              <p className="font-sans text-white/80 max-w-md">
                Join thousands of successful vendors. Start selling and grow your business with NIMEX.
              </p>
            </div>
            <Button
              onClick={() => navigate('/vendor/register')}
              className="bg-white text-primary-600 hover:bg-neutral-100 font-bold px-8 py-3 rounded-xl shadow-lg btn-shine flex-shrink-0"
            >
              Start Selling
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </div>

      {/* Product Sections */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
              <p className="font-sans text-neutral-500">Loading products...</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-16">
            <ProductGrid
              title="Fresh Recommendations"
              subtitle="Newly added products you might love"
              products={freshRecommendations}
            />
            <ProductGrid
              title="Top Vendors"
              subtitle="Trusted sellers with excellent ratings"
              products={topVendorsList}
            />
            <ProductGrid
              title="Trending in Electronics"
              subtitle="Popular gadgets and devices"
              products={electronics}
              icon={<TrendingUp className="w-5 h-5 text-blue-500" />}
            />
            <ProductGrid
              title="Fashion & Style"
              subtitle="Trendy apparel and accessories"
              products={fashion}
            />
          </div>
        )}
      </div>
    </section>
  );
};
