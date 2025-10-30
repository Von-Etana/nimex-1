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
  private config: GoogleMapsConfig;

  constructor() {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      throw new Error('Missing required environment variable: VITE_GOOGLE_MAPS_API_KEY');
    }
    this.config = { apiKey };
  }

  /**
   * Search for places using text query
   */
  async searchPlaces(query: string, location?: { lat: number; lng: number }): Promise<PlaceResult[]> {
    try {
      const params = new URLSearchParams({
        key: this.config.apiKey,
        query: query,
        fields: 'place_id,formatted_address,geometry,name,types'
      });

      if (location) {
        params.append('location', `${location.lat},${location.lng}`);
        params.append('radius', '50000'); // 50km radius
      }

      const response = await fetch(`https://maps.googleapis.com/maps/api/place/textsearch/json?${params}`);

      if (!response.ok) {
        throw new Error(`Google Places API error: ${response.status}`);
      }

      const data: { results: PlaceResult[]; status: string } = await response.json();

      if (data.status !== 'OK') {
        throw new Error(`Google Places API returned status: ${data.status}`);
      }

      return data.results;
    } catch (error) {
      console.error('Error searching places:', error);
      throw error;
    }
  }

  /**
   * Get place details by place ID
   */
  async getPlaceDetails(placeId: string): Promise<PlaceResult | null> {
    try {
      const params = new URLSearchParams({
        key: this.config.apiKey,
        place_id: placeId,
        fields: 'place_id,formatted_address,geometry,name,types'
      });

      const response = await fetch(`https://maps.googleapis.com/maps/api/place/details/json?${params}`);

      if (!response.ok) {
        throw new Error(`Google Places Details API error: ${response.status}`);
      }

      const data: { result: PlaceResult; status: string } = await response.json();

      if (data.status !== 'OK') {
        throw new Error(`Google Places Details API returned status: ${data.status}`);
      }

      return data.result;
    } catch (error) {
      console.error('Error getting place details:', error);
      throw error;
    }
  }

  /**
   * Geocode an address to coordinates
   */
  async geocodeAddress(address: string): Promise<PlaceResult[]> {
    try {
      const params = new URLSearchParams({
        key: this.config.apiKey,
        address: address
      });

      const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params}`);

      if (!response.ok) {
        throw new Error(`Google Geocoding API error: ${response.status}`);
      }

      const data: GeocodeResult = await response.json();

      if (data.status !== 'OK') {
        throw new Error(`Google Geocoding API returned status: ${data.status}`);
      }

      // Convert geocoding results to place-like format
      return data.results.map(result => ({
        place_id: result.place_id,
        formatted_address: result.formatted_address,
        geometry: result.geometry,
        name: result.formatted_address,
        types: result.types || []
      }));
    } catch (error) {
      console.error('Error geocoding address:', error);
      throw error;
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
      const originStrings = origins.map(origin => `${origin.lat},${origin.lng}`);
      const destinationStrings = destinations.map(dest => `${dest.lat},${dest.lng}`);

      const params = new URLSearchParams({
        key: this.config.apiKey,
        origins: originStrings.join('|'),
        destinations: destinationStrings.join('|'),
        units: 'metric'
      });

      const response = await fetch(`https://maps.googleapis.com/maps/api/distancematrix/json?${params}`);

      if (!response.ok) {
        throw new Error(`Google Distance Matrix API error: ${response.status}`);
      }

      const data: DistanceMatrixResult = await response.json();

      if (data.status !== 'OK') {
        throw new Error(`Google Distance Matrix API returned status: ${data.status}`);
      }

      return data;
    } catch (error) {
      console.error('Error calculating distance matrix:', error);
      throw error;
    }
  }

  /**
   * Search for locations in Nigeria (with bias)
   */
  async searchNigerianLocations(query: string): Promise<PlaceResult[]> {
    try {
      const params = new URLSearchParams({
        key: this.config.apiKey,
        query: query,
        fields: 'place_id,formatted_address,geometry,name,types'
      });

      // Bias results towards Nigeria
      params.append('location', '9.0820,8.6753'); // Center of Nigeria
      params.append('radius', '1000000'); // 1000km radius

      const response = await fetch(`https://maps.googleapis.com/maps/api/place/textsearch/json?${params}`);

      if (!response.ok) {
        throw new Error(`Google Places API error: ${response.status}`);
      }

      const data: { results: PlaceResult[]; status: string } = await response.json();

      if (data.status !== 'OK') {
        throw new Error(`Google Places API returned status: ${data.status}`);
      }

      return data.results;
    } catch (error) {
      console.error('Error searching Nigerian locations:', error);
      throw error;
    }
  }

  /**
   * Get autocomplete suggestions
   */
  async getAutocompleteSuggestions(input: string, location?: { lat: number; lng: number }): Promise<string[]> {
    try {
      const params = new URLSearchParams({
        key: this.config.apiKey,
        input: input,
        types: '(cities)',
        components: 'country:ng' // Restrict to Nigeria
      });

      if (location) {
        params.append('location', `${location.lat},${location.lng}`);
        params.append('radius', '50000');
      }

      const response = await fetch(`https://maps.googleapis.com/maps/api/place/autocomplete/json?${params}`);

      if (!response.ok) {
        throw new Error(`Google Autocomplete API error: ${response.status}`);
      }

      const data: { predictions: Array<{ description: string }>; status: string } = await response.json();

      if (data.status !== 'OK') {
        throw new Error(`Google Autocomplete API returned status: ${data.status}`);
      }

      return data.predictions.map(prediction => prediction.description);
    } catch (error) {
      console.error('Error getting autocomplete suggestions:', error);
      throw error;
    }
  }
}

export const googleMapsService = new GoogleMapsService();
export type { PlaceResult, DistanceMatrixResult };