import { FirestoreService } from './firestore.service';
import { COLLECTIONS } from '../lib/collections';
import { logger } from '../lib/logger';
import { Timestamp } from 'firebase/firestore';
import type { Vendor, SubscriptionPlan, SubscriptionStatus } from '../types/firestore';

interface SubscriptionTier {
  plan: SubscriptionPlan;
  name: string;
  price: number;
  duration: number; // months
  features: string[];
}

export const SUBSCRIPTION_TIERS: SubscriptionTier[] = [
  {
    plan: 'monthly',
    name: 'Monthly',
    price: 1250,
    duration: 1,
    features: [
      'Basic marketplace access',
      'Up to 10 products',
      'Basic analytics',
      'Email support'
    ]
  },
  {
    plan: 'quarterly',
    name: '3 Months',
    price: 3550,
    duration: 3,
    features: [
      'All monthly features',
      'Up to 50 products',
      'Advanced analytics',
      'Priority support',
      'Featured listings'
    ]
  },
  {
    plan: 'semi_annual',
    name: '6 Months',
    price: 6550,
    duration: 6,
    features: [
      'All quarterly features',
      'Unlimited products',
      'Premium analytics',
      'Phone support',
      'Custom branding'
    ]
  },
  {
    plan: 'annual',
    name: '12 Months',
    price: 10550,
    duration: 12,
    features: [
      'All semi-annual features',
      'API access',
      'White-label solution',
      'Dedicated account manager',
      'Custom integrations'
    ]
  }
];

class SubscriptionService {
  /**
   * Get subscription tier by plan
   */
  getTierByPlan(plan: SubscriptionPlan): SubscriptionTier | undefined {
    return SUBSCRIPTION_TIERS.find(tier => tier.plan === plan);
  }

  /**
   * Calculate subscription end date
   */
  calculateEndDate(startDate: Date, plan: SubscriptionPlan): Date {
    const tier = this.getTierByPlan(plan);
    if (!tier) throw new Error('Invalid subscription plan');

    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + tier.duration);
    return endDate;
  }

  /**
   * Check if subscription is active
   */
  isSubscriptionActive(status: SubscriptionStatus, endDate: Date | null): boolean {
    if (status !== 'active') return false;
    if (!endDate) return false;
    return new Date() < endDate;
  }

  /**
   * Get all available tiers
   */
  getAllTiers(): SubscriptionTier[] {
    return SUBSCRIPTION_TIERS;
  }

  /**
   * Validate subscription plan
   */
  isValidPlan(plan: string): plan is SubscriptionPlan {
    return ['monthly', 'quarterly', 'semi_annual', 'annual'].includes(plan);
  }

  /**
   * Get subscription status for a vendor
   */
  async getVendorSubscription(vendorId: string) {
    try {
      const vendor = await FirestoreService.getDocument<Vendor>(COLLECTIONS.VENDORS, vendorId);

      if (!vendor) throw new Error('Vendor not found');

      // Helper to convert timestamp/string to Date
      const toDate = (val: any) => {
        if (!val) return null;
        if (val instanceof Timestamp) return val.toDate();
        return new Date(val);
      };

      const startDate = toDate(vendor.subscription_start_date);
      const endDate = toDate(vendor.subscription_end_date);

      return {
        plan: vendor.subscription_plan,
        status: vendor.subscription_status,
        startDate,
        endDate,
        isActive: this.isSubscriptionActive(vendor.subscription_status, endDate)
      };
    } catch (error) {
      logger.error('Error fetching vendor subscription:', error);
      throw error;
    }
  }

  /**
   * Update vendor subscription
   */
  async updateVendorSubscription(vendorId: string, plan: SubscriptionPlan) {
    try {
      const startDate = new Date();
      const endDate = this.calculateEndDate(startDate, plan);

      await FirestoreService.updateDocument(COLLECTIONS.VENDORS, vendorId, {
        subscription_plan: plan,
        subscription_status: 'active',
        subscription_start_date: Timestamp.fromDate(startDate),
        subscription_end_date: Timestamp.fromDate(endDate)
      });

      return {
        plan,
        status: 'active' as SubscriptionStatus,
        startDate,
        endDate,
        isActive: true
      };
    } catch (error) {
      logger.error('Error updating vendor subscription:', error);
      throw error;
    }
  }

  /**
   * Cancel vendor subscription
   */
  async cancelVendorSubscription(vendorId: string) {
    try {
      await FirestoreService.updateDocument(COLLECTIONS.VENDORS, vendorId, {
        subscription_status: 'cancelled'
      });

      return { success: true };
    } catch (error) {
      logger.error('Error cancelling vendor subscription:', error);
      throw error;
    }
  }

  /**
   * Check if vendor can perform action based on subscription
   */
  canVendorPerformAction(vendorSubscription: any, action: string): boolean {
    const { plan, isActive } = vendorSubscription;

    if (!isActive) return false;

    switch (action) {
      case 'list_products':
        return true; // All plans can list products

      case 'featured_listing':
        return ['quarterly', 'semi_annual', 'annual'].includes(plan);

      case 'unlimited_products':
        return ['semi_annual', 'annual'].includes(plan);

      case 'api_access':
        return plan === 'annual';

      case 'custom_branding':
        return ['semi_annual', 'annual'].includes(plan);

      default:
        return false;
    }
  }

  /**
   * Get product limit for vendor based on subscription
   */
  getProductLimit(plan: SubscriptionPlan): number {
    switch (plan) {
      case 'free':
        return 0; // No products allowed
      case 'monthly':
        return 10;
      case 'quarterly':
        return 50;
      case 'semi_annual':
      case 'annual':
        return -1; // Unlimited
      default:
        return 0;
    }
  }
}

export const subscriptionService = new SubscriptionService();
export type { SubscriptionTier };