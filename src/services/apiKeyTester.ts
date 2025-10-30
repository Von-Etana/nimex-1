import { healthCheckService } from './healthCheckService';

interface APIKeyTestResult {
  service: string;
  status: 'success' | 'failed' | 'missing_config';
  error?: string;
  details?: any;
}

class APIKeyTester {
  async testAllAPIKeys(): Promise<APIKeyTestResult[]> {
    const results: APIKeyTestResult[] = [];

    // Test Supabase
    results.push(await this.testSupabase());

    // Test Twilio
    results.push(await this.testTwilio());

    // Test SendGrid (via health check)
    results.push(await this.testSendGrid());

    // Test Clerk (basic validation)
    results.push(await this.testClerk());

    // Test Google Maps
    results.push(await this.testGoogleMaps());

    return results;
  }

  private async testSupabase(): Promise<APIKeyTestResult> {
    try {
      const url = process.env.VITE_SUPABASE_URL;
      const key = process.env.VITE_SUPABASE_ANON_KEY;

      if (!url || !key) {
        return {
          service: 'supabase',
          status: 'missing_config',
          error: 'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY'
        };
      }

      // Test basic connection
      const response = await fetch(`${url}/rest/v1/`, {
        method: 'GET',
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`,
        },
      });

      if (response.ok) {
        return {
          service: 'supabase',
          status: 'success',
          details: { status: response.status, url }
        };
      } else {
        return {
          service: 'supabase',
          status: 'failed',
          error: `HTTP ${response.status}: ${response.statusText}`,
          details: { status: response.status, url }
        };
      }
    } catch (error) {
      return {
        service: 'supabase',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async testTwilio(): Promise<APIKeyTestResult> {
    try {
      const accountSid = process.env.VITE_TWILIO_ACCOUNT_SID;
      const apiKey = process.env.VITE_TWILIO_API_KEY;
      const apiSecret = process.env.VITE_TWILIO_API_SECRET;

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
      const apiSecret = process.env.VITE_TWILIO_API_SECRET;

      if (!apiSecret) {
        return {
          service: 'sendgrid',
          status: 'missing_config',
          error: 'Missing VITE_TWILIO_API_SECRET (SendGrid key)'
        };
      }

      // Test user profile endpoint
      const response = await fetch('https://api.sendgrid.com/v3/user/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiSecret}`,
        },
      });

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
    } catch (error) {
      return {
        service: 'sendgrid',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async testClerk(): Promise<APIKeyTestResult> {
    try {
      const publishableKey = process.env.VITE_CLERK_PUBLISHABLE_KEY;

      if (!publishableKey) {
        return {
          service: 'clerk',
          status: 'missing_config',
          error: 'Missing VITE_CLERK_PUBLISHABLE_KEY'
        };
      }

      // Basic format validation
      if (!publishableKey.startsWith('pk_')) {
        return {
          service: 'clerk',
          status: 'failed',
          error: 'Clerk key must start with "pk_"'
        };
      }

      // Test basic connectivity (this is limited since Clerk keys are frontend-only)
      // We'll do a basic format check and assume it's valid if format is correct
      return {
        service: 'clerk',
        status: 'success',
        details: {
          keyFormat: 'valid',
          keyType: publishableKey.includes('test') ? 'test' : 'live'
        }
      };
    } catch (error) {
      return {
        service: 'clerk',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async testGoogleMaps(): Promise<APIKeyTestResult> {
    try {
      const apiKey = process.env.VITE_GOOGLE_MAPS_API_KEY;

      if (!apiKey) {
        return {
          service: 'google_maps',
          status: 'missing_config',
          error: 'Missing VITE_GOOGLE_MAPS_API_KEY'
        };
      }

      // Test with a simple geocoding request
      const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=Lagos,Nigeria&key=${apiKey}`);

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