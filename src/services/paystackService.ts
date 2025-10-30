interface PaystackConfig {
  publicKey: string;
  testMode: boolean;
}

interface InitializePaymentRequest {
  email: string;
  amount: number;
  orderId: string;
  metadata?: Record<string, any>;
  callbackUrl?: string;
}

interface InitializePaymentResponse {
  success: boolean;
  data?: {
    authorizationUrl: string;
    accessCode: string;
    reference: string;
  };
  error?: string;
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
  error?: string;
}

class PaystackService {
  private config: PaystackConfig;

  constructor() {
    this.config = {
      publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
      testMode: import.meta.env.VITE_PAYSTACK_TEST_MODE === 'true',
    };

    if (!this.config.publicKey) {
      throw new Error('Missing required environment variable: VITE_PAYSTACK_PUBLIC_KEY');
    }
  }

  async initializeSubscriptionPayment(
    email: string,
    plan: string,
    vendorId: string
  ): Promise<InitializePaymentResponse> {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      // Get plan details
      const { subscriptionService } = await import('./subscriptionService');
      const tier = subscriptionService.getTierByPlan(plan as any);

      if (!tier) {
        throw new Error('Invalid subscription plan');
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/initialize-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          email,
          amount: Math.round(tier.price * 100),
          reference: `NIMEX-SUB-${vendorId}-${plan}-${Date.now()}`,
          metadata: {
            type: 'subscription',
            vendor_id: vendorId,
            plan: plan,
            price: tier.price,
          },
          callback_url: `${window.location.origin}/vendor/subscription/success`,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to initialize subscription payment');
      }

      const data = await response.json();

      return {
        success: true,
        data: {
          authorizationUrl: data.authorization_url,
          accessCode: data.access_code,
          reference: data.reference,
        },
      };
    } catch (error) {
      console.error('Failed to initialize subscription payment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to initialize subscription payment',
      };
    }
  }

  async initializePayment(request: InitializePaymentRequest): Promise<InitializePaymentResponse> {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/initialize-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          email: request.email,
          amount: Math.round(request.amount * 100),
          reference: `NIMEX-${request.orderId}-${Date.now()}`,
          metadata: {
            order_id: request.orderId,
            ...request.metadata,
          },
          callback_url: request.callbackUrl || `${window.location.origin}/orders/${request.orderId}`,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to initialize payment');
      }

      const data = await response.json();

      return {
        success: true,
        data: {
          authorizationUrl: data.authorization_url,
          accessCode: data.access_code,
          reference: data.reference,
        },
      };
    } catch (error) {
      console.error('Failed to initialize payment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to initialize payment',
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

          // Update vendor subscription
          const { subscriptionService } = await import('./subscriptionService');
          await subscriptionService.updateVendorSubscription(vendorId, plan as any);

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
        error: error instanceof Error ? error.message : 'Failed to verify subscription payment',
      };
    }
  }

  async verifyPayment(reference: string): Promise<VerifyPaymentResponse> {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/verify-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ reference }),
      });

      if (!response.ok) {
        throw new Error('Failed to verify payment');
      }

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
    } catch (error) {
      console.error('Failed to verify payment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to verify payment',
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
    return this.config.testMode;
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

export type {
  InitializePaymentRequest,
  InitializePaymentResponse,
  VerifyPaymentResponse,
};
