import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { paystackService } from '../services/paystackService';

// Mock subscriptionService (using correct path relative to the test file)
const mockSubscriptionService = {
  getTierByPlan: vi.fn(),
  updateVendorSubscription: vi.fn(),
};
vi.mock('../services/subscriptionService', () => ({
  subscriptionService: mockSubscriptionService,
}));

// Mock firestore.service (using correct path relative to the test file)
const mockFirestoreService = {
  addDocument: vi.fn(),
};
vi.mock('../services/firestore.service', () => ({
  FirestoreService: mockFirestoreService,
}));

describe('PaystackService Unit Tests', () => {
  const originalFetch = global.fetch;
  const originalPaystackPop = (window as any).PaystackPop;
  
  // Back up original config/apiUrl from singleton instance to restore after tests
  const originalConfig = { ...(paystackService as any).config };
  const originalApiUrl = (paystackService as any).apiUrl;

  // Custom mock objects
  let mockFetch: any;
  let mockOpenIframe: any;
  let mockPaystackPopSetup: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Override singleton configurations directly since constructor ran at module load
    (paystackService as any).config = {
      publicKey: 'pk_test_mock_123456',
    };
    (paystackService as any).apiUrl = 'https://api.test-nimex.com';

    // Mock global fetch
    mockFetch = vi.fn();
    global.fetch = mockFetch;

    // Mock PaystackPop iframe calls
    mockOpenIframe = vi.fn();
    mockPaystackPopSetup = vi.fn().mockReturnValue({
      openIframe: mockOpenIframe,
    });
    (window as any).PaystackPop = {
      setup: mockPaystackPopSetup,
    };
  });

  afterEach(() => {
    // Restore globals and singleton instance config
    global.fetch = originalFetch;
    (window as any).PaystackPop = originalPaystackPop;
    (paystackService as any).config = originalConfig;
    (paystackService as any).apiUrl = originalApiUrl;
    
    // Clean up any dynamically appended scripts from DOM
    const scripts = document.querySelectorAll('script[src="https://js.paystack.co/v1/inline.js"]');
    scripts.forEach(script => script.remove());
  });

  // ==========================================
  // CATEGORY 1: Happy Path Tests
  // ==========================================
  describe('Happy Path Tests', () => {
    it('should initialize subscription payment successfully', async () => {
      // Mock plan details
      mockSubscriptionService.getTierByPlan.mockReturnValue({
        plan: 'monthly',
        name: 'Monthly',
        price: 1550,
        duration: 1,
      });

      // Mock successful fetch response
      const mockResponseData = {
        authorization_url: 'https://checkout.paystack.com/mock-auth',
        access_code: 'mock-access-code',
        reference: 'NIMEX-SUB-vendor-123-monthly-987654',
      };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponseData,
      });

      const result = await paystackService.initializeSubscriptionPayment(
        'vendor@test.com',
        'monthly',
        'vendor-123'
      );

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.authorizationUrl).toBe(mockResponseData.authorization_url);
      expect(result.data?.accessCode).toBe(mockResponseData.access_code);
      expect(result.data?.reference).toContain('NIMEX-SUB-vendor-123-monthly-');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test-nimex.com/initializePayment',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"amount":155000'), // 1550 * 100
        })
      );
    });

    it('should initialize custom order payment successfully', async () => {
      const mockResponseData = {
        authorization_url: 'https://checkout.paystack.com/order-mock-auth',
        access_code: 'order-access-code',
        reference: 'NIMEX-order-456-12345',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponseData,
      });

      const result = await paystackService.initializePayment({
        orderId: 'order-456',
        customerEmail: 'buyer@test.com',
        amountNaira: 5000,
        reference: 'custom-ref-123',
        callbackUrl: 'https://test.com/callback',
        metadata: { info: 'test-meta' },
      });

      expect(result.success).toBe(true);
      expect(result.data?.reference).toBe(mockResponseData.reference);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test-nimex.com/initializePayment',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"amount":500000'), // 5000 * 100
        })
      );
    });

    it('should verify payment successfully', async () => {
      const mockVerificationData = {
        reference: 'NIMEX-order-456-12345',
        amount: 250000, // in kobo
        status: 'success',
        paid_at: '2026-06-09T12:00:00Z',
        channel: 'card',
        customer: { email: 'buyer@test.com' },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockVerificationData,
      });

      const result = await paystackService.verifyPayment('NIMEX-order-456-12345');

      expect(result.success).toBe(true);
      expect(result.data?.amount).toBe(2500); // converted to Naira
      expect(result.data?.status).toBe('success');
      expect(result.data?.customer.email).toBe('buyer@test.com');
    });

    it('should verify subscription payment, update vendor subscription, and log transaction', async () => {
      // Mock verifyPayment response
      const mockVerificationData = {
        reference: 'NIMEX-SUB-vendorId123-monthly-12345',
        amount: 155000,
        status: 'success',
        paid_at: '2026-06-09T12:00:00Z',
        channel: 'card',
        customer: { email: 'vendor@test.com' },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockVerificationData,
      });

      mockSubscriptionService.updateVendorSubscription.mockResolvedValueOnce({
        plan: 'monthly',
        status: 'active',
      });

      mockFirestoreService.addDocument.mockResolvedValueOnce('doc-id-999');

      const result = await paystackService.verifySubscriptionPayment(
        'NIMEX-SUB-vendorId123-monthly-12345'
      );

      expect(result.success).toBe(true);
      expect(mockSubscriptionService.updateVendorSubscription).toHaveBeenCalledWith(
        'vendorId123',
        'monthly'
      );
      expect(mockFirestoreService.addDocument).toHaveBeenCalledWith(
        'payment_transactions',
        expect.objectContaining({
          vendor_id: 'vendorId123',
          amount: 1550, // Naira
          type: 'subscription',
          payment_method: 'paystack',
        })
      );
    });

    it('should open payment modal via window.PaystackPop setup', () => {
      const onSuccess = vi.fn();
      const onClose = vi.fn();

      paystackService.openPaymentModal(
        'buyer@test.com',
        2500,
        'NIMEX-ref-1',
        onSuccess,
        onClose
      );

      expect(mockPaystackPopSetup).toHaveBeenCalledWith({
        key: 'pk_test_mock_123456',
        email: 'buyer@test.com',
        amount: 250000,
        ref: 'NIMEX-ref-1',
        onClose: expect.any(Function),
        callback: expect.any(Function),
      });

      expect(mockOpenIframe).toHaveBeenCalled();

      // Simulate callbacks
      const setupConfig = mockPaystackPopSetup.mock.calls[0][0];
      setupConfig.onClose();
      expect(onClose).toHaveBeenCalled();

      setupConfig.callback({ reference: 'NIMEX-ref-1' });
      expect(onSuccess).toHaveBeenCalledWith('NIMEX-ref-1');
    });

    it('should detect test mode based on VITE_APP_ENV', () => {
      // Stub the env variable at runtime since isTestMode reads it dynamically
      vi.stubEnv('VITE_APP_ENV', 'test');
      expect(paystackService.isTestMode()).toBe(true);

      vi.stubEnv('VITE_APP_ENV', 'production');
      expect(paystackService.isTestMode()).toBe(false);
    });
  });

  // ==========================================
  // CATEGORY 2: Edge Case Tests
  // ==========================================
  describe('Edge Case Tests', () => {
    it('should reject payment initialization with invalid subscription plan', async () => {
      mockSubscriptionService.getTierByPlan.mockReturnValue(undefined);

      const result = await paystackService.initializeSubscriptionPayment(
        'vendor@test.com',
        'invalid-plan',
        'vendor-123'
      );

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Invalid subscription plan');
    });

    it('should handle decimal price rounding correctly for kobo conversion', async () => {
      mockSubscriptionService.getTierByPlan.mockReturnValue({
        plan: 'monthly',
        name: 'Monthly',
        price: 1550.579, // Decimal price to check Math.round
        duration: 1,
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          authorization_url: 'https://checkout.paystack.com/mock-auth',
          access_code: 'mock-access',
          reference: 'ref',
        }),
      });

      await paystackService.initializeSubscriptionPayment(
        'vendor@test.com',
        'monthly',
        'vendor-123'
      );

      // 1550.579 * 100 = 155057.9 -> Math.round -> 155058
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.amount).toBe(155058);
    });

    it('should load Paystack script only once if already loaded', async () => {
      // Simulate that PaystackPop is already defined
      (window as any).PaystackPop = { setup: vi.fn() };

      const scriptCountBefore = document.querySelectorAll('script').length;
      await expect(paystackService.loadPaystackScript()).resolves.toBeUndefined();
      
      const scriptCountAfter = document.querySelectorAll('script').length;
      expect(scriptCountAfter).toBe(scriptCountBefore); // No new script added
    });

    it('should handle non-standard subscription reference parts gracefully', async () => {
      // Reference format: NIMEX-SUB-vendorId-plan-timestamp
      // What if it is too short or malformed? E.g., 'NIMEX-SUB-vendorId'
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          reference: 'NIMEX-SUB-vendorId',
          amount: 155000,
          status: 'success',
          paid_at: '2026-06-09T12:00:00Z',
          channel: 'card',
          customer: { email: 'vendor@test.com' },
        }),
      });

      const result = await paystackService.verifySubscriptionPayment('NIMEX-SUB-vendorId');
      
      // Should fall through parts verification and return validation instead of crash
      expect(result.success).toBe(true);
      expect(mockSubscriptionService.updateVendorSubscription).not.toHaveBeenCalled();
    });
  });

  // ==========================================
  // CATEGORY 3: Error Handling Tests
  // ==========================================
  describe('Error Handling Tests', () => {
    it('should handle fetch upstream HTTP non-200 responses gracefully in initialization', async () => {
      mockSubscriptionService.getTierByPlan.mockReturnValue({
        plan: 'monthly',
        name: 'Monthly',
        price: 1550,
        duration: 1,
      });

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Invalid API Key' }),
      });

      const result = await paystackService.initializeSubscriptionPayment(
        'vendor@test.com',
        'monthly',
        'vendor-123'
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('UPSTREAM_ERROR');
      expect(result.error?.message).toBe('Invalid API Key');
    });

    it('should handle fetch exceptions (network down) gracefully in verification', async () => {
      mockFetch.mockRejectedValueOnce(new Error('DNS lookup failed'));

      const result = await paystackService.verifyPayment('ref-123');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NETWORK_ERROR');
      expect(result.error?.message).toBe('DNS lookup failed');
    });

    it('should return network error when verification response json throws', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Malformed JSON body');
        },
      });

      const result = await paystackService.verifyPayment('ref-123');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NETWORK_ERROR');
    });

    it('should return upstream error when non-ok response json throws during parsing', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => {
          throw new Error('Malformed error JSON body');
        },
      });

      const result = await paystackService.verifyPayment('ref-123');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('UPSTREAM_ERROR');
      expect(result.error?.message).toBe('Payment verification failed'); // Fallback message
    });

    it('should fail when calling openPaymentModal with script not loaded', () => {
      delete (window as any).PaystackPop;
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      paystackService.openPaymentModal(
        'buyer@test.com',
        2500,
        'ref',
        vi.fn(),
        vi.fn()
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith('Paystack SDK not loaded');
      consoleErrorSpy.mockRestore();
    });

    it('should handle script loading failure rejection', async () => {
      // Temporarily remove global PaystackPop
      delete (window as any).PaystackPop;

      const originalCreateElement = document.createElement.bind(document);
      const spyCreateElement = vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
        const element = originalCreateElement(tagName);
        if (tagName === 'script') {
          // Trigger onerror asynchronously
          setTimeout(() => {
            if ((element as any).onerror) {
              (element as any).onerror(new ErrorEvent('error'));
            }
          }, 0);
        }
        return element;
      });

      await expect(paystackService.loadPaystackScript()).rejects.toThrow(
        'Failed to load Paystack script'
      );

      spyCreateElement.mockRestore();
    });
  });
});
