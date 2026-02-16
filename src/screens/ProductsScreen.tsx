import { CATEGORIES } from '../lib/categories';

// ... imports remain the same

// ... const sortOptions remains same

export const ProductsScreen: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { success } = useToast();

  // Product state
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [selectedCategoryId, setSelectedCategoryId] = useState('all');
  const [selectedPriceRange, setSelectedPriceRange] = useState(0);
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState('featured');
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch products from Firestore
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);

        // Fetch products - use simpler filter to avoid composite index requirement
        // Filter by is_active only, then filter client-side for status
        const productsData = await FirestoreService.getDocuments<any>(COLLECTIONS.PRODUCTS, {
          orderByField: 'created_at',
          orderByDirection: 'desc'
        });

        if (!productsData || productsData.length === 0) {
          setProducts([]);
          setLoading(false);
          return;
        }

        // Client-side filter for active products
        // A product is visible if: (is_active === true) OR (status === 'active')
        const activeProducts = productsData.filter(p =>
          p.is_active === true || p.status === 'active'
        );

        if (activeProducts.length === 0) {
          setProducts([]);
          setLoading(false);
          return;
        }

        // Fetch vendors to map vendor names
        const vendorIds = Array.from(new Set(activeProducts.map(p => p.vendor_id).filter(Boolean)));
        const vendorMap = new Map<string, any>();

        if (vendorIds.length > 0) {
          const vendors = await FirestoreService.getDocuments<any>(COLLECTIONS.VENDORS);
          vendors.forEach(v => {
            vendorMap.set(v.id, v);
          });
        }

        // Transform products to ProductCard format
        const transformedProducts = activeProducts.map(p => transformProduct(p, vendorMap));
        setProducts(transformedProducts);
      } catch (error) {
        console.error('Error fetching products:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Initialize filters from URL params
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam) {
      // Check if it matches an ID directly
      const match = CATEGORIES.find(c => c.id === categoryParam);
      if (match) {
        setSelectedCategoryId(match.id);
      } else {
        // Fallback: check names (legacy support)
        const nameMatch = CATEGORIES.find(c => c.name.toLowerCase() === categoryParam.toLowerCase());
        if (nameMatch) setSelectedCategoryId(nameMatch.id);
        else if (categoryParam !== 'All') setSelectedCategoryId(categoryParam); // Keep as is if no match found, maybe custom ID
      }
    }

    const searchParam = searchParams.get('search');
    if (searchParam) {
      setSearchQuery(searchParam);
    }
  }, [searchParams]);

  // Update URL when category changes
  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    if (categoryId === 'all') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', categoryId);
    }
    setSearchParams(searchParams);
  };

  const filteredProducts = products.filter((product) => {
    const categoryMatch = selectedCategoryId === 'all' ||
      product.category === selectedCategoryId ||
      // Handle potential legacy mismatch or sub-categories
      (product.category && product.category.toLowerCase() === selectedCategoryId.toLowerCase());

    const priceRange = priceRanges[selectedPriceRange];
    const priceMatch = product.price >= priceRange.min && product.price <= priceRange.max;
    const ratingMatch = product.rating >= minRating;
    const searchMatch = !searchQuery ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.category && product.category.toLowerCase().includes(searchQuery.toLowerCase()));
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

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const addToCartLogic = async (product: Product) => {
    try {
      await CartService.addToCart(product.id.toString(), 1);
      success(`${product.name} added to cart!`);
      triggerCartUpdate();
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  }

  const activeFiltersCount =
    (selectedCategoryId !== 'all' ? 1 : 0) +
    (selectedPriceRange !== 0 ? 1 : 0) +
    (minRating > 0 ? 1 : 0);

  if (loading) {
    return (
      <div className="flex flex-col w-full min-h-screen bg-neutral-50">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      </div>
    );
  }

  const getCategoryName = (id: string) => {
    if (id === 'all') return 'All Products';
    const cat = CATEGORIES.find(c => c.id === id);
    return cat ? cat.name : id;
  };

  return (
    <div className="flex flex-col w-full min-h-screen bg-neutral-50">
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="font-heading font-bold text-neutral-900 text-2xl md:text-3xl">
                {getCategoryName(selectedCategoryId)}
              </h1>
              <p className="font-sans text-neutral-600 text-sm mt-1">
                {sortedProducts.length} products available
              </p>
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
                          handleCategoryChange('all');
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
                        <label className="flex items-center gap-2 cursor-pointer group">
                          <input
                            type="radio"
                            name="category"
                            checked={selectedCategoryId === 'all'}
                            onChange={() => handleCategoryChange('all')}
                            className="w-4 h-4 text-primary-500 focus:ring-primary-500 cursor-pointer"
                          />
                          <span className="font-sans text-sm text-neutral-700 group-hover:text-primary-500">
                            All Categories
                          </span>
                        </label>
                        {CATEGORIES.map((category) => (
                          <label
                            key={category.id}
                            className="flex items-center gap-2 cursor-pointer group"
                          >
                            <input
                              type="radio"
                              name="category"
                              checked={selectedCategoryId === category.id}
                              onChange={() => handleCategoryChange(category.id)}
                              className="w-4 h-4 text-primary-500 focus:ring-primary-500 cursor-pointer"
                            />
                            <span className="font-sans text-sm text-neutral-700 group-hover:text-primary-500">
                              {category.name}
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
                                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
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
                        handleCategoryChange('all');
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
                    <div key={product.id} className="h-full">
                      <ProductCard
                        product={product}
                        onAddToCart={(e) => {
                          e.stopPropagation();
                          addToCartLogic(product);
                        }}
                        onToggleWishlist={(e) => {
                          e.stopPropagation();
                          console.log('Wishlist toggled for', product.id);
                        }}
                      />
                    </div>
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
