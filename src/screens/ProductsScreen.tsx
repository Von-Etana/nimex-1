import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  SlidersHorizontal,
  Star,
  ShoppingCart,
  Heart,
  ChevronDown,
  X,
  SearchIcon,
} from 'lucide-react';

interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  vendor: string;
  vendorId: number;
  rating: number;
  reviews: number;
  category: string;
  inStock: boolean;
  discount?: number;
}

const mockProducts: Product[] = [
  {
    id: 1,
    name: 'Handwoven Ankara Fabric',
    price: 8500,
    originalPrice: 12000,
    image: '/image-1.png',
    vendor: 'NaijaCrafts Emporium',
    vendorId: 1,
    rating: 4.8,
    reviews: 124,
    category: 'Textiles',
    inStock: true,
    discount: 29,
  },
  {
    id: 2,
    name: 'Traditional Clay Pottery Set',
    price: 15000,
    image: '/image-2.png',
    vendor: 'NaijaCrafts Emporium',
    vendorId: 1,
    rating: 4.9,
    reviews: 89,
    category: 'Home & Garden',
    inStock: true,
  },
  {
    id: 3,
    name: 'Beaded Jewelry Collection',
    price: 6500,
    originalPrice: 9000,
    image: '/image-3.png',
    vendor: 'Fashion Finesse Boutique',
    vendorId: 3,
    rating: 4.7,
    reviews: 156,
    category: 'Fashion',
    inStock: true,
    discount: 28,
  },
  {
    id: 4,
    name: 'Nigerian Cookbook Collection',
    price: 4500,
    image: '/image-5.png',
    vendor: 'The Bookworm Nook',
    vendorId: 6,
    rating: 4.9,
    reviews: 234,
    category: 'Books',
    inStock: true,
  },
  {
    id: 5,
    name: 'Organic Jollof Spice Mix',
    price: 2500,
    image: '/image-4.png',
    vendor: 'Mama Nkechi\'s Kitchen',
    vendorId: 2,
    rating: 5.0,
    reviews: 412,
    category: 'Food',
    inStock: true,
  },
  {
    id: 6,
    name: 'African Print Dashiki',
    price: 12500,
    originalPrice: 18000,
    image: '/image-6.png',
    vendor: 'Fashion Finesse Boutique',
    vendorId: 3,
    rating: 4.6,
    reviews: 98,
    category: 'Fashion',
    inStock: true,
    discount: 31,
  },
  {
    id: 7,
    name: 'Indoor Plant Collection',
    price: 8000,
    image: '/image-7.png',
    vendor: 'Green Thumb Gardens',
    vendorId: 5,
    rating: 4.8,
    reviews: 67,
    category: 'Home & Garden',
    inStock: true,
  },
  {
    id: 8,
    name: 'Wireless Bluetooth Earbuds',
    price: 18000,
    originalPrice: 25000,
    image: '/image-8.png',
    vendor: 'Tech Haven Electronics',
    vendorId: 1,
    rating: 4.5,
    reviews: 289,
    category: 'Electronics',
    inStock: true,
    discount: 28,
  },
  {
    id: 9,
    name: 'Leather Laptop Bag',
    price: 22000,
    image: '/image-1.png',
    vendor: 'Fashion Finesse Boutique',
    vendorId: 3,
    rating: 4.7,
    reviews: 143,
    category: 'Fashion',
    inStock: true,
  },
  {
    id: 10,
    name: 'Adire Tie-Dye Fabric',
    price: 7500,
    image: '/image-2.png',
    vendor: 'NaijaCrafts Emporium',
    vendorId: 1,
    rating: 4.9,
    reviews: 178,
    category: 'Textiles',
    inStock: true,
  },
  {
    id: 11,
    name: 'Palm Oil (5 Litres)',
    price: 9500,
    image: '/image-4.png',
    vendor: 'Mama Nkechi\'s Kitchen',
    vendorId: 2,
    rating: 4.8,
    reviews: 256,
    category: 'Food',
    inStock: true,
  },
  {
    id: 12,
    name: 'Contemporary Art Print',
    price: 35000,
    image: '/image-3.png',
    vendor: 'NaijaCrafts Emporium',
    vendorId: 1,
    rating: 4.6,
    reviews: 45,
    category: 'Art',
    inStock: true,
  },
];

const categories = ['All', 'Fashion', 'Electronics', 'Food', 'Books', 'Home & Garden', 'Textiles', 'Art'];

const priceRanges = [
  { label: 'All Prices', min: 0, max: Infinity },
  { label: 'Under ₦5,000', min: 0, max: 5000 },
  { label: '₦5,000 - ₦10,000', min: 5000, max: 10000 },
  { label: '₦10,000 - ₦20,000', min: 10000, max: 20000 },
  { label: 'Above ₦20,000', min: 20000, max: Infinity },
];

const sortOptions = [
  { label: 'Featured', value: 'featured' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
  { label: 'Top Rated', value: 'rating' },
  { label: 'Most Reviews', value: 'reviews' },
];

export const ProductsScreen: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPriceRange, setSelectedPriceRange] = useState(0);
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState('featured');
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProducts = mockProducts.filter((product) => {
    const categoryMatch = selectedCategory === 'All' || product.category === selectedCategory;
    const priceRange = priceRanges[selectedPriceRange];
    const priceMatch = product.price >= priceRange.min && product.price <= priceRange.max;
    const ratingMatch = product.rating >= minRating;
    const searchMatch = !searchQuery ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase());
    return categoryMatch && priceMatch && ratingMatch && searchMatch;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price_asc':
        return a.price - b.price;
      case 'price_desc':
        return b.price - a.price;
      case 'rating':
        return b.rating - a.rating;
      case 'reviews':
        return b.reviews - a.reviews;
      default:
        return 0;
    }
  });

  const handleAddToCart = (productId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('Added to cart:', productId);
  };

  const handleProductClick = (productId: number) => {
    navigate(`/product/${productId}`);
  };

  const handleVendorClick = (vendorId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/vendor/${vendorId}`);
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-3.5 h-3.5 ${
              i < Math.floor(rating)
                ? 'text-accent-yellow fill-accent-yellow'
                : 'text-neutral-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const activeFiltersCount =
    (selectedCategory !== 'All' ? 1 : 0) +
    (selectedPriceRange !== 0 ? 1 : 0) +
    (minRating > 0 ? 1 : 0);

  return (
    <div className="flex flex-col w-full min-h-screen bg-neutral-50">
      <div className="w-full max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="font-heading font-bold text-neutral-900 text-2xl md:text-3xl">
                All Products
              </h1>
              <p className="font-sans text-neutral-600 text-sm mt-1">
                {sortedProducts.length} products available
              </p>
            </div>

            {/* Search Bar */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="w-64 h-10 pl-10 pr-4 rounded-lg border border-neutral-200 font-sans text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="md:hidden border-neutral-200 text-neutral-700 font-sans text-sm"
                >
                  <SlidersHorizontal className="w-4 h-4 mr-2" />
                  Filters
                  {activeFiltersCount > 0 && (
                    <Badge className="ml-2 bg-primary-500 text-white">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>

                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="appearance-none bg-white border border-neutral-200 rounded-lg px-4 py-2 pr-10 font-sans text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
                  >
                    {sortOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className={`lg:col-span-1 ${showFilters ? 'block' : 'hidden'} md:block`}>
              <Card className="border border-neutral-200 shadow-sm sticky top-20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="font-heading font-bold text-neutral-900 text-lg">
                      Filters
                    </h2>
                    {activeFiltersCount > 0 && (
                      <button
                        onClick={() => {
                          setSelectedCategory('All');
                          setSelectedPriceRange(0);
                          setMinRating(0);
                        }}
                        className="font-sans text-xs text-primary-500 hover:text-primary-600"
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  <div className="flex flex-col gap-6">
                    <div>
                      <h3 className="font-sans font-semibold text-neutral-900 text-sm mb-3">
                        Category
                      </h3>
                      <div className="flex flex-col gap-2">
                        {categories.map((category) => (
                          <label
                            key={category}
                            className="flex items-center gap-2 cursor-pointer group"
                          >
                            <input
                              type="radio"
                              name="category"
                              checked={selectedCategory === category}
                              onChange={() => setSelectedCategory(category)}
                              className="w-4 h-4 text-primary-500 focus:ring-primary-500 cursor-pointer"
                            />
                            <span className="font-sans text-sm text-neutral-700 group-hover:text-primary-500">
                              {category}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-neutral-100 pt-6">
                      <h3 className="font-sans font-semibold text-neutral-900 text-sm mb-3">
                        Price Range
                      </h3>
                      <div className="flex flex-col gap-2">
                        {priceRanges.map((range, index) => (
                          <label
                            key={index}
                            className="flex items-center gap-2 cursor-pointer group"
                          >
                            <input
                              type="radio"
                              name="price"
                              checked={selectedPriceRange === index}
                              onChange={() => setSelectedPriceRange(index)}
                              className="w-4 h-4 text-primary-500 focus:ring-primary-500 cursor-pointer"
                            />
                            <span className="font-sans text-sm text-neutral-700 group-hover:text-primary-500">
                              {range.label}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-neutral-100 pt-6">
                      <h3 className="font-sans font-semibold text-neutral-900 text-sm mb-3">
                        Minimum Rating
                      </h3>
                      <div className="flex flex-col gap-2">
                        {[0, 4, 4.5].map((rating) => (
                          <label
                            key={rating}
                            className="flex items-center gap-2 cursor-pointer group"
                          >
                            <input
                              type="radio"
                              name="rating"
                              checked={minRating === rating}
                              onChange={() => setMinRating(rating)}
                              className="w-4 h-4 text-primary-500 focus:ring-primary-500 cursor-pointer"
                            />
                            <div className="flex items-center gap-1.5">
                              {rating === 0 ? (
                                <span className="font-sans text-sm text-neutral-700 group-hover:text-primary-500">
                                  All Ratings
                                </span>
                              ) : (
                                <>
                                  <span className="font-sans text-sm text-neutral-700 group-hover:text-primary-500">
                                    {rating}+
                                  </span>
                                  <Star className="w-4 h-4 text-accent-yellow fill-accent-yellow" />
                                </>
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-3">
              {sortedProducts.length === 0 ? (
                <Card className="border border-neutral-200 shadow-sm">
                  <CardContent className="p-12 text-center">
                    <p className="font-sans text-neutral-600 text-lg">
                      No products found matching your filters.
                    </p>
                    <Button
                      onClick={() => {
                        setSelectedCategory('All');
                        setSelectedPriceRange(0);
                        setMinRating(0);
                      }}
                      className="mt-4 bg-primary-500 hover:bg-primary-600 text-white"
                    >
                      Clear Filters
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sortedProducts.map((product) => (
                    <Card
                      key={product.id}
                      onClick={() => handleProductClick(product.id)}
                      className="border border-neutral-200 shadow-sm hover:shadow-lg hover:border-primary-200 transition-all cursor-pointer group"
                    >
                      <CardContent className="p-0">
                        <div className="relative overflow-hidden">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          {product.discount && (
                            <Badge className="absolute top-3 left-3 bg-red-500 text-white font-sans font-semibold">
                              -{product.discount}%
                            </Badge>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log('Added to wishlist:', product.id);
                            }}
                            className="absolute top-3 right-3 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-primary-50 transition-colors"
                          >
                            <Heart className="w-5 h-5 text-neutral-600" />
                          </button>
                        </div>

                        <div className="p-4 flex flex-col gap-3">
                          <div className="flex flex-col gap-1">
                            <h3 className="font-heading font-bold text-neutral-900 text-base line-clamp-1">
                              {product.name}
                            </h3>
                            <button
                              onClick={(e) => handleVendorClick(product.vendorId, e)}
                              className="font-sans text-xs text-primary-500 hover:text-primary-600 text-left"
                            >
                              {product.vendor}
                            </button>
                          </div>

                          <div className="flex items-center gap-2">
                            {renderStars(product.rating)}
                            <span className="font-sans text-xs text-neutral-600">
                              ({product.reviews})
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="font-heading font-bold text-neutral-900 text-xl">
                              ₦{product.price.toLocaleString()}
                            </span>
                            {product.originalPrice && (
                              <span className="font-sans text-sm text-neutral-400 line-through">
                                ₦{product.originalPrice.toLocaleString()}
                              </span>
                            )}
                          </div>

                          <Button
                            onClick={(e) => handleAddToCart(product.id, e)}
                            className="w-full bg-primary-500 hover:bg-primary-600 text-white font-sans font-semibold text-sm py-2.5 rounded-lg flex items-center justify-center gap-2"
                          >
                            <ShoppingCart className="w-4 h-4" />
                            Add to Cart
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
