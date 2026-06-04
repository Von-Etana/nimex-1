import type { NormalizedPaymentRequest, ServiceError } from '../types/serviceTypes';

interface PaystackConfig {
  publicKey: string;
}

interface InitializePaymentResponse {
  success: boolean;
  data?: {
    authorizationUrl: string;
    accessCode: string;
    reference: string;
  };
  error?: ServiceError;
}

interface VerifyPaymentResponse {
  success: boolean;
  data?: {
    reference: string;
    amount: number;
    status: string;
    paidAt: string;
    channel: string;
    customer: {
      email: string;
    };
  };
  error?: ServiceError;
}

class PaystackService {
  private config: PaystackConfig;
  private apiUrl: string;

  constructor() {
    this.config = {
      publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
    };
    // Placeholder for Firebase Functions URL
    this.apiUrl = import.meta.env.VITE_API_URL || 'https://your-firebase-project.cloudfunctions.net';

    if (!this.config.publicKey) {
      console.warn('Missing required environment variable: VITE_PAYSTACK_PUBLIC_KEY');
    }
  }

  async initializeSubscriptionPayment(
    email: string,
    plan: string,
    vendorId: string
  ): Promise<InitializePaymentResponse> {
    try {
      // Get plan details
      const { subscriptionService } = await import('./subscriptionService');
      const tier = subscriptionService.getTierByPlan(plan as any);

      if (!tier) {
        throw new Error('Invalid subscription plan');
      }

      const reference = `NIMEX-SUB-${vendorId}-${plan}-${Date.now()}`;

      // Try actual backend first
      const response = await fetch(`${this.apiUrl}/initializePayment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          amount: Math.round(tier.price * 100),
          reference,
          metadata: {
            type: 'subscription',
            vendor_id: vendorId,
            plan: plan,
            price: tier.price,
          },
          callback_url: `${window.location.origin}/vendor/subscription/success`,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          data: {
            authorizationUrl: data.authorization_url,
            accessCode: data.access_code,
            reference: data.reference,
          },
        };
      }
      
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: {
          code: 'UPSTREAM_ERROR',
          message: errorData.message || 'Payment initialization failed',
          retryable: true
        }
      };

    } catch (error) {
      console.error('Failed to initialize subscription payment:', error);
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Network error initializing subscription payment',
          retryable: true
        }
      };
    }
  }

  async initializePayment(request: NormalizedPaymentRequest): Promise<InitializePaymentResponse> {
    try {
      const reference = request.reference || `NIMEX-${request.orderId}-${Date.now()}`;

      const response = await fetch(`${this.apiUrl}/initializePayment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: request.customerEmail,
          amount: Math.round(request.amountNaira * 100),
          reference,
          metadata: {
            order_id: request.orderId,
            ...request.metadata,
          },
          callback_url: request.callbackUrl || `${window.location.origin}/orders/${request.orderId}`,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          data: {
            authorizationUrl: data.authorization_url,
            accessCode: data.access_code,
            reference: data.reference,
          },
        };
      }
      
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: {
          code: 'UPSTREAM_ERROR',
          message: errorData.message || 'Payment initialization failed',
          retryable: true
        }
      };

    } catch (error) {
      console.error('Failed to initialize payment:', error);
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Failed to initialize payment',
          retryable: true
        }
      };
    }
  }

  async verifySubscriptionPayment(reference: string) {
    try {
      const verification = await this.verifyPayment(reference);

      if (verification.success && verification.data?.status === 'success') {
        // Extract metadata from reference
        const parts = reference.split('-');
        if (parts.length >= 4 && parts[1] === 'SUB') {
          const vendorId = parts[2];
          const plan = parts[3];

          // Update vendor subscription to active and set end date
          const { subscriptionService } = await import('./subscriptionService');
          await subscriptionService.updateVendorSubscription(vendorId, plan as any);

          // Log transaction for Admin Dashboard
          const { FirestoreService } = await import('./firestore.service');
          // Using raw string 'payment_transactions' as it might not be in COLLECTIONS yet, 
          // or import COLLECTIONS if available. Better to use raw string for now or check COLLECTIONS.
          // Based on previous context, COLLECTIONS is in '../lib/collections'. 
          // But to be safe and avoid circular deps issues if any, I'll dynamic import or just use string.
          // The AdminTransactionsScreen uses 'payment_transactions'.

          await FirestoreService.addDocument('payment_transactions', {
            amount: verification.data.amount,
            payment_status: 'paid',
            payment_method: 'paystack',
            payment_reference: reference,
            created_at: new Date().toISOString(),
            vendor_id: vendorId,
            buyer_id: vendorId, // Vendor is the buyer of the subscription
            type: 'subscription',
            description: `Subscription Payment - ${plan} Plan`
          });

          return {
            success: true,
            data: {
              ...verification.data,
              vendorId,
              plan,
            }
          };
        }
      }

      return verification;
    } catch (error) {
      console.error('Failed to verify subscription payment:', error);
      return {
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: error instanceof Error ? error.message : 'Failed to verify subscription payment',
          retryable: false
        }
      };
    }
  }

  async verifyPayment(reference: string): Promise<VerifyPaymentResponse> {
    try {
      const response = await fetch(`${this.apiUrl}/verifyPayment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference }),
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          data: {
            reference: data.reference,
            amount: data.amount / 100,
            status: data.status,
            paidAt: data.paid_at,
            channel: data.channel,
            customer: {
              email: data.customer.email,
            },
          },
        };
      }
      
      const errorData = await response.json().catch(() => ({}));
      return { 
        success: false, 
        error: {
          code: 'UPSTREAM_ERROR',
          message: errorData.message || 'Payment verification failed',
          retryable: true
        }
      };

    } catch (error) {
      console.error('Failed to verify payment:', error);
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Failed to verify payment',
          retryable: true
        }
      };
    }
  }

  openPaymentModal(
    email: string,
    amount: number,
    reference: string,
    onSuccess: (reference: string) => void,
    onClose: () => void
  ) {
    if (!(window as any).PaystackPop) {
      console.error('Paystack SDK not loaded');
      return;
    }

    const handler = (window as any).PaystackPop.setup({
      key: this.config.publicKey,
      email,
      amount: Math.round(amount * 100),
      ref: reference,
      onClose: () => {
        onClose();
      },
      callback: (response: any) => {
        onSuccess(response.reference);
      },
    });

    handler.openIframe();
  }

  isTestMode(): boolean {
    return import.meta.env.VITE_APP_ENV !== 'production';
  }

  loadPaystackScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if ((window as any).PaystackPop) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://js.paystack.co/v1/inline.js';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Paystack script'));
      document.head.appendChild(script);
    });
  }
}

export const paystackService = new PaystackService();

  VerifyPaymentResponse,
};
