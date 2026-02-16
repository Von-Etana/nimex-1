import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Package,
    Truck,
    MapPin,
    Clock,
    AlertCircle,
    ChevronLeft,
    ShoppingBag,
    CreditCard,
    User,
    Phone
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { useAuth } from '../../contexts/AuthContext';
import { FirestoreService } from '../../services/firestore.service';
import { COLLECTIONS } from '../../lib/collections';
import { where, orderBy, limit } from 'firebase/firestore';
import { giglService } from '../../services/giglService';

interface Order {
    id: string;
    order_number: string;
    status: string;
    total_amount: number;
    payment_status: string;
    created_at: any;
    buyer_id: string;
    delivery_address_id: string;
    items?: any[];
}

interface Address {
    id: string;
    full_name: string;
    phone: string;
    address_line1: string;
    address_line2?: string;
    city: string;
    state: string;
}

interface Delivery {
    id: string;
    delivery_status: string;
    delivery_type: string;
    tracking_number?: string;
    gigl_tracking_url?: string;
    estimated_cost?: number;
}

export const VendorOrderDetailsScreen: React.FC = () => {
    const { orderId } = useParams<{ orderId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [order, setOrder] = useState<Order | null>(null);
    const [address, setAddress] = useState<Address | null>(null);
    const [delivery, setDelivery] = useState<Delivery | null>(null);
    const [loading, setLoading] = useState(true);
    const [processingShipment, setProcessingShipment] = useState(false);
    const [shippingQuote, setShippingQuote] = useState<number | null>(null);
    const [quoteError, setQuoteError] = useState<string>('');

    useEffect(() => {
        if (user && orderId) {
            loadOrderDetails();
        }
    }, [orderId, user]);

    const loadOrderDetails = async () => {
        try {
            setLoading(true);
            // 1. Fetch Order
            const orderData = await FirestoreService.getDocument<any>(COLLECTIONS.ORDERS, orderId!);
            if (!orderData) throw new Error('Order not found');

            // 2. Fetch Items
            const items = await FirestoreService.getDocuments<any>(COLLECTIONS.ORDER_ITEMS, {
                filters: [{ field: 'order_id', operator: '==', value: orderId }]
            });

            setOrder({ ...orderData, items });

            // 3. Fetch Address
            if (orderData.delivery_address_id) {
                const addr = await FirestoreService.getDocument<Address>(COLLECTIONS.ADDRESSES, orderData.delivery_address_id);
                setAddress(addr);
            }

            // 4. Fetch Existing Delivery
            const deliveries = await FirestoreService.getDocuments<any>(COLLECTIONS.DELIVERIES, {
                filters: [{ field: 'order_id', operator: '==', value: orderId }],
                limitCount: 1
            });

            if (deliveries.length > 0) {
                setDelivery(deliveries[0]);
            } else if (orderData.delivery_address_id) {
                // If no delivery exists yet, try to get a quote to show "Estimated Cost"
                // (This is distinct from creating shipment, just a preview)
                getShippingQuote(orderData, items, deliveries[0]); // Pass undefined if no delivery
            }

        } catch (error) {
            console.error('Error loading order:', error);
        } finally {
            setLoading(false);
        }
    };

    const getShippingQuote = async (orderData: any, items: any[], existingDelivery: any) => {
        if (existingDelivery) return; // No need if already shipped

        // Need address
        let deliveryAddr = address;
        if (!deliveryAddr && orderData.delivery_address_id) {
            deliveryAddr = await FirestoreService.getDocument<Address>(COLLECTIONS.ADDRESSES, orderData.delivery_address_id);
            setAddress(deliveryAddr);
        }

        if (!deliveryAddr) return;

        try {
            const quote = await giglService.getDeliveryQuote({
                pickupState: 'Lagos', // Vendor Address (Hardcoded for now)
                pickupCity: 'Ikeja',
                deliveryState: deliveryAddr.state,
                deliveryCity: deliveryAddr.city,
                weight: items.length * 1, // Approx
                deliveryType: 'standard'
            });

            if (quote.success && quote.data) {
                setShippingQuote(quote.data.estimatedCost);
            }
        } catch (err) {
            console.warn('Failed to get auto-quote', err);
        }
    };


    const handleCreateShipment = async () => {
        if (!order || !address) return;
        setProcessingShipment(true);
        setQuoteError('');

        try {
            const result = await giglService.createShipment({
                orderId: order.id,
                items: order.items || [],
                senderDetails: {
                    name: user?.displayName || 'Vendor',
                    phone: user?.phoneNumber || '08000000000',
                    email: user?.email || 'vendor@example.com',
                    address: 'Vendor Address, Lagos', // Should come from Vendor Profile
                    city: 'Ikeja',
                    state: 'Lagos'
                },
                receiverDetails: {
                    name: address.full_name,
                    phone: address.phone,
                    email: 'customer@example.com', // Should fetch buyer email
                    address: address.address_line1 + (address.address_line2 ? ', ' + address.address_line2 : ''),
                    city: address.city,
                    state: address.state
                },
                deliveryType: 'standard'
            });

            if (result.success && result.data) {
                // Reload to show shipment details
                await loadOrderDetails();
                alert(`Shipment Created! Tracking: ${result.data.trackingNumber}`);
            } else {
                setQuoteError(result.error || 'Failed to create shipment');
            }

        } catch (err) {
            console.error('Create shipment error:', err);
            setQuoteError('Failed to process shipment request');
        } finally {
            setProcessingShipment(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading...</div>;
    if (!order) return <div className="p-8 text-center">Order not found</div>;

    return (
        <div className="min-h-screen bg-neutral-50 p-4 md:p-8">
            <Button
                variant="ghost"
                onClick={() => navigate('/vendor/orders')}
                className="mb-6 pl-0 hover:bg-transparent hover:text-primary-600"
            >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back to Orders
            </Button>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="font-heading font-bold text-2xl text-neutral-900">
                        Order #{order.order_number}
                    </h1>
                    <p className="font-sans text-neutral-500">
                        Placed on {new Date(order.created_at?.toDate ? order.created_at.toDate() : order.created_at).toLocaleDateString()}
                    </p>
                </div>
                <div className={`px-4 py-2 rounded-full text-sm font-semibold capitalize
            ${order.status === 'completed' ? 'bg-green-100 text-green-700' :
                        order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                            'bg-blue-100 text-blue-700'}`}>
                    {order.status}
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Left Column - Order Info */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Shipment Card */}
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                                    <Truck className="w-5 h-5 text-primary-700" />
                                </div>
                                <h2 className="font-heading font-semibold text-lg text-neutral-900">
                                    Shipment Management
                                </h2>
                            </div>

                            {delivery ? (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                                        <div>
                                            <h3 className="font-semibold text-green-900">Shipment Active</h3>
                                            <p className="text-green-800 text-sm mt-1">
                                                Tracking Number: <span className="font-mono font-bold">{delivery.tracking_number || 'N/A'}</span>
                                            </p>
                                            <p className="text-green-800 text-sm">
                                                Status: <span className="capitalize">{delivery.delivery_status.replace('_', ' ')}</span>
                                            </p>
                                            {delivery.gigl_tracking_url && (
                                                <Button
                                                    size="sm"
                                                    className="mt-3 bg-green-600 hover:bg-green-700"
                                                    onClick={() => window.open(delivery.gigl_tracking_url, '_blank')}
                                                >
                                                    Track Shipment
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    {quoteError && (
                                        <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-center gap-2">
                                            <AlertCircle className="w-4 h-4" />
                                            {quoteError}
                                        </div>
                                    )}

                                    <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 mb-4">
                                        <p className="text-sm text-neutral-600 mb-2">Estimated Shipping Cost</p>
                                        <p className="text-xl font-bold text-neutral-900">
                                            {shippingQuote ? `₦${shippingQuote.toLocaleString()}` : 'Calculated at creation...'}
                                        </p>
                                    </div>

                                    <Button
                                        onClick={handleCreateShipment}
                                        disabled={processingShipment || !address}
                                        className="w-full h-12"
                                    >
                                        {processingShipment ? 'Creating Shipment...' : 'Create GIGL Shipment'}
                                    </Button>
                                    <p className="text-xs text-neutral-500 mt-3 text-center">
                                        * This will generate a waybill and request pickup from your location.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Order Items */}
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                                    <ShoppingBag className="w-5 h-5 text-primary-700" />
                                </div>
                                <h2 className="font-heading font-semibold text-lg text-neutral-900">
                                    Items ({order.items?.length || 0})
                                </h2>
                            </div>

                            <div className="space-y-4">
                                {order.items?.map((item: any, idx: number) => (
                                    <div key={idx} className="flex gap-4 border-b border-neutral-100 pb-4 last:border-0 last:pb-0">
                                        <div className="w-16 h-16 bg-neutral-100 rounded-lg bg-cover bg-center" style={{ backgroundImage: `url(${item.product_image})` }} />
                                        <div>
                                            <h4 className="font-medium text-neutral-900">{item.product_title}</h4>
                                            <p className="text-sm text-neutral-500">Quantity: {item.quantity}</p>
                                            <p className="font-semibold text-primary-600">₦{item.unit_price?.toLocaleString()}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column - Customer & Payment */}
                <div className="space-y-6">
                    <Card>
                        <CardContent className="p-6">
                            <h2 className="font-heading font-semibold text-lg text-neutral-900 mb-4">
                                Customer Details
                            </h2>
                            {address ? (
                                <div className="space-y-3">
                                    <div className="flex items-start gap-3">
                                        <User className="w-4 h-4 text-neutral-400 mt-1" />
                                        <div>
                                            <p className="font-medium text-neutral-900">{address.full_name}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Phone className="w-4 h-4 text-neutral-400 mt-1" />
                                        <p className="text-neutral-600">{address.phone}</p>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <MapPin className="w-4 h-4 text-neutral-400 mt-1" />
                                        <p className="text-neutral-600">
                                            {address.address_line1}<br />
                                            {address.city}, {address.state}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-neutral-500 text-sm">No address details available</p>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <h2 className="font-heading font-semibold text-lg text-neutral-900 mb-4">
                                Payment Summary
                            </h2>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-neutral-600">Subtotal</span>
                                    <span className="font-medium">₦{order.items?.reduce((s, i) => s + (i.total_price || 0), 0).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-neutral-600">Shipping</span>
                                    <span className="font-medium">₦{(order as any).shipping_fee?.toLocaleString() || '0'}</span>
                                </div>
                                <div className="pt-3 border-t border-neutral-200 flex justify-between">
                                    <span className="font-bold text-neutral-900">Total</span>
                                    <span className="font-bold text-primary-600">₦{order.total_amount.toLocaleString()}</span>
                                </div>
                                <div className="pt-2">
                                    <div className={`w-full py-2 text-center rounded-lg text-sm font-medium
                                ${order.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                        Payment: {order.payment_status?.toUpperCase()}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};
