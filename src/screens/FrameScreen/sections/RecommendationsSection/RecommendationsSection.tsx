import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../../../../components/ui/button";
import { Card, CardContent } from "../../../../components/ui/card";
import { Separator } from "../../../../components/ui/separator";
import { ProductCard } from "../../../../components/products/ProductCard";
import { recommendationService, ProductRecommendation, VendorRanking } from "../../../../services/recommendationService";
import { Loader2, Star, MapPin, TrendingUp, Clock } from "lucide-react";
import { FirestoreService } from "../../../../services/firestore.service";
import { COLLECTIONS } from "../../../../lib/collections";

const socialIcons = [
  { src: "/container-3.svg", alt: "Facebook" },
  { src: "/container-2.svg", alt: "Instagram" },
  { src: "/container-1.svg", alt: "YouTube" },
  { src: "/container.svg", alt: "LinkedIn" },
  { src: "/container-4.svg", alt: "TikTok" },
];

const footerLinks = [
  {
    title: "Product",
    links: [
      { label: "Electronics", path: "/categories" },
      { label: "Fashion", path: "/categories" },
      { label: "Home & Office", path: "/categories" },
      { label: "Groceries", path: "/categories" },
      { label: "Books", path: "/categories" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Blog", path: "/blog" },
      { label: "FAQ", path: "/faq" },
      { label: "Support", path: "/contact" },
      { label: "Developers", path: "/contact" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", path: "/about" },
      { label: "Terms & Conditions", path: "/terms" },
      { label: "Contact Us", path: "/contact" },
      { label: "Privacy Policy", path: "/privacy" },
    ],
  },
];

export const RecommendationsSection = (): JSX.Element => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [trendingProducts, setTrendingProducts] = useState<ProductRecommendation[]>([]);
  const [topVendors, setTopVendors] = useState<VendorRanking[]>([]);
  const [freshRecommendations, setFreshRecommendations] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch Trending Products
      const trending = await recommendationService.getTrendingProducts(4);
      setTrendingProducts(trending);

      // Fetch Top Vendors
      const vendors = await recommendationService.getTopVendors(4);
      setTopVendors(vendors);

      // Fetch Fresh Recommendations (New Arrivals)
      // Fetch all products and filter client-side to handle both is_active and status fields
      const allProducts = await FirestoreService.getDocuments<any>(COLLECTIONS.PRODUCTS, {
        orderByField: 'created_at',
        orderByDirection: 'desc',
        limitCount: 20  // Fetch more to filter from
      });

      // Filter for active products: is_active=true OR status='active'
      const activeProducts = (allProducts || [])
        .filter(p => p.is_active === true || p.status === 'active')
        .slice(0, 4);

      // Transform products to match ProductCard interface
      const transformedProducts = activeProducts.map(p => ({
        id: p.id,
        name: p.title || p.name || 'Untitled Product',
        price: p.price || 0,
        originalPrice: p.compare_at_price || undefined,
        image: p.image_url || (p.images && p.images[0]) || '/placeholder.png',
        images: p.images || [],
        vendor: p.vendor_name || 'Vendor',
        vendorId: p.vendor_id || '',
        rating: p.rating || 0,
        reviews: p.reviews_count || 0,
        category: p.category_name || 'General',
        inStock: (p.stock_quantity || 0) > 0,
        discount: p.compare_at_price ? Math.round(((p.compare_at_price - p.price) / p.compare_at_price) * 100) : undefined,
        tags: p.tags || [],
        video_url: p.video_url,
        location: p.location,
        isVerified: p.is_verified || false
      }));

      setFreshRecommendations(transformedProducts);

    } catch (error) {
      console.error("Error fetching recommendations:", error);
    } finally {
      setLoading(false);
    }
  };

  const VendorCard = ({ vendor, ranking }: { vendor: any, ranking: VendorRanking }) => (
    <div
      onClick={() => navigate(`/vendor/${vendor.id}`)}
      className="bg-white border border-neutral-200 rounded-xl p-4 hover:shadow-md transition-all cursor-pointer group"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 rounded-full bg-neutral-100 overflow-hidden">
          {vendor.logo_url ? (
            <img src={vendor.logo_url} alt={vendor.business_name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-neutral-400 font-bold text-lg">
              {vendor.business_name?.charAt(0)}
            </div>
          )}
        </div>
        <div>
          <h3 className="font-heading font-bold text-neutral-900 text-sm group-hover:text-primary-600 transition-colors">
            {vendor.business_name}
          </h3>
          <div className="flex items-center gap-1 text-xs text-neutral-600">
            <MapPin className="w-3 h-3" />
            <span>{vendor.market_location || 'Lagos, Nigeria'}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-neutral-600 border-t border-neutral-100 pt-3">
        <div className="flex items-center gap-1">
          <Star className="w-3 h-3 text-yellow-400 fill-current" />
          <span className="font-medium text-neutral-900">{ranking.metrics.rating.toFixed(1)}</span>
        </div>
        <div className="flex items-center gap-1">
          <TrendingUp className="w-3 h-3 text-green-600" />
          <span>{ranking.metrics.totalSales} Sales</span>
        </div>
      </div>
    </div>
  );

  return (
    <section className="flex flex-col items-center gap-10 w-full py-10 bg-neutral-50">

      {/* Fresh Recommendations */}
      <div className="w-full max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-heading font-bold text-2xl md:text-3xl text-neutral-900">
              Fresh Recommendations
            </h2>
            <p className="text-neutral-600 mt-1">New arrivals just for you</p>
          </div>
          <Button variant="outline" onClick={() => navigate('/products?sort=newest')}>
            View All
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin" /></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {freshRecommendations.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>

      {/* Trending Products */}
      <div className="w-full max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-heading font-bold text-2xl md:text-3xl text-neutral-900">
              Trending Now
            </h2>
            <p className="text-neutral-600 mt-1">Most popular products this week</p>
          </div>
          <Button variant="outline" onClick={() => navigate('/products?sort=popular')}>
            View All
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin" /></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {trendingProducts.map((item) => (
              <ProductCard key={item.product.id} product={item.product} />
            ))}
          </div>
        )}
      </div>

      {/* Top Vendors */}
      <div className="w-full max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-heading font-bold text-2xl md:text-3xl text-neutral-900">
              Top Vendors
            </h2>
            <p className="text-neutral-600 mt-1">Best rated sellers on Nimex</p>
          </div>
          <Button variant="outline" onClick={() => navigate('/vendors')}>
            View All
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin" /></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {topVendors.map((ranking) => (
              <VendorCard key={ranking.vendor.id} vendor={ranking.vendor} ranking={ranking} />
            ))}
          </div>
        )}
      </div>

      {/* CTA Card */}
      <Card className="w-full max-w-[752px] bg-[#fff9e6] rounded-2xl border-none shadow-none mx-4">
        <CardContent className="flex flex-col items-center gap-6 p-10">
          <h2 className="font-heading font-bold text-[#19191f] text-3xl md:text-4xl text-center leading-tight">
            Unlock Your Business Potential
          </h2>

          <p className="font-sans font-normal text-[#19191f] text-lg text-center opacity-90 max-w-[672px]">
            Join NIMEX's thriving community of vendors. Sell your products,
            reach a wider audience, and grow your business with ease.
          </p>

          <Link to="/signup">
            <Button
              className="h-11 px-8 bg-gray-100 hover:bg-gray-200 text-[#323742] rounded-[10px] font-medium text-sm"
              variant="secondary"
            >
              Start Selling Today
            </Button>
          </Link>
        </CardContent>
      </Card>

      <footer className="w-full bg-[#fafafb] py-8 md:py-11 mt-10">
        <div className="w-full max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row justify-between gap-8 md:gap-12">
            <div className="flex gap-4 justify-center md:justify-start">
              {socialIcons.map((icon, index) => (
                <button
                  key={index}
                  className="w-5 h-5 flex items-center justify-center hover:opacity-70 transition-opacity"
                  aria-label={icon.alt}
                >
                  <img className="w-5 h-5" alt={icon.alt} src={icon.src} />
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 md:gap-12 lg:gap-20">
              {footerLinks.map((section, sectionIndex) => (
                <nav key={sectionIndex} className="flex flex-col gap-4">
                  <h3 className="font-heading font-semibold text-[#171a1f] text-base">
                    {section.title}
                  </h3>
                  <ul className="flex flex-col gap-2">
                    {section.links.map((link, linkIndex) => (
                      <li key={linkIndex}>
                        <Link
                          to={link.path}
                          className="font-sans font-normal text-[#171a1f] text-sm opacity-80 hover:opacity-100 transition-opacity"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </nav>
              ))}
            </div>
          </div>

          <Separator className="mt-8 md:mt-12 bg-[#e5e5e5]" />

          <div className="mt-6 text-center md:text-left">
            <p className="font-sans font-normal text-[#171a1f] text-sm opacity-60">
              © 2025 NIMEX. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </section>
  );
};
