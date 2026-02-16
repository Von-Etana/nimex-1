import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Package,
  Truck,
  MapPin,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  MessageSquare,
  Shield,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { useAuth } from '../contexts/AuthContext';
import { FirestoreService } from '../services/firestore.service';
import { COLLECTIONS } from '../lib/collections';
import { where, orderBy, limit } from 'firebase/firestore';
import { orderService } from '../services/orderService';

interface Order {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  payment_status: string;
  tracking_number: string;
  created_at: string;
  delivered_at?: string;
  vendor: {
    business_name: string;
  };
}

interface Delivery {
  id: string;
  delivery_status: string;
  delivery_type: string;
  estimated_delivery_date: string;
  actual_delivery_date?: string;
  gigl_tracking_url?: string;
  delivery_proof_url?: string;
  recipient_name?: string;
}

interface StatusHistoryItem {
  status: string;
  location?: string;
  notes?: string;
  created_at: string;
}

interface EscrowTransaction {
  status: string;
  amount: number;
  held_at: string;
  released_at?: string;
}

export const OrderTrackingScreen: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [statusHistory, setStatusHistory] = useState<StatusHistoryItem[]>([]);
  const [escrow, setEscrow] = useState<EscrowTransaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmingDelivery, setConfirmingDelivery] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (orderId) {
      loadOrderDetails();
    }
  }, [orderId, user]);

  const loadOrderDetails = async () => {
    if (!orderId || !user) return;

    setLoading(true);

    try {
      // 1. Fetch Order
      const orderData = await FirestoreService.getDocument<any>(COLLECTIONS.ORDERS, orderId);

      if (!orderData || orderData.buyer_id !== user.uid) {
        console.error('Order not found or unauthorized');
        return;
      }

      // 2. Fetch Vendor
      let vendorName = 'Unknown Vendor';
      if (orderData.vendor_id) {
        const vendor = await FirestoreService.getDocument<any>(COLLECTIONS.VENDORS, orderData.vendor_id);
        if (vendor) {
          vendorName = vendor.business_name;
        }
      }

      setOrder({
        ...orderData,
        vendor: { business_name: vendorName }
      });

      // 3. Fetch Delivery
      const deliveries = await FirestoreService.getDocuments<any>(COLLECTIONS.DELIVERIES, [
        where('order_id', '==', orderId),
        limit(1)
      ]);

      if (deliveries.length > 0) {
        const deliveryData = deliveries[0];
        setDelivery(deliveryData);

        // 4. Fetch Delivery History
        const historyData = await FirestoreService.getDocuments<StatusHistoryItem>(COLLECTIONS.DELIVERY_STATUS_HISTORY, [
          where('delivery_id', '==', deliveryData.id),
          orderBy('created_at', 'desc')
        ]);
        setStatusHistory(historyData);
      }

      // 5. Fetch Escrow Transaction
      const escrowTransactions = await FirestoreService.getDocuments<EscrowTransaction>(COLLECTIONS.ESCROW_TRANSACTIONS, [
        where('order_id', '==', orderId),
        limit(1)
      ]);

      if (escrowTransactions.length > 0) {
        setEscrow(escrowTransactions[0]);
      }

    } catch (error) {
      console.error('Error loading order details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelivery = async () => {
    if (!orderId || !user) return;

    setConfirmingDelivery(true);

    try {
      const result = await orderService.confirmDelivery({
        orderId,
        buyerId: user.id,
      });

      if (result.success) {
        await loadOrderDetails();
        alert('Delivery confirmed! Escrow will be released to vendor.');
      } else {
        alert('Failed to confirm delivery: ' + result.error);
      }
    } catch (error) {
      console.error('Error confirming delivery:', error);
      alert('Failed to confirm delivery');
    } finally {
      setConfirmingDelivery(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
      case 'confirmed':
        return <Clock className="w-6 h-6 text-yellow-600" />;
      case 'processing':
      case 'pickup_scheduled':
        return <Package className="w-6 h-6 text-blue-600" />;
      case 'in_transit':
      case 'out_for_delivery':
        return <Truck className="w-6 h-6 text-purple-600" />;
      case 'delivered':
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'cancelled':
      case 'failed':
        return <AlertCircle className="w-6 h-6 text-red-600" />;
      default:
        return <Package className="w-6 h-6 text-neutral-600" />;
    }
  };

  const getStatusLabel = (status: string) => {
    return status
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const canConfirmDelivery =
    delivery?.delivery_status === 'delivered' && !delivery.actual_delivery_date;

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-12 h-12 text-primary-500 mx-auto mb-4 animate-pulse" />
          <p className="font-sans text-neutral-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-error mx-auto mb-4" />
          <h2 className="font-heading font-bold text-xl text-neutral-900 mb-2">
            Order Not Found
          </h2>
          <p className="font-sans text-neutral-600 mb-6">
            The order you're looking for doesn't exist or you don't have access to it.
          </p>
          <Button onClick={() => navigate('/')}>Go to Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-8">
        <div className="mb-8">
          <h1 className="font-heading font-bold text-2xl md:text-3xl text-neutral-900 mb-2">
            Order Details
          </h1>
          <p className="font-sans text-neutral-600">
            Order #{order.order_number}
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-heading font-semibold text-lg text-neutral-900">
                    Order Status
                  </h2>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(delivery?.delivery_status || order.status)}
                    <span className="font-sans font-semibold text-neutral-900">
                      {getStatusLabel(delivery?.delivery_status || order.status)}
                    </span>
                  </div>
                </div>

                {delivery && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-primary-50 rounded-lg">
                      <div>
                        <p className="font-sans text-sm text-neutral-600 mb-1">
                          Estimated Delivery
                        </p>
                        <p className="font-sans font-semibold text-neutral-900">
                          {new Date(delivery.estimated_delivery_date).toLocaleDateString('en-NG', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                      {order.tracking_number && (
                        <div className="text-right">
                          <p className="font-sans text-sm text-neutral-600 mb-1">
                            Tracking Number
                          </p>
                          <p className="font-mono font-semibold text-neutral-900">
                            {order.tracking_number}
                          </p>
                        </div>
                      )}
                    </div>

                    {delivery.gigl_tracking_url && (
                      <Button
                        variant="outline"
                        onClick={() => window.open(delivery.gigl_tracking_url, '_blank')}
                        className="w-full"
                      >
                        <Truck className="w-4 h-4 mr-2" />
                        Track with GIGL
                      </Button>
                    )}

                    {canConfirmDelivery && (
                      <Card className="border-green-200 bg-green-50">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <h3 className="font-sans font-semibold text-neutral-900 mb-1">
                                Package Delivered
                              </h3>
                              <p className="font-sans text-sm text-neutral-700 mb-3">
                                Has your package arrived? Confirm delivery to release payment to the vendor.
                              </p>
                              <Button
                                onClick={handleConfirmDelivery}
                                disabled={confirmingDelivery}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                {confirmingDelivery ? 'Confirming...' : 'Confirm Delivery'}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {delivery.delivery_proof_url && (
                      <div>
                        <h3 className="font-sans font-semibold text-neutral-900 mb-3">
                          Delivery Proof
                        </h3>
                        <img
                          src={delivery.delivery_proof_url}
                          alt="Delivery proof"
                          className="w-full rounded-lg border border-neutral-200"
                        />
                        {delivery.recipient_name && (
                          <p className="font-sans text-sm text-neutral-600 mt-2">
                            Received by: {delivery.recipient_name}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h2 className="font-heading font-semibold text-lg text-neutral-900 mb-6">
                  Delivery Timeline
                </h2>

                <div className="space-y-4">
                  {statusHistory.length === 0 ? (
                    <p className="font-sans text-neutral-600 text-center py-4">
                      No status updates yet
                    </p>
                  ) : (
                    statusHistory.map((item, index) => (
                      <div key={index} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${index === 0 ? 'bg-primary-100' : 'bg-neutral-100'
                              }`}
                          >
                            {getStatusIcon(item.status)}
                          </div>
                          {index < statusHistory.length - 1 && (
                            <div className="w-0.5 h-full bg-neutral-200 my-1" />
                          )}
                        </div>

                        <div className="flex-1 pb-6">
                          <p className="font-sans font-semibold text-neutral-900">
                            {getStatusLabel(item.status)}
                          </p>
                          {item.location && (
                            <p className="font-sans text-sm text-neutral-600 flex items-center gap-1 mt-1">
                              <MapPin className="w-3 h-3" />
                              {item.location}
                            </p>
                          )}
                          {item.notes && (
                            <p className="font-sans text-sm text-neutral-700 mt-1">
                              {item.notes}
                            </p>
                          )}
                          <p className="font-sans text-xs text-neutral-500 mt-2">
                            {new Date(item.created_at).toLocaleString('en-NG', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <h2 className="font-heading font-semibold text-lg text-neutral-900 mb-4">
                  Order Summary
                </h2>

                <div className="space-y-3">
                  <div className="flex justify-between font-sans text-sm">
                    <span className="text-neutral-600">Vendor</span>
                    <span className="font-medium text-neutral-900">
                      {order.vendor.business_name}
                    </span>
                  </div>
                  <div className="flex justify-between font-sans text-sm">
                    <span className="text-neutral-600">Order Date</span>
                    <span className="font-medium text-neutral-900">
                      {new Date(order.created_at).toLocaleDateString('en-NG')}
                    </span>
                  </div>
                  <div className="flex justify-between font-sans text-sm">
                    <span className="text-neutral-600">Payment Status</span>
                    <span
                      className={`font-medium ${order.payment_status === 'paid'
                          ? 'text-green-600'
                          : 'text-yellow-600'
                        }`}
                    >
                      {getStatusLabel(order.payment_status)}
                    </span>
                  </div>
                  <div className="pt-3 border-t border-neutral-200 flex justify-between">
                    <span className="font-sans font-semibold text-neutral-900">Total</span>
                    <span className="font-heading font-bold text-lg text-primary-600">
                      ₦{order.total_amount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {escrow && (
              <Card className="border-primary-200 bg-primary-50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Shield className="w-5 h-5 text-primary-600" />
                    <h3 className="font-heading font-semibold text-neutral-900">
                      Escrow Protection
                    </h3>
                  </div>
                  <p className="font-sans text-sm text-neutral-700 mb-3">
                    Your payment of ₦{escrow.amount.toLocaleString()} is secured in escrow.
                  </p>
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${escrow.status === 'held'
                          ? 'bg-yellow-500'
                          : escrow.status === 'released'
                            ? 'bg-green-500'
                            : 'bg-neutral-500'
                        }`}
                    />
                    <span className="font-sans text-sm font-medium text-neutral-900">
                      {getStatusLabel(escrow.status)}
                    </span>
                  </div>
                  {escrow.status === 'held' && (
                    <p className="font-sans text-xs text-neutral-600 mt-3">
                      Funds will be released to vendor after delivery confirmation
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            <div className="space-y-3">
              <Button
                variant="outline"
                onClick={() => navigate('/chat')}
                className="w-full justify-start"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Contact Vendor
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate(`/orders/${orderId}/dispute`)}
                className="w-full justify-start text-error hover:bg-error/5"
              >
                <FileText className="w-4 h-4 mr-2" />
                Report Issue
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
