/**
 * Firestore Data Models
 * Mirrors the Supabase database types but adapted for Firestore
 */

import { Timestamp } from 'firebase/firestore';

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

// Base interface for all Firestore documents
export interface FirestoreDocument {
    id: string;
    created_at?: Timestamp | string;
    updated_at?: Timestamp | string;
}

export interface Profile extends FirestoreDocument {
    email: string;
    full_name: string | null;
    phone: string | null;
    role: UserRole;
    avatar_url: string | null;
    location: string | null;
}

export interface Vendor extends FirestoreDocument {
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
    bank_account_details: any | null;
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
    notification_preferences: any | null;
    is_active: boolean;
    referral_code: string | null;
    total_referrals: number;
    referred_by_vendor_id: string | null;
    referred_by_marketer_id: string | null;
}

export interface Product extends FirestoreDocument {
    vendor_id: string;
    category_id: string;
    title: string;
    description: string;
    price: number;
    compare_at_price: number | null;
    currency: string;
    stock_quantity: number;
    sku: string | null;
    images: string[];
    attributes: any | null;
    specifications: any | null;
    tags: string[] | null;
    status: 'active' | 'draft' | 'archived';
    is_featured: boolean;
    average_rating: number;
    total_reviews: number;
    view_count: number;
    sales_count: number;
    min_order_quantity: number;
    max_order_quantity: number | null;
    shipping_info: any | null;
}

export interface Cart extends FirestoreDocument {
    user_id: string;
}

export interface CartItem extends FirestoreDocument {
    cart_id: string;
    product_id: string;
    quantity: number;
    // Denormalized product data for easier display
    product_snapshot?: {
        title: string;
        price: number;
        image: string | null;
        vendor_id: string;
    };
}

// Extended CartItem with full product data (joined at runtime)
export interface CartItemWithProduct extends CartItem {
    product?: Product;
}

// Extended Cart with items
export interface CartWithItems extends Cart {
    items: CartItemWithProduct[];
}

export interface Order extends FirestoreDocument {
    order_number: string;
    buyer_id: string;
    vendor_id: string;
    status: OrderStatus;
    payment_status: PaymentStatus;
    payment_method: string;
    payment_reference: string | null;
    subtotal: number;
    tax_amount: number;
    shipping_amount: number;
    discount_amount: number;
    total_amount: number;
    currency: string;
    shipping_address: any;
    billing_address: any;
    notes: string | null;
    estimated_delivery_date: string | null;
    actual_delivery_date: string | null;
    escrow_status: EscrowStatus;
    escrow_release_date: string | null;
    tracking_number: string | null;
    carrier: string | null;
}

export interface OrderItem extends FirestoreDocument {
    order_id: string;
    product_id: string;
    variant_id: string | null;
    quantity: number;
    unit_price: number;
    total_price: number;
    product_snapshot: any; // Snapshot of product data at time of order
}

export interface Category extends FirestoreDocument {
    name: string;
    slug: string;
    description: string | null;
    parent_id: string | null;
    image_url: string | null;
    icon_name: string | null;
    level: number;
    display_order: number;
    is_active: boolean;
}

export interface AdminRole extends FirestoreDocument {
    name: string;
    display_name: string;
    description: string | null;
    is_system: boolean;
}

export interface AdminPermission extends FirestoreDocument {
    code: string;
    name: string;
    description: string | null;
    module: string;
}

export interface AdminRoleAssignment extends FirestoreDocument {
    user_id: string;
    role_id: string;
    assigned_by: string | null;
}

export interface KYCSubmission extends FirestoreDocument {
    user_id: string;
    document_type: string;
    document_number: string | null;
    document_url: string;
    selfie_url: string | null;
    status: KYCStatus;
    rejection_reason: string | null;
    reviewed_by: string | null;
    reviewed_at: string | null;
    submitted_at: string;
}
