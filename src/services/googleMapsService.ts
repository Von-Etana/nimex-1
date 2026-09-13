import { fetchWithTimeout } from '../lib/fetchWithTimeout';

interface GoogleMapsConfig {
  apiKey: string;
}

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

interface GeocodeResult {
  results: PlaceResult[];
  status: string;
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
  private config: GoogleMapsConfig | null;

  constructor() {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.warn('Google Maps API key not configured. Map and location autocomplete features will be disabled.');
      this.config = null;
      return;
    }
    this.config = { apiKey };
  }

  hasApiKey(): boolean {
    return this.config !== null;
  }

  private getApiKey(): string | null {
    return this.config?.apiKey ?? null;
  }

  /**
   * Search for places using text query
   */
  async searchPlaces(query: string, location?: { lat: number; lng: number }): Promise<PlaceResult[]> {
    try {
      const apiKey = this.getApiKey();
      if (!apiKey) return [];

      const params = new URLSearchParams({
        key: apiKey,
        query: query,
        fields: 'place_id,formatted_address,geometry,name,types'
      });

      if (location) {
        params.append('location', `${location.lat},${location.lng}`);
        params.append('radius', '50000'); // 50km radius
      }

      const response = await fetchWithTimeout(`https://maps.googleapis.com/maps/api/place/textsearch/json?${params}`, {
        timeoutMs: 10000
      });

      if (!response.ok) {
        throw new Error('Location service unavailable');
      }

      const data: { results: PlaceResult[]; status: string } = await response.json();

      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        throw new Error('Location service unavailable');
      }

      return data.results || [];
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
      const apiKey = this.getApiKey();
      if (!apiKey) return null;

      const params = new URLSearchParams({
        key: apiKey,
        place_id: placeId,
        fields: 'place_id,formatted_address,geometry,name,types'
      });

      const response = await fetchWithTimeout(`https://maps.googleapis.com/maps/api/place/details/json?${params}`, {
        timeoutMs: 10000
      });

      if (!response.ok) {
        throw new Error('Location service unavailable');
      }

      const data: { result: PlaceResult; status: string } = await response.json();

      if (data.status !== 'OK') {
        throw new Error('Location service unavailable');
      }

      return data.result;
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
      const apiKey = this.getApiKey();
      if (!apiKey) return [];

      const params = new URLSearchParams({
        key: apiKey,
        address: address
      });

      const response = await fetchWithTimeout(`https://maps.googleapis.com/maps/api/geocode/json?${params}`, {
        timeoutMs: 10000
      });

      if (!response.ok) {
        throw new Error('Location service unavailable');
      }

      const data: GeocodeResult = await response.json();

      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        throw new Error('Location service unavailable');
      }

      if (data.status === 'ZERO_RESULTS') return [];

      // Convert geocoding results to place-like format
      return (data.results || []).map(result => ({
        place_id: result.place_id,
        formatted_address: result.formatted_address,
        geometry: result.geometry,
        name: result.formatted_address,
        types: result.types || []
      }));
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
      const apiKey = this.getApiKey();
      if (!apiKey) {
        throw new Error('Location service unavailable');
      }

      const originStrings = origins.map(origin => `${origin.lat},${origin.lng}`);
      const destinationStrings = destinations.map(dest => `${dest.lat},${dest.lng}`);

      const params = new URLSearchParams({
        key: apiKey,
        origins: originStrings.join('|'),
        destinations: destinationStrings.join('|'),
        units: 'metric'
      });

      const response = await fetchWithTimeout(`https://maps.googleapis.com/maps/api/distancematrix/json?${params}`, {
        timeoutMs: 10000
      });

      if (!response.ok) {
        throw new Error('Location service unavailable');
      }

      const data: DistanceMatrixResult = await response.json();

      if (data.status !== 'OK') {
        throw new Error('Location service unavailable');
      }

      return data;
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
      const apiKey = this.getApiKey();
      if (!apiKey) return [];

      const params = new URLSearchParams({
        key: apiKey,
        query: query,
        fields: 'place_id,formatted_address,geometry,name,types'
      });

      // Bias results towards Nigeria
      params.append('location', '9.0820,8.6753'); // Center of Nigeria
      params.append('radius', '1000000'); // 1000km radius

      const response = await fetchWithTimeout(`https://maps.googleapis.com/maps/api/place/textsearch/json?${params}`, {
        timeoutMs: 10000
      });

      if (!response.ok) {
        throw new Error('Location service unavailable');
      }

      const data: { results: PlaceResult[]; status: string } = await response.json();

      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        throw new Error('Location service unavailable');
      }

      return data.results || [];
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
      const apiKey = this.getApiKey();
      if (!apiKey) return [];

      const params = new URLSearchParams({
        key: apiKey,
        input: input,
        types: '(cities)',
        components: 'country:ng' // Restrict to Nigeria
      });

      if (location) {
        params.append('location', `${location.lat},${location.lng}`);
        params.append('radius', '50000');
      }

      const response = await fetchWithTimeout(`https://maps.googleapis.com/maps/api/place/autocomplete/json?${params}`, {
        timeoutMs: 10000
      });

      if (!response.ok) {
        throw new Error('Location service unavailable');
      }

      const data: { predictions: Array<{ description: string }>; status: string } = await response.json();

      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        throw new Error('Location service unavailable');
      }

      return (data.predictions || []).map(prediction => prediction.description);
    } catch (error) {
      console.error('Error getting autocomplete suggestions:', error);
      throw new Error('Location service unavailable');
    }
  }
}

export const googleMapsService = new GoogleMapsService();
export type { PlaceResult, DistanceMatrixResult };
