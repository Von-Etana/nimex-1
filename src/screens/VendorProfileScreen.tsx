import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Store,
  MapPin,
  Star,
  ShieldCheck,
  Share2,
  Search,
  Package,
  Clock,
  CheckCircle2,
  MessageCircle,
  ArrowLeft,
  ShoppingBag,
  Award,
  Building2,
  Check
} from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { FirestoreService } from '../services/firestore.service';
import { COLLECTIONS } from '../lib/collections';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { where, limit } from 'firebase/firestore';

interface VendorData {
  id: string;
  business_name?: string;
  business_description?: string;
  business_address?: string;
  business_phone?: string;
  market_id?: string;
  market_location?: string;
  market_location_details?: string;
  avatar_url?: string;
  logo_url?: string;
  banner_url?: string;
  rating?: number;
  cac_number?: string;
  is_verified?: boolean;
  total_sales?: number;
  created_at?: any;
}

interface Product {
  id: string;
  title: string;
  name?: string;
  price: number;
  compare_at_price?: number | null;
  stock_quantity: number;
  images?: string[];
  image_url?: string;
  category_id?: string;
  category?: string;
  description?: string;
  vendor_id?: string;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  buyer_name?: string;
  created_at?: any;
}

export const VendorProfileScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [vendor, setVendor] = useState<VendorData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [marketName, setMarketName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'products' | 'reviews'>('products');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (id) {
      loadVendorStore(id);
    }
  }, [id]);

  const loadVendorStore = async (vendorId: string) => {
    try {
      setLoading(true);

      // 1. Fetch Vendor Details
      const vendorDoc = await FirestoreService.getDocument<VendorData>(COLLECTIONS.VENDORS, vendorId);
      if (vendorDoc) {
        setVendor(vendorDoc);

        // Fetch market name if market_id exists
        if (vendorDoc.market_id) {
          try {
            const marketDoc = await FirestoreService.getDocument<any>(COLLECTIONS.MARKETS, vendorDoc.market_id);
            if (marketDoc?.name) {
              setMarketName(marketDoc.name);
            }
          } catch (e) {
            console.error('Error fetching market details:', e);
          }
        }
      }

      // 2. Fetch Vendor Products
      const productsData = await FirestoreService.getDocuments<Product>(COLLECTIONS.PRODUCTS, [
        where('vendor_id', '==', vendorId),
        where('is_active', '==', true),
        limit(100)
      ]);
      setProducts(productsData || []);

      // 3. Fetch Vendor Reviews
      try {
        const reviewsData = await FirestoreService.getDocuments<Review>(COLLECTIONS.REVIEWS, [
          where('vendor_id', '==', vendorId),
          limit(30)
        ]);
        setReviews(reviewsData || []);
      } catch (err) {
        console.warn('Reviews collection query fallback:', err);
      }
    } catch (err) {
      console.error('Error loading vendor store:', err);
    } finally {
      setLoading(false);
    }
  };

  // Derive unique categories from products
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      const cat = p.category || p.category_id;
      if (cat) set.add(cat);
    });
    return Array.from(set);
  }, [products]);

  // Filter products by search query and category
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const title = (p.title || p.name || '').toLowerCase();
      const desc = (p.description || '').toLowerCase();
      const matchesSearch = !searchQuery.trim() || title.includes(searchQuery.toLowerCase()) || desc.includes(searchQuery.toLowerCase());
      
      const itemCat = p.category || p.category_id || 'other';
      const matchesCategory = selectedCategory === 'all' || itemCat.toLowerCase() === selectedCategory.toLowerCase();

      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  const handleShareStore = async () => {
    const storeUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: vendor?.business_name || 'NIMEX Verified Vendor Store',
          text: `Shop directly from ${vendor?.business_name || 'this vendor'} on NIMEX with 100% Escrow Protection:`,
          url: storeUrl,
        });
        return;
      } catch (e) {
        // Fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(storeUrl);
      setCopiedLink(true);
      showToast('Store link copied to clipboard!', 'success');
      setTimeout(() => setCopiedLink(false), 3000);
    } catch (err) {
      showToast('Failed to copy link', 'error');
    }
  };

  const handleWhatsAppChat = () => {
    if (!vendor) return;
    const phone = vendor.business_phone ? vendor.business_phone.replace(/\D/g, '') : '';
    const cleanPhone = phone.startsWith('0') ? `234${phone.slice(1)}` : phone.startsWith('234') ? phone : `234${phone}`;
    const storeUrl = window.location.href;
    const message = encodeURIComponent(
      `Hello ${vendor.business_name || 'Seller'}, I'm viewing your store on NIMEX (${storeUrl}). I'm interested in your items!`
    );

    if (cleanPhone && cleanPhone.length >= 10) {
      window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
    } else {
      showToast('Vendor phone number is not available for WhatsApp', 'info');
    }
  };

  const handleAddToCart = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.stock_quantity <= 0) {
      showToast('This item is currently out of stock', 'error');
      return;
    }

    try {
      const cartJson = localStorage.getItem('nimex_cart');
      const existingCart = cartJson ? JSON.parse(cartJson) : [];
      const image = product.images?.[0] || product.image_url || '/placeholder.png';

      const existingIndex = existingCart.findIndex((item: any) => item.product_id === product.id);
      if (existingIndex >= 0) {
        existingCart[existingIndex].quantity += 1;
      } else {
        existingCart.push({
          id: Date.now().toString(),
          product_id: product.id,
          title: product.title || product.name,
          price: product.price,
          image: image,
          vendor_id: vendor?.id || product.vendor_id || '',
          vendor_name: vendor?.business_name || 'Vendor Store',
          quantity: 1
        });
      }

      localStorage.setItem('nimex_cart', JSON.stringify(existingCart));
      window.dispatchEvent(new Event('cartUpdated'));
      showToast('Added to cart!', 'success');
    } catch (err) {
      console.error('Error adding to cart:', err);
      showToast('Could not add to cart', 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-sans text-neutral-600 font-medium">Loading store details...</p>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="min-h-[70vh] max-w-2xl mx-auto px-4 py-16 text-center">
        <Store className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
        <h2 className="text-2xl font-heading font-bold text-neutral-900 mb-2">Store Not Found</h2>
        <p className="text-neutral-600 mb-6">
          The vendor profile you are looking for does not exist or may have been deactivated.
        </p>
        <Button onClick={() => navigate('/vendors')} className="bg-primary-600 hover:bg-primary-700 text-white">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Browse Active Vendors
        </Button>
      </div>
    );
  }

  const businessName = vendor.business_name || 'Verified NIMEX Vendor';
  const avatarUrl = vendor.avatar_url || vendor.logo_url || '/image-1.png';
  const ratingValue = vendor.rating || (reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length) : 5.0);
  const locationText = vendor.market_location_details
    ? `${vendor.market_location_details}, ${marketName || vendor.market_location || vendor.business_address || 'Lagos, Nigeria'}`
    : marketName || vendor.market_location || vendor.business_address || 'Lagos, Nigeria';

  return (
    <div className="w-full min-h-screen bg-neutral-50 pb-16">
      {/* Hero Storefront Banner */}
      <div className="relative w-full h-48 md:h-64 bg-primary-900 overflow-hidden">
        {vendor.banner_url ? (
          <img src={vendor.banner_url} alt={businessName} className="w-full h-full object-cover opacity-60" />
        ) : (
          <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: "url('/image.png')" }} />
        )}
        <div className="absolute inset-0 bg-black/40" />
        
        {/* Back Link & Share Button */}
        <div className="absolute top-4 left-4 right-4 max-w-7xl mx-auto flex items-center justify-between z-10">
          <Link
            to="/vendors"
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md text-white font-sans text-xs md:text-sm font-medium transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>All Vendors</span>
          </Link>
          <button
            onClick={handleShareStore}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md text-white font-sans text-xs md:text-sm font-medium transition-all"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            <span>{copiedLink ? 'Link Copied!' : 'Share Store'}</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-16 md:-mt-20 relative z-10">
        {/* Vendor Header Card */}
        <Card className="border border-neutral-200/80 shadow-md bg-white rounded-2xl overflow-hidden mb-6">
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              {/* Profile Details */}
              <div className="flex items-start gap-4 md:gap-6">
                <div className="relative flex-shrink-0">
                  <img
                    src={avatarUrl}
                    alt={businessName}
                    className="w-20 h-20 md:w-28 md:h-28 rounded-2xl object-cover border-4 border-white shadow-md bg-neutral-100"
                  />
                  <div className="absolute -bottom-1 -right-1 bg-primary-600 text-white p-1 rounded-full border-2 border-white shadow-sm" title="NIMEX Verified">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>

                <div className="flex flex-col">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <h1 className="text-xl md:text-3xl font-heading font-bold text-neutral-900 leading-tight">
                      {businessName}
                    </h1>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Verified Merchant
                    </span>
                    {vendor.cac_number && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800" title={`CAC: ${vendor.cac_number}`}>
                        <Building2 className="w-3.5 h-3.5" />
                        CAC: {vendor.cac_number}
                      </span>
                    )}
                  </div>

                  {/* Physical Market Location */}
                  <div className="flex items-center gap-1.5 text-neutral-600 text-xs md:text-sm font-medium mb-3">
                    <MapPin className="w-4 h-4 text-primary-600 flex-shrink-0" />
                    <span>{locationText}</span>
                  </div>

                  {/* Rating and Response SLA */}
                  <div className="flex flex-wrap items-center gap-4 text-xs md:text-sm text-neutral-600">
                    <div className="flex items-center gap-1.5 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/60">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span className="font-bold text-neutral-900">{ratingValue.toFixed(1)}</span>
                      <span className="text-neutral-500">({reviews.length} reviews)</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-neutral-600">
                      <Clock className="w-4 h-4 text-emerald-600" />
                      <span>Replies in &lt; 30 mins</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-neutral-600">
                      <Award className="w-4 h-4 text-primary-600" />
                      <span>{products.length} Products listed</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch md:items-center gap-3 w-full md:w-auto">
                <Button
                  onClick={handleWhatsAppChat}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 px-5 rounded-xl shadow-sm flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  Chat on WhatsApp
                </Button>
                <Button
                  onClick={() => {
                    if (!user) {
                      navigate('/login');
                      return;
                    }
                    navigate(`/chat/${vendor.id}`);
                  }}
                  variant="outline"
                  className="border-neutral-300 hover:bg-neutral-100 text-neutral-800 font-semibold py-2.5 px-5 rounded-xl flex items-center justify-center gap-2"
                >
                  <Store className="w-4 h-4" />
                  In-App Message
                </Button>
              </div>
            </div>

            {/* Business Bio / Description */}
            {vendor.business_description && (
              <div className="mt-5 pt-5 border-t border-neutral-100">
                <p className="font-sans text-neutral-600 text-sm leading-relaxed max-w-4xl">
                  {vendor.business_description}
                </p>
              </div>
            )}

            {/* Escrow Buyer Protection Warning Box */}
            <div className="mt-5 p-3.5 bg-emerald-50/80 border border-emerald-200/80 rounded-xl flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
              <div className="text-xs md:text-sm text-emerald-900 leading-snug">
                <strong className="font-semibold text-emerald-950">NIMEX Escrow Protection Guaranteed: </strong>
                When ordering from {businessName}, always checkout and pay on NIMEX. Your funds remain safely in escrow until you inspect and accept your items. Never make direct personal bank transfers to sellers.
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Store Tabs (Products vs Reviews) */}
        <div className="flex items-center gap-6 border-b border-neutral-200 mb-6">
          <button
            onClick={() => setActiveTab('products')}
            className={`pb-3 font-heading font-semibold text-sm md:text-base border-b-2 transition-all ${
              activeTab === 'products'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            Products ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`pb-3 font-heading font-semibold text-sm md:text-base border-b-2 transition-all ${
              activeTab === 'reviews'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            Customer Reviews ({reviews.length})
          </button>
        </div>

        {/* Tab 1: Products Content */}
        {activeTab === 'products' && (
          <div>
            {/* Search and Category Filter Toolbar */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6">
              {/* In-store search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder={`Search ${businessName}'s store...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedCategory === 'all'
                      ? 'bg-primary-600 text-white'
                      : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-100'
                  }`}
                >
                  All Items ({products.length})
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold capitalize whitespace-nowrap transition-all ${
                      selectedCategory.toLowerCase() === cat.toLowerCase()
                        ? 'bg-primary-600 text-white'
                        : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-100'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Products Grid */}
            {filteredProducts.length === 0 ? (
              <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center">
                <Package className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
                <h3 className="font-heading font-semibold text-lg text-neutral-900 mb-1">No products found</h3>
                <p className="font-sans text-sm text-neutral-500 max-w-md mx-auto mb-4">
                  {searchQuery || selectedCategory !== 'all'
                    ? 'No products matched your search or category filter. Try clearing your filters.'
                    : 'This vendor has not listed any active products yet.'}
                </p>
                {(searchQuery || selectedCategory !== 'all') && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('all');
                    }}
                    className="text-xs"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {filteredProducts.map((product) => {
                  const image = product.images?.[0] || product.image_url || '/placeholder.png';
                  const isOutOfStock = (product.stock_quantity ?? 0) <= 0;
                  const hasDiscount = product.compare_at_price && product.compare_at_price > product.price;
                  const discountPercent = hasDiscount
                    ? Math.round(((product.compare_at_price! - product.price) / product.compare_at_price!) * 100)
                    : 0;

                  return (
                    <Card
                      key={product.id}
                      onClick={() => navigate(`/product/${product.id}`)}
                      className="group bg-white border border-neutral-200 rounded-2xl overflow-hidden hover:shadow-lg hover:border-primary-300 transition-all cursor-pointer flex flex-col"
                    >
                      <div className="relative aspect-square w-full bg-neutral-100 overflow-hidden">
                        <img
                          src={image}
                          alt={product.title || product.name || 'Product'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {/* Discount Badge */}
                        {hasDiscount && (
                          <div className="absolute top-2.5 left-2.5 bg-red-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                            -{discountPercent}%
                          </div>
                        )}
                        {/* Out of Stock Overlay */}
                        {isOutOfStock && (
                          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
                            <span className="bg-neutral-900/90 text-white font-bold text-xs px-3 py-1.5 rounded-lg">
                              Out of Stock
                            </span>
                          </div>
                        )}
                      </div>

                      <CardContent className="p-4 flex flex-col flex-1 justify-between">
                        <div>
                          <p className="font-sans text-xs text-neutral-400 uppercase tracking-wider mb-1">
                            {product.category || product.category_id || 'Item'}
                          </p>
                          <h4 className="font-heading font-semibold text-neutral-900 text-sm md:text-base line-clamp-2 mb-2 group-hover:text-primary-600 transition-colors">
                            {product.title || product.name}
                          </h4>
                        </div>

                        <div>
                          <div className="flex items-baseline gap-2 mb-3">
                            <span className="font-heading font-bold text-neutral-900 text-base md:text-lg">
                              ₦{product.price.toLocaleString()}
                            </span>
                            {hasDiscount && (
                              <span className="text-xs text-neutral-400 line-through">
                                ₦{product.compare_at_price!.toLocaleString()}
                              </span>
                            )}
                          </div>

                          <Button
                            onClick={(e) => handleAddToCart(product, e)}
                            disabled={isOutOfStock}
                            className={`w-full py-2 text-xs md:text-sm font-semibold rounded-xl flex items-center justify-center gap-1.5 ${
                              isOutOfStock
                                ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                                : 'bg-primary-600 hover:bg-primary-700 text-white'
                            }`}
                          >
                            <ShoppingBag className="w-4 h-4" />
                            {isOutOfStock ? 'Sold Out' : 'Add to Cart'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Reviews Content */}
        {activeTab === 'reviews' && (
          <div className="bg-white rounded-2xl border border-neutral-200 p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-neutral-100 mb-6">
              <div className="flex items-center gap-4">
                <div className="text-4xl font-heading font-bold text-neutral-900">
                  {ratingValue.toFixed(1)}
                </div>
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-5 h-5 ${
                          s <= Math.round(ratingValue) ? 'fill-amber-400 text-amber-400' : 'text-neutral-200'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="font-sans text-xs text-neutral-500">
                    Based on {reviews.length} verified customer reviews
                  </p>
                </div>
              </div>
              <div className="text-xs text-neutral-500 bg-neutral-50 p-3 rounded-xl border border-neutral-200/60 max-w-sm">
                Only verified buyers who completed their orders via NIMEX Escrow can leave reviews.
              </div>
            </div>

            {reviews.length === 0 ? (
              <div className="py-12 text-center">
                <Star className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
                <h4 className="font-heading font-semibold text-neutral-800 text-base mb-1">No reviews yet</h4>
                <p className="font-sans text-xs text-neutral-500">
                  Be the first to order and review {businessName}!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((r) => (
                  <div key={r.id} className="p-4 rounded-xl border border-neutral-100 bg-neutral-50/50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-heading font-bold text-neutral-900 text-sm">
                          {r.buyer_name || 'Verified Buyer'}
                        </span>
                        <span className="inline-flex items-center text-[10px] text-emerald-700 bg-emerald-100 font-semibold px-2 py-0.5 rounded-full">
                          Verified Purchase
                        </span>
                      </div>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 ${
                              s <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-neutral-200'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="font-sans text-sm text-neutral-700">{r.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
export default VendorProfileScreen;
