import { auth } from '../lib/firebase.config';

interface APIKeyTestResult {
  service: string;
  status: 'success' | 'failed' | 'missing_config';
  error?: string;
  details?: any;
}

class APIKeyTester {
  async testAllAPIKeys(): Promise<APIKeyTestResult[]> {
    const results: APIKeyTestResult[] = [];

    // Test Firebase
    results.push(await this.testFirebase());

    // Test Google Maps
    results.push(await this.testGoogleMaps());

    return results;
  }

  private async testFirebase(): Promise<APIKeyTestResult> {
    try {
      const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
      const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;

      if (!apiKey || !projectId) {
        return {
          service: 'firebase',
          status: 'missing_config',
          error: 'Missing VITE_FIREBASE_API_KEY or VITE_FIREBASE_PROJECT_ID'
        };
      }

      // Check if auth is initialized
      if (auth) {
        return {
          service: 'firebase',
          status: 'success',
          details: {
            projectId,
            authDomain: auth.config.authDomain,
            initialized: true
          }
        };
      } else {
        return {
          service: 'firebase',
          status: 'failed',
          error: 'Firebase Auth not initialized'
        };
      }
    } catch (error) {
      return {
        service: 'firebase',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async testTwilio(): Promise<APIKeyTestResult> {
    // Twilio integration is disabled
    return {
      service: 'twilio',
      status: 'missing_config',
      error: 'Twilio integration is disabled',
    };
  }

  private async testGoogleMaps(): Promise<APIKeyTestResult> {
    try {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

      if (!apiKey) {
        return {
          service: 'google_maps',
          status: 'missing_config',
          error: 'Missing VITE_GOOGLE_MAPS_API_KEY'
        };
      }

      // Test with a simple geocoding request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      try {
        const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=Lagos,Nigeria&key=${apiKey}`, {
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          return {
            service: 'google_maps',
            status: 'failed',
            error: `HTTP ${response.status}: ${response.statusText}`
          };
        }

        const data = await response.json();

        if (data.status === 'OK') {
          return {
            service: 'google_maps',
            status: 'success',
            details: {
              status: data.status,
              resultsCount: data.results?.length || 0
            }
          };
        } else {
          return {
            service: 'google_maps',
            status: 'failed',
            error: `API returned status: ${data.status}`,
            details: data
          };
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          return {
            service: 'google_maps',
            status: 'failed',
            error: 'Request timeout - service may be unavailable'
          };
        }
        throw fetchError;
      }
    } catch (error) {
      return {
        service: 'google_maps',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async runComprehensiveTest(): Promise<{
    results: APIKeyTestResult[];
    summary: {
      total: number;
      successful: number;
      failed: number;
      missing: number;
    };
  }> {
    const results = await this.testAllAPIKeys();

    const summary = {
      total: results.length,
      successful: results.filter(r => r.status === 'success').length,
      failed: results.filter(r => r.status === 'failed').length,
      missing: results.filter(r => r.status === 'missing_config').length,
    };

    return { results, summary };
  }
}

export const apiKeyTester = new APIKeyTester();
export type { APIKeyTestResult };
