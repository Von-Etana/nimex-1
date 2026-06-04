import { FirestoreService } from './firestore.service';
import { FirebaseStorageService } from './firebaseStorage.service';
import { COLLECTIONS } from '../lib/collections';
import { logger } from '../lib/logger';
import { Timestamp } from 'firebase/firestore';
import { terminalService } from './terminalService';

interface CreateDeliveryRequest {
  orderId: string;
  vendorId: string;
  buyerId: string;
  pickupAddress: {
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode?: string;
  };
  deliveryAddress: {
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode?: string;
  };
  packageDetails: {
    weight: number;
    length?: number;
    width?: number;
    height?: number;
    description: string;
    value: number;
  };
  deliveryType: 'standard' | 'express' | 'same_day';
  deliveryCost: number;
  deliveryNotes?: string;
}

interface DeliveryResponse {
  success: boolean;
  data?: {
    deliveryId: string;
    trackingNumber: string;
    trackingUrl: string;
    estimatedDeliveryDate: string;
  };
  error?: string;
}

class DeliveryService {
  async createDelivery(request: CreateDeliveryRequest): Promise<DeliveryResponse> {
    try {
      // Step 1: Fetch rates for the shipment first
      const ratesResult = await terminalService.getRates({
        pickupAddress: request.pickupAddress,
        deliveryAddress: request.deliveryAddress,
        parcels: [{
          weight: request.packageDetails.weight,
          length: request.packageDetails.length,
          width: request.packageDetails.width,
          height: request.packageDetails.height,
          description: request.packageDetails.description,
          value: request.packageDetails.value,
        }]
      });

      if (!ratesResult.success || !ratesResult.data || !ratesResult.data.rates || ratesResult.data.rates.length === 0) {
        throw new Error(ratesResult.error || 'Failed to fetch rates from Terminal.africa');
      }

      const { shipmentId, rates } = ratesResult.data;

      // Select rate based on delivery type
      const sortedRates = [...rates].sort((a, b) => a.amount - b.amount);
      let selectedRate = sortedRates[0]; // standard/cheapest

      if (request.deliveryType === 'express') {
        selectedRate = sortedRates[Math.min(1, sortedRates.length - 1)];
      } else if (request.deliveryType === 'same_day') {
        selectedRate = sortedRates[sortedRates.length - 1];
      }

      // Step 2: Book the shipment with the selected rate
      const shipmentResult = await terminalService.createShipment({
        shipmentId,
        rateId: selectedRate.id
      });

      if (!shipmentResult.success || !shipmentResult.data) {
        throw new Error(shipmentResult.error || 'Failed to create shipment with Terminal.africa');
      }

      const deliveryId = `delivery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      await FirestoreService.runTransaction(async (transaction) => {
        // Create delivery record
        await FirestoreService.setDocument(COLLECTIONS.DELIVERIES, deliveryId, {
          order_id: request.orderId,
          vendor_id: request.vendorId,
          buyer_id: request.buyerId,
          terminal_shipment_id: shipmentResult.data!.id,
          terminal_tracking_url: shipmentResult.data!.tracking_url,
          pickup_address: request.pickupAddress,
          delivery_address: request.deliveryAddress,
          delivery_type: request.deliveryType,
          package_weight: request.packageDetails.weight,
          package_dimensions: {
            length: request.packageDetails.length,
            width: request.packageDetails.width,
            height: request.packageDetails.height,
          },
          delivery_cost: request.deliveryCost,
          estimated_delivery_date: selectedRate.duration || '3-5 Days',
          delivery_status: 'pickup_scheduled',
          delivery_notes: request.deliveryNotes,
          terminal_response_data: shipmentResult.data,
          created_at: Timestamp.now(),
          updated_at: Timestamp.now(),
        });

        // Add status history
        const historyId = `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await FirestoreService.setDocument(COLLECTIONS.DELIVERY_STATUS_HISTORY, historyId, {
          delivery_id: deliveryId,
          status: 'pickup_scheduled',
          location: 'Pickup location',
          notes: 'Shipment created and pickup scheduled',
          updated_by: 'system',
          created_at: Timestamp.now(),
        });

        // Update order
        await FirestoreService.updateDocument(COLLECTIONS.ORDERS, request.orderId, {
          status: 'processing',
          tracking_number: shipmentResult.data!.tracking_number,
        });
      });

      return {
        success: true,
        data: {
          deliveryId,
          trackingNumber: shipmentResult.data.tracking_number,
          trackingUrl: shipmentResult.data.tracking_url,
          estimatedDeliveryDate: selectedRate.duration || '3-5 Days',
        },
      };
    } catch (error) {
      logger.error('Failed to create delivery:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create delivery',
      };
    }
  }

  async updateDeliveryStatus(
    deliveryId: string,
    status: string,
    location?: string,
    notes?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await FirestoreService.runTransaction(async (transaction) => {
        // Update delivery
        const updates: any = {
          delivery_status: status,
          last_status_update: Timestamp.now(),
        };

        if (status === 'delivered') {
          updates.actual_delivery_date = Timestamp.now();
        }

        await FirestoreService.updateDocument(COLLECTIONS.DELIVERIES, deliveryId, updates);

        // Add history
        const historyId = `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await FirestoreService.setDocument(COLLECTIONS.DELIVERY_STATUS_HISTORY, historyId, {
          delivery_id: deliveryId,
          status,
          location,
          notes,
          updated_by: 'terminal_webhook',
          created_at: Timestamp.now(),
        });

        // Update order if delivered
        if (status === 'delivered') {
          const delivery = await FirestoreService.getDocument(COLLECTIONS.DELIVERIES, deliveryId);
          if (delivery) {
            await FirestoreService.updateDocument(COLLECTIONS.ORDERS, (delivery as any).order_id, {
              status: 'delivered',
              delivered_at: Timestamp.now(),
            });
          }
        }
      });

      return { success: true };
    } catch (error) {
      logger.error('Failed to update delivery status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update delivery status',
      };
    }
  }

  async addStatusHistory(
    deliveryId: string,
    status: string,
    location?: string,
    notes?: string,
    updatedBy: string = 'system'
  ): Promise<void> {
    try {
      const historyId = `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await FirestoreService.setDocument(COLLECTIONS.DELIVERY_STATUS_HISTORY, historyId, {
        delivery_id: deliveryId,
        status,
        location,
        notes,
        updated_by: updatedBy,
        created_at: Timestamp.now(),
      });
    } catch (error) {
      logger.error('Failed to add status history:', error);
    }
  }

  async getDeliveryTracking(shipmentId: string): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      const trackingResult = await terminalService.trackShipment(shipmentId);

      if (!trackingResult.success || !trackingResult.data) {
        throw new Error(trackingResult.error || 'Failed to get tracking information');
      }

      return {
        success: true,
        data: trackingResult.data,
      };
    } catch (error) {
      logger.error('Failed to get delivery tracking:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get tracking information',
      };
    }
  }

  async uploadDeliveryProof(
    deliveryId: string,
    proofImageFile: File,
    recipientName: string,
    signatureImageFile?: File
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Upload proof image
      const { url: proofUrl, error: uploadError } = await FirebaseStorageService.uploadFile(
        proofImageFile,
        `delivery-proofs/${deliveryId}`,
        `proof_${Date.now()}_${proofImageFile.name}`
      );

      if (uploadError || !proofUrl) {
        throw new Error(uploadError?.message || 'Failed to upload proof image');
      }

      let signatureUrl: string | undefined;
      if (signatureImageFile) {
        const { url: sigUrl, error: sigError } = await FirebaseStorageService.uploadFile(
          signatureImageFile,
          `delivery-signatures/${deliveryId}`,
          `signature_${Date.now()}_${signatureImageFile.name}`
        );

        if (sigUrl) {
          signatureUrl = sigUrl;
        }
      }

      await FirestoreService.runTransaction(async (transaction) => {
        // Update delivery
        await FirestoreService.updateDocument(COLLECTIONS.DELIVERIES, deliveryId, {
          delivery_proof_url: proofUrl,
          recipient_name: recipientName,
          recipient_signature_url: signatureUrl,
          delivery_status: 'delivered',
          actual_delivery_date: Timestamp.now(),
        });

        // Add history
        const historyId = `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await FirestoreService.setDocument(COLLECTIONS.DELIVERY_STATUS_HISTORY, historyId, {
          delivery_id: deliveryId,
          status: 'delivered',
          notes: `Delivered to ${recipientName}`,
          updated_by: 'vendor',
          created_at: Timestamp.now(),
        });
      });

      return { success: true };
    } catch (error) {
      logger.error('Failed to upload delivery proof:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload delivery proof',
      };
    }
  }

  async calculateDeliveryCost(
    pickupCity: string,
    pickupState: string,
    deliveryCity: string,
    deliveryState: string,
    weight: number,
    deliveryType: 'standard' | 'express' | 'same_day'
  ): Promise<{ success: boolean; cost?: number; error?: string }> {
    try {
      const ratesResult = await terminalService.getRates({
        pickupAddress: {
          fullName: 'Vendor Office',
          phone: '08000000000',
          addressLine1: 'Main Pickup St',
          city: pickupCity,
          state: pickupState,
        },
        deliveryAddress: {
          fullName: 'Buyer Destination',
          phone: '08000000000',
          addressLine1: 'Main Delivery St',
          city: deliveryCity,
          state: deliveryState,
        },
        parcels: [{
          weight: weight,
          description: 'Package Delivery',
        }]
      });

      if (!ratesResult.success || !ratesResult.data || !ratesResult.data.rates || ratesResult.data.rates.length === 0) {
        // Fallback to local zones
        const zones = await FirestoreService.getDocuments(COLLECTIONS.DELIVERY_ZONES, {
          filters: [
            { field: 'state', operator: '==', value: deliveryState },
            { field: 'is_active', operator: '==', value: true }
          ],
          limitCount: 1
        });

        if (zones.length > 0) {
          const zone: any = zones[0];
          let cost = zone.base_rate + zone.per_kg_rate * weight;
          if (deliveryType === 'express') {
            cost *= zone.express_multiplier;
          } else if (deliveryType === 'same_day') {
            cost *= zone.express_multiplier * 1.5;
          }
          return { success: true, cost: Math.round(cost) };
        }

        throw new Error('Unable to calculate delivery cost');
      }

      const { rates } = ratesResult.data;
      const sortedRates = [...rates].sort((a, b) => a.amount - b.amount);
      let selectedRate = sortedRates[0]; // cheapest/standard

      if (deliveryType === 'express') {
        selectedRate = sortedRates[Math.min(1, sortedRates.length - 1)];
      } else if (deliveryType === 'same_day') {
        selectedRate = sortedRates[sortedRates.length - 1];
      }

      return {
        success: true,
        cost: selectedRate.amount,
      };
    } catch (error) {
      logger.error('Failed to calculate delivery cost:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to calculate delivery cost',
      };
    }
  }
}

export const deliveryService = new DeliveryService();

export type { CreateDeliveryRequest, DeliveryResponse };
