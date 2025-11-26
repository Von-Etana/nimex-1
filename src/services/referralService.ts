import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';

export interface ReferralStats {
  totalReferrals: number;
  completedReferrals: number;
  pendingReferrals: number;
  totalCommissionEarned: number;
  pendingCommission: number;
}

export interface VendorReferral {
  id: string;
  referredVendorId: string;
  referredVendorName: string;
  referredVendorEmail: string;
  status: 'pending' | 'completed' | 'rejected';
  commissionAmount: number;
  commissionPaid: boolean;
  createdAt: string;
}

export interface MarketerInfo {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  businessName: string;
  referralCode: string;
  status: string;
  totalReferrals: number;
  totalCommissionEarned: number;
}

class ReferralService {
  async getVendorReferralCode(vendorId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('vendors')
      .select('referral_code')
      .eq('id', vendorId)
      .maybeSingle();

    if (error) {
      logger.error('Error fetching vendor referral code:', error);
      return null;
    }

    return data?.referral_code || null;
  }

  async getVendorReferralStats(vendorId: string): Promise<ReferralStats> {
    const { data: referrals, error } = await supabase
      .from('vendor_referrals')
      .select('status, commission_amount, commission_paid')
      .eq('referrer_vendor_id', vendorId);

    if (error) {
      logger.error('Error fetching referral stats:', error);
      return {
        totalReferrals: 0,
        completedReferrals: 0,
        pendingReferrals: 0,
        totalCommissionEarned: 0,
        pendingCommission: 0,
      };
    }

    const stats = referrals.reduce(
      (acc, ref) => {
        acc.totalReferrals++;
        if (ref.status === 'completed') {
          acc.completedReferrals++;
          if (ref.commission_paid) {
            acc.totalCommissionEarned += Number(ref.commission_amount || 0);
          } else {
            acc.pendingCommission += Number(ref.commission_amount || 0);
          }
        } else if (ref.status === 'pending') {
          acc.pendingReferrals++;
        }
        return acc;
      },
      {
        totalReferrals: 0,
        completedReferrals: 0,
        pendingReferrals: 0,
        totalCommissionEarned: 0,
        pendingCommission: 0,
      }
    );

    return stats;
  }

  async getVendorReferrals(vendorId: string): Promise<VendorReferral[]> {
    const { data, error } = await supabase
      .from('vendor_referrals')
      .select(`
        id,
        referred_vendor_id,
        status,
        commission_amount,
        commission_paid,
        created_at,
        vendors!vendor_referrals_referred_vendor_id_fkey (
          business_name,
          user_id
        )
      `)
      .eq('referrer_vendor_id', vendorId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching vendor referrals:', error);
      return [];
    }

    const referralsWithDetails = await Promise.all(
      (data || []).map(async (ref) => {
        const vendor = ref.vendors;
        let email = '';

        if (vendor?.user_id) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email')
            .eq('id', vendor.user_id)
            .maybeSingle();
          email = profile?.email || '';
        }

        return {
          id: ref.id,
          referredVendorId: ref.referred_vendor_id,
          referredVendorName: vendor?.business_name || 'Unknown Vendor',
          referredVendorEmail: email,
          status: ref.status,
          commissionAmount: Number(ref.commission_amount || 0),
          commissionPaid: ref.commission_paid,
          createdAt: ref.created_at,
        };
      })
    );

    return referralsWithDetails;
  }

  async validateReferralCode(code: string): Promise<{
    valid: boolean;
    type: 'vendor' | 'marketer' | null;
    referrerId: string | null;
  }> {
    if (code.startsWith('VND-')) {
      const { data, error } = await supabase
        .from('vendors')
        .select('id')
        .eq('referral_code', code)
        .maybeSingle();

      if (!error && data) {
        return { valid: true, type: 'vendor', referrerId: data.id };
      }
    } else if (code.startsWith('MKT-')) {
      const { data, error } = await supabase
        .from('marketers')
        .select('id')
        .eq('referral_code', code)
        .eq('status', 'active')
        .maybeSingle();

      if (!error && data) {
        return { valid: true, type: 'marketer', referrerId: data.id };
      }
    }

    return { valid: false, type: null, referrerId: null };
  }

  async createVendorReferral(
    referrerVendorId: string,
    referredVendorId: string,
    referralCode: string,
    commissionAmount: number
  ): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase.from('vendor_referrals').insert({
      referrer_vendor_id: referrerVendorId,
      referred_vendor_id: referredVendorId,
      referral_code: referralCode,
      commission_amount: commissionAmount,
      status: 'completed',
    });

    if (error) {
      logger.error('Error creating vendor referral:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  }

  async createMarketerReferral(
    marketerId: string,
    vendorId: string,
    referralCode: string,
    commissionAmount: number
  ): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase.from('marketer_referrals').insert({
      marketer_id: marketerId,
      vendor_id: vendorId,
      referral_code: referralCode,
      commission_amount: commissionAmount,
      status: 'completed',
    });

    if (error) {
      logger.error('Error creating marketer referral:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  }

  async getCommissionSettings(): Promise<{
    vendorReferralAmount: number;
    marketerReferralAmount: number;
  }> {
    const { data, error } = await supabase
      .from('commission_settings')
      .select('type, commission_amount')
      .eq('is_active', true);

    if (error) {
      logger.error('Error fetching commission settings:', error);
      return { vendorReferralAmount: 5000, marketerReferralAmount: 10000 };
    }

    const settings = {
      vendorReferralAmount: 5000,
      marketerReferralAmount: 10000,
    };

    data?.forEach((setting) => {
      if (setting.type === 'vendor_referral') {
        settings.vendorReferralAmount = Number(setting.commission_amount);
      } else if (setting.type === 'marketer_referral') {
        settings.marketerReferralAmount = Number(setting.commission_amount);
      }
    });

    return settings;
  }

  async registerMarketer(data: {
    fullName: string;
    email: string;
    phone: string;
    businessName?: string;
    bankAccountDetails?: any;
  }): Promise<{ success: boolean; error?: string; marketerId?: string }> {
    try {
      // Check if marketer with this email already exists
      const { data: existing } = await supabase
        .from('marketers')
        .select('id')
        .eq('email', data.email)
        .maybeSingle();

      if (existing) {
        return {
          success: false,
          error: 'A marketer account with this email already exists.'
        };
      }

      const { data: marketer, error } = await supabase
        .from('marketers')
        .insert({
          full_name: data.fullName,
          email: data.email,
          phone: data.phone,
          business_name: data.businessName || null,
          bank_account_details: data.bankAccountDetails || null,
          status: 'pending',
        })
        .select('id')
        .single();

      if (error) {
        logger.error('Error registering marketer:', error);
        return { success: false, error: error.message };
      }

      return { success: true, marketerId: marketer.id };
    } catch (err: any) {
      logger.error('Unexpected error in registerMarketer:', err);
      return {
        success: false,
        error: 'An unexpected error occurred. Please try again later.'
      };
    }
  }

  async getMarketerByEmail(email: string): Promise<MarketerInfo | null> {
    const { data, error } = await supabase
      .from('marketers')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      fullName: data.full_name,
      email: data.email,
      phone: data.phone,
      businessName: data.business_name || '',
      referralCode: data.referral_code,
      status: data.status,
      totalReferrals: data.total_referrals,
      totalCommissionEarned: Number(data.total_commission_earned || 0),
    };
  }

  async getMarketerReferrals(marketerId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('marketer_referrals')
      .select(`
        id,
        vendor_id,
        status,
        commission_amount,
        commission_paid,
        created_at,
        vendors (
          business_name,
          user_id
        )
      `)
      .eq('marketer_id', marketerId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching marketer referrals:', error);
      return [];
    }

    return data || [];
  }

  generateReferralLink(referralCode: string): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}/signup?ref=${referralCode}`;
  }

  async copyReferralLink(referralCode: string): Promise<boolean> {
    const link = this.generateReferralLink(referralCode);
    try {
      await navigator.clipboard.writeText(link);
      return true;
    } catch (error) {
      logger.error('Error copying to clipboard:', error);
      return false;
    }
  }
}

export const referralService = new ReferralService();
