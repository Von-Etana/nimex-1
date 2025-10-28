import { supabase } from '../lib/supabase';
import { giglService, CreateShipmentRequest } from './giglService';

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
      const shipmentRequest: CreateShipmentRequest = {
        orderId: request.orderId,
        vendorId: request.vendorId,
        pickupAddress: request.pickupAddress,
        deliveryAddress: request.deliveryAddress,
        packageDetails: request.packageDetails,
        deliveryType: request.deliveryType,
        deliveryNotes: request.deliveryNotes,
      };

      const shipmentResult = await giglService.createShipment(shipmentRequest);

      if (!shipmentResult.success || !shipmentResult.data) {
        throw new Error(shipmentResult.error || 'Failed to create GIGL shipment');
      }

      const { data: delivery, error: deliveryError } = await supabase
        .from('deliveries')
        .insert({
          order_id: request.orderId,
          vendor_id: request.vendorId,
          buyer_id: request.buyerId,
          gigl_shipment_id: shipmentResult.data.shipmentId,
          gigl_tracking_url: shipmentResult.data.trackingUrl,
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
          estimated_delivery_date: shipmentResult.data.estimatedDeliveryDate,
          delivery_status: 'pickup_scheduled',
          delivery_notes: request.deliveryNotes,
          gigl_response_data: shipmentResult,
        })
        .select()
        .single();

      if (deliveryError || !delivery) {
        throw new Error(deliveryError?.message || 'Failed to create delivery record');
      }

      await this.addStatusHistory(
        delivery.id,
        'pickup_scheduled',
        'Pickup location',
        'Shipment created and pickup scheduled',
        'system'
      );

      const { error: orderError } = await supabase
        .from('orders')
        .update({
          status: 'processing',
          tracking_number: shipmentResult.data.trackingNumber,
        })
        .eq('id', request.orderId);

      if (orderError) {
        console.error('Failed to update order with tracking:', orderError);
      }

      return {
        success: true,
        data: {
          deliveryId: delivery.id,
          trackingNumber: shipmentResult.data.trackingNumber,
          trackingUrl: shipmentResult.data.trackingUrl,
          estimatedDeliveryDate: shipmentResult.data.estimatedDeliveryDate,
        },
      };
    } catch (error) {
      console.error('Failed to create delivery:', error);
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
      const { error: updateError } = await supabase
        .from('deliveries')
        .update({
          delivery_status: status,
          last_status_update: new Date().toISOString(),
          ...(status === 'delivered' && { actual_delivery_date: new Date().toISOString() }),
        })
        .eq('id', deliveryId);

      if (updateError) {
        throw new Error(updateError.message);
      }

      await this.addStatusHistory(deliveryId, status, location, notes, 'gigl_webhook');

      if (status === 'delivered') {
        const { data: delivery } = await supabase
          .from('deliveries')
          .select('order_id')
          .eq('id', deliveryId)
          .single();

        if (delivery) {
          await supabase
            .from('orders')
            .update({ status: 'delivered', delivered_at: new Date().toISOString() })
            .eq('id', delivery.order_id);
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to update delivery status:', error);
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
      await supabase.from('delivery_status_history').insert({
        delivery_id: deliveryId,
        status,
        location,
        notes,
        updated_by: updatedBy,
      });
    } catch (error) {
      console.error('Failed to add status history:', error);
    }
  }

  async getDeliveryTracking(trackingNumber: string): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      const trackingResult = await giglService.getTrackingStatus(trackingNumber);

      if (!trackingResult.success || !trackingResult.data) {
        throw new Error(trackingResult.error || 'Failed to get tracking information');
      }

      return {
        success: true,
        data: trackingResult.data,
      };
    } catch (error) {
      console.error('Failed to get delivery tracking:', error);
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
      const proofPath = `delivery-proofs/${deliveryId}/${Date.now()}-${proofImageFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from('delivery-images')
        .upload(proofPath, proofImageFile);

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      const { data: proofUrl } = supabase.storage
        .from('delivery-images')
        .getPublicUrl(proofPath);

      let signatureUrl: string | undefined;
      if (signatureImageFile) {
        const signaturePath = `delivery-signatures/${deliveryId}/${Date.now()}-${signatureImageFile.name}`;
        const { error: sigUploadError } = await supabase.storage
          .from('delivery-images')
          .upload(signaturePath, signatureImageFile);

        if (!sigUploadError) {
          const { data: sigUrl } = supabase.storage
            .from('delivery-images')
            .getPublicUrl(signaturePath);
          signatureUrl = sigUrl.publicUrl;
        }
      }

      const { error: updateError } = await supabase
        .from('deliveries')
        .update({
          delivery_proof_url: proofUrl.publicUrl,
          recipient_name: recipientName,
          recipient_signature_url: signatureUrl,
          delivery_status: 'delivered',
          actual_delivery_date: new Date().toISOString(),
        })
        .eq('id', deliveryId);

      if (updateError) {
        throw new Error(updateError.message);
      }

      await this.addStatusHistory(
        deliveryId,
        'delivered',
        undefined,
        `Delivered to ${recipientName}`,
        'vendor'
      );

      return { success: true };
    } catch (error) {
      console.error('Failed to upload delivery proof:', error);
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
      const quoteResult = await giglService.getDeliveryQuote({
        pickupCity,
        pickupState,
        deliveryCity,
        deliveryState,
        weight,
        deliveryType,
      });

      if (!quoteResult.success || !quoteResult.data) {
        const { data: zone } = await supabase
          .from('delivery_zones')
          .select('base_rate, per_kg_rate, express_multiplier')
          .eq('state', deliveryState)
          .eq('is_active', true)
          .single();

        if (zone) {
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

      return {
        success: true,
        cost: quoteResult.data.estimatedCost,
      };
    } catch (error) {
      console.error('Failed to calculate delivery cost:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to calculate delivery cost',
      };
    }
  }
}

export const deliveryService = new DeliveryService();

export type { CreateDeliveryRequest, DeliveryResponse };
