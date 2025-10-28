import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { Eye, MapPin, CheckCircle } from 'lucide-react';

interface Product {
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
  products: Product[];
  onViewAll?: () => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({ title, products, onViewAll }) => {
  const navigate = useNavigate();

  const handleProductClick = (product: Product, index: number) => {
    const productId = `product-${index + 1}`;
    navigate(`/product/${productId}`, { state: { product } });
  };

  return (
    <div className="flex flex-col items-start gap-4 md:gap-5 w-full">
      <div className="flex items-center justify-between w-full">
        <h2 className="font-heading font-bold text-neutral-900 text-lg md:text-xl">
          {title}
        </h2>
        <button
          onClick={onViewAll}
          className="font-sans font-medium text-accent-yellow hover:text-accent-orange text-xs md:text-sm"
        >
          View All
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 md:gap-4 w-full">
        {products.map((product, index) => (
          <Card
            key={index}
            onClick={() => handleProductClick(product, index)}
            className="w-full shadow-sm border border-neutral-100 overflow-hidden cursor-pointer hover:shadow-lg hover:border-primary-200 transition-all"
          >
            <CardContent className="p-0">
              <div
                className="w-full h-32 md:h-36 bg-cover bg-center"
                style={{ backgroundImage: `url(${product.image})` }}
              />
              <div className="p-2 md:p-3 flex flex-col gap-1.5">
                <h3 className="font-heading font-semibold text-neutral-900 text-xs md:text-sm line-clamp-2 leading-tight">
                  {product.title}
                </h3>

                <div className="flex flex-col gap-0.5">
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-sans font-bold text-primary-500 text-sm md:text-base">
                      {product.price}
                    </span>
                    {product.oldPrice && (
                      <span className="font-sans text-neutral-400 text-xs line-through">
                        {product.oldPrice}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 mt-0.5">
                  <img
                    src={product.vendorImage}
                    alt={product.vendor}
                    className="w-4 h-4 md:w-5 md:h-5 rounded-full object-cover"
                  />
                  <span className="font-sans text-neutral-600 text-[10px] md:text-xs truncate flex-1">
                    {product.vendor}
                  </span>
                  {product.verified && (
                    <CheckCircle className="w-3 h-3 text-primary-500 flex-shrink-0" />
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 text-[10px] md:text-xs text-neutral-500 mt-0.5">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">{product.location}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    <span>{product.views}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 mt-0.5">
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <span
                        key={i}
                        className={`text-xs ${
                          i < product.rating ? 'text-accent-yellow' : 'text-neutral-300'
                        }`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <Badge
                    className={`w-fit h-auto px-1.5 py-0.5 rounded-full font-sans font-medium text-[9px] md:text-[10px] ${
                      product.badge.variant === 'yellow'
                        ? 'bg-accent-yellow text-accent-foreground hover:bg-accent-yellow'
                        : product.badge.variant === 'green'
                          ? 'bg-primary-500 text-white hover:bg-primary-500'
                          : 'bg-error text-white hover:bg-error'
                    }`}
                  >
                    {product.badge.text}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
