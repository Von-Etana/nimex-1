import React, { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Heart, ShoppingCart, Star, Eye } from 'lucide-react';
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
}

interface ProductCardProps {
    product: Product;
    onAddToCart?: (e: React.MouseEvent) => void;
    onToggleWishlist?: (e: React.MouseEvent) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart, onToggleWishlist }) => {
    const navigate = useNavigate();
    const [isHovered, setIsHovered] = useState(false);

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

    const renderStars = (rating: number) => {
        return (
            <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                    <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${i < Math.floor(rating)
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-neutral-300'
                            }`}
                    />
                ))}
            </div>
        );
    };

    return (
        <Card
            onClick={handleCardClick}
            className="group border border-neutral-200 shadow-sm hover:shadow-lg hover:border-primary-200 transition-all duration-300 hover:-translate-y-1 cursor-pointer h-full flex flex-col overflow-hidden"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="relative aspect-square overflow-hidden bg-neutral-100">
                <img
                    src={displayImage}
                    alt={product.name}
                    className={`w-full h-full object-cover transition-transform duration-500 ${isHovered ? 'scale-110' : 'scale-100'}`}
                />

                {/* Tags */}
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                    {product.discount && (
                        <Badge className="bg-danger text-white font-sans font-semibold shadow-sm">
                            -{product.discount}%
                        </Badge>
                    )}
                    {product.tags?.includes('new') && (
                        <Badge className="bg-info text-white font-sans font-semibold shadow-sm">
                            NEW
                        </Badge>
                    )}
                    {product.tags?.includes('hot') && (
                        <Badge className="bg-warning text-white font-sans font-semibold shadow-sm">
                            HOT
                        </Badge>
                    )}
                    {product.tags?.includes('urgent') && (
                        <Badge className="bg-danger text-white font-sans font-semibold shadow-sm animate-pulse">
                            URGENT
                        </Badge>
                    )}
                    {product.video_url && (
                        <Badge className="bg-neutral-900/80 text-white font-sans font-semibold shadow-sm backdrop-blur-sm">
                            VIDEO
                        </Badge>
                    )}
                </div>

                {/* Quick Actions Overlay */}
                <div className={`absolute top-3 right-3 flex flex-col gap-2 transition-all duration-300 ${isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}`}>
                    <button
                        onClick={onToggleWishlist}
                        className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-primary-50 text-neutral-600 hover:text-primary-500 transition-colors"
                        title="Add to Wishlist"
                    >
                        <Heart className="w-4 h-4" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); /* Quick view logic */ }}
                        className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-primary-50 text-neutral-600 hover:text-primary-500 transition-colors"
                        title="Quick View"
                    >
                        <Eye className="w-4 h-4" />
                    </button>
                </div>

                {/* Add to Cart Button (Visible on Hover) */}
                <div className={`absolute bottom-0 left-0 right-0 p-4 transition-all duration-300 transform ${isHovered ? 'translate-y-0' : 'translate-y-full'}`}>
                    <Button
                        onClick={onAddToCart}
                        className="w-full bg-primary-500 hover:bg-primary-600 text-white shadow-lg"
                    >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Add to Cart
                    </Button>
                </div>
            </div>

            <CardContent className="p-4 flex flex-col gap-2 flex-1">
                <div className="flex flex-col gap-1">
                    <h3 className="font-heading font-bold text-neutral-900 text-base line-clamp-1 group-hover:text-primary-600 transition-colors">
                        {product.name}
                    </h3>
                    <button
                        onClick={handleVendorClick}
                        className="font-sans text-xs text-neutral-500 hover:text-primary-500 text-left transition-colors"
                    >
                        {product.vendor}
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    {renderStars(product.rating)}
                    <span className="font-sans text-xs text-neutral-400">
                        ({product.reviews})
                    </span>
                </div>

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
