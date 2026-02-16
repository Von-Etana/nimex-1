# Firebase Migration Guide

## Overview
This document outlines the complete migration from Supabase to Firebase for the Nimex e-commerce platform.

## ✅ Completed Tasks

### Phase 1: Firebase Setup
- [x] Install Firebase dependencies (firebase@latest)
- [x] Create Firebase project configuration (`src/lib/firebase.ts`)
- [x] Set up Firebase Authentication service (`src/services/firebaseAuthService.ts`)
- [x] Set up Firestore Database service (`src/services/firestoreService.ts`)
- [x] Set up Firebase Storage service (`src/services/firebaseStorageService.ts`)
- [x] Configure environment variables (`.env.example` created)

### Phase 2: Database Service Migration
- [x] Create Firestore service layer with CRUD operations
- [x] Cart service already migrated to Firebase
- [ ] Update environment variables with actual Firebase credentials
- [ ] Remove Supabase client code
- [ ] Remove Supabase migrations folder
- [ ] Clean up unused imports

## 🔧 Firebase Configuration

### Required Environment Variables

Add these to your `.env` file with actual values from Firebase Console:

```env
VITE_FIREBASE_API_KEY=your_firebase_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=nimex-ecommerce.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=nimex-ecommerce
VITE_FIREBASE_STORAGE_BUCKET=nimex-ecommerce.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
VITE_USE_FIREBASE_EMULATOR=false
```

### How to Get Firebase Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing "nimex-ecommerce"
3. Click on "Project Settings" (gear icon)
4. Scroll down to "Your apps" section
5. Click "Add app" → Select "Web" (</>) icon
6. Register your app with nickname "Nimex Web App"
7. Copy the configuration values to your `.env` file

## 📁 Firebase Services Created

### 1. Authentication Service (`firebaseAuthService.ts`)
- Sign up with email/password
- Sign in
- Sign out
- Password reset
- Profile management
- Auth state listener

### 2. Firestore Service (`firestoreService.ts`)
- Get single document
- Get multiple documents with queries
- Create document
- Update document
- Delete document
- Batch operations
- Pagination support
- Document counting

### 3. Storage Service (`firebaseStorageService.ts`)
- Upload files with progress tracking
- Upload multiple files
- Delete files
- Get download URLs
- List files in directory
- Image upload with validation
- Unique file path generation

## 🗄️ Firestore Database Structure

### Collections

```
profiles/
  {userId}/
    - email: string
    - full_name: string
    - phone?: string
    - role: 'admin' | 'vendor' | 'buyer' | 'marketer'
    - created_at: timestamp
    - updated_at: timestamp
    - avatar_url?: string

vendors/
  {vendorId}/
    - user_id: string
    - business_name: string
    - business_description: string
    - market_location: string
    - rating: number
    - created_at: timestamp
    - updated_at: timestamp

products/
  {productId}/
    - vendor_id: string
    - title: string
    - description: string
    - price: number
    - compare_at_price?: number
    - stock_quantity: number
    - category_id: string
    - images: string[]
    - tags: string[]
    - is_active: boolean
    - views_count: number
    - created_at: timestamp
    - updated_at: timestamp

carts/
  {cartId}/
    - user_id: string
    - created_at: timestamp
    - updated_at: timestamp

cart_items/
  {itemId}/
    - cart_id: string
    - product_id: string
    - quantity: number
    - created_at: timestamp
    - updated_at: timestamp

orders/
  {orderId}/
    - user_id: string
    - vendor_id: string
    - order_number: string
    - total_amount: number
    - status: string
    - items: array
    - created_at: timestamp
    - updated_at: timestamp

marketers/
  {marketerId}/
    - full_name: string
    - email: string
    - phone: string
    - business_name?: string
    - referral_code: string
    - status: 'pending' | 'active' | 'suspended'
    - total_referrals: number
    - total_commission_earned: number
    - created_at: timestamp
    - updated_at: timestamp
```

## 🔐 Firebase Security Rules

### Firestore Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    function isAdmin() {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/profiles/$(request.auth.uid)).data.role == 'admin';
    }
    
    function isVendor() {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/profiles/$(request.auth.uid)).data.role == 'vendor';
    }
    
    // Profiles
    match /profiles/{userId} {
      allow read: if isAuthenticated();
      allow create: if isOwner(userId);
      allow update: if isOwner(userId) || isAdmin();
      allow delete: if isAdmin();
    }
    
    // Vendors
    match /vendors/{vendorId} {
      allow read: if true; // Public read
      allow create: if isAuthenticated();
      allow update: if isOwner(resource.data.user_id) || isAdmin();
      allow delete: if isAdmin();
    }
    
    // Products
    match /products/{productId} {
      allow read: if true; // Public read
      allow create: if isVendor();
      allow update: if isOwner(resource.data.vendor_id) || isAdmin();
      allow delete: if isOwner(resource.data.vendor_id) || isAdmin();
    }
    
    // Carts
    match /carts/{cartId} {
      allow read: if isOwner(resource.data.user_id);
      allow create: if isAuthenticated();
      allow update: if isOwner(resource.data.user_id);
      allow delete: if isOwner(resource.data.user_id);
    }
    
    // Cart Items
    match /cart_items/{itemId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated();
    }
    
    // Orders
    match /orders/{orderId} {
      allow read: if isOwner(resource.data.user_id) || 
                     isOwner(resource.data.vendor_id) || 
                     isAdmin();
      allow create: if isAuthenticated();
      allow update: if isAdmin() || isOwner(resource.data.vendor_id);
      allow delete: if isAdmin();
    }
    
    // Marketers
    match /marketers/{marketerId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if isAdmin();
      allow delete: if isAdmin();
    }
  }
}
```

### Storage Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isImage() {
      return request.resource.contentType.matches('image/.*');
    }
    
    function isUnder10MB() {
      return request.resource.size < 10 * 1024 * 1024;
    }
    
    // Product images
    match /products/{vendorId}/{imageId} {
      allow read: if true; // Public read
      allow write: if isAuthenticated() && isImage() && isUnder10MB();
      allow delete: if isAuthenticated();
    }
    
    // Profile avatars
    match /avatars/{userId}/{imageId} {
      allow read: if true; // Public read
      allow write: if isAuthenticated() && 
                      request.auth.uid == userId && 
                      isImage() && 
                      isUnder10MB();
      allow delete: if isAuthenticated() && request.auth.uid == userId;
    }
    
    // Vendor documents
    match /vendor-documents/{vendorId}/{documentId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && isUnder10MB();
      allow delete: if isAuthenticated();
    }
  }
}
```

## 🚀 Next Steps

### 1. Create Firebase Project
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project
firebase init
```

Select:
- Firestore
- Storage
- Hosting (optional)

### 2. Deploy Security Rules
```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Storage rules
firebase deploy --only storage:rules
```

### 3. Update Code to Use Firebase Services

Replace Supabase imports with Firebase services:

**Before:**
```typescript
import { supabase } from '../lib/supabase';
```

**After:**
```typescript
import { authService } from '../services/firebaseAuthService';
import { firestoreService } from '../services/firestoreService';
import { storageService } from '../services/firebaseStorageService';
```

### 4. Remove Supabase Dependencies

```bash
# Remove Supabase package
npm uninstall @supabase/supabase-js

# Remove Supabase files
rm -rf src/lib/supabase.ts
rm -rf supabase/
```

### 5. Update AuthContext

Modify `src/contexts/AuthContext.tsx` to use Firebase Auth instead of Supabase.

## 📝 Testing Checklist

- [ ] Test user registration
- [ ] Test user login
- [ ] Test password reset
- [ ] Test product creation
- [ ] Test cart operations (add, update, remove)
- [ ] Test file uploads
- [ ] Test real-time updates
- [ ] Test all screens functionality
- [ ] Verify security rules work correctly

## 🐛 Troubleshooting

### Firebase Not Initialized
**Error:** "Firebase app not initialized"
**Solution:** Ensure `.env` file has all required Firebase credentials

### Authentication Errors
**Error:** "auth/invalid-api-key"
**Solution:** Verify `VITE_FIREBASE_API_KEY` in `.env` file

### Firestore Permission Denied
**Error:** "Missing or insufficient permissions"
**Solution:** Deploy Firestore security rules using `firebase deploy --only firestore:rules`

### Storage Upload Failed
**Error:** "storage/unauthorized"
**Solution:** Deploy Storage security rules using `firebase deploy --only storage:rules`

## 📚 Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Data Modeling](https://firebase.google.com/docs/firestore/data-model)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)
- [Firebase Storage](https://firebase.google.com/docs/storage)

---

**Migration Status:** In Progress
**Last Updated:** December 1, 2025
