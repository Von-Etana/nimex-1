import { FirestoreService } from './firestore.service';
import { COLLECTIONS } from '../lib/collections';

interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  error?: string;
  responseTime?: number;
}

class HealthCheckService {
  private lastChecks = new Map<string, HealthCheckResult>();

  async checkTwilioHealth(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    try {
      // Simple health check - try to get account info
      const response = await fetch('https://api.twilio.com/2010-04-01/Accounts.json', {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${btoa(`${import.meta.env.VITE_TWILIO_API_KEY}:${import.meta.env.VITE_TWILIO_API_SECRET}`)}`,
        },
      });

      const result: HealthCheckResult = {
        service: 'twilio',
        status: response.ok ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - startTime,
      };

      if (!response.ok) {
        result.error = `HTTP ${response.status}: ${response.statusText}`;
      }

      this.lastChecks.set('twilio', result);
      return result;
    } catch (error) {
      const result: HealthCheckResult = {
        service: 'twilio',
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      this.lastChecks.set('twilio', result);
      return result;
    }
  }

  async checkSendGridHealth(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    try {
      // Simple health check - try to get user profile
      const response = await fetch('https://api.sendgrid.com/v3/user/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_TWILIO_API_SECRET}`,
        },
      });

      const result: HealthCheckResult = {
        service: 'sendgrid',
        status: response.ok ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - startTime,
      };

      if (!response.ok) {
        result.error = `HTTP ${response.status}: ${response.statusText}`;
      }

      this.lastChecks.set('sendgrid', result);
      return result;
    } catch (error) {
      const result: HealthCheckResult = {
        service: 'sendgrid',
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      this.lastChecks.set('sendgrid', result);
      return result;
    }
  }

  async checkFirestoreHealth(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    try {
      // Simple health check - try to fetch 1 document from profiles
      // We use profiles because it's a core collection
      await FirestoreService.getDocuments(COLLECTIONS.PROFILES, { limitCount: 1 });

      const result: HealthCheckResult = {
        service: 'firestore',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - startTime,
      };

      this.lastChecks.set('firestore', result);
      return result;
    } catch (error) {
      const result: HealthCheckResult = {
        service: 'firestore',
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      this.lastChecks.set('firestore', result);
      return result;
    }
  }

  async runAllHealthChecks(): Promise<HealthCheckResult[]> {
    const checks = await Promise.allSettled([
      this.checkTwilioHealth(),
      this.checkSendGridHealth(),
      this.checkFirestoreHealth(),
    ]);

    const results: HealthCheckResult[] = [];
    checks.forEach((check) => {
      if (check.status === 'fulfilled') {
        results.push(check.value);
      } else {
        results.push({
          service: 'unknown',
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          error: check.reason?.message || 'Health check failed',
        });
      }
    });

    return results;
  }

  getLastCheck(service: string): HealthCheckResult | undefined {
    return this.lastChecks.get(service);
  }

  getAllLastChecks(): HealthCheckResult[] {
    return Array.from(this.lastChecks.values());
  }
}

export const healthCheckService = new HealthCheckService();
export type { HealthCheckResult };