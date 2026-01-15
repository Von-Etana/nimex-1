import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Share2, MessageCircle, ShoppingCart, MapPin, Star, Shield, Zap, Edit3 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { where } from 'firebase/firestore';
import { FirestoreService } from '../services/firestore.service';
import { COLLECTIONS } from '../lib/collections';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { sanitizeText } from '../lib/sanitization';
import { logger } from '../lib/logger';
import { reviewService, Review } from '../services/reviewService';

import { triggerCartUpdate } from '../hooks/useCart';
interface ProductDetail {
  id: string;
  title: string;
  description: string;
  price: number;
  compare_at_price: number | null;
  images: string[];
  stock_quantity: number;
  location: string;
  rating: number;
  views_count: number;
  vendor_id: string;
  video_url?: string;
}

interface Vendor {
  id: string;
  business_name: string;
  rating: number;
  total_sales: number;
  response_time: number;
  verification_status: string;
}

export const ProductDetailScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success } = useToast();

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  // Review state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [canReview, setCanReview] = useState(false);
  const [reviewOrderId, setReviewOrderId] = useState<string | undefined>();
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    if (id) {
      fetchProductDetail();
      loadReviews();
      if (user) {
        checkFavoriteStatus();
        checkReviewEligibility();
      }
    }
  }, [id, user]);

  // Load product reviews
  const loadReviews = async () => {
    if (!id) return;
    const productReviews = await reviewService.getProductReviews(id, 10);
    setReviews(productReviews);
  };

  // Check if user can review
  const checkReviewEligibility = async () => {
    if (!user || !id) return;
    const result = await reviewService.canUserReview(user.uid, id);
    setCanReview(result.canReview);
    setReviewOrderId(result.orderId);
  };

  // Submit review
  const handleSubmitReview = async () => {
    if (!user || !product || !reviewOrderId || !reviewComment.trim()) return;

    setIsSubmittingReview(true);
    try {
      const result = await reviewService.createReview({
        productId: product.id,
        vendorId: product.vendor_id,
        buyerId: user.uid,
        buyerName: user.displayName || 'Customer',
        orderId: reviewOrderId,
        rating: reviewRating,
        comment: reviewComment.trim(),
      });

      if (result.success) {
        success('Review submitted successfully!');
        setShowReviewForm(false);
        setReviewComment('');
        setReviewRating(5);
        setCanReview(false);
        loadReviews(); // Reload reviews
      }
    } catch (error) {
      logger.error('Error submitting review', error);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const fetchProductDetail = async () => {
    try {
      // Fetch product from Firestore
      const productData = await FirestoreService.getDocument<ProductDetail>(COLLECTIONS.PRODUCTS, id!);

      if (productData) {
        setProduct(productData);

        // Increment views count
        await FirestoreService.updateDocument(COLLECTIONS.PRODUCTS, id!, {
          views_count: (productData.views_count || 0) + 1
        });

        // Fetch vendor data
        const vendorData = await FirestoreService.getDocument<Vendor>(COLLECTIONS.VENDORS, productData.vendor_id);

        if (vendorData) {
          setVendor(vendorData);
        }
      }
    } catch (error) {
      logger.error('Error fetching product', error);
    } finally {
      setLoading(false);
    }
  };

  const checkFavoriteStatus = async () => {
    if (!user || !id) return;

    try {
      const wishlists = await FirestoreService.getDocuments<any>(COLLECTIONS.WISHLISTS, {
        filters: [
          { field: 'user_id', operator: '==', value: user.uid },
          { field: 'product_id', operator: '==', value: id }
        ]
      });

      setIsFavorite(wishlists.length > 0);
    } catch (error) {
      logger.error('Error checking favorite', error);
    }
  };

  const toggleFavorite = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      if (isFavorite) {
        // Find and delete the wishlist item
        const wishlists = await FirestoreService.getDocuments<any>(COLLECTIONS.WISHLISTS, {
          filters: [
            { field: 'user_id', operator: '==', value: user.uid },
            { field: 'product_id', operator: '==', value: id }
          ]
        });

        if (wishlists.length > 0) {
          await FirestoreService.deleteDocument(COLLECTIONS.WISHLISTS, wishlists[0].id);
        }
        setIsFavorite(false);
      } else {
        // Add to wishlist
        const newId = `wish_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await FirestoreService.setDocument(COLLECTIONS.WISHLISTS, newId, {
          user_id: user.uid,
          product_id: id!
        });
        setIsFavorite(true);
      }
    } catch (error) {
      logger.error('Error toggling favorite', error);
    }
  };

  const handleChatWithVendor = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate(`/chat/${vendor?.id}`);
  };

  const handleAddToCart = () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!product) return;

    // Get existing cart from localStorage
    const cartJson = localStorage.getItem('nimex_cart');
    const existingCart = cartJson ? JSON.parse(cartJson) : [];

    // Create cart item
    const cartItem = {
      id: Date.now().toString(),
      product_id: product.id,
      title: product.title,
      price: product.price,
      image: images[0],
      vendor_id: product.vendor_id,
      vendor_name: vendor?.business_name || 'Vendor',
      quantity: 1
    };

    // Check if product already in cart
    const existingIndex = existingCart.findIndex((item: any) => item.product_id === product.id);

    if (existingIndex >= 0) {
      // Update quantity
      existingCart[existingIndex].quantity += 1;
    } else {
      // Add new item
      existingCart.push(cartItem);
    }

    // Save to localStorage
    localStorage.setItem('nimex_cart', JSON.stringify(existingCart));

    // Show feedback
    success('Product added to cart!');
    triggerCartUpdate();

    // Navigate to cart
    navigate('/cart');
  };

  const handleBuyNow = () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!product) return;

    // Create cart item for checkout
    const buyNowItem = {
      id: Date.now().toString(),
      product_id: product.id,
      title: product.title,
      price: product.price,
      image: images[0],
      vendor_id: product.vendor_id,
      vendor_name: vendor?.business_name || 'Vendor',
      quantity: 1
    };

    // Navigate directly to checkout with the item
    navigate('/checkout', {
      state: {
        cartItems: [buyNowItem],
        isBuyNow: true  // Flag to indicate this is a direct purchase
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="font-sans text-neutral-600">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-heading font-bold text-2xl text-neutral-900 mb-2">Product not found</h2>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </div>
    );
  }

  const images = Array.isArray(product.images) && product.images.length > 0
    ? product.images
    : ['/image-1.png', '/image-2.png'];

  const discount = product.compare_at_price
    ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="grid md:grid-cols-2 gap-8 md:gap-12">
          <div className="space-y-4">
            <div className="aspect-square rounded-2xl overflow-hidden bg-neutral-100">
              <img
                src={images[selectedImage]}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            </div>

            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${selectedImage === index ? 'border-primary-500' : 'border-transparent'
                      }`}
                  >
                    <img
                      src={image}
                      alt={`${product.title} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {product.video_url && (
              <div className="mt-4">
                <h3 className="font-heading font-semibold text-lg text-neutral-900 mb-2">
                  Product Video
                </h3>
                <div className="aspect-video rounded-lg overflow-hidden bg-neutral-900">
                  <iframe
                    src={product.video_url.replace('watch?v=', 'embed/').replace('vimeo.com/', 'player.vimeo.com/video/')}
                    title="Product Video"
                    className="w-full h-full"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <h1 className="font-heading font-bold text-2xl md:text-3xl text-neutral-900 mb-3">
                {product.title}
              </h1>

              <div className="flex items-center gap-4 mb-4">
                {product.rating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 fill-accent-yellow text-accent-yellow" />
                    <span className="font-sans font-semibold text-neutral-900">
                      {product.rating.toFixed(1)}
                    </span>
                  </div>
                )}
                <span className="font-sans text-sm text-neutral-600">
                  {product.views_count} views
                </span>
              </div>

              <div className="flex items-baseline gap-3 mb-4">
                <span className="font-heading font-bold text-3xl text-primary-500">
                  ₦{product.price.toLocaleString()}
                </span>
                {product.compare_at_price && (
                  <>
                    <span className="font-sans text-lg text-neutral-400 line-through">
                      ₦{product.compare_at_price.toLocaleString()}
                    </span>
                    <Badge className="bg-error text-white">
                      {discount}% OFF
                    </Badge>
                  </>
                )}
              </div>

              {product.location && (
                <div className="flex items-center gap-2 text-neutral-600 mb-6">
                  <MapPin className="w-4 h-4" />
                  <span className="font-sans text-sm">{product.location}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex gap-3">
                <Button
                  onClick={handleBuyNow}
                  className="flex-1 h-12 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white font-semibold shadow-lg"
                >
                  <Zap className="w-5 h-5 mr-2" />
                  Buy Now
                </Button>
                <Button
                  onClick={handleAddToCart}
                  variant="outline"
                  className="flex-1 h-12 border-primary-500 text-primary-500 hover:bg-primary-50"
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Add to Cart
                </Button>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={toggleFavorite}
                  className={`flex-1 h-12 ${isFavorite ? 'text-error border-error' : ''}`}
                >
                  <Heart className={`w-5 h-5 mr-2 ${isFavorite ? 'fill-error' : ''}`} />
                  {isFavorite ? 'Saved' : 'Save'}
                </Button>
                <Button variant="outline" className="flex-1 h-12">
                  <Share2 className="w-5 h-5 mr-2" />
                  Share
                </Button>
              </div>
            </div>

            <Button
              onClick={handleChatWithVendor}
              variant="outline"
              className="w-full h-12 border-primary-500 text-primary-500 hover:bg-primary-50"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Chat with Seller
            </Button>

            {vendor && (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-heading font-semibold text-lg text-neutral-900">
                          {vendor.business_name}
                        </h3>
                        {vendor.verification_status === 'verified' && (
                          <Badge className="bg-accent-yellow text-accent-foreground">
                            <Shield className="w-3 h-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-neutral-600">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-accent-yellow text-accent-yellow" />
                          <span>{vendor.rating.toFixed(1)}</span>
                        </div>
                        <span>{vendor.total_sales} sales</span>
                        <span>Responds in ~{vendor.response_time}min</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate(`/vendor/${vendor.id}`)}
                  >
                    View Shop
                  </Button>
                </CardContent>
              </Card>
            )}

            <div>
              <h2 className="font-heading font-semibold text-lg text-neutral-900 mb-3">
                Description
              </h2>
              <p className="font-sans text-neutral-700 leading-body whitespace-pre-line">
                {sanitizeText(product.description)}
              </p>
            </div>

            {/* Reviews Section */}
            <div className="pt-6 border-t border-neutral-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading font-semibold text-lg text-neutral-900">
                  Customer Reviews ({reviews.length})
                </h2>
                {canReview && !showReviewForm && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowReviewForm(true)}
                    className="flex items-center gap-2"
                  >
                    <Edit3 className="w-4 h-4" />
                    Write Review
                  </Button>
                )}
              </div>

              {/* Review Form */}
              {showReviewForm && (
                <Card className="mb-6 border-primary-200 bg-primary-50">
                  <CardContent className="p-4">
                    <h3 className="font-heading font-medium text-neutral-900 mb-3">Your Review</h3>

                    {/* Star Rating */}
                    <div className="flex items-center gap-1 mb-4">
                      <span className="text-sm text-neutral-600 mr-2">Rating:</span>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setReviewRating(star)}
                          className="p-1"
                        >
                          <Star
                            className={`w-6 h-6 ${star <= reviewRating ? 'fill-accent-yellow text-accent-yellow' : 'text-neutral-300'}`}
                          />
                        </button>
                      ))}
                    </div>

                    {/* Comment */}
                    <textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Share your experience with this product..."
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg mb-3 min-h-[100px] resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />

                    <div className="flex gap-2">
                      <Button
                        onClick={handleSubmitReview}
                        disabled={isSubmittingReview || !reviewComment.trim()}
                        className="bg-primary-500 hover:bg-primary-600"
                      >
                        {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowReviewForm(false);
                          setReviewComment('');
                          setReviewRating(5);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Reviews List */}
              {reviews.length === 0 ? (
                <div className="text-center py-8 bg-neutral-50 rounded-lg">
                  <Star className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
                  <p className="text-neutral-600">No reviews yet</p>
                  <p className="text-sm text-neutral-400">Be the first to review this product</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="p-4 bg-neutral-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-primary-700">
                              {review.buyer_name?.charAt(0).toUpperCase() || 'C'}
                            </span>
                          </div>
                          <span className="font-medium text-neutral-900">{review.buyer_name}</span>
                          {review.is_verified_purchase && (
                            <Badge variant="secondary" className="text-xs">Verified Purchase</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${star <= review.rating ? 'fill-accent-yellow text-accent-yellow' : 'text-neutral-300'}`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-neutral-700 text-sm">{review.comment}</p>
                      <p className="text-xs text-neutral-400 mt-2">
                        {review.created_at?.toDate?.()?.toLocaleDateString('en-NG', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        }) || 'Recently'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-neutral-100">
              <div className="flex items-center gap-3 text-sm">
                <Shield className="w-5 h-5 text-primary-500" />
                <span className="font-sans text-neutral-700">
                  Protected by NIMEX Escrow. Your payment is held securely until delivery.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
