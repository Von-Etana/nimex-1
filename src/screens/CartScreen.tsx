import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { useAuth } from '../contexts/AuthContext';

import { triggerCartUpdate } from '../hooks/useCart';
interface CartItem {
  id: string;
  product_id: string;
  title: string;
  price: number;
  image: string;
  vendor_id: string;
  vendor_name: string;
  quantity: number;
}

export const CartScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { from: location } });
      return;
    }

    loadCart();
  }, [user]);

  const loadCart = () => {
    try {
      const saved = localStorage.getItem('nimex_cart');
      if (saved) {
        setCartItems(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading cart:', error);
    }
  };

  const saveCart = (items: CartItem[]) => {
    triggerCartUpdate();
    try {
      localStorage.setItem('nimex_cart', JSON.stringify(items));
      setCartItems(items);
    } catch (error) {
      console.error('Error saving cart:', error);
    }
  };

  const addToCart = (item: CartItem) => {
    const existingIndex = cartItems.findIndex(i => i.product_id === item.product_id);

    if (existingIndex >= 0) {
      const updated = [...cartItems];
      updated[existingIndex].quantity += 1;
      saveCart(updated);
    } else {
      saveCart([...cartItems, item]);
    }
  };

  const updateQuantity = (itemId: string, delta: number) => {
    const updated = cartItems.map(item => {
      if (item.id === itemId) {
        const newQuantity = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQuantity };
      }
      return item;
    });
    saveCart(updated);
  };

  const removeItem = (itemId: string) => {
    const updated = cartItems.filter(item => item.id !== itemId);
    saveCart(updated);
  };

  const groupedByVendor = cartItems.reduce((acc, item) => {
    if (!acc[item.vendor_id]) {
      acc[item.vendor_id] = {
        vendor_id: item.vendor_id,
        vendor_name: item.vendor_name,
        items: []
      };
    }
    acc[item.vendor_id].items.push(item);
    return acc;
  }, {} as Record<string, { vendor_id: string; vendor_name: string; items: CartItem[] }>);

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shippingFee = Object.keys(groupedByVendor).length * 2000;
  const total = subtotal + shippingFee;

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center px-4">
          <div className="w-24 h-24 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-12 h-12 text-neutral-400" />
          </div>
          <h2 className="font-heading font-bold text-2xl text-neutral-900 mb-3">
            Your cart is empty
          </h2>
          <p className="font-sans text-neutral-600 mb-8">
            Add some products to get started
          </p>
          <Button onClick={() => navigate('/')}>
            Continue Shopping
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
        <h1 className="font-heading font-bold text-2xl md:text-3xl text-neutral-900 mb-8">
          Shopping Cart
        </h1>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {Object.values(groupedByVendor).map(({ vendor_id, vendor_name, items }) => (
              <Card key={vendor_id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-neutral-100">
                    <h3 className="font-heading font-semibold text-lg text-neutral-900">
                      {vendor_name}
                    </h3>
                    <span className="font-sans text-sm text-neutral-600">
                      {items.length} {items.length === 1 ? 'item' : 'items'}
                    </span>
                  </div>

                  <div className="space-y-4">
                    {items.map((item) => (
                      <div key={item.id} className="flex gap-4">
                        <div
                          className="w-24 h-24 rounded-lg bg-cover bg-center flex-shrink-0"
                          style={{ backgroundImage: `url(${item.image})` }}
                        />

                        <div className="flex-1">
                          <h4 className="font-sans font-semibold text-neutral-900 mb-2 line-clamp-2">
                            {item.title}
                          </h4>
                          <div className="flex items-center justify-between">
                            <span className="font-sans font-bold text-primary-500">
                              ₦{item.price.toLocaleString()}
                            </span>

                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2 border border-neutral-200 rounded-lg">
                                <button
                                  onClick={() => updateQuantity(item.id, -1)}
                                  disabled={item.quantity <= 1}
                                  className="p-2 hover:bg-neutral-100 disabled:opacity-50"
                                >
                                  <Minus className="w-4 h-4" />
                                </button>
                                <span className="font-sans font-medium px-2 min-w-[2rem] text-center">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => updateQuantity(item.id, 1)}
                                  className="p-2 hover:bg-neutral-100"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              </div>

                              <button
                                onClick={() => removeItem(item.id)}
                                className="p-2 text-error hover:bg-error/10 rounded-lg"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-20">
              <CardContent className="p-6">
                <h3 className="font-heading font-semibold text-lg text-neutral-900 mb-4">
                  Order Summary
                </h3>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between font-sans text-neutral-700">
                    <span>Subtotal ({cartItems.length} items)</span>
                    <span>₦{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-sans text-neutral-700">
                    <span>Shipping Fee</span>
                    <span>₦{shippingFee.toLocaleString()}</span>
                  </div>
                  <div className="pt-3 border-t border-neutral-200 flex justify-between font-heading font-bold text-lg text-neutral-900">
                    <span>Total</span>
                    <span className="text-primary-500">₦{total.toLocaleString()}</span>
                  </div>
                </div>

                <Button
                  onClick={() => navigate('/checkout', { state: { cartItems } })}
                  className="w-full h-12 bg-primary-500 hover:bg-primary-600 mb-3"
                >
                  Proceed to Checkout
                </Button>

                <Button
                  variant="outline"
                  onClick={() => navigate('/')}
                  className="w-full h-12"
                >
                  Continue Shopping
                </Button>

                <div className="mt-6 pt-6 border-t border-neutral-100">
                  <p className="font-sans text-xs text-neutral-600 text-center">
                    Your payment is protected by NIMEX Escrow until delivery confirmation
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
