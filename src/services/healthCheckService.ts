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

  async checkSendGridHealth(): Promise<HealthCheckResult> {
    // SendGrid/Twilio integration is disabled
    return {
      service: 'sendgrid',
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'SendGrid integration is disabled',
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
      // Twilio/SendGrid disabled
      // this.checkTwilioHealth(),
      // this.checkSendGridHealth(),
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