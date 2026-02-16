import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { Eye, MapPin, CheckCircle, ArrowRight, Star, Heart } from 'lucide-react';
import { Button } from '../../../../components/ui/button';

interface Product {
  id?: string;  // Firestore document ID
  image: string;
  title: string;
  price: string;
  oldPrice?: string;
  vendor: string;
  vendorImage: string;
  location: string;
  views: string;
  rating: number;
  verified: boolean;
  badge: {
    text: string;
    variant: 'yellow' | 'green' | 'red';
  };
}

interface ProductGridProps {
  title: string;
  subtitle?: string;
  products: Product[];
  onViewAll?: () => void;
  icon?: React.ReactNode;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  title,
  subtitle,
  products,
  onViewAll,
  icon
}) => {
  const navigate = useNavigate();

  const handleProductClick = (product: Product, index: number) => {
    // Use the actual Firestore document ID if available, otherwise fall back to index-based ID
    const productId = product.id || `product-${index + 1}`;
    navigate(`/product/${productId}`, { state: { product } });
  };

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="w-10 h-10 bg-neutral-100 rounded-xl flex items-center justify-center">
              {icon}
            </div>
          )}
          <div>
            <h2 className="font-heading font-bold text-neutral-900 text-xl md:text-2xl">
              {title}
            </h2>
            {subtitle && (
              <p className="font-sans text-sm text-neutral-500 mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          onClick={onViewAll || (() => navigate('/products'))}
          className="text-primary-600 hover:text-primary-700 font-medium text-sm"
        >
          View All
          <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {products.map((product, index) => (
          <Card
            key={index}
            onClick={() => handleProductClick(product, index)}
            className="group relative w-full shadow-sm border border-neutral-100 overflow-hidden cursor-pointer hover:shadow-premium hover:-translate-y-1 transition-all duration-300 rounded-xl"
          >
            <CardContent className="p-0">
              {/* Image Container */}
              <div className="relative aspect-square overflow-hidden bg-neutral-100">
                <img
                  src={product.image}
                  alt={product.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                {/* Badge */}
                <Badge
                  className={`absolute top-2 left-2 px-2 py-0.5 rounded-md font-semibold text-[10px] shadow-sm ${product.badge.variant === 'yellow'
                    ? 'bg-amber-400 text-amber-900'
                    : product.badge.variant === 'green'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-red-500 text-white'
                    }`}
                >
                  {product.badge.text}
                </Badge>

                {/* Wishlist Button */}
                <button
                  onClick={(e) => { e.stopPropagation(); }}
                  className="absolute top-2 right-2 w-7 h-7 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-50 hover:text-red-500"
                >
                  <Heart className="w-3.5 h-3.5" />
                </button>

                {/* Quick View Overlay */}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                  <span className="bg-white text-neutral-900 px-3 py-1.5 rounded-lg text-xs font-medium shadow-md transform translate-y-2 group-hover:translate-y-0 transition-transform duration-200">
                    Quick View
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-3 flex flex-col gap-2">
                {/* Title */}
                <h3 className="font-sans font-semibold text-neutral-900 text-xs md:text-sm line-clamp-2 leading-snug min-h-[32px] group-hover:text-primary-600 transition-colors">
                  {product.title}
                </h3>

                {/* Price */}
                <div className="flex items-baseline gap-1.5">
                  <span className="font-heading font-bold text-primary-600 text-sm md:text-base">
                    {product.price}
                  </span>
                  {product.oldPrice && (
                    <span className="font-sans text-neutral-400 text-[10px] line-through">
                      {product.oldPrice}
                    </span>
                  )}
                </div>

                {/* Vendor */}
                <div className="flex items-center gap-1.5">
                  <img
                    src={product.vendorImage}
                    alt={product.vendor}
                    className="w-4 h-4 rounded-full object-cover ring-1 ring-neutral-200"
                  />
                  <span className="font-sans text-neutral-600 text-[10px] truncate flex-1">
                    {product.vendor}
                  </span>
                  {product.verified && (
                    <CheckCircle className="w-3 h-3 text-primary-500 flex-shrink-0" />
                  )}
                </div>

                {/* Location & Views */}
                <div className="flex items-center justify-between text-[9px] md:text-[10px] text-neutral-400">
                  <div className="flex items-center gap-0.5">
                    <MapPin className="w-2.5 h-2.5" />
                    <span className="truncate max-w-[60px]">{product.location}</span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <Eye className="w-2.5 h-2.5" />
                    <span>{product.views}</span>
                  </div>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3 h-3 ${i < product.rating
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-neutral-200 fill-neutral-200'
                        }`}
                    />
                  ))}
                  <span className="font-sans text-[10px] text-neutral-400 ml-1">
                    ({product.rating})
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
