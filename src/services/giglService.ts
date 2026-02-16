import { functions } from '../lib/firebase'; // Ensure you have this export in your firebase config
import { httpsCallable } from 'firebase/functions';

interface DeliveryQuoteRequest {
  pickupState: string;
  pickupCity: string;
  deliveryState: string;
  deliveryCity: string;
  weight: number;
  deliveryType: 'standard' | 'express' | 'same_day';
}

interface DeliveryQuoteResponse {
  success: boolean;
  data?: {
    estimatedCost: number;
    estimatedDays: number;
    deliveryType: string;
    zoneCode: string;
  };
  error?: string;
}

interface CreateShipmentRequest {
  orderId: string;
  vendorId: string;
  pickupAddress: any;
  deliveryAddress: any;
  packageDetails: any;
  deliveryType: 'standard' | 'express' | 'same_day';
  deliveryNotes?: string;
}

interface CreateShipmentResponse {
  success: boolean;
  data?: {
    shipmentId: string;
    trackingNumber: string;
    trackingUrl: string;
    estimatedDeliveryDate: string;
    cost: number;
  };
  error?: string;
}

interface TrackingStatusResponse {
  success: boolean;
  data?: {
    trackingNumber: string;
    status: string;
    currentLocation: string;
    estimatedDelivery: string;
    history: Array<{
      status: string;
      location: string;
      timestamp: string;
      notes?: string;
    }>;
  };
  error?: string;
}

class GIGLService {

  async getDeliveryQuote(request: DeliveryQuoteRequest): Promise<DeliveryQuoteResponse> {
    try {
      const getQuote = httpsCallable(functions, 'getGiglShippingQuote');
      const response = await getQuote(request);
      return response.data as DeliveryQuoteResponse;
    } catch (error: any) {
      console.error('Failed to get delivery quote:', error);
      return {
        success: false,
        error: error.message || 'Failed to get delivery quote',
      };
    }
  }

  async createShipment(request: CreateShipmentRequest): Promise<CreateShipmentResponse> {
    try {
      const createShipment = httpsCallable(functions, 'createGiglShipment');
      const response = await createShipment(request);
      return response.data as CreateShipmentResponse;
    } catch (error: any) {
      console.error('Failed to create shipment:', error);
      return {
        success: false,
        error: error.message || 'Failed to create shipment',
      };
    }
  }

  async getTrackingStatus(trackingNumber: string): Promise<TrackingStatusResponse> {
    try {
      const trackShipment = httpsCallable(functions, 'trackGiglShipment');
      const response = await trackShipment({ trackingNumber });
      return response.data as TrackingStatusResponse;
    } catch (error: any) {
      console.error('Failed to get tracking status:', error);
      return {
        success: false,
        error: error.message || 'Failed to get tracking status',
      };
    }
  }

  async getServiceAreas(): Promise<{ success: boolean; data?: Array<{ state: string; cities: string[] }>; error?: string }> {
    try {
      const getAreas = httpsCallable(functions, 'getGiglServiceAreas');
      const response = await getAreas();
      return response.data as { success: boolean; data?: Array<{ state: string; cities: string[] }>; error?: string };
    } catch (error: any) {
      console.error('Failed to get service areas:', error);
      return {
        success: false,
        error: error.message || 'Failed to get service areas',
      };
    }
  }
}

export const giglService = new GIGLService();
export type { DeliveryQuoteRequest, DeliveryQuoteResponse, CreateShipmentRequest, TrackingStatusResponse };
