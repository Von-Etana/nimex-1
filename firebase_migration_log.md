# Firebase Service Migration Log

## Overview
This log documents the migration of core services from Supabase to Firebase (Firestore and Storage).

## Completed Migrations

### Core Services
1.  **CartService** (`src/services/cartService.ts`)
    - Migrated to use `FirestoreService`.
    - Updated data models to use `Timestamp`.
    - Implemented cart operations (add, remove, update, clear).

2.  **OrderService** (`src/services/orderService.ts`)
    - Migrated to use `FirestoreService`.
    - Implemented transactions for order creation and status updates.
    - Updated to use `COLLECTIONS` constants.

3.  **DeliveryService** (`src/services/deliveryService.ts`)
    - Migrated to use `FirestoreService` and `FirebaseStorageService`.
    - Updated delivery tracking and proof of delivery upload.

4.  **RecommendationService** (`src/services/recommendationService.ts`)
    - Migrated to use `FirestoreService`.
    - Implemented trending products and top vendors queries using Firestore.
    - Added user search history tracking.

5.  **ReferralService** (`src/services/referralService.ts`)
    - Migrated to use `FirestoreService`.
    - Updated referral code validation and tracking.

6.  **SubscriptionService** (`src/services/subscriptionService.ts`)
    - Migrated to use `FirestoreService`.
    - Updated vendor subscription management.

7.  **FlutterwaveService** (`src/services/flutterwaveService.ts`)
    - Migrated to use `FirestoreService` for updating vendor wallet info.
    - Updated callback URL to placeholder (needs Cloud Function).

8.  **PaystackService** (`src/services/paystackService.ts`)
    - Removed Supabase dependencies.
    - Updated to use placeholder backend URL for payment initialization (needs Cloud Function).

9.  **HealthCheckService** (`src/services/healthCheckService.ts`)
    - Migrated to check Firestore connectivity instead of Supabase.

10. **APIKeyTester** (`src/services/apiKeyTester.ts`)
    - Migrated to test Firebase configuration instead of Supabase.

### Components & Screens
1.  **VendorOnboardingScreen** (`src/screens/vendor/VendorOnboardingScreen.tsx`)
    - Migrated to use `FirestoreService` for saving vendor profile.
    - Migrated to use `FirebaseStorageService` for document uploads.
    - Updated to use migrated `referralService` and `subscriptionService`.

2.  **ReviewForm** (`src/components/reviews/ReviewForm.tsx`)
    - Migrated to use `FirestoreService` for submitting reviews.
    - Migrated to use `FirebaseStorageService` for image uploads.

3.  **SupportUtils** (`src/lib/supportUtils.ts`)
    - Migrated to use `FirebaseStorageService` for attachment uploads.

## Next Steps
1.  **Screen Migration (Phase 6)**
    - Migrate remaining screens (Vendor Dashboard, Admin Dashboard, User Profile, etc.) to use the new services.
    - Remove direct `supabase` imports from these screens.

2.  **Real-time Features (Phase 7)**
    - Migrate chat service to Firestore.
    - Migrate notifications to Firestore.

3.  **Cleanup (Phase 8)**
    - Remove `supabase` client and dependencies once all screens are migrated.

## Notes
- The application may still have build errors due to remaining `supabase` imports in unmigrated screens.
- Backend functions (Paystack/Flutterwave webhooks) need to be migrated to Firebase Cloud Functions.
