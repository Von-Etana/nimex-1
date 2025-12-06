import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShoppingBag, MapPin, CreditCard, Truck, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { useAuth } from '../contexts/AuthContext';
import { where, orderBy } from 'firebase/firestore';
import { FirestoreService } from '../services/firestore.service';
import { COLLECTIONS } from '../lib/collections';
import { orderService } from '../services/orderService';
import { flutterwaveService } from '../services/flutterwaveService';
import { deliveryService } from '../services/deliveryService';

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

interface Address {
  id: string;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code?: string;
  is_default: boolean;
}

export const CheckoutScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [cartItems] = useState<CartItem[]>(location.state?.cartItems || []);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [deliveryType, setDeliveryType] = useState<'standard' | 'express' | 'same_day'>('standard');
  const [deliveryCost, setDeliveryCost] = useState<number>(0);
  const [isCalculatingCost, setIsCalculatingCost] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>('');
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState<Partial<Address>>({
    full_name: '',
    phone: '',
    address_line1: '',
    city: '',
    state: '',
  });

  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { from: location } });
      return;
    }

    if (cartItems.length === 0) {
      navigate('/cart');
      return;
    }

    loadAddresses();
  }, [user, cartItems]);

  useEffect(() => {
    if (selectedAddressId && cartItems.length > 0) {
      calculateDeliveryCost();
    }
  }, [selectedAddressId, deliveryType]);

  const loadAddresses = async () => {
    if (!user) return;

    try {
      const fetchedAddresses = await FirestoreService.getDocuments<Address>(COLLECTIONS.ADDRESSES, {
        filters: [{ field: 'user_id', operator: '==', value: user.uid }],
        orderBy: { field: 'is_default', direction: 'desc' }
      });

      setAddresses(fetchedAddresses);
      if (fetchedAddresses.length > 0) {
        const defaultAddress = fetchedAddresses.find((addr) => addr.is_default) || fetchedAddresses[0];
        setSelectedAddressId(defaultAddress.id);
      }
    } catch (error) {
      console.error('Error loading addresses:', error);
    }
  };

  const calculateDeliveryCost = async () => {
    const selectedAddress = addresses.find((addr) => addr.id === selectedAddressId);
    if (!selectedAddress) return;

    setIsCalculatingCost(true);
    setError('');

    try {
      const totalWeight = cartItems.length * 1;

      const result = await deliveryService.calculateDeliveryCost(
        'Lagos',
        'Lagos',
        selectedAddress.city,
        selectedAddress.state,
        totalWeight,
        deliveryType
      );

      if (result.success && result.cost) {
        setDeliveryCost(result.cost);
      } else {
        setDeliveryCost(deliveryType === 'standard' ? 2000 : deliveryType === 'express' ? 3000 : 4500);
      }
    } catch (err) {
      console.error('Error calculating delivery cost:', err);
      setDeliveryCost(deliveryType === 'standard' ? 2000 : deliveryType === 'express' ? 3000 : 4500);
    } finally {
      setIsCalculatingCost(false);
    }
  };

  const handleAddAddress = async () => {
    if (!user || !newAddress.full_name || !newAddress.phone || !newAddress.address_line1 || !newAddress.city || !newAddress.state) {
      setError('Please fill in all required address fields');
      return;
    }

    try {
      const addressData = {
        user_id: user.uid,
        ...newAddress,
        is_default: addresses.length === 0,
      };

      const addressId = `addr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await FirestoreService.setDocument(COLLECTIONS.ADDRESSES, addressId, {
        ...addressData,
        id: addressId
      });

      const newAddressWithId = { ...addressData, id: addressId } as Address;
      setAddresses([...addresses, newAddressWithId]);
      setSelectedAddressId(addressId);
      setShowAddressForm(false);
      setNewAddress({
        full_name: '',
        phone: '',
        address_line1: '',
        city: '',
        state: '',
      });
    } catch (error) {
      console.error('Error adding address:', error);
      setError('Failed to add address');
    }
  };

  const handleCheckout = async () => {
    if (!user || !selectedAddressId) {
      setError('Please select a delivery address');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      const vendorItems = cartItems.reduce((acc, item) => {
        if (!acc[item.vendor_id]) {
          acc[item.vendor_id] = [];
        }
        acc[item.vendor_id].push(item);
        return acc;
      }, {} as Record<string, CartItem[]>);

      const orderPromises = Object.entries(vendorItems).map(async ([vendorId, items]) => {
        const orderResult = await orderService.createOrder({
          buyerId: user.uid,
          vendorId,
          items: items.map((item) => ({
            productId: item.product_id,
            productTitle: item.title,
            productImage: item.image,
            quantity: item.quantity,
            unitPrice: item.price,
          })),
          deliveryAddressId: selectedAddressId,
          deliveryType,
          deliveryCost,
        });

        return orderResult;
      });

      const orderResults = await Promise.all(orderPromises);
      const failedOrders = orderResults.filter((result) => !result.success);

      if (failedOrders.length > 0) {
        throw new Error('Failed to create some orders');
      }

      const firstOrder = orderResults[0];
      if (!firstOrder.data) {
        throw new Error('No order data returned');
      }

      const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const totalAmount = subtotal + deliveryCost;

      await flutterwaveService.loadFlutterwaveScript();

      const paymentResult = await flutterwaveService.initializePayment({
        email: user.email || '',
        amount: totalAmount,
        orderId: firstOrder.data.orderId,
        name: user.displayName || 'Customer',
        metadata: {
          order_ids: orderResults.map((r) => r.data?.orderId).filter(Boolean),
          buyer_id: user.uid,
        },
      });

      if (!paymentResult.success || !paymentResult.data) {
        throw new Error(paymentResult.error || 'Failed to initialize payment');
      }

      flutterwaveService.openPaymentModal(
        paymentResult.data,
        async (response) => {
          // Verify
          const verifyResult = await flutterwaveService.verifyPayment(response.transaction_id || response.tx_ref);

          if (verifyResult.success) {
            for (const orderResult of orderResults) {
              if (orderResult.data) {
                await orderService.updateOrderPaymentStatus(
                  orderResult.data.orderId,
                  'paid',
                  response.tx_ref,
                  'flutterwave'
                );
              }
            }

            localStorage.removeItem('nimex_cart');
            navigate('/orders/' + firstOrder.data.orderId, {
              state: { paymentSuccess: true },
            });
          } else {
            setError('Payment verification failed');
            setIsProcessing(false);
          }
        },
        () => {
          setIsProcessing(false);
        }
      );
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err instanceof Error ? err.message : 'Failed to process checkout');
      setIsProcessing(false);
    }
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subtotal + deliveryCost;

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
        <h1 className="font-heading font-bold text-2xl md:text-3xl text-neutral-900 mb-8">
          Checkout
        </h1>

        {error && (
          <Card className="mb-6 border-error bg-error/5">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-error flex-shrink-0" />
              <p className="font-sans text-sm text-error">{error}</p>
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-primary-700" />
                  </div>
                  <h2 className="font-heading font-semibold text-lg text-neutral-900">
                    Delivery Address
                  </h2>
                </div>

                {addresses.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="font-sans text-neutral-600 mb-4">
                      No delivery address found. Please add one.
                    </p>
                    <Button onClick={() => setShowAddressForm(true)}>
                      Add Delivery Address
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {addresses.map((address) => (
                      <div
                        key={address.id}
                        onClick={() => setSelectedAddressId(address.id)}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${selectedAddressId === address.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-neutral-200 hover:border-neutral-300'
                          }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-sans font-semibold text-neutral-900">
                                {address.full_name}
                              </span>
                              {address.is_default && (
                                <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs font-medium rounded">
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="font-sans text-sm text-neutral-700">
                              {address.phone}
                            </p>
                            <p className="font-sans text-sm text-neutral-600 mt-1">
                              {address.address_line1}
                              {address.address_line2 && `, ${address.address_line2}`}
                            </p>
                            <p className="font-sans text-sm text-neutral-600">
                              {address.city}, {address.state}
                            </p>
                          </div>
                          {selectedAddressId === address.id && (
                            <CheckCircle className="w-5 h-5 text-primary-600 flex-shrink-0" />
                          )}
                        </div>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      onClick={() => setShowAddressForm(true)}
                      className="w-full"
                    >
                      Add New Address
                    </Button>
                  </div>
                )}

                {showAddressForm && (
                  <div className="mt-6 p-6 border border-neutral-200 rounded-lg bg-neutral-50">
                    <h3 className="font-heading font-semibold text-neutral-900 mb-4">
                      Add New Address
                    </h3>
                    <div className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <input
                          type="text"
                          placeholder="Full Name *"
                          value={newAddress.full_name || ''}
                          onChange={(e) =>
                            setNewAddress({ ...newAddress, full_name: e.target.value })
                          }
                          className="w-full px-4 py-2 border border-neutral-300 rounded-lg font-sans text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                        <input
                          type="tel"
                          placeholder="Phone Number *"
                          value={newAddress.phone || ''}
                          onChange={(e) =>
                            setNewAddress({ ...newAddress, phone: e.target.value })
                          }
                          className="w-full px-4 py-2 border border-neutral-300 rounded-lg font-sans text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <input
                        type="text"
                        placeholder="Address Line 1 *"
                        value={newAddress.address_line1 || ''}
                        onChange={(e) =>
                          setNewAddress({ ...newAddress, address_line1: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-neutral-300 rounded-lg font-sans text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      <input
                        type="text"
                        placeholder="Address Line 2 (Optional)"
                        value={newAddress.address_line2 || ''}
                        onChange={(e) =>
                          setNewAddress({ ...newAddress, address_line2: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-neutral-300 rounded-lg font-sans text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      <div className="grid md:grid-cols-2 gap-4">
                        <input
                          type="text"
                          placeholder="City *"
                          value={newAddress.city || ''}
                          onChange={(e) =>
                            setNewAddress({ ...newAddress, city: e.target.value })
                          }
                          className="w-full px-4 py-2 border border-neutral-300 rounded-lg font-sans text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                        <select
                          value={newAddress.state || ''}
                          onChange={(e) =>
                            setNewAddress({ ...newAddress, state: e.target.value })
                          }
                          className="w-full px-4 py-2 border border-neutral-300 rounded-lg font-sans text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="">Select State *</option>
                          <option value="Lagos">Lagos</option>
                          <option value="Abuja FCT">Abuja FCT</option>
                          <option value="Rivers">Rivers</option>
                          <option value="Kano">Kano</option>
                          <option value="Oyo">Oyo</option>
                          <option value="Edo">Edo</option>
                          <option value="Enugu">Enugu</option>
                        </select>
                      </div>
                      <div className="flex gap-3">
                        <Button onClick={handleAddAddress} className="flex-1">
                          Save Address
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setShowAddressForm(false)}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <Truck className="w-5 h-5 text-primary-700" />
                  </div>
                  <h2 className="font-heading font-semibold text-lg text-neutral-900">
                    Delivery Method
                  </h2>
                </div>

                <div className="space-y-3">
                  {[
                    { type: 'standard' as const, label: 'Standard Delivery', days: '3-5 business days' },
                    { type: 'express' as const, label: 'Express Delivery', days: '1-2 business days' },
                    { type: 'same_day' as const, label: 'Same Day Delivery', days: 'Within 24 hours' },
                  ].map((option) => (
                    <div
                      key={option.type}
                      onClick={() => setDeliveryType(option.type)}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${deliveryType === option.type
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-neutral-200 hover:border-neutral-300'
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-sans font-semibold text-neutral-900">{option.label}</p>
                          <p className="font-sans text-sm text-neutral-600">{option.days}</p>
                        </div>
                        {deliveryType === option.type && (
                          <CheckCircle className="w-5 h-5 text-primary-600" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <ShoppingBag className="w-5 h-5 text-primary-700" />
                  </div>
                  <h2 className="font-heading font-semibold text-lg text-neutral-900">
                    Order Items ({cartItems.length})
                  </h2>
                </div>

                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex gap-4">
                      <div
                        className="w-20 h-20 rounded-lg bg-cover bg-center flex-shrink-0"
                        style={{ backgroundImage: `url(${item.image})` }}
                      />
                      <div className="flex-1">
                        <h4 className="font-sans font-medium text-neutral-900 mb-1 line-clamp-2">
                          {item.title}
                        </h4>
                        <p className="font-sans text-sm text-neutral-600">
                          Quantity: {item.quantity}
                        </p>
                        <p className="font-sans font-semibold text-primary-600 mt-1">
                          ₦{(item.price * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-20">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-primary-700" />
                  </div>
                  <h2 className="font-heading font-semibold text-lg text-neutral-900">
                    Payment Summary
                  </h2>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between font-sans text-neutral-700">
                    <span>Subtotal ({cartItems.length} items)</span>
                    <span>₦{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-sans text-neutral-700">
                    <span>Delivery Fee</span>
                    {isCalculatingCost ? (
                      <span className="text-sm text-neutral-500">Calculating...</span>
                    ) : (
                      <span>₦{deliveryCost.toLocaleString()}</span>
                    )}
                  </div>
                  <div className="pt-3 border-t border-neutral-200 flex justify-between font-heading font-bold text-lg text-neutral-900">
                    <span>Total</span>
                    <span className="text-primary-600">₦{total.toLocaleString()}</span>
                  </div>
                </div>

                <Button
                  onClick={handleCheckout}
                  disabled={!selectedAddressId || isProcessing || isCalculatingCost}
                  className="w-full h-12 bg-primary-500 hover:bg-primary-600"
                >
                  {isProcessing ? 'Processing...' : 'Proceed to Payment'}
                </Button>

                <div className="mt-6 pt-6 border-t border-neutral-100">
                  <p className="font-sans text-xs text-neutral-600 text-center mb-2">
                    Your payment is protected by NIMEX Escrow
                  </p>
                  <p className="font-sans text-xs text-neutral-500 text-center">
                    Funds are held securely until delivery confirmation
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
