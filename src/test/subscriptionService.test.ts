import { describe, it, expect, vi, beforeEach } from 'vitest';
import { COLLECTIONS } from '../lib/collections';

// 1. Define hoisted mocks to be available during early module imports
const { mockFirestoreService, MockTimestamp } = vi.hoisted(() => {
  class TempTimestamp {
    constructor(public seconds: number, public nanoseconds: number) {}
    toDate() {
      return new Date(this.seconds * 1000);
    }
    static fromDate(date: Date) {
      return new TempTimestamp(Math.floor(date.getTime() / 1000), 0);
    }
  }

  return {
    mockFirestoreService: {
      getDocument: vi.fn(),
      updateDocument: vi.fn(),
    },
    MockTimestamp: TempTimestamp,
  };
});

vi.mock('../services/firestore.service', () => ({
  FirestoreService: mockFirestoreService,
}));

vi.mock('firebase/firestore', () => ({
  Timestamp: MockTimestamp,
}));

// Mock logger
vi.mock('../lib/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// 2. Import the service under test
import { subscriptionService, SUBSCRIPTION_TIERS } from '../services/subscriptionService';
import type { SubscriptionPlan, SubscriptionStatus } from '../types/firestore';

describe('SubscriptionService Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================
  // CATEGORY 1: Happy Path Tests
  // ==========================================
  describe('Happy Path Tests', () => {
    it('should retrieve correct subscription tier by plan', () => {
      const monthlyTier = subscriptionService.getTierByPlan('monthly');
      expect(monthlyTier).toBeDefined();
      expect(monthlyTier?.name).toBe('Monthly');
      expect(monthlyTier?.price).toBe(1550);
      expect(monthlyTier?.duration).toBe(1);

      const annualTier = subscriptionService.getTierByPlan('annual');
      expect(annualTier?.name).toBe('12 Months');
      expect(annualTier?.price).toBe(10550);
      expect(annualTier?.duration).toBe(12);
    });

    it('should calculate subscription end date correctly', () => {
      const startDate = new Date('2026-06-09T12:00:00Z');
      const endDate = subscriptionService.calculateEndDate(startDate, 'quarterly');

      // June + 3 months = September
      expect(endDate.getFullYear()).toBe(2026);
      expect(endDate.getMonth()).toBe(8); // September is 8 (0-indexed: Jan=0, Sep=8)
      expect(endDate.getDate()).toBe(9);
    });

    it('should determine subscription active state correctly', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);

      const active = subscriptionService.isSubscriptionActive('active', futureDate);
      expect(active).toBe(true);

      const inactiveStatus = subscriptionService.isSubscriptionActive('cancelled', futureDate);
      expect(inactiveStatus).toBe(false);
    });

    it('should return all subscription tiers', () => {
      const tiers = subscriptionService.getAllTiers();
      expect(tiers).toEqual(SUBSCRIPTION_TIERS);
      expect(tiers.length).toBe(4);
    });

    it('should validate plans correctly', () => {
      expect(subscriptionService.isValidPlan('monthly')).toBe(true);
      expect(subscriptionService.isValidPlan('annual')).toBe(true);
      expect(subscriptionService.isValidPlan('free')).toBe(false);
      expect(subscriptionService.isValidPlan('premium')).toBe(false);
    });

    it('should retrieve vendor subscription details and parse Timestamp correctly', async () => {
      const mockStartDate = new Date('2026-06-01T00:00:00Z');
      const mockEndDate = new Date('2026-07-01T00:00:00Z');

      const mockVendor = {
        subscription_plan: 'monthly' as SubscriptionPlan,
        subscription_status: 'active' as SubscriptionStatus,
        subscription_start_date: MockTimestamp.fromDate(mockStartDate),
        subscription_end_date: MockTimestamp.fromDate(mockEndDate),
      };

      mockFirestoreService.getDocument.mockResolvedValueOnce(mockVendor);

      const result = await subscriptionService.getVendorSubscription('vendor-123');

      expect(mockFirestoreService.getDocument).toHaveBeenCalledWith(COLLECTIONS.VENDORS, 'vendor-123');
      expect(result.plan).toBe('monthly');
      expect(result.status).toBe('active');
      expect(result.startDate?.getTime()).toBe(mockStartDate.getTime());
      expect(result.endDate?.getTime()).toBe(mockEndDate.getTime());
      // Since mockEndDate is in the future (relative to the local 2026-06-09 system clock if run then) or we mock system time
      // Let's assert based on static clock: if today is 2026-06-09, is 2026-07-01 active? Yes.
      expect(result.isActive).toBe(new Date() < mockEndDate);
    });

    it('should update vendor subscription successfully in Firestore', async () => {
      mockFirestoreService.updateDocument.mockResolvedValueOnce(undefined);

      const result = await subscriptionService.updateVendorSubscription('vendor-123', 'semi_annual');

      expect(mockFirestoreService.updateDocument).toHaveBeenCalledWith(
        COLLECTIONS.VENDORS,
        'vendor-123',
        expect.objectContaining({
          subscription_plan: 'semi_annual',
          subscription_status: 'active',
          subscription_start_date: expect.any(MockTimestamp),
          subscription_end_date: expect.any(MockTimestamp),
        })
      );

      expect(result.plan).toBe('semi_annual');
      expect(result.status).toBe('active');
      expect(result.isActive).toBe(true);
    });

    it('should cancel vendor subscription successfully in Firestore', async () => {
      mockFirestoreService.updateDocument.mockResolvedValueOnce(undefined);

      const result = await subscriptionService.cancelVendorSubscription('vendor-123');

      expect(mockFirestoreService.updateDocument).toHaveBeenCalledWith(
        COLLECTIONS.VENDORS,
        'vendor-123',
        { subscription_status: 'cancelled' }
      );
      expect(result.success).toBe(true);
    });

    it('should determine vendor permission actions based on subscription tiers', () => {
      const activeMonthly = { plan: 'monthly', isActive: true };
      const activeQuarterly = { plan: 'quarterly', isActive: true };
      const activeAnnual = { plan: 'annual', isActive: true };
      const inactiveAnnual = { plan: 'annual', isActive: false };

      // list_products (allowed for all active)
      expect(subscriptionService.canVendorPerformAction(activeMonthly, 'list_products')).toBe(true);
      expect(subscriptionService.canVendorPerformAction(inactiveAnnual, 'list_products')).toBe(false);

      // featured_listing (allowed for quarterly and above)
      expect(subscriptionService.canVendorPerformAction(activeMonthly, 'featured_listing')).toBe(false);
      expect(subscriptionService.canVendorPerformAction(activeQuarterly, 'featured_listing')).toBe(true);

      // unlimited_products (semi_annual and annual)
      expect(subscriptionService.canVendorPerformAction(activeQuarterly, 'unlimited_products')).toBe(false);
      expect(subscriptionService.canVendorPerformAction(activeAnnual, 'unlimited_products')).toBe(true);

      // api_access (only annual)
      expect(subscriptionService.canVendorPerformAction(activeQuarterly, 'api_access')).toBe(false);
      expect(subscriptionService.canVendorPerformAction(activeAnnual, 'api_access')).toBe(true);
    });

    it('should return correct product limits by plan', () => {
      expect(subscriptionService.getProductLimit('free')).toBe(0);
      expect(subscriptionService.getProductLimit('monthly')).toBe(10);
      expect(subscriptionService.getProductLimit('quarterly')).toBe(50);
      expect(subscriptionService.getProductLimit('semi_annual')).toBe(-1);
      expect(subscriptionService.getProductLimit('annual')).toBe(-1);
    });
  });

  // ==========================================
  // CATEGORY 2: Edge Case Tests
  // ==========================================
  describe('Edge Case Tests', () => {
    it('should throw error when calculating end date for an invalid plan', () => {
      const startDate = new Date();
      expect(() => {
        subscriptionService.calculateEndDate(startDate, 'invalid' as any);
      }).toThrow('Invalid subscription plan');
    });

    it('should return false for active checks on null end dates', () => {
      expect(subscriptionService.isSubscriptionActive('active', null)).toBe(false);
    });

    it('should return false for active checks on expired subscriptions', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      expect(subscriptionService.isSubscriptionActive('active', pastDate)).toBe(false);
    });

    it('should support standard Date strings fallback when parsing vendor subscription dates', async () => {
      const mockVendor = {
        subscription_plan: 'monthly' as SubscriptionPlan,
        subscription_status: 'active' as SubscriptionStatus,
        subscription_start_date: '2026-06-01T00:00:00Z',
        subscription_end_date: '2026-07-01T00:00:00Z',
      };

      mockFirestoreService.getDocument.mockResolvedValueOnce(mockVendor);

      const result = await subscriptionService.getVendorSubscription('vendor-123');

      expect(result.startDate).toBeInstanceOf(Date);
      expect(result.endDate).toBeInstanceOf(Date);
      expect(result.startDate?.toISOString()).toBe('2026-06-01T00:00:00.000Z');
    });

    it('should deny permissions for unknown actions', () => {
      const activeAnnual = { plan: 'annual', isActive: true };
      expect(subscriptionService.canVendorPerformAction(activeAnnual, 'unknown_action')).toBe(false);
    });
  });

  // ==========================================
  // CATEGORY 3: Error Handling Tests
  // ==========================================
  describe('Error Handling Tests', () => {
    it('should throw error when fetching vendor subscription fails due to missing vendor document', async () => {
      mockFirestoreService.getDocument.mockResolvedValueOnce(null);

      await expect(subscriptionService.getVendorSubscription('missing-vendor')).rejects.toThrow('Vendor not found');
    });

    it('should log and propagate error when Firestore fails on updating subscription', async () => {
      const dbError = new Error('Database connection failed');
      mockFirestoreService.updateDocument.mockRejectedValueOnce(dbError);

      await expect(subscriptionService.updateVendorSubscription('vendor-123', 'monthly')).rejects.toThrow('Database connection failed');
    });
  });
});
