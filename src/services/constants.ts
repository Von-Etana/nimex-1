/**
 * Application constants and configuration values
 * Centralized location for all magic numbers, strings, and configuration
 */

// File upload constants
export const FILE_UPLOAD = {
  MAX_SIZE_MB: 10,
  MAX_SIZE_BYTES: 10 * 1024 * 1024,
  ALLOWED_TYPES: ['.pdf', '.jpg', '.jpeg', '.png'],
  MIME_TYPES: ['application/pdf', 'image/jpeg', 'image/png']
} as const;

// Form validation constants
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 6,
  BUSINESS_NAME_MAX_LENGTH: 100,
  BUSINESS_DESCRIPTION_MAX_LENGTH: 500,
  PHONE_REGEX: /^\+[1-9]\d{1,14}$/,
  ACCOUNT_NUMBER_LENGTH: 10
} as const;

// UI constants
export const UI = {
  DEBOUNCE_DELAY: 300,
  ANIMATION_DURATION: 200,
  TOAST_DURATION: 5000,
  SKELETON_COUNT: 3,
  PAGINATION_SIZE: 20
} as const;

// API constants
export const API = {
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000
} as const;

// Subscription constants
export const SUBSCRIPTION = {
  FREE_TRIAL_DAYS: 30,
  MAX_PRODUCTS_FREE: 0,
  MAX_PRODUCTS_MONTHLY: 10,
  MAX_PRODUCTS_QUARTERLY: 50,
  MAX_PRODUCTS_SEMI_ANNUAL: 100,
  MAX_PRODUCTS_ANNUAL: -1 // Unlimited
} as const;

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network connection failed. Please check your internet connection.',
  SERVER_ERROR: 'Server error occurred. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  RATE_LIMIT: 'Too many requests. Please wait and try again.',
  FILE_TOO_LARGE: `File size exceeds ${FILE_UPLOAD.MAX_SIZE_MB}MB limit.`,
  INVALID_FILE_TYPE: `File type not supported. Allowed types: ${FILE_UPLOAD.ALLOWED_TYPES.join(', ')}`
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  PROFILE_UPDATED: 'Profile updated successfully.',
  PASSWORD_CHANGED: 'Password changed successfully.',
  FILE_UPLOADED: 'File uploaded successfully.',
  PAYMENT_SUCCESSFUL: 'Payment processed successfully.',
  SUBSCRIPTION_ACTIVATED: 'Subscription activated successfully.'
} as const;

// Route constants
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  PROFILE: '/profile',
  ORDERS: '/orders',
  CART: '/cart',
  CHECKOUT: '/checkout',
  VENDOR_DASHBOARD: '/vendor/dashboard',
  VENDOR_ONBOARDING: '/vendor/onboarding',
  ADMIN_DASHBOARD: '/admin'
} as const;

// Local storage keys
export const STORAGE_KEYS = {
  CART: 'nimex_cart',
  USER_PREFERENCES: 'nimex_preferences',
  SEARCH_HISTORY: 'nimex_search_history',
  THEME: 'nimex_theme'
} as const;

// Feature flags
export const FEATURES = {
  ENABLE_NOTIFICATIONS: true,
  ENABLE_CHAT: true,
  ENABLE_ANALYTICS: false,
  ENABLE_PWA: false,
  ENABLE_OFFLINE_MODE: false
} as const;

// Color constants
export const COLORS = {
  PRIMARY: '#006400',
  SECONDARY: '#8B4513',
  SUCCESS: '#22C55E',
  ERROR: '#EF4444',
  WARNING: '#F59E0B',
  INFO: '#3B82F6'
} as const;

// Breakpoint constants (Tailwind CSS)
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536
} as const;

// Time constants
export const TIME = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000
} as const;