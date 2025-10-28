import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Plus, Search, Edit, Trash2, Eye, EyeOff, Loader2, Package } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock_quantity: number;
  is_active: boolean;
  image_url: string | null;
  category_name?: string;
  created_at: string;
}

export const ProductsManagementScreen: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user) {
      loadProducts();
    }
  }, [user]);

  const loadProducts = async () => {
    try {
      setLoading(true);

      const { data: vendor } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (!vendor) return;

      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories (
            name
          )
        `)
        .eq('vendor_id', vendor.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const productsWithCategory = data?.map(p => ({
        ...p,
        category_name: p.categories?.name
      })) || [];

      setProducts(productsWithCategory);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleProductStatus = async (productId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: !currentStatus })
        .eq('id', productId);

      if (error) throw error;
      await loadProducts();
    } catch (error) {
      console.error('Error toggling product status:', error);
    }
  };

  const deleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;
      await loadProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto px-3 md:px-6 py-4 md:py-8">
        <div className="flex flex-col gap-4 md:gap-6">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h1 className="font-heading font-bold text-lg md:text-3xl text-neutral-900">
                Products
              </h1>
              <p className="font-sans text-xs md:text-sm text-neutral-600 mt-1">
                Manage your product listings
              </p>
            </div>
            <Button
              onClick={() => navigate('/vendor/products/create')}
              className="bg-green-700 hover:bg-green-800 text-white px-3 py-2 md:px-6 md:py-2 rounded-lg flex items-center gap-1 md:gap-2 text-xs md:text-sm"
            >
              <Plus className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Add Product</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>

          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="mb-4 md:mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products..."
                    className="w-full h-10 md:h-12 pl-10 pr-4 rounded-lg border border-neutral-200 font-sans text-sm md:text-base text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between mb-4 md:mb-6 pb-3 md:pb-4 border-b border-neutral-100">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 md:w-5 md:h-5 text-neutral-700" />
                  <h2 className="font-heading font-semibold text-sm md:text-xl text-neutral-900">
                    All Products ({filteredProducts.length})
                  </h2>
                </div>
              </div>

              {filteredProducts.length === 0 ? (
                <div className="text-center py-8 md:py-12">
                  <Package className="w-12 h-12 md:w-16 md:h-16 text-neutral-300 mx-auto mb-3 md:mb-4" />
                  <p className="font-sans text-sm md:text-base text-neutral-600">
                    {searchQuery ? 'No products found' : 'No products yet'}
                  </p>
                  {!searchQuery && (
                    <Button
                      onClick={() => navigate('/vendor/products/create')}
                      className="mt-4 bg-green-700 hover:bg-green-800 text-white px-4 py-2 text-xs md:text-sm"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Your First Product
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-3 md:space-y-4">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center gap-3 md:gap-4 p-3 md:p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
                    >
                      <div className="w-16 h-16 md:w-20 md:h-20 bg-neutral-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="w-6 h-6 md:w-8 md:h-8 text-neutral-400" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-sans font-semibold text-sm md:text-base text-neutral-900 truncate">
                            {product.name}
                          </h3>
                          <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
                            <button
                              onClick={() => toggleProductStatus(product.id, product.is_active)}
                              className="p-1 md:p-1.5 rounded-lg hover:bg-neutral-200 transition-colors"
                              title={product.is_active ? 'Hide product' : 'Show product'}
                            >
                              {product.is_active ? (
                                <Eye className="w-3.5 h-3.5 md:w-4 md:h-4 text-green-600" />
                              ) : (
                                <EyeOff className="w-3.5 h-3.5 md:w-4 md:h-4 text-neutral-400" />
                              )}
                            </button>
                            <button
                              onClick={() => alert('Edit functionality coming soon')}
                              className="p-1 md:p-1.5 rounded-lg hover:bg-neutral-200 transition-colors"
                            >
                              <Edit className="w-3.5 h-3.5 md:w-4 md:h-4 text-neutral-600" />
                            </button>
                            <button
                              onClick={() => deleteProduct(product.id)}
                              className="p-1 md:p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-red-600" />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                          <span className="font-heading font-bold text-sm md:text-lg text-green-700">
                            ₦{product.price.toLocaleString()}
                          </span>
                          {product.category_name && (
                            <span className="px-2 py-0.5 bg-neutral-100 rounded text-xs text-neutral-600">
                              {product.category_name}
                            </span>
                          )}
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            product.stock_quantity > 10
                              ? 'bg-green-100 text-green-700'
                              : product.stock_quantity > 0
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {product.stock_quantity} in stock
                          </span>
                        </div>
                        {product.description && (
                          <p className="font-sans text-xs md:text-sm text-neutral-600 mt-1 truncate md:line-clamp-2">
                            {product.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
