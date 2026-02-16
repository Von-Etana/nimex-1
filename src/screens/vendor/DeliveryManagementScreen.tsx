import React, { useState, useEffect } from 'react';
import { Package, Truck, AlertCircle, Upload, CheckCircle } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { useAuth } from '../../contexts/AuthContext';
import { FirestoreService } from '../../services/firestore.service';
import { COLLECTIONS } from '../../lib/collections';
import { deliveryService } from '../../services/deliveryService';

interface Order {
  id: string;
  order_number: string;
  buyer: {
    full_name: string;
    email: string;
  };
  delivery_address: {
    full_name: string;
    phone: string;
    address_line1: string;
    city: string;
    state: string;
  };
  total_amount: number;
  status: string;
  created_at: string;
}

interface Delivery {
  id: string;
  order_id: string;
  delivery_status: string;
  gigl_shipment_id?: string;
  gigl_tracking_url?: string;
  estimated_delivery_date?: string;
}

type TabType = 'pending' | 'in_transit' | 'delivered';

export const DeliveryManagementScreen: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [orders, setOrders] = useState<Order[]>([]);
  const [deliveries, setDeliveries] = useState<Record<string, Delivery>>({});
  const [loading, setLoading] = useState(true);
  const [processingOrders, setProcessingOrders] = useState<Set<string>>(new Set());
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [recipientName, setRecipientName] = useState('');
  const [uploadingProof, setUploadingProof] = useState(false);

  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user, activeTab]);

  const loadOrders = async () => {
    if (!user) return;

    setLoading(true);

    try {
      // Get vendor ID
      const vendors = await FirestoreService.getDocuments<any>(COLLECTIONS.VENDORS, {
        filters: [{ field: 'user_id', operator: '==', value: user.uid }],
        limitCount: 1
      });

      if (vendors.length === 0) return;
      const vendorData = vendors[0];

      // Build filters for orders
      const filters: any[] = [
        { field: 'vendor_id', operator: '==', value: vendorData.id },
        { field: 'payment_status', operator: '==', value: 'paid' }
      ];

      if (activeTab === 'pending') {
        filters.push({ field: 'status', operator: 'in', value: ['confirmed', 'processing'] });
      } else if (activeTab === 'in_transit') {
        filters.push({ field: 'status', operator: '==', value: 'shipped' });
      } else if (activeTab === 'delivered') {
        filters.push({ field: 'status', operator: '==', value: 'delivered' });
      }

      // Fetch orders
      const ordersData = await FirestoreService.getDocuments<any>(COLLECTIONS.ORDERS, {
        filters,
        orderBy: { field: 'created_at', direction: 'desc' }
      });

      // Manual joins for buyer and address, and fetch delivery
      const enrichedOrders = await Promise.all((ordersData || []).map(async (order) => {
        const [buyer, address] = await Promise.all([
          order.buyer_id ? FirestoreService.getDocument<any>(COLLECTIONS.PROFILES, order.buyer_id) : null,
          order.delivery_address_id ? FirestoreService.getDocument<any>(COLLECTIONS.ADDRESSES, order.delivery_address_id) : null
        ]);

        // If address is not found by ID, check if it's embedded
        const deliveryAddress = address || order.delivery_address || {};

        return {
          ...order,
          buyer: {
            full_name: buyer?.full_name || 'Unknown',
            email: buyer?.email || 'Unknown',
          },
          delivery_address: deliveryAddress,
        };
      }));

      setOrders(enrichedOrders);

      if (enrichedOrders.length > 0) {
        // Fetch deliveries for these orders
        // Since 'in' query is limited to 10, we'll fetch individually or use a different strategy
        // For now, let's fetch individually in parallel as it's robust
        const deliveriesMap: Record<string, Delivery> = {};

        await Promise.all(enrichedOrders.map(async (order) => {
          const orderDeliveries = await FirestoreService.getDocuments<Delivery>(COLLECTIONS.DELIVERIES, {
            filters: [{ field: 'order_id', operator: '==', value: order.id }],
            limitCount: 1
          });

          if (orderDeliveries.length > 0) {
            deliveriesMap[order.id] = orderDeliveries[0];
          }
        }));

        setDeliveries(deliveriesMap);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateShipment = async (order: Order) => {
    if (!user) return;

    setProcessingOrders(new Set(processingOrders).add(order.id));

    try {
      // Get vendor data
      const vendors = await FirestoreService.getDocuments<any>(COLLECTIONS.VENDORS, {
        filters: [{ field: 'user_id', operator: '==', value: user.uid }],
        limitCount: 1
      });

      if (vendors.length === 0) {
        throw new Error('Vendor data not found');
      }
      const vendorData = vendors[0];

      const result = await deliveryService.createDelivery({
        orderId: order.id,
        vendorId: vendorData.id,
        buyerId: order.buyer.id,
        pickupAddress: {
          fullName: vendorData.business_name,
          phone: vendorData.business_phone || '',
          addressLine1: vendorData.business_address || '',
          city: 'Lagos',
          state: 'Lagos',
        },
        deliveryAddress: order.delivery_address,
        packageDetails: {
          weight: 2,
          description: `Order ${order.order_number}`,
          value: order.total_amount,
        },
        deliveryType: 'standard',
        deliveryCost: 2000,
        deliveryNotes: `NIMEX Order ${order.order_number}`,
      });

      if (result.success) {
        alert('Shipment created successfully!');
        await loadOrders();
      } else {
        alert('Failed to create shipment: ' + result.error);
      }
    } catch (error) {
      console.error('Error creating shipment:', error);
      alert('Failed to create shipment');
    } finally {
      const newSet = new Set(processingOrders);
      newSet.delete(order.id);
      setProcessingOrders(newSet);
    }
  };

  const handleUploadProof = async () => {
    if (!proofFile || !recipientName || !selectedOrder) return;

    setUploadingProof(true);

    try {
      const delivery = deliveries[selectedOrder];
      if (!delivery) {
        throw new Error('Delivery not found');
      }

      const result = await deliveryService.uploadDeliveryProof(
        delivery.id,
        proofFile,
        recipientName
      );

      if (result.success) {
        alert('Delivery proof uploaded successfully!');
        setSelectedOrder(null);
        setProofFile(null);
        setRecipientName('');
        await loadOrders();
      } else {
        alert('Failed to upload proof: ' + result.error);
      }
    } catch (error) {
      console.error('Error uploading proof:', error);
      alert('Failed to upload delivery proof');
    } finally {
      setUploadingProof(false);
    }
  };

  const tabs = [
    { id: 'pending' as TabType, label: 'Pending Shipment', count: 0 },
    { id: 'in_transit' as TabType, label: 'In Transit', count: 0 },
    { id: 'delivered' as TabType, label: 'Delivered', count: 0 },
  ];

  return (
    <div className="flex flex-col w-full min-h-screen bg-neutral-50">
      <div className="w-full max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="font-heading font-bold text-neutral-900 text-2xl md:text-3xl mb-2">
              Delivery Management
            </h1>
            <p className="font-sans text-neutral-600">
              Manage shipments and track deliveries
            </p>
          </div>

          <div className="flex items-center gap-2 border-b border-neutral-200 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 font-sans text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === tab.id
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-neutral-600 hover:text-neutral-900'
                  }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Package className="w-8 h-8 text-primary-500 animate-pulse" />
            </div>
          ) : orders.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Package className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                <h3 className="font-heading font-semibold text-lg text-neutral-900 mb-2">
                  No orders found
                </h3>
                <p className="font-sans text-neutral-600">
                  {activeTab === 'pending'
                    ? 'No orders pending shipment'
                    : activeTab === 'in_transit'
                      ? 'No shipments in transit'
                      : 'No delivered orders'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const delivery = deliveries[order.id];
                const isProcessing = processingOrders.has(order.id);

                return (
                  <Card key={order.id}>
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                        <div>
                          <h3 className="font-heading font-semibold text-lg text-neutral-900 mb-1">
                            Order #{order.order_number}
                          </h3>
                          <p className="font-sans text-sm text-neutral-600">
                            {order.buyer.full_name} • {order.buyer.email}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-heading font-bold text-lg text-primary-600">
                            ₦{order.total_amount.toLocaleString()}
                          </p>
                          <p className="font-sans text-xs text-neutral-500">
                            {new Date(order.created_at).toLocaleDateString('en-NG')}
                          </p>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div className="p-4 bg-neutral-50 rounded-lg">
                          <p className="font-sans text-sm font-medium text-neutral-900 mb-2 flex items-center gap-2">
                            <Package className="w-4 h-4" />
                            Delivery Address
                          </p>
                          <p className="font-sans text-sm text-neutral-700">
                            {order.delivery_address.full_name}
                          </p>
                          <p className="font-sans text-sm text-neutral-600">
                            {order.delivery_address.phone}
                          </p>
                          <p className="font-sans text-sm text-neutral-600">
                            {order.delivery_address.address_line1}
                          </p>
                          <p className="font-sans text-sm text-neutral-600">
                            {order.delivery_address.city}, {order.delivery_address.state}
                          </p>
                        </div>

                        {delivery && (
                          <div className="p-4 bg-primary-50 rounded-lg">
                            <p className="font-sans text-sm font-medium text-neutral-900 mb-2 flex items-center gap-2">
                              <Truck className="w-4 h-4" />
                              Shipment Info
                            </p>
                            <p className="font-sans text-sm text-neutral-700 mb-1">
                              Status:{' '}
                              <span className="font-semibold">
                                {delivery.delivery_status
                                  .split('_')
                                  .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                                  .join(' ')}
                              </span>
                            </p>
                            {delivery.gigl_shipment_id && (
                              <p className="font-mono text-xs text-neutral-600 mb-1">
                                GIGL: {delivery.gigl_shipment_id}
                              </p>
                            )}
                            {delivery.estimated_delivery_date && (
                              <p className="font-sans text-xs text-neutral-600">
                                ETA:{' '}
                                {new Date(
                                  delivery.estimated_delivery_date
                                ).toLocaleDateString('en-NG')}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-3 flex-wrap">
                        {!delivery && activeTab === 'pending' && (
                          <Button
                            onClick={() => handleCreateShipment(order)}
                            disabled={isProcessing}
                            className="bg-primary-600 hover:bg-primary-700"
                          >
                            <Truck className="w-4 h-4 mr-2" />
                            {isProcessing ? 'Creating...' : 'Create Shipment'}
                          </Button>
                        )}

                        {delivery?.gigl_tracking_url && (
                          <Button
                            variant="outline"
                            onClick={() => window.open(delivery.gigl_tracking_url, '_blank')}
                          >
                            <Truck className="w-4 h-4 mr-2" />
                            Track Shipment
                          </Button>
                        )}

                        {delivery &&
                          delivery.delivery_status === 'out_for_delivery' &&
                          activeTab === 'in_transit' && (
                            <Button
                              variant="outline"
                              onClick={() => setSelectedOrder(order.id)}
                              className="border-green-600 text-green-600 hover:bg-green-50"
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              Upload Proof of Delivery
                            </Button>
                          )}

                        {delivery &&
                          delivery.delivery_status === 'delivered' &&
                          activeTab === 'delivered' && (
                            <div className="flex items-center gap-2 text-green-600">
                              <CheckCircle className="w-4 h-4" />
                              <span className="font-sans text-sm font-medium">
                                Delivery Confirmed
                              </span>
                            </div>
                          )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <h2 className="font-heading font-bold text-xl text-neutral-900 mb-4">
                Upload Delivery Proof
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="font-sans text-sm font-medium text-neutral-900 mb-2 block">
                    Recipient Name *
                  </label>
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="Who received the package?"
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg font-sans text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="font-sans text-sm font-medium text-neutral-900 mb-2 block">
                    Delivery Photo *
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg font-sans text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <p className="font-sans text-xs text-neutral-500 mt-1">
                    Photo showing package at delivery location
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleUploadProof}
                    disabled={!proofFile || !recipientName || uploadingProof}
                    className="flex-1 bg-primary-600 hover:bg-primary-700"
                  >
                    {uploadingProof ? 'Uploading...' : 'Upload Proof'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedOrder(null);
                      setProofFile(null);
                      setRecipientName('');
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
