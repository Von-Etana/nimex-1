import React, { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Heart, ShoppingCart, Star, Eye, Play, MapPin, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export interface Product {
    id: number | string;
    name: string;
    price: number;
    originalPrice?: number;
    image: string;
    images?: string[]; // For hover effect
    vendor: string;
    vendorId: number | string;
    rating: number;
    reviews: number;
    category: string;
    inStock: boolean;
    discount?: number;
    tags?: string[]; // 'new', 'hot', 'urgent', etc.
    video_url?: string;
    location?: string;
    isVerified?: boolean;
}

interface ProductCardProps {
    product: Product;
    onAddToCart?: (e: React.MouseEvent) => void;
    onToggleWishlist?: (e: React.MouseEvent) => void;
    variant?: 'default' | 'compact' | 'horizontal';
}

export const ProductCard: React.FC<ProductCardProps> = ({
    product,
    onAddToCart,
    onToggleWishlist,
    variant = 'default'
}) => {
    const navigate = useNavigate();
    const [isHovered, setIsHovered] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [isWishlisted, setIsWishlisted] = useState(false);

    // Determine which image to show
    const displayImage = isHovered && product.images && product.images.length > 1
        ? product.images[1]
        : product.image;

    const handleCardClick = () => {
        navigate(`/product/${product.id}`);
    };

    const handleVendorClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigate(`/vendor/${product.vendorId}`);
    };

    const handleWishlistClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsWishlisted(!isWishlisted);
        onToggleWishlist?.(e);
    };

    const discountPercentage = product.originalPrice
        ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
        : product.discount;

    const renderStars = (rating: number) => {
        return (
            <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                    <Star
                        key={i}
                        className={`w-3 h-3 ${i < Math.floor(rating)
                                ? 'text-amber-400 fill-amber-400'
                                : i < rating
                                    ? 'text-amber-400 fill-amber-400 opacity-50'
                                    : 'text-neutral-200 fill-neutral-200'
                            }`}
                    />
                ))}
            </div>
        );
    };

    if (variant === 'horizontal') {
        return (
            <Card
                onClick={handleCardClick}
                className="group border border-neutral-100 shadow-sm hover:shadow-premium hover:border-primary-100 transition-all duration-300 cursor-pointer overflow-hidden"
            >
                <div className="flex">
                    <div className="relative w-40 h-40 flex-shrink-0 overflow-hidden bg-neutral-100">
                        <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            onLoad={() => setImageLoaded(true)}
                        />
                        {discountPercentage && (
                            <Badge className="absolute top-2 left-2 bg-red-500 text-white font-semibold text-xs px-2">
                                -{discountPercentage}%
                            </Badge>
                        )}
                    </div>
                    <CardContent className="flex-1 p-4 flex flex-col justify-between">
                        <div>
                            <h3 className="font-heading font-semibold text-neutral-900 text-base line-clamp-2 group-hover:text-primary-600 transition-colors">
                                {product.name}
                            </h3>
                            <button
                                onClick={handleVendorClick}
                                className="font-sans text-xs text-neutral-500 hover:text-primary-500 transition-colors mt-1"
                            >
                                {product.vendor}
                            </button>
                            <div className="flex items-center gap-2 mt-2">
                                {renderStars(product.rating)}
                                <span className="text-xs text-neutral-400">({product.reviews})</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center gap-2">
                                <span className="font-heading font-bold text-neutral-900 text-lg">
                                    ₦{product.price.toLocaleString()}
                                </span>
                                {product.originalPrice && (
                                    <span className="text-sm text-neutral-400 line-through">
                                        ₦{product.originalPrice.toLocaleString()}
                                    </span>
                                )}
                            </div>
                            <Button
                                onClick={onAddToCart}
                                size="sm"
                                className="bg-primary-500 hover:bg-primary-600 text-white"
                            >
                                <ShoppingCart className="w-4 h-4" />
                            </Button>
                        </div>
                    </CardContent>
                </div>
            </Card>
        );
    }

    return (
        <Card
            onClick={handleCardClick}
            className="group border border-neutral-100 shadow-sm hover:shadow-premium hover:border-primary-100 transition-all duration-300 hover:-translate-y-1 cursor-pointer h-full flex flex-col overflow-hidden rounded-xl"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Image Container */}
            <div className="relative aspect-square overflow-hidden bg-neutral-100">
                {/* Skeleton loader */}
                {!imageLoaded && (
                    <div className="absolute inset-0 skeleton" />
                )}

                <img
                    src={displayImage}
                    alt={product.name}
                    className={`w-full h-full object-cover transition-all duration-500 ${isHovered ? 'scale-110' : 'scale-100'
                        } ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                    onLoad={() => setImageLoaded(true)}
                />

                {/* Gradient Overlay on Hover */}
                <div className={`absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`} />

                {/* Tags */}
                <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                    {discountPercentage && (
                        <Badge className="bg-red-500 text-white font-semibold shadow-sm text-[10px] px-2 py-0.5">
                            -{discountPercentage}%
                        </Badge>
                    )}
                    {product.tags?.includes('new') && (
                        <Badge className="bg-blue-500 text-white font-semibold shadow-sm text-[10px] px-2 py-0.5">
                            NEW
                        </Badge>
                    )}
                    {product.tags?.includes('hot') && (
                        <Badge className="bg-orange-500 text-white font-semibold shadow-sm text-[10px] px-2 py-0.5 badge-pulse">
                            🔥 HOT
                        </Badge>
                    )}
                    {product.tags?.includes('urgent') && (
                        <Badge className="bg-red-600 text-white font-semibold shadow-sm text-[10px] px-2 py-0.5 animate-pulse">
                            URGENT
                        </Badge>
                    )}
                    {product.video_url && (
                        <Badge className="bg-neutral-900/80 text-white font-semibold shadow-sm text-[10px] px-2 py-0.5 backdrop-blur-sm flex items-center gap-1">
                            <Play className="w-2.5 h-2.5 fill-current" />
                            VIDEO
                        </Badge>
                    )}
                </div>

                {/* Quick Actions (Right Side) */}
                <div className={`absolute top-3 right-3 flex flex-col gap-2 transition-all duration-300 ${isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'
                    }`}>
                    <button
                        onClick={handleWishlistClick}
                        className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all duration-200 ${isWishlisted
                                ? 'bg-red-500 text-white'
                                : 'bg-white hover:bg-red-50 text-neutral-600 hover:text-red-500'
                            }`}
                        title="Add to Wishlist"
                    >
                        <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); /* Quick view logic */ }}
                        className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-primary-50 text-neutral-600 hover:text-primary-500 transition-all duration-200"
                        title="Quick View"
                    >
                        <Eye className="w-4 h-4" />
                    </button>
                </div>

                {/* Add to Cart Button (Visible on Hover) */}
                <div className={`absolute bottom-0 left-0 right-0 p-3 transition-all duration-300 transform ${isHovered ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
                    }`}>
                    <Button
                        onClick={onAddToCart}
                        className="w-full bg-primary-500 hover:bg-primary-600 text-white shadow-lg font-semibold text-sm py-2.5 btn-shine"
                    >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Add to Cart
                    </Button>
                </div>

                {/* Out of Stock Overlay */}
                {!product.inStock && (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                        <span className="bg-neutral-900 text-white px-4 py-2 rounded-lg font-semibold text-sm">
                            Out of Stock
                        </span>
                    </div>
                )}
            </div>

            {/* Content */}
            <CardContent className="p-4 flex flex-col gap-2 flex-1">
                {/* Product Name */}
                <h3 className="font-heading font-semibold text-neutral-900 text-sm line-clamp-2 min-h-[40px] group-hover:text-primary-600 transition-colors">
                    {product.name}
                </h3>

                {/* Vendor & Location */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={handleVendorClick}
                        className="flex items-center gap-1 font-sans text-xs text-neutral-500 hover:text-primary-500 transition-colors"
                    >
                        <span className="truncate max-w-[100px]">{product.vendor}</span>
                        {product.isVerified && (
                            <CheckCircle className="w-3 h-3 text-primary-500 flex-shrink-0" />
                        )}
                    </button>
                    {product.location && (
                        <span className="flex items-center gap-0.5 text-xs text-neutral-400">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate max-w-[60px]">{product.location}</span>
                        </span>
                    )}
                </div>

                {/* Rating */}
                <div className="flex items-center gap-1.5">
                    {renderStars(product.rating)}
                    <span className="font-sans text-xs text-neutral-400">
                        ({product.reviews})
                    </span>
                </div>

                {/* Price */}
                <div className="mt-auto flex items-center gap-2 pt-2">
                    <span className="font-heading font-bold text-neutral-900 text-lg">
                        ₦{product.price.toLocaleString()}
                    </span>
                    {product.originalPrice && (
                        <span className="font-sans text-sm text-neutral-400 line-through">
                            ₦{product.originalPrice.toLocaleString()}
                        </span>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};
