import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { ArrowLeft, Save, Loader2, Upload, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { ProductTagsInput } from '../../components/vendor/ProductTagsInput';

interface Category {
  id: string;
  name: string;
}

export const CreateProductScreen: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock_quantity: '',
    category_id: '',
    image_url: '',
    tags: [] as string[],
  });

  useEffect(() => {
    loadCategories();
    if (isEditing && id) {
      loadProductForEditing(id);
    }
  }, [isEditing, id]);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (err: any) {
      console.error('Error loading categories:', err);
    }
  };

  const loadProductForEditing = async (productId: string) => {
    try {
      setLoading(true);
      const { data: product, error } = await supabase
        .from('products')
        .select(`
          *,
          product_tags (
            tag
          )
        `)
        .eq('id', productId)
        .single();

      if (error) throw error;

      if (product) {
        setFormData({
          name: product.name,
          description: product.description || '',
          price: product.price.toString(),
          stock_quantity: product.stock_quantity.toString(),
          category_id: product.category_id || '',
          image_url: product.image_url || '',
          tags: product.product_tags?.map((pt: any) => pt.tag) || [],
        });
      }
    } catch (err: any) {
      setError('Failed to load product for editing');
      console.error('Error loading product:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUrlChange = (url: string) => {
    setFormData({ ...formData, image_url: url });
    setImagePreview(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (!user) throw new Error('User not authenticated');

      // Get vendor ID
      const { data: vendor, error: vendorError } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (vendorError) throw vendorError;
      if (!vendor) throw new Error('Vendor profile not found');

      let product;

      if (isEditing && id) {
        // Update existing product
        const { data: updatedProduct, error: updateError } = await supabase
          .from('products')
          .update({
            name: formData.name,
            description: formData.description || null,
            price: parseFloat(formData.price),
            stock_quantity: parseInt(formData.stock_quantity),
            category_id: formData.category_id || null,
            image_url: formData.image_url || null,
          })
          .eq('id', id)
          .select()
          .single();

        if (updateError) throw updateError;
        product = updatedProduct;
      } else {
        // Create new product
        const { data: newProduct, error: createError } = await supabase
          .from('products')
          .insert({
            vendor_id: vendor.id,
            name: formData.name,
            description: formData.description || null,
            price: parseFloat(formData.price),
            stock_quantity: parseInt(formData.stock_quantity),
            category_id: formData.category_id || null,
            image_url: formData.image_url || null,
            is_active: true,
          })
          .select()
          .single();

        if (createError) throw createError;
        product = newProduct;
      }

      if (isEditing && id) {
        // For updates, we already have the product from the update operation
      } else {
        // For creates, check for error
        if (createError) throw createError;
      }

      // Handle tags for both create and update
      if (product) {
        // Delete existing tags first
        await supabase
          .from('product_tags')
          .delete()
          .eq('product_id', product.id);

        // Add new tags if any
        if (formData.tags.length > 0) {
          const tagInserts = formData.tags.map((tag: string) => ({
            product_id: product.id,
            tag: tag,
          }));

          const { error: tagsError } = await supabase
            .from('product_tags')
            .insert(tagInserts);

          if (tagsError) throw tagsError;
        }
      }

      setSuccess(isEditing ? 'Product updated successfully!' : 'Product created successfully!');
      setTimeout(() => {
        navigate('/vendor/products');
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-neutral-50">
      <div className="max-w-4xl mx-auto px-3 md:px-6 py-4 md:py-8">
        <div className="flex flex-col gap-4 md:gap-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/vendor/products')}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-neutral-700" />
            </button>
            <div>
              <h1 className="font-heading font-bold text-lg md:text-3xl text-neutral-900">
                {isEditing ? 'Edit Product' : 'Create New Product'}
              </h1>
              <p className="font-sans text-xs md:text-sm text-neutral-600 mt-0.5 md:mt-1">
                Add a new product to your store
              </p>
            </div>
          </div>

          {error && (
            <div className="p-3 md:p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="font-sans text-xs md:text-sm text-red-600">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-3 md:p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="font-sans text-xs md:text-sm text-green-600">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
            <Card>
              <CardContent className="p-4 md:p-6 space-y-4 md:space-y-6">
                <div className="flex items-center gap-2 md:gap-3 pb-3 md:pb-4 border-b border-neutral-100">
                  <h2 className="font-heading font-semibold text-sm md:text-xl text-neutral-900">
                    Product Information
                  </h2>
                </div>

                <div>
                  <label className="block font-sans font-medium text-xs md:text-sm text-neutral-700 mb-1 md:mb-2">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full h-10 md:h-12 px-3 md:px-4 rounded-lg border border-neutral-200 font-sans text-sm md:text-base text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="e.g., Handwoven Basket"
                  />
                </div>

                <div>
                  <label className="block font-sans font-medium text-xs md:text-sm text-neutral-700 mb-1 md:mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className="w-full px-3 md:px-4 py-2 md:py-3 rounded-lg border border-neutral-200 font-sans text-sm md:text-base text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                    placeholder="Describe your product..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div>
                    <label className="block font-sans font-medium text-xs md:text-sm text-neutral-700 mb-1 md:mb-2">
                      Price (₦) *
                    </label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      required
                      min="0"
                      step="0.01"
                      className="w-full h-10 md:h-12 px-3 md:px-4 rounded-lg border border-neutral-200 font-sans text-sm md:text-base text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block font-sans font-medium text-xs md:text-sm text-neutral-700 mb-1 md:mb-2">
                      Stock Quantity *
                    </label>
                    <input
                      type="number"
                      value={formData.stock_quantity}
                      onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                      required
                      min="0"
                      className="w-full h-10 md:h-12 px-3 md:px-4 rounded-lg border border-neutral-200 font-sans text-sm md:text-base text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-sans font-medium text-xs md:text-sm text-neutral-700 mb-1 md:mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full h-10 md:h-12 px-3 md:px-4 rounded-lg border border-neutral-200 font-sans text-sm md:text-base text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-sans font-medium text-xs md:text-sm text-neutral-700 mb-1 md:mb-2">
                    Product Image URL
                  </label>
                  <div className="space-y-3">
                    <input
                      type="url"
                      value={formData.image_url}
                      onChange={(e) => handleImageUrlChange(e.target.value)}
                      className="w-full h-10 md:h-12 px-3 md:px-4 rounded-lg border border-neutral-200 font-sans text-sm md:text-base text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="https://example.com/image.jpg"
                    />
                    {imagePreview && (
                      <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-lg overflow-hidden border border-neutral-200">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-full object-cover"
                          onError={() => setImagePreview(null)}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, image_url: '' });
                            setImagePreview(null);
                          }}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block font-sans font-medium text-xs md:text-sm text-neutral-700 mb-1 md:mb-2">
                    Product Tags
                  </label>
                  <ProductTagsInput
                    tags={formData.tags}
                    onChange={(tags) => setFormData({ ...formData, tags })}
                  />
                  <p className="font-sans text-xs text-neutral-500 mt-1">
                    Add tags to help customers find your product
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3 md:gap-4">
              <Button
                type="button"
                onClick={() => navigate('/vendor/products')}
                className="flex-1 h-10 md:h-12 bg-white hover:bg-neutral-50 text-neutral-900 border border-neutral-200 font-sans font-semibold text-sm md:text-base rounded-lg"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 h-10 md:h-12 bg-green-700 hover:bg-green-800 text-white font-sans font-semibold text-sm md:text-base rounded-lg flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 md:w-5 md:h-5" />
                    Create Product
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
