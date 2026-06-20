import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { COLLECTIONS } from '../lib/collections';

// Define hoisted mocks to be available during early module imports
const { mockFirestoreService, mockHttpsCallables } = vi.hoisted(() => ({
  mockFirestoreService: {
    addDocument: vi.fn(),
    updateDocument: vi.fn(),
  },
  mockHttpsCallables: {} as Record<string, any>,
}));

vi.mock('../services/firestore.service', () => ({
  FirestoreService: mockFirestoreService,
}));

// Mock firebase config
vi.mock('../lib/firebase.config', () => ({
  app: {},
}));

// Mock firebase/functions to allow dynamic backend function responses
vi.mock('firebase/functions', () => ({
  getFunctions: vi.fn(),
  httpsCallable: vi.fn((functionsInstance, name) => {
    return async (data: any) => {
      if (mockHttpsCallables[name]) {
        return { data: await mockHttpsCallables[name](data) };
      }
      throw new Error(`Mock for Cloud Function ${name} not defined`);
    };
  }),
}));

// Import the service under test after mocks are defined and registered
import { flutterwaveService } from '../services/flutterwaveService';

describe('FlutterwaveService Unit Tests', () => {
  const originalFlutterwaveCheckout = (window as any).FlutterwaveCheckout;
  const originalConfig = { ...(flutterwaveService as any).config };

  beforeEach(() => {
    vi.clearAllMocks();
    // Clear dynamic cloud function mocks
    for (const key in mockHttpsCallables) {
      delete mockHttpsCallables[key];
    }

    // Override singleton configurations
    (flutterwaveService as any).config = {
      publicKey: 'FLWPUBK_TEST-MOCK-123',
    };

    // Default mock for window.FlutterwaveCheckout
    (window as any).FlutterwaveCheckout = vi.fn();
  });

  afterEach(() => {
    // Restore globals and configuration
    (window as any).FlutterwaveCheckout = originalFlutterwaveCheckout;
    (flutterwaveService as any).config = originalConfig;

    // Clean up dynamic scripts appended to head
    const scripts = document.querySelectorAll('script[src="https://checkout.flutterwave.com/v3.js"]');
    scripts.forEach(script => script.remove());
  });

  // ==========================================
  // CATEGORY 1: Happy Path Tests
  // ==========================================
  describe('Happy Path Tests', () => {
    it('should initialize payment successfully', async () => {
      const mockResult = {
        success: true,
        data: {
          link: 'https://checkout.flutterwave.com/mock-link',
        },
      };

      mockHttpsCallables['initializeFlutterwavePayment'] = vi.fn().mockResolvedValue(mockResult);

      const result = await flutterwaveService.initializePayment({
        orderId: 'order-123',
        customerEmail: 'buyer@test.com',
        amountNaira: 5000,
        customerPhone: '08012345678',
        reference: 'custom-tx-ref',
        callbackUrl: 'https://test.com/callback',
        metadata: { customInfo: 'hello' },
      });

      expect(result.success).toBe(true);
      expect(result.data?.link).toBe(mockResult.data.link);
      expect(result.data?.tx_ref).toBe('custom-tx-ref');
      expect(mockHttpsCallables['initializeFlutterwavePayment']).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'buyer@test.com',
          amount: 5000,
          tx_ref: 'custom-tx-ref',
          redirect_url: 'https://test.com/callback',
          customer: {
            email: 'buyer@test.com',
            phonenumber: '08012345678',
          },
          metadata: {
            order_id: 'order-123',
            customInfo: 'hello',
          },
        })
      );
    });

    it('should verify payment, log transaction, and extract orderId from tx_ref fallback', async () => {
      const mockResult = {
        success: true,
        data: {
          tx_ref: 'NIMEX-order_999-timestamp123',
          amount: 5000,
          meta: {},
        },
      };

      mockHttpsCallables['verifyFlutterwavePayment'] = vi.fn().mockResolvedValue(mockResult);
      mockFirestoreService.addDocument.mockResolvedValueOnce('transaction-id-abc');

      const result = await flutterwaveService.verifyPayment('transaction-123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResult.data);
      expect(mockFirestoreService.addDocument).toHaveBeenCalledWith(
        'payment_transactions',
        expect.objectContaining({
          amount: 5000,
          payment_status: 'paid',
          payment_method: 'flutterwave',
          payment_reference: 'NIMEX-order_999-timestamp123',
          order_id: 'order_999',
          type: 'order',
        })
      );
    });

    it('should create virtual account successfully and update Firestore', async () => {
      const mockResult = {
        success: true,
        data: {
          account_number: '1234567890',
          bank_name: 'Wema Bank',
          flw_ref: 'FLW-VA-MOCK-789',
        },
      };

      mockHttpsCallables['createFlutterwaveVirtualAccount'] = vi.fn().mockResolvedValue(mockResult);
      mockFirestoreService.updateDocument.mockResolvedValueOnce(undefined);

      const result = await flutterwaveService.createVirtualAccount('vendor-456', {
        email: 'vendor@test.com',
        business_name: 'Super Shop Services',
        phone: '08099998888',
        bvn: '22222222222',
      });

      expect(result.success).toBe(true);
      expect(result.data?.account_number).toBe('1234567890');
      expect(result.data?.bank_name).toBe('Wema Bank');
      expect(mockFirestoreService.updateDocument).toHaveBeenCalledWith(
        COLLECTIONS.VENDORS,
        'vendor-456',
        expect.objectContaining({
          virtual_account_number: '1234567890',
          virtual_account_bank: 'Wema Bank',
        })
      );
    });

    it('should create vendor wallet subaccount and update Firestore', async () => {
      const mockResult = {
        success: true,
        data: {
          subaccount_id: 'RS_MOCK_123456',
          bank_name: 'Access Bank',
          account_number: '0987654321',
          account_name: 'Super Shop Services',
        },
      };

      mockHttpsCallables['createFlutterwaveSubaccount'] = vi.fn().mockResolvedValue(mockResult);
      mockFirestoreService.updateDocument.mockResolvedValueOnce(undefined);

      const result = await flutterwaveService.createVendorWallet('vendor-456', {
        business_name: 'Super Shop Services',
        email: 'vendor@test.com',
        phone: '08099998888',
        bank_code: '044',
        account_number: '0987654321',
      });

      expect(result.success).toBe(true);
      expect(result.data?.wallet_id).toBe('RS_MOCK_123456');
      expect(mockFirestoreService.updateDocument).toHaveBeenCalledWith(
        COLLECTIONS.VENDORS,
        'vendor-456',
        expect.objectContaining({
          flutterwave_wallet_id: 'RS_MOCK_123456',
          flutterwave_bank_name: 'Access Bank',
          flutterwave_account_number: '0987654321',
        })
      );
    });

    it('should process withdrawal and log transaction to Firestore', async () => {
      const mockResult = {
        success: true,
        data: {
          reference: 'NIMEX-PAYOUT-vendor-456-1111111',
          status: 'success',
        },
      };

      mockHttpsCallables['processFlutterwaveWithdrawal'] = vi.fn().mockResolvedValue(mockResult);
      mockFirestoreService.addDocument.mockResolvedValueOnce('tx-987');

      const result = await flutterwaveService.transferToVendor(
        'vendor-456',
        15000,
        '058',
        '0112233445',
        'Weekly Payout'
      );

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('success');
      expect(mockFirestoreService.addDocument).toHaveBeenCalledWith(
        'payment_transactions',
        expect.objectContaining({
          amount: 15000,
          payment_status: 'pending',
          payment_method: 'flutterwave',
          vendor_id: 'vendor-456',
          type: 'withdrawal',
        })
      );
    });

    it('should fetch bank list from API successfully', async () => {
      const mockResult = {
        success: true,
        banks: [
          { name: 'Mock Bank A', code: '999' },
        ],
      };

      mockHttpsCallables['getFlutterwaveBankList'] = vi.fn().mockResolvedValue(mockResult);

      const result = await flutterwaveService.getBankList();

      expect(result.success).toBe(true);
      expect(result.banks).toEqual(mockResult.banks);
    });

    it('should resolve account number successfully', async () => {
      const mockResult = {
        success: true,
        data: {
          account_name: 'JOHN DOE',
        },
      };

      mockHttpsCallables['resolveFlutterwaveAccount'] = vi.fn().mockResolvedValue(mockResult);

      const result = await flutterwaveService.resolveAccountNumber('0112233445', '058');

      expect(result.success).toBe(true);
      expect(result.accountName).toBe('JOHN DOE');
    });

    it('should open payment modal via FlutterwaveCheckout', () => {
      const onSuccess = vi.fn();
      const onClose = vi.fn();

      const modalData = {
        tx_ref: 'tx-ref-1',
        amount: 2500,
        customer: { email: 'test@test.com' },
      };

      flutterwaveService.openPaymentModal(modalData, onSuccess, onClose);

      expect((window as any).FlutterwaveCheckout).toHaveBeenCalledWith(
        expect.objectContaining({
          public_key: 'FLWPUBK_TEST-MOCK-123',
          tx_ref: 'tx-ref-1',
          amount: 2500,
          callback: expect.any(Function),
          onclose: onClose,
        })
      );

      // Extract callback and simulate successful response
      const checkoutCallConfig = ((window as any).FlutterwaveCheckout as any).mock.calls[0][0];
      checkoutCallConfig.callback({ status: 'successful' });
      expect(onSuccess).toHaveBeenCalled();

      // Simulate failed/cancelled response
      checkoutCallConfig.callback({ status: 'failed' });
      expect(onClose).toHaveBeenCalled();
    });
  });

  // ==========================================
  // CATEGORY 2: Edge Case Tests
  // ==========================================
  describe('Edge Case Tests', () => {
    it('should handle business name splitting when creating subaccount / virtual account', async () => {
      // Test business name with multiple spaces
      const mockResult = {
        success: true,
        data: {
          account_number: '1111111111',
          bank_name: 'Wema Bank',
        },
      };

      mockHttpsCallables['createFlutterwaveVirtualAccount'] = vi.fn().mockResolvedValue(mockResult);

      await flutterwaveService.createVirtualAccount('vendor-456', {
        email: 'vendor@test.com',
        business_name: 'Super Duper Shop Services LLC',
      });

      // Name split checks: firstname should be 'Super', lastname should be 'Duper Shop Services LLC'
      expect(mockHttpsCallables['createFlutterwaveVirtualAccount']).toHaveBeenCalledWith(
        expect.objectContaining({
          firstname: 'Super',
          lastname: 'Duper Shop Services LLC',
        })
      );
    });

    it('should handle single word business name for splitting', async () => {
      const mockResult = {
        success: true,
        data: {
          account_number: '1111111111',
          bank_name: 'Wema Bank',
        },
      };

      mockHttpsCallables['createFlutterwaveVirtualAccount'] = vi.fn().mockResolvedValue(mockResult);

      await flutterwaveService.createVirtualAccount('vendor-456', {
        email: 'vendor@test.com',
        business_name: 'OneWord',
      });

      expect(mockHttpsCallables['createFlutterwaveVirtualAccount']).toHaveBeenCalledWith(
        expect.objectContaining({
          firstname: 'OneWord',
          lastname: 'Business', // Fallback value from the service code
        })
      );
    });

    it('should fallback to static bank list if getBankList Cloud Function throws an error', async () => {
      mockHttpsCallables['getFlutterwaveBankList'] = vi.fn().mockRejectedValue(new Error('Cloud Function Down'));

      const result = await flutterwaveService.getBankList();

      expect(result.success).toBe(true);
      expect(result.banks).toBeDefined();
      expect(result.banks?.length).toBeGreaterThan(0);
      expect(result.banks?.[0].name).toBe('Access Bank'); // Static fallback check
    });

    it('should load Flutterwave script only once if script tag is already appended or defined', async () => {
      (window as any).FlutterwaveCheckout = vi.fn();
      
      const scriptCountBefore = document.querySelectorAll('script').length;
      await expect(flutterwaveService.loadFlutterwaveScript()).resolves.toBeUndefined();
      
      const scriptCountAfter = document.querySelectorAll('script').length;
      expect(scriptCountAfter).toBe(scriptCountBefore);
    });
  });

  // ==========================================
  // CATEGORY 3: Error Handling Tests
  // ==========================================
  describe('Error Handling Tests', () => {
    it('should return UPSTREAM_ERROR when Cloud Function reports failure in initializePayment', async () => {
      mockHttpsCallables['initializeFlutterwavePayment'] = vi.fn().mockResolvedValue({
        success: false,
        error: 'Invalid public key',
      });

      const result = await flutterwaveService.initializePayment({
        orderId: 'order-123',
        customerEmail: 'buyer@test.com',
        amountNaira: 500,
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('UPSTREAM_ERROR');
      expect(result.error?.message).toBe('Invalid public key');
    });

    it('should return NETWORK_ERROR when Cloud Function throws exception in verifyPayment', async () => {
      mockHttpsCallables['verifyFlutterwavePayment'] = vi.fn().mockRejectedValue(new Error('Network Connection Lost'));

      const result = await flutterwaveService.verifyPayment('tx-ref-1');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NETWORK_ERROR');
      expect(result.error?.message).toBe('Network Connection Lost');
    });

    it('should fail and log error when calling openPaymentModal with script not loaded', () => {
      delete (window as any).FlutterwaveCheckout;
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      flutterwaveService.openPaymentModal({}, vi.fn(), vi.fn());

      expect(consoleErrorSpy).toHaveBeenCalledWith('Flutterwave script not loaded');
      consoleErrorSpy.mockRestore();
    });

    it('should handle script loading failure rejection', async () => {
      delete (window as any).FlutterwaveCheckout;

      const originalCreateElement = document.createElement.bind(document);
      const spyCreateElement = vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
        const element = originalCreateElement(tagName);
        if (tagName === 'script') {
          setTimeout(() => {
            if ((element as any).onerror) {
              (element as any).onerror(new ErrorEvent('error'));
            }
          }, 0);
        }
        return element;
      });

      await expect(flutterwaveService.loadFlutterwaveScript()).rejects.toThrow(
        'Failed to load Flutterwave script'
      );

      spyCreateElement.mockRestore();
    });
  });
});
