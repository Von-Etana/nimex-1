/**
 * Firestore Collection Names and References
 * Centralized location for all Firestore collection names
 */

export const COLLECTIONS = {
    // User & Authentication
    PROFILES: 'profiles',
    ADMIN_ROLES: 'admin_roles',
    ADMIN_PERMISSIONS: 'admin_permissions',
    ADMIN_ROLE_ASSIGNMENTS: 'admin_role_assignments',

    // Vendors
    VENDORS: 'vendors',
    KYC_SUBMISSIONS: 'kyc_submissions',
    MARKETS: 'markets',
    VENDOR_PAYOUT_ACCOUNTS: 'vendor_payout_accounts',



    // Products & Categories
    PRODUCTS: 'products',
    CATEGORIES: 'categories',
    PRODUCT_TAGS: 'product_tags',
    REVIEWS: 'reviews',
    WISHLISTS: 'wishlists',

    // Orders & Transactions
    ORDERS: 'orders',
    ORDER_ITEMS: 'order_items',
    ADDRESSES: 'addresses',

    // Payments & Escrow
    ESCROW_TRANSACTIONS: 'escrow_transactions',
    WALLET_TRANSACTIONS: 'wallet_transactions',
    PAYOUTS: 'payouts',

    // Delivery
    DELIVERIES: 'deliveries',
    DELIVERY_STATUS_HISTORY: 'delivery_status_history',
    DELIVERY_ZONES: 'delivery_zones',

    // Chat
    CHAT_CONVERSATIONS: 'chat_conversations',
    CHAT_MESSAGES: 'chat_messages',

    // Referrals & Commissions
    MARKETERS: 'marketers',
    VENDOR_REFERRALS: 'vendor_referrals',
    MARKETER_REFERRALS: 'marketer_referrals',
    COMMISSION_SETTINGS: 'commission_settings',
    COMMISSION_PAYMENTS: 'commission_payments',

    // Cart
    CARTS: 'carts',
    CART_ITEMS: 'cart_items',

    // Support & Disputes
    SUPPORT_TICKETS: 'support_tickets',
    DISPUTES: 'disputes',

    // Notifications
    NOTIFICATIONS: 'notifications',

    // Ads & Marketing
    ADS: 'ads',
    AD_CAMPAIGNS: 'ad_campaigns',

    // Analytics
    USER_SEARCH_HISTORY: 'user_search_history',
    PRODUCT_VIEWS: 'product_views',
    USER_INTERESTS: 'user_interests',

    // System
    SYSTEM_LOGS: 'system_logs',
    AUDIT_LOGS: 'audit_logs',
} as const;

/**
 * Subcollection names
 */
export const SUBCOLLECTIONS = {
    // Under products
    PRODUCT_REVIEWS: 'reviews',

    // Under orders
    ORDER_ITEMS: 'items',

    // Under chat_conversations
    MESSAGES: 'messages',

    // Under admin_roles
    PERMISSIONS: 'permissions',

    // Under vendors
    VENDOR_PRODUCTS: 'products',
    VENDOR_ORDERS: 'orders',

    // Under marketers
    MARKETER_REFERRALS: 'referrals',
} as const;

/**
 * Storage bucket paths
 */
export const STORAGE_PATHS = {
    // User uploads
    AVATARS: 'avatars',

    // Product uploads
    PRODUCT_IMAGES: 'products',

    // KYC documents
    KYC_DOCUMENTS: 'kyc/documents',
    KYC_SELFIES: 'kyc/selfies',
    KYC_CAC: 'kyc/cac',

    // Delivery proofs
    DELIVERY_PROOFS: 'deliveries/proofs',

    // Chat images
    CHAT_IMAGES: 'chat/images',

    // Support attachments
    SUPPORT_ATTACHMENTS: 'support/attachments',

    // Ads
    AD_IMAGES: 'ads/images',
} as const;

/**
 * Firestore indexes required for queries
 * These need to be created in Firebase Console or via firebase.indexes.json
 */
export const REQUIRED_INDEXES = [
    // Products
    { collection: 'products', fields: ['vendor_id', 'status', 'created_at'] },
    { collection: 'products', fields: ['category_id', 'status', 'created_at'] },
    { collection: 'products', fields: ['status', 'is_featured', 'created_at'] },

    // Orders
    { collection: 'orders', fields: ['buyer_id', 'status', 'created_at'] },
    { collection: 'orders', fields: ['vendor_id', 'status', 'created_at'] },
    { collection: 'orders', fields: ['status', 'created_at'] },

    // Reviews
    { collection: 'reviews', fields: ['product_id', 'created_at'] },
    { collection: 'reviews', fields: ['vendor_id', 'created_at'] },

    // Chat messages
    { collection: 'chat_messages', fields: ['conversation_id', 'created_at'] },

    // Deliveries
    { collection: 'deliveries', fields: ['order_id', 'status', 'created_at'] },

    // Wallet transactions
    { collection: 'wallet_transactions', fields: ['vendor_id', 'created_at'] },

    // KYC submissions
    { collection: 'kyc_submissions', fields: ['user_id', 'status', 'submitted_at'] },
    { collection: 'kyc_submissions', fields: ['status', 'submitted_at'] },
] as const;

export type CollectionName = typeof COLLECTIONS[keyof typeof COLLECTIONS];
export type SubcollectionName = typeof SUBCOLLECTIONS[keyof typeof SUBCOLLECTIONS];
export type StoragePath = typeof STORAGE_PATHS[keyof typeof STORAGE_PATHS];
