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
    // Twilio integration is disabled
    return {
      service: 'twilio',
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Twilio integration is disabled',
    };
  }

  async checkResendHealth(): Promise<HealthCheckResult> {
    const apiKey = import.meta.env.VITE_RESEND_API_KEY;
    if (!apiKey) {
      return {
        service: 'resend',
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'VITE_RESEND_API_KEY is not configured',
      };
    }
    // Key is present — we validate the format to avoid a live API call in health checks
    const isValidFormat = apiKey.startsWith('re_') || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(apiKey);
    return {
      service: 'resend',
      status: isValidFormat ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      error: isValidFormat ? undefined : 'API key does not match expected Resend format (re_...) or UUID format',
    };
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
      this.checkResendHealth(),
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