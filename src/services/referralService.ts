import { FirestoreService } from './firestore.service';
import { COLLECTIONS } from '../lib/collections';
import { logger } from '../lib/logger';
import { Timestamp } from 'firebase/firestore';
import type { Vendor, Profile } from '../types/firestore';
import { emailNotificationService } from './emailNotificationService';

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
    try {
      const vendor = await FirestoreService.getDocument<Vendor>(COLLECTIONS.VENDORS, vendorId);
      return vendor?.referral_code || null;
    } catch (error) {
      logger.error('Error fetching vendor referral code:', error);
      return null;
    }
  }

  async getVendorReferralStats(vendorId: string): Promise<ReferralStats> {
    try {
      const referrals = await FirestoreService.getDocuments<any>(COLLECTIONS.VENDOR_REFERRALS, {
        filters: [{ field: 'referrer_vendor_id', operator: '==', value: vendorId }]
      });

      return referrals.reduce(
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
    } catch (error) {
      logger.error('Error fetching referral stats:', error);
      return {
        totalReferrals: 0,
        completedReferrals: 0,
        pendingReferrals: 0,
        totalCommissionEarned: 0,
        pendingCommission: 0,
      };
    }
  }

  async getVendorReferrals(vendorId: string): Promise<VendorReferral[]> {
    try {
      const referrals = await FirestoreService.getDocuments<any>(COLLECTIONS.VENDOR_REFERRALS, {
        filters: [{ field: 'referrer_vendor_id', operator: '==', value: vendorId }],
        orderByField: 'created_at',
        orderByDirection: 'desc'
      });

      const referralsWithDetails = await Promise.all(
        referrals.map(async (ref) => {
          let vendorName = 'Unknown Vendor';
          let vendorEmail = '';

          if (ref.referred_vendor_id) {
            const vendor = await FirestoreService.getDocument<Vendor>(COLLECTIONS.VENDORS, ref.referred_vendor_id);
            if (vendor) {
              vendorName = vendor.business_name;
              if (vendor.user_id) {
                const profile = await FirestoreService.getDocument<Profile>(COLLECTIONS.PROFILES, vendor.user_id);
                vendorEmail = profile?.email || '';
              }
            }
          }

          return {
            id: ref.id,
            referredVendorId: ref.referred_vendor_id,
            referredVendorName: vendorName,
            referredVendorEmail: vendorEmail,
            status: ref.status,
            commissionAmount: Number(ref.commission_amount || 0),
            commissionPaid: ref.commission_paid,
            createdAt: ref.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
          };
        })
      );

      return referralsWithDetails;
    } catch (error) {
      logger.error('Error fetching vendor referrals:', error);
      return [];
    }
  }

  async validateReferralCode(code: string): Promise<{
    valid: boolean;
    type: 'vendor' | 'marketer' | null;
    referrerId: string | null;
  }> {
    try {
      if (code.startsWith('VND-')) {
        const vendors = await FirestoreService.getDocuments<Vendor>(COLLECTIONS.VENDORS, {
          filters: [{ field: 'referral_code', operator: '==', value: code }],
          limitCount: 1
        });

        if (vendors.length > 0) {
          return { valid: true, type: 'vendor', referrerId: vendors[0].id };
        }
      } else if (code.startsWith('MKT-')) {
        const marketers = await FirestoreService.getDocuments<any>(COLLECTIONS.MARKETERS, {
          filters: [
            { field: 'referral_code', operator: '==', value: code },
            { field: 'status', operator: '==', value: 'active' }
          ],
          limitCount: 1
        });

        if (marketers.length > 0) {
          return { valid: true, type: 'marketer', referrerId: marketers[0].id };
        }
      }

      return { valid: false, type: null, referrerId: null };
    } catch (error) {
      logger.error('Error validating referral code:', error);
      return { valid: false, type: null, referrerId: null };
    }
  }

  async createVendorReferral(
    referrerVendorId: string,
    referredVendorId: string,
    referralCode: string,
    commissionAmount: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const id = `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await FirestoreService.setDocument(COLLECTIONS.VENDOR_REFERRALS, id, {
        referrer_vendor_id: referrerVendorId,
        referred_vendor_id: referredVendorId,
        referral_code: referralCode,
        commission_amount: commissionAmount,
        status: 'completed',
        created_at: Timestamp.now()
      });

      return { success: true };
    } catch (error) {
      logger.error('Error creating vendor referral:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async createMarketerReferral(
    marketerId: string,
    vendorId: string,
    referralCode: string,
    commissionAmount: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const id = `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await FirestoreService.setDocument(COLLECTIONS.MARKETER_REFERRALS, id, {
        marketer_id: marketerId,
        vendor_id: vendorId,
        referral_code: referralCode,
        commission_amount: commissionAmount,
        status: 'completed',
        created_at: Timestamp.now()
      });

      // Send email notification to marketer
      try {
        const marketer = await FirestoreService.getDocument<any>(COLLECTIONS.MARKETERS, marketerId);
        const vendor = await FirestoreService.getDocument<Vendor>(COLLECTIONS.VENDORS, vendorId);

        if (marketer?.email && vendor?.business_name) {
          emailNotificationService.sendReferralNotification(
            marketer.email,
            marketer.full_name || 'Marketer',
            vendor.business_name,
            commissionAmount
          ).catch(err => logger.error('Failed to send referral email:', err));
        }
      } catch (emailError) {
        logger.error('Error sending referral notification email:', emailError);
      }

      return { success: true };
    } catch (error) {
      logger.error('Error creating marketer referral:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getCommissionSettings(): Promise<{
    vendorReferralAmount: number;
    marketerReferralAmount: number;
  }> {
    try {
      const settings = await FirestoreService.getDocuments<any>(COLLECTIONS.COMMISSION_SETTINGS, {
        filters: [{ field: 'is_active', operator: '==', value: true }]
      });

      const result = {
        vendorReferralAmount: 5000,
        marketerReferralAmount: 10000,
      };

      settings.forEach((setting) => {
        if (setting.type === 'vendor_referral') {
          result.vendorReferralAmount = Number(setting.commission_amount);
        } else if (setting.type === 'marketer_referral') {
          result.marketerReferralAmount = Number(setting.commission_amount);
        }
      });

      return result;
    } catch (error) {
      logger.error('Error fetching commission settings:', error);
      return { vendorReferralAmount: 5000, marketerReferralAmount: 10000 };
    }
  }

  async registerMarketer(data: {
    fullName: string;
    email: string;
    phone: string;
    businessName?: string;
    bankAccountDetails?: any;
    userId: string;
  }): Promise<{ success: boolean; error?: string; marketerId?: string }> {
    try {
      // Check if marketer with this email already exists
      // We can also check if a document with userId exists now
      const existingDoc = await FirestoreService.documentExists(COLLECTIONS.MARKETERS, data.userId);

      if (existingDoc) {
        return {
          success: false,
          error: 'A marketer account already exists for this user.'
        };
      }

      // Double check email uniqueness if needed, though 1:1 user mapping usually suffices.
      // Keeping email check for safety if multiple users try to use same email (unlikely with Auth)
      const existingEmail = await FirestoreService.getDocuments<any>(COLLECTIONS.MARKETERS, {
        filters: [{ field: 'email', operator: '==', value: data.email }],
        limitCount: 1
      });

      if (existingEmail.length > 0) {
        return {
          success: false,
          error: 'A marketer account with this email already exists.'
        };
      }

      // Use userId as the document ID
      const id = data.userId;

      await FirestoreService.setDocument(COLLECTIONS.MARKETERS, id, {
        user_id: data.userId, // Keep this field for queries if needed
        full_name: data.fullName,
        email: data.email,
        phone: data.phone,
        business_name: data.businessName || null,
        bank_account_details: data.bankAccountDetails || null,
        status: 'pending',
        referral_code: `MKT-${Date.now().toString(36).toUpperCase()}`, // Generate a referral code
        created_at: Timestamp.now(),
        updated_at: Timestamp.now()
      });

      return { success: true, marketerId: id };
    } catch (err: any) {
      logger.error('Unexpected error in registerMarketer:', err);
      return {
        success: false,
        error: 'An unexpected error occurred. Please try again later.'
      };
    }
  }

  async getMarketerByEmail(email: string): Promise<MarketerInfo | null> {
    try {
      const marketers = await FirestoreService.getDocuments<any>(COLLECTIONS.MARKETERS, {
        filters: [{ field: 'email', operator: '==', value: email }],
        limitCount: 1
      });

      if (marketers.length === 0) {
        return null;
      }

      const data = marketers[0];

      return {
        id: data.id,
        fullName: data.full_name,
        email: data.email,
        phone: data.phone,
        businessName: data.business_name || '',
        referralCode: data.referral_code,
        status: data.status,
        totalReferrals: data.total_referrals || 0,
        totalCommissionEarned: Number(data.total_commission_earned || 0),
      };
    } catch (error) {
      logger.error('Error fetching marketer by email:', error);
      return null;
    }
  }

  async getMarketerReferrals(marketerId: string): Promise<any[]> {
    try {
      const referrals = await FirestoreService.getDocuments<any>(COLLECTIONS.MARKETER_REFERRALS, {
        filters: [{ field: 'marketer_id', operator: '==', value: marketerId }],
        orderByField: 'created_at',
        orderByDirection: 'desc'
      });

      // Fetch vendor details for each referral
      // This is N+1, but fine for now
      const referralsWithDetails = await Promise.all(
        referrals.map(async (ref) => {
          let vendorName = 'Unknown Vendor';

          if (ref.vendor_id) {
            const vendor = await FirestoreService.getDocument<Vendor>(COLLECTIONS.VENDORS, ref.vendor_id);
            if (vendor) {
              vendorName = vendor.business_name;
            }
          }

          return {
            ...ref,
            vendors: {
              business_name: vendorName
            }
          };
        })
      );

      return referralsWithDetails;
    } catch (error) {
      logger.error('Error fetching marketer referrals:', error);
      return [];
    }
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
