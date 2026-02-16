export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'buyer' | 'vendor' | 'admin' | 'marketer';
export type VerificationStatus = 'pending' | 'verified' | 'rejected';
export type KYCStatus = 'pending' | 'approved' | 'rejected' | 'resubmit';
export type VerificationBadge = 'none' | 'basic' | 'verified' | 'premium';
export type SubscriptionPlan = 'free' | 'monthly' | 'quarterly' | 'semi_annual' | 'annual';
export type SubscriptionStatus = 'active' | 'inactive' | 'expired' | 'cancelled';
export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'disputed';
export type PaymentStatus = 'pending' | 'paid' | 'refunded';
export type EscrowStatus = 'held' | 'released' | 'refunded' | 'disputed';
export type TransactionType = 'sale' | 'refund' | 'payout' | 'fee';
export type PayoutStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          phone: string | null;
          role: UserRole;
          avatar_url: string | null;
          location: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          phone?: string | null;
          role?: UserRole;
          avatar_url?: string | null;
          location?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          phone?: string | null;
          role?: UserRole;
          avatar_url?: string | null;
          location?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      vendors: {
        Row: {
          id: string;
          user_id: string;
          business_name: string;
          business_description: string | null;
          business_address: string | null;
          business_phone: string | null;
          market_location: string | null;
          sub_category_tags: string[] | null;
          cac_number: string | null;
          cac_certificate_url: string | null;
          proof_of_address_url: string | null;
          avatar_url: string | null;
          bank_account_details: Json | null;
          verification_badge: VerificationBadge;
          verification_status: VerificationStatus;
          verification_date: string | null;
          subscription_plan: SubscriptionPlan;
          subscription_status: SubscriptionStatus;
          subscription_start_date: string | null;
          subscription_end_date: string | null;
          rating: number;
          total_sales: number;
          response_time: number;
          wallet_balance: number;
          notification_preferences: Json | null;
          is_active: boolean;
          referral_code: string | null;
          total_referrals: number;
          referred_by_vendor_id: string | null;
          referred_by_marketer_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          business_name: string;
          business_description?: string | null;
          business_address?: string | null;
          business_phone?: string | null;
          market_location?: string | null;
          sub_category_tags?: string[] | null;
          cac_number?: string | null;
          cac_certificate_url?: string | null;
          proof_of_address_url?: string | null;
          avatar_url?: string | null;
          bank_account_details?: Json | null;
          verification_badge?: VerificationBadge;
          verification_status?: VerificationStatus;
          verification_date?: string | null;
          rating?: number;
          total_sales?: number;
          response_time?: number;
          wallet_balance?: number;
          notification_preferences?: Json | null;
          is_active?: boolean;
          referral_code?: string | null;
          total_referrals?: number;
          referred_by_vendor_id?: string | null;
          referred_by_marketer_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          business_name?: string;
          business_description?: string | null;
          business_address?: string | null;
          business_phone?: string | null;
          market_location?: string | null;
          sub_category_tags?: string[] | null;
          cac_number?: string | null;
          cac_certificate_url?: string | null;
          proof_of_address_url?: string | null;
          avatar_url?: string | null;
          bank_account_details?: Json | null;
          verification_badge?: VerificationBadge;
          verification_status?: VerificationStatus;
          verification_date?: string | null;
          subscription_plan?: SubscriptionPlan;
          subscription_status?: SubscriptionStatus;
          subscription_start_date?: string | null;
          subscription_end_date?: string | null;
          rating?: number;
          total_sales?: number;
          response_time?: number;
          wallet_balance?: number;
          notification_preferences?: Json | null;
          is_active?: boolean;
          referral_code?: string | null;
          total_referrals?: number;
          referred_by_vendor_id?: string | null;
          referred_by_marketer_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          vendor_id: string;
          category_id: string;
          title: string;
          description: string;
          price: number;
          compare_at_price: number | null;
          images: Json;
          stock_quantity: number;
          location: string | null;
          status: string;
          views_count: number;
          favorites_count: number;
          rating: number;
          is_featured: boolean;
          video_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          vendor_id: string;
          category_id: string;
          title: string;
          description: string;
          price: number;
          compare_at_price?: number | null;
          images?: Json;
          stock_quantity?: number;
          location?: string | null;
          status?: string;
          views_count?: number;
          favorites_count?: number;
          rating?: number;
          is_featured?: boolean;
          video_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          vendor_id?: string;
          category_id?: string;
          title?: string;
          description?: string;
          price?: number;
          compare_at_price?: number | null;
          images?: Json;
          stock_quantity?: number;
          location?: string | null;
          status?: string;
          views_count?: number;
          favorites_count?: number;
          rating?: number;
          is_featured?: boolean;
          video_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          icon: string | null;
          parent_id: string | null;
          display_order: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          icon?: string | null;
          parent_id?: string | null;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          icon?: string | null;
          parent_id?: string | null;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          buyer_id: string;
          vendor_id: string;
          delivery_address_id: string | null;
          status: OrderStatus;
          subtotal: number;
          shipping_fee: number;
          total_amount: number;
          payment_status: PaymentStatus;
          payment_method: string | null;
          payment_reference: string | null;
          tracking_number: string | null;
          delivery_proof_url: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
          delivered_at: string | null;
        };
      };
      kyc_submissions: {
        Row: {
          id: string;
          user_id: string;
          id_type: string;
          id_number: string;
          id_document_url: string;
          selfie_url: string;
          cac_document_url: string | null;
          status: KYCStatus;
          admin_notes: string | null;
          submitted_at: string;
          reviewed_at: string | null;
          reviewed_by: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          id_type: string;
          id_number: string;
          id_document_url: string;
          selfie_url: string;
          cac_document_url?: string | null;
          status?: KYCStatus;
          admin_notes?: string | null;
          submitted_at?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          id_type?: string;
          id_number?: string;
          id_document_url?: string;
          selfie_url?: string;
          cac_document_url?: string | null;
          status?: KYCStatus;
          admin_notes?: string | null;
          submitted_at?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
        };
      };
      admin_roles: {
        Row: {
          id: string;
          name: string;
          display_name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          display_name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          display_name?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      admin_permissions: {
        Row: {
          id: string;
          name: string;
          category: string;
          description: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          category: string;
          description: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          category?: string;
          description?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      role_permissions: {
        Row: {
          role_id: string;
          permission_id: string;
          created_at: string;
        };
        Insert: {
          role_id: string;
          permission_id: string;
          created_at?: string;
        };
        Update: {
          role_id?: string;
          permission_id?: string;
          created_at?: string;
        };
      };
      admin_role_assignments: {
        Row: {
          id: string;
          user_id: string;
          role_id: string;
          assigned_by: string | null;
          assigned_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role_id: string;
          assigned_by?: string | null;
          assigned_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          role_id?: string;
          assigned_by?: string | null;
          assigned_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      wallet_transactions: {
        Row: {
          id: string;
          vendor_id: string;
          type: TransactionType;
          amount: number;
          balance_after: number;
          reference: string | null;
          description: string | null;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          vendor_id: string;
          type: TransactionType;
          amount: number;
          balance_after: number;
          reference?: string | null;
          description?: string | null;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          vendor_id?: string;
          type?: TransactionType;
          amount?: number;
          balance_after?: number;
          reference?: string | null;
          description?: string | null;
          status?: string;
          created_at?: string;
        };
      };
      payouts: {
        Row: {
          id: string;
          vendor_id: string;
          amount: number;
          bank_name: string;
          account_number: string;
          account_name: string;
          status: PayoutStatus;
          reference: string | null;
          requested_at: string;
          processed_at: string | null;
        };
        Insert: {
          id?: string;
          vendor_id: string;
          amount: number;
          bank_name: string;
          account_number: string;
          account_name: string;
          status?: PayoutStatus;
          reference?: string | null;
          requested_at?: string;
          processed_at?: string | null;
        };
        Update: {
          id?: string;
          vendor_id?: string;
          amount?: number;
          bank_name?: string;
          account_number?: string;
          account_name?: string;
          status?: PayoutStatus;
          reference?: string | null;
          requested_at?: string;
          processed_at?: string | null;
        };
      };
      escrow_transactions: {
        Row: {
          id: string;
          order_id: string;
          buyer_id: string;
          vendor_id: string;
          amount: number;
          platform_fee: number;
          vendor_amount: number;
          status: EscrowStatus;
          held_at: string;
          released_at: string | null;
          release_reason: string | null;
          dispute_reason: string | null;
        };
        Insert: {
          id?: string;
          order_id: string;
          buyer_id: string;
          vendor_id: string;
          amount: number;
          platform_fee?: number;
          vendor_amount: number;
          status?: EscrowStatus;
          held_at?: string;
          released_at?: string | null;
          release_reason?: string | null;
          dispute_reason?: string | null;
        };
        Update: {
          id?: string;
          order_id?: string;
          buyer_id?: string;
          vendor_id?: string;
          amount?: number;
          platform_fee?: number;
          vendor_amount?: number;
          status?: EscrowStatus;
          held_at?: string;
          released_at?: string | null;
          release_reason?: string | null;
          dispute_reason?: string | null;
        };
      };
      reviews: {
        Row: {
          id: string;
          product_id: string;
          order_id: string | null;
          buyer_id: string;
          vendor_id: string;
          rating: number;
          review_text: string | null;
          images: Json | null;
          is_verified_purchase: boolean;
          helpful_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          order_id?: string | null;
          buyer_id: string;
          vendor_id: string;
          rating: number;
          review_text?: string | null;
          images?: Json | null;
          is_verified_purchase?: boolean;
          helpful_count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          order_id?: string | null;
          buyer_id?: string;
          vendor_id?: string;
          rating?: number;
          review_text?: string | null;
          images?: Json | null;
          is_verified_purchase?: boolean;
          helpful_count?: number;
          created_at?: string;
        };
      };
      chat_conversations: {
        Row: {
          id: string;
          buyer_id: string;
          vendor_id: string;
          product_id: string | null;
          last_message: string | null;
          last_message_at: string;
          unread_buyer: number;
          unread_vendor: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          buyer_id: string;
          vendor_id: string;
          product_id?: string | null;
          last_message?: string | null;
          last_message_at?: string;
          unread_buyer?: number;
          unread_vendor?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          buyer_id?: string;
          vendor_id?: string;
          product_id?: string | null;
          last_message?: string | null;
          last_message_at?: string;
          unread_buyer?: number;
          unread_vendor?: number;
          created_at?: string;
        };
      };
      chat_messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          message_text: string | null;
          image_url: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_id: string;
          message_text?: string | null;
          image_url?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          sender_id?: string;
          message_text?: string | null;
          image_url?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
      };
      wishlists: {
        Row: {
          id: string;
          user_id: string;
          product_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          product_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          product_id?: string;
          created_at?: string;
        };
      };
      marketers: {
        Row: {
          id: string;
          user_id: string | null;
          full_name: string;
          email: string;
          phone: string;
          business_name: string | null;
          referral_code: string;
          status: 'pending' | 'active' | 'suspended' | 'inactive';
          total_referrals: number;
          total_commission_earned: number;
          bank_account_details: Json | null;
          approved_by: string | null;
          approved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          full_name: string;
          email: string;
          phone: string;
          business_name?: string | null;
          referral_code?: string;
          status?: 'pending' | 'active' | 'suspended' | 'inactive';
          total_referrals?: number;
          total_commission_earned?: number;
          bank_account_details?: Json | null;
          approved_by?: string | null;
          approved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          full_name?: string;
          email?: string;
          phone?: string;
          business_name?: string | null;
          referral_code?: string;
          status?: 'pending' | 'active' | 'suspended' | 'inactive';
          total_referrals?: number;
          total_commission_earned?: number;
          bank_account_details?: Json | null;
          approved_by?: string | null;
          approved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      vendor_referrals: {
        Row: {
          id: string;
          referrer_vendor_id: string;
          referred_vendor_id: string;
          referral_code: string;
          status: 'pending' | 'completed' | 'rejected';
          commission_amount: number;
          commission_paid: boolean;
          commission_paid_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          referrer_vendor_id: string;
          referred_vendor_id: string;
          referral_code: string;
          status?: 'pending' | 'completed' | 'rejected';
          commission_amount?: number;
          commission_paid?: boolean;
          commission_paid_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          referrer_vendor_id?: string;
          referred_vendor_id?: string;
          referral_code?: string;
          status?: 'pending' | 'completed' | 'rejected';
          commission_amount?: number;
          commission_paid?: boolean;
          commission_paid_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      marketer_referrals: {
        Row: {
          id: string;
          marketer_id: string;
          vendor_id: string;
          referral_code: string;
          status: 'pending' | 'completed' | 'rejected';
          commission_amount: number;
          commission_paid: boolean;
          commission_paid_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          marketer_id: string;
          vendor_id: string;
          referral_code: string;
          status?: 'pending' | 'completed' | 'rejected';
          commission_amount?: number;
          commission_paid?: boolean;
          commission_paid_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          marketer_id?: string;
          vendor_id?: string;
          referral_code?: string;
          status?: 'pending' | 'completed' | 'rejected';
          commission_amount?: number;
          commission_paid?: boolean;
          commission_paid_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      commission_settings: {
        Row: {
          id: string;
          type: string;
          commission_amount: number;
          is_active: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          type: string;
          commission_amount: number;
          is_active?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          type?: string;
          commission_amount?: number;
          is_active?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      carts: {
        Row: {
          id: string;
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      cart_items: {
        Row: {
          id: string;
          cart_id: string;
          product_id: string;
          quantity: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          cart_id: string;
          product_id: string;
          quantity?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          cart_id?: string;
          product_id?: string;
          quantity?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      commission_payments: {
        Row: {
          id: string;
          recipient_type: 'vendor' | 'marketer';
          recipient_id: string;
          amount: number;
          payment_method: string | null;
          reference_number: string | null;
          status: 'pending' | 'processing' | 'completed' | 'failed';
          referral_ids: Json | null;
          notes: string | null;
          processed_by: string | null;
          processed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          recipient_type: 'vendor' | 'marketer';
          recipient_id: string;
          amount: number;
          payment_method?: string | null;
          reference_number?: string | null;
          status?: 'pending' | 'processing' | 'completed' | 'failed';
          referral_ids?: Json | null;
          notes?: string | null;
          processed_by?: string | null;
          processed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          recipient_type?: 'vendor' | 'marketer';
          recipient_id?: string;
          amount?: number;
          payment_method?: string | null;
          reference_number?: string | null;
          status?: 'pending' | 'processing' | 'completed' | 'failed';
          referral_ids?: Json | null;
          notes?: string | null;
          processed_by?: string | null;
          processed_at?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      user_role: UserRole;
      verification_status: VerificationStatus;
      kyc_status: KYCStatus;
      verification_badge: VerificationBadge;
      subscription_plan: SubscriptionPlan;
      subscription_status: SubscriptionStatus;
      order_status: OrderStatus;
      payment_status: PaymentStatus;
      escrow_status: EscrowStatus;
      transaction_type: TransactionType;
      payout_status: PayoutStatus;
    };
  };
}
