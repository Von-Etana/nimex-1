import { functions, httpsCallable } from '../lib/firebase';

interface PlaceResult {
  place_id: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  name: string;
  types: string[];
}

interface DistanceMatrixResult {
  destination_addresses: string[];
  origin_addresses: string[];
  rows: Array<{
    elements: Array<{
      distance: {
        text: string;
        value: number; // meters
      };
      duration: {
        text: string;
        value: number; // seconds
      };
      status: string;
    }>;
  }>;
  status: string;
}

class GoogleMapsService {
  /**
   * All Google Maps API calls are now proxied through Firebase Cloud Functions
   * so the API key is not exposed in the client bundle.
   */
  hasApiKey(): boolean {
    return true;
  }

  /**
   * Search for places using text query
   */
  async searchPlaces(query: string, location?: { lat: number; lng: number }): Promise<PlaceResult[]> {
    try {
      const callable = httpsCallable<{ query: string; location?: { lat: number; lng: number }; radius?: number }, { results: PlaceResult[] }>(
        functions,
        'searchPlaces'
      );
      const response = await callable({ query, location, radius: 50000 });
      return response.data.results || [];
    } catch (error) {
      console.error('Error searching places:', error);
      throw new Error('Location service unavailable');
    }
  }

  /**
   * Get place details by place ID
   */
  async getPlaceDetails(placeId: string): Promise<PlaceResult | null> {
    try {
      const callable = httpsCallable<{ placeId: string }, { result: PlaceResult | null }>(
        functions,
        'getPlaceDetails'
      );
      const response = await callable({ placeId });
      return response.data.result;
    } catch (error) {
      console.error('Error getting place details:', error);
      throw new Error('Location service unavailable');
    }
  }

  /**
   * Geocode an address to coordinates
   */
  async geocodeAddress(address: string): Promise<PlaceResult[]> {
    try {
      const callable = httpsCallable<{ address: string }, { results: PlaceResult[] }>(
        functions,
        'geocodeAddress'
      );
      const response = await callable({ address });
      return response.data.results || [];
    } catch (error) {
      console.error('Error geocoding address:', error);
      throw new Error('Location service unavailable');
    }
  }

  /**
   * Calculate distance and duration between two points
   */
  async getDistanceMatrix(
    origins: Array<{ lat: number; lng: number }>,
    destinations: Array<{ lat: number; lng: number }>
  ): Promise<DistanceMatrixResult> {
    try {
      const callable = httpsCallable<
        { origins: Array<{ lat: number; lng: number }>; destinations: Array<{ lat: number; lng: number }> },
        DistanceMatrixResult
      >(functions, 'getDistanceMatrix');
      const response = await callable({ origins, destinations });
      return response.data;
    } catch (error) {
      console.error('Error calculating distance matrix:', error);
      throw new Error('Location service unavailable');
    }
  }

  /**
   * Search for locations in Nigeria (with bias)
   */
  async searchNigerianLocations(query: string): Promise<PlaceResult[]> {
    try {
      const callable = httpsCallable<{ query: string; location?: { lat: number; lng: number }; radius?: number }, { results: PlaceResult[] }>(
        functions,
        'searchPlaces'
      );
      // Bias results towards center of Nigeria
      const response = await callable({
        query,
        location: { lat: 9.0820, lng: 8.6753 },
        radius: 1000000,
      });
      return response.data.results || [];
    } catch (error) {
      console.error('Error searching Nigerian locations:', error);
      throw new Error('Location service unavailable');
    }
  }

  /**
   * Get autocomplete suggestions
   */
  async getAutocompleteSuggestions(input: string, location?: { lat: number; lng: number }): Promise<string[]> {
    try {
      const callable = httpsCallable<
        { input: string; location?: { lat: number; lng: number }; radius?: number },
        { predictions: string[] }
      >(functions, 'getAutocompleteSuggestions');
      const response = await callable({ input, location, radius: 50000 });
      return response.data.predictions || [];
    } catch (error) {
      console.error('Error getting autocomplete suggestions:', error);
      throw new Error('Location service unavailable');
    }
  }
}

export const googleMapsService = new GoogleMapsService();
export type { PlaceResult, DistanceMatrixResult };
