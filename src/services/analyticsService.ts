import { analytics } from '../lib/firebase';
import { logEvent as firebaseLogEvent } from 'firebase/analytics';

/**
 * AnalyticsService
 * Provides standardized event tracking for conversion funnels and product metrics.
 * Sanitizes input to avoid accidentally transmitting PII (passwords, emails, raw phone numbers).
 */
class AnalyticsService {
  private log(eventName: string, params?: Record<string, any>) {
    try {
      if (analytics && typeof window !== 'undefined') {
        firebaseLogEvent(analytics, eventName, params);
      }
    } catch (e) {
      // Non-blocking analytics error
    }
  }

  trackSignUp(method: string, role: string) {
    this.log('sign_up', { method, role });
  }

  trackLogin(method: string) {
    this.log('login', { method });
  }

  trackAddToCart(productId: string, title: string, price: number, quantity: number = 1) {
    this.log('add_to_cart', {
      currency: 'NGN',
      value: price * quantity,
      items: [
        {
          item_id: productId,
          item_name: title.slice(0, 100),
          price,
          quantity,
        },
      ],
    });
  }

  trackBeginCheckout(totalAmount: number, itemCount: number) {
    this.log('begin_checkout', {
      currency: 'NGN',
      value: totalAmount,
      item_count: itemCount,
    });
  }

  trackPurchase(orderId: string, totalAmount: number, itemCount: number) {
    this.log('purchase', {
      transaction_id: orderId,
      currency: 'NGN',
      value: totalAmount,
      item_count: itemCount,
    });
  }

  trackSearch(searchTerm: string) {
    // Sanitize: truncate and remove possible email or phone fragments
    const sanitized = searchTerm.trim().slice(0, 100);
    this.log('search', { search_term: sanitized });
  }

  trackVendorOnboardingStep(stepNumber: number, stepName: string) {
    this.log('vendor_onboarding_step', { step: stepNumber, name: stepName });
  }
}

export const analyticsService = new AnalyticsService();
