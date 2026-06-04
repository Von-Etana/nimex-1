import { functions } from '../lib/firebase';
import { httpsCallable } from 'firebase/functions';
import { logger } from '../lib/logger';

export interface AddressDetails {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode?: string;
}

export interface ParcelDetails {
  weight: number;
  length?: number;
  width?: number;
  height?: number;
  description: string;
  value?: number;
}

export interface GetRatesRequest {
  pickupAddress: AddressDetails;
  deliveryAddress: AddressDetails;
  parcels: ParcelDetails[];
}

export interface RateResponse {
  id: string;
  carrier_name: string;
  amount: number;
  currency: string;
  duration: string;
  carrier_id: string;
}

export interface GetRatesResponse {
  success: boolean;
  data?: {
    shipmentId: string;
    rates: RateResponse[];
  };
  error?: string;
}

export interface CreateShipmentRequest {
  shipmentId: string;
  rateId: string;
}

export interface CreateShipmentResponse {
  success: boolean;
  data?: {
    id: string;
    tracking_number: string;
    carrier_name: string;
    amount: number;
    currency: string;
    status: string;
    tracking_url: string;
  };
  error?: string;
}

export interface TrackShipmentResponse {
  success: boolean;
  data?: {
    status: string;
    location?: string;
    history: Array<{
      status: string;
      description: string;
      time: string;
    }>;
  };
  error?: string;
}

class TerminalService {
  async getRates(request: GetRatesRequest): Promise<GetRatesResponse> {
    try {
      const getTerminalRatesFn = httpsCallable<any, any>(functions, 'getTerminalRates');
      
      const adaptAddress = (addr: AddressDetails) => ({
        name: addr.fullName,
        phone: addr.phone,
        email: 'customer@nimex.ng', // fallback required email field
        address: `${addr.addressLine1}${addr.addressLine2 ? ', ' + addr.addressLine2 : ''}`,
        city: addr.city,
        state: addr.state,
        country: 'Nigeria',
      });

      const response = await getTerminalRatesFn({
        pickup_address: adaptAddress(request.pickupAddress),
        delivery_address: adaptAddress(request.deliveryAddress),
        parcels: request.parcels.map(p => ({
          weight: p.weight,
          length: p.length || 10,
          width: p.width || 10,
          height: p.height || 10,
          description: p.description,
          value: p.value || 0
        }))
      });

      return response.data as GetRatesResponse;
    } catch (error: any) {
      logger.error('Failed to get Terminal rates:', error);
      return {
        success: false,
        error: error.message || 'Failed to get shipping rates'
      };
    }
  }

  async createShipment(request: CreateShipmentRequest): Promise<CreateShipmentResponse> {
    try {
      const createTerminalShipmentFn = httpsCallable<any, any>(functions, 'createTerminalShipment');
      const response = await createTerminalShipmentFn({
        shipmentId: request.shipmentId,
        rateId: request.rateId
      });
      return response.data as CreateShipmentResponse;
    } catch (error: any) {
      logger.error('Failed to create Terminal shipment:', error);
      return {
        success: false,
        error: error.message || 'Failed to create shipment'
      };
    }
  }

  async trackShipment(shipmentId: string): Promise<TrackShipmentResponse> {
    try {
      const trackTerminalShipmentFn = httpsCallable<any, any>(functions, 'trackTerminalShipment');
      const response = await trackTerminalShipmentFn({ shipmentId });
      return response.data as TrackShipmentResponse;
    } catch (error: any) {
      logger.error('Failed to track Terminal shipment:', error);
      return {
        success: false,
        error: error.message || 'Failed to track shipment'
      };
    }
  }

  async getCarriers(): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      const getTerminalCarriersFn = httpsCallable<any, any>(functions, 'getTerminalCarriers');
      const response = await getTerminalCarriersFn();
      return response.data as any;
    } catch (error: any) {
      logger.error('Failed to get Terminal carriers:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch carriers'
      };
    }
  }
}

export const terminalService = new TerminalService();
