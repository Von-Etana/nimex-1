export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'buyer' | 'vendor' | 'admin';
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
          proof_of_address_url: string | null;
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
          is_active: boolean;
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
          proof_of_address_url?: string | null;
          bank_account_details?: Json | null;
          verification_badge?: VerificationBadge;
          verification_status?: VerificationStatus;
          verification_date?: string | null;
          rating?: number;
          total_sales?: number;
          response_time?: number;
          wallet_balance?: number;
          is_active?: boolean;
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
          proof_of_address_url?: string | null;
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
          is_active?: boolean;
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
