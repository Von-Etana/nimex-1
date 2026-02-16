import { healthCheckService } from './healthCheckService';
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

    // Test Twilio
    results.push(await this.testTwilio());

    // Test SendGrid (via health check)
    results.push(await this.testSendGrid());

    // Test Clerk (basic validation) - keeping for legacy if needed, or remove if not used
    // results.push(await this.testClerk());

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
    try {
      const accountSid = import.meta.env.VITE_TWILIO_ACCOUNT_SID;
      const apiKey = import.meta.env.VITE_TWILIO_API_KEY;
      const apiSecret = import.meta.env.VITE_TWILIO_API_SECRET;

      if (!accountSid || !apiKey || !apiSecret) {
        return {
          service: 'twilio',
          status: 'missing_config',
          error: 'Missing Twilio credentials'
        };
      }

      // Test account info endpoint
      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${btoa(`${apiKey}:${apiSecret}`)}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        return {
          service: 'twilio',
          status: 'success',
          details: {
            accountSid: data.sid,
            status: data.status,
            friendlyName: data.friendly_name
          }
        };
      } else {
        return {
          service: 'twilio',
          status: 'failed',
          error: `HTTP ${response.status}: ${response.statusText}`,
          details: { accountSid }
        };
      }
    } catch (error) {
      return {
        service: 'twilio',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async testSendGrid(): Promise<APIKeyTestResult> {
    try {
      const apiSecret = import.meta.env.VITE_TWILIO_API_SECRET;

      if (!apiSecret) {
        return {
          service: 'sendgrid',
          status: 'missing_config',
          error: 'Missing VITE_TWILIO_API_SECRET (SendGrid key)'
        };
      }

      // Test user profile endpoint with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      try {
        const response = await fetch('https://api.sendgrid.com/v3/user/profile', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiSecret}`,
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          return {
            service: 'sendgrid',
            status: 'success',
            details: {
              username: data.username,
              email: data.email,
              firstName: data.first_name,
              lastName: data.last_name
            }
          };
        } else {
          return {
            service: 'sendgrid',
            status: 'failed',
            error: `HTTP ${response.status}: ${response.statusText}`
          };
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          return {
            service: 'sendgrid',
            status: 'failed',
            error: 'Request timeout - service may be unavailable'
          };
        }
        throw fetchError;
      }
    } catch (error) {
      return {
        service: 'sendgrid',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
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