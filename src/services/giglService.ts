interface GIGLConfig {
  apiBaseUrl: string;
  apiKey: string;
  testMode: boolean;
}

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
  private config: GIGLConfig;

  constructor() {
    this.config = {
      apiBaseUrl: import.meta.env.VITE_GIGL_API_URL || 'https://api.giglogistics.com/v1',
      apiKey: import.meta.env.VITE_GIGL_API_KEY || '',
      testMode: import.meta.env.VITE_GIGL_TEST_MODE === 'true',
    };
  }

  private async makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' = 'GET',
    body?: any
  ): Promise<T> {
    try {
      const url = `${this.config.apiBaseUrl}${endpoint}`;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      };

      if (this.config.testMode) {
        headers['X-Test-Mode'] = 'true';
      }

      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Request failed' }));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('GIGL API Error:', error);
      throw error;
    }
  }

  async getDeliveryQuote(request: DeliveryQuoteRequest): Promise<DeliveryQuoteResponse> {
    try {
      const response = await this.makeRequest<any>(
        '/shipping/quote',
        'POST',
        {
          pickup: {
            state: request.pickupState,
            city: request.pickupCity,
          },
          delivery: {
            state: request.deliveryState,
            city: request.deliveryCity,
          },
          weight: request.weight,
          service_type: request.deliveryType,
        }
      );

      return {
        success: true,
        data: {
          estimatedCost: response.data.price,
          estimatedDays: response.data.estimated_days,
          deliveryType: request.deliveryType,
          zoneCode: response.data.zone_code,
        },
      };
    } catch (error) {
      console.error('Failed to get delivery quote:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get delivery quote',
      };
    }
  }

  async createShipment(request: CreateShipmentRequest): Promise<CreateShipmentResponse> {
    try {
      const response = await this.makeRequest<any>(
        '/shipments/create',
        'POST',
        {
          order_reference: request.orderId,
          vendor_id: request.vendorId,
          pickup_details: {
            contact_name: request.pickupAddress.fullName,
            contact_phone: request.pickupAddress.phone,
            address: request.pickupAddress.addressLine1,
            address_line_2: request.pickupAddress.addressLine2,
            city: request.pickupAddress.city,
            state: request.pickupAddress.state,
            postal_code: request.pickupAddress.postalCode,
          },
          delivery_details: {
            contact_name: request.deliveryAddress.fullName,
            contact_phone: request.deliveryAddress.phone,
            address: request.deliveryAddress.addressLine1,
            address_line_2: request.deliveryAddress.addressLine2,
            city: request.deliveryAddress.city,
            state: request.deliveryAddress.state,
            postal_code: request.deliveryAddress.postalCode,
          },
          package: {
            weight: request.packageDetails.weight,
            length: request.packageDetails.length,
            width: request.packageDetails.width,
            height: request.packageDetails.height,
            description: request.packageDetails.description,
            declared_value: request.packageDetails.value,
          },
          service_type: request.deliveryType,
          delivery_notes: request.deliveryNotes,
        }
      );

      return {
        success: true,
        data: {
          shipmentId: response.data.shipment_id,
          trackingNumber: response.data.tracking_number,
          trackingUrl: response.data.tracking_url,
          estimatedDeliveryDate: response.data.estimated_delivery,
          cost: response.data.shipping_cost,
        },
      };
    } catch (error) {
      console.error('Failed to create shipment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create shipment',
      };
    }
  }

  async getTrackingStatus(trackingNumber: string): Promise<TrackingStatusResponse> {
    try {
      const response = await this.makeRequest<any>(
        `/shipments/track/${trackingNumber}`,
        'GET'
      );

      return {
        success: true,
        data: {
          trackingNumber: response.data.tracking_number,
          status: response.data.status,
          currentLocation: response.data.current_location,
          estimatedDelivery: response.data.estimated_delivery,
          history: response.data.tracking_history.map((item: any) => ({
            status: item.status,
            location: item.location,
            timestamp: item.timestamp,
            notes: item.notes,
          })),
        },
      };
    } catch (error) {
      console.error('Failed to get tracking status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get tracking status',
      };
    }
  }

  async cancelShipment(trackingNumber: string, reason: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.makeRequest<any>(
        `/shipments/${trackingNumber}/cancel`,
        'POST',
        { reason }
      );

      return { success: true };
    } catch (error) {
      console.error('Failed to cancel shipment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to cancel shipment',
      };
    }
  }

  async getServiceAreas(): Promise<{ success: boolean; data?: Array<{ state: string; cities: string[] }>; error?: string }> {
    try {
      const response = await this.makeRequest<any>('/service-areas', 'GET');

      return {
        success: true,
        data: response.data.areas,
      };
    } catch (error) {
      console.error('Failed to get service areas:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get service areas',
      };
    }
  }

  calculateEstimatedDeliveryDate(deliveryType: string, baseDate: Date = new Date()): Date {
    const daysToAdd = deliveryType === 'same_day' ? 0 : deliveryType === 'express' ? 1 : 3;
    const estimatedDate = new Date(baseDate);
    estimatedDate.setDate(estimatedDate.getDate() + daysToAdd);
    return estimatedDate;
  }

  isTestMode(): boolean {
    return this.config.testMode;
  }
}

export const giglService = new GIGLService();

export type {
  DeliveryQuoteRequest,
  DeliveryQuoteResponse,
  CreateShipmentRequest,
  CreateShipmentResponse,
  TrackingStatusResponse,
};
