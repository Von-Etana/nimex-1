import { supabase } from '../lib/supabase';
import type { SubscriptionPlan, SubscriptionStatus } from '../types/database';

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
    price: 1200,
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
    price: 3500,
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
    price: 6500,
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
    price: 10500,
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
    return ['free', 'monthly', 'quarterly', 'semi_annual', 'annual'].includes(plan);
  }

  /**
   * Get subscription status for a vendor
   */
  async getVendorSubscription(vendorId: string) {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('subscription_plan, subscription_status, subscription_start_date, subscription_end_date')
        .eq('id', vendorId)
        .single();

      if (error) throw error;

      return {
        plan: data.subscription_plan,
        status: data.subscription_status,
        startDate: data.subscription_start_date ? new Date(data.subscription_start_date) : null,
        endDate: data.subscription_end_date ? new Date(data.subscription_end_date) : null,
        isActive: this.isSubscriptionActive(data.subscription_status, data.subscription_end_date ? new Date(data.subscription_end_date) : null)
      };
    } catch (error) {
      console.error('Error fetching vendor subscription:', error);
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

      const { data, error } = await supabase
        .from('vendors')
        .update({
          subscription_plan: plan,
          subscription_status: 'active',
          subscription_start_date: startDate.toISOString(),
          subscription_end_date: endDate.toISOString()
        })
        .eq('id', vendorId)
        .select()
        .single();

      if (error) throw error;

      return {
        plan: data.subscription_plan,
        status: data.subscription_status,
        startDate,
        endDate,
        isActive: true
      };
    } catch (error) {
      console.error('Error updating vendor subscription:', error);
      throw error;
    }
  }

  /**
   * Cancel vendor subscription
   */
  async cancelVendorSubscription(vendorId: string) {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .update({
          subscription_status: 'cancelled'
        })
        .eq('id', vendorId)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error cancelling vendor subscription:', error);
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