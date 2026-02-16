# Firebase Setup Guide

## Prerequisites

1. **Firebase Project**: You should have a Firebase project created at [Firebase Console](https://console.firebase.google.com/)
2. **Node.js**: Ensure Node.js is installed (v16 or higher recommended)
3. **Disk Space**: Ensure you have at least 500MB of free disk space for Firebase dependencies

## Step 1: Install Firebase Dependencies

```bash
npm install firebase
```

> **Note**: If you encounter `ENOSPC: no space left on device` error, free up disk space and try again.

## Step 2: Get Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click on the gear icon (⚙️) → Project settings
4. Scroll down to "Your apps" section
5. If you haven't added a web app, click "Add app" and select Web (</>) icon
6. Copy the Firebase configuration object

## Step 3: Configure Environment Variables

Create or update your `.env` file in the project root with the following variables:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id (optional)
```

### Example `.env` file:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSyC1234567890abcdefghijklmnopqrstu
VITE_FIREBASE_AUTH_DOMAIN=nimex-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=nimex-app
VITE_FIREBASE_STORAGE_BUCKET=nimex-app.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890
VITE_FIREBASE_MEASUREMENT_ID=G-ABCDEF1234

# Remove old Supabase variables (after migration is complete)
# VITE_SUPABASE_URL=...
# VITE_SUPABASE_ANON_KEY=...
```

## Step 4: Enable Firebase Services

### 4.1 Enable Authentication

1. In Firebase Console, go to **Authentication** → **Get started**
2. Enable **Email/Password** sign-in method
3. (Optional) Enable other sign-in methods as needed

### 4.2 Create Firestore Database

1. In Firebase Console, go to **Firestore Database** → **Create database**
2. Choose **Start in production mode** (we'll add security rules later)
3. Select a location (choose closest to your users)
4. Click **Enable**

### 4.3 Enable Firebase Storage

1. In Firebase Console, go to **Storage** → **Get started**
2. Choose **Start in production mode**
3. Click **Done**

## Step 5: Set Up Firestore Security Rules

In Firebase Console → Firestore Database → Rules, replace the default rules with:

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
    
    // Orders
    match /orders/{orderId} {
      allow read: if isOwner(resource.data.buyer_id) || 
                     isOwner(resource.data.vendor_id) || 
                     isAdmin();
      allow create: if isAuthenticated();
      allow update: if isOwner(resource.data.buyer_id) || 
                       isOwner(resource.data.vendor_id) || 
                       isAdmin();
    }
    
    // Cart
    match /carts/{cartId} {
      allow read, write: if isOwner(resource.data.user_id);
    }
    
    match /cart_items/{itemId} {
      allow read, write: if isAuthenticated();
    }
    
    // Chat
    match /chat_conversations/{conversationId} {
      allow read: if isOwner(resource.data.buyer_id) || 
                     isOwner(resource.data.vendor_id);
      allow create: if isAuthenticated();
      allow update: if isOwner(resource.data.buyer_id) || 
                       isOwner(resource.data.vendor_id);
    }
    
    match /chat_messages/{messageId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
    }
    
    // Admin only collections
    match /admin_roles/{roleId} {
      allow read: if isAdmin();
      allow write: if isAdmin();
    }
    
    match /kyc_submissions/{submissionId} {
      allow read: if isOwner(resource.data.user_id) || isAdmin();
      allow create: if isAuthenticated();
      allow update: if isAdmin();
    }
    
    // Default deny all
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## Step 6: Set Up Firebase Storage Rules

In Firebase Console → Storage → Rules, replace the default rules with:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isAdmin() {
      return isAuthenticated() && 
             firestore.get(/databases/(default)/documents/profiles/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Avatars - users can upload their own
    match /avatars/{userId}/{allPaths=**} {
      allow read: if true;
      allow write: if isAuthenticated() && request.auth.uid == userId;
    }
    
    // Product images - vendors only
    match /products/{vendorId}/{allPaths=**} {
      allow read: if true;
      allow write: if isAuthenticated();
    }
    
    // KYC documents - user and admin only
    match /kyc/{type}/{userId}/{allPaths=**} {
      allow read: if isAuthenticated() && (request.auth.uid == userId || isAdmin());
      allow write: if isAuthenticated() && request.auth.uid == userId;
    }
    
    // Delivery proofs
    match /deliveries/{orderId}/{allPaths=**} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated();
    }
    
    // Chat images
    match /chat/images/{conversationId}/{allPaths=**} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated();
    }
    
    // Default deny
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

## Step 7: Create Firestore Indexes

Some queries require composite indexes. Create a `firestore.indexes.json` file in your project root:

```json
{
  "indexes": [
    {
      "collectionGroup": "products",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "vendor_id", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "created_at", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "products",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "category_id", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "created_at", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "orders",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "buyer_id", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "created_at", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "orders",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "vendor_id", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "created_at", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "chat_messages",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "conversation_id", "order": "ASCENDING" },
        { "fieldPath": "created_at", "order": "ASCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

Deploy indexes using Firebase CLI:
```bash
npm install -g firebase-tools
firebase login
firebase init firestore
firebase deploy --only firestore:indexes
```

## Step 8: Verify Setup

Run your application:
```bash
npm run dev
```

Check the browser console for Firebase initialization messages. You should see:
```
Firebase initialized successfully
```

## Troubleshooting

### Error: "Missing Firebase environment variable"
- Ensure all environment variables are set in `.env`
- Restart your development server after updating `.env`

### Error: "Firebase configuration is invalid"
- Double-check your Firebase config values
- Ensure there are no extra spaces or quotes in `.env`

### Error: "Permission denied" in Firestore
- Check your Firestore security rules
- Ensure the user is authenticated
- Verify the user has the correct role

### Error: "ENOSPC: no space left on device"
- Free up disk space (delete node_modules, clear npm cache, etc.)
- Run `npm cache clean --force`
- Try installing again

## Next Steps

After completing the setup:
1. ✅ Firebase is configured and initialized
2. 🔄 Migrate authentication (AuthContext)
3. 🔄 Migrate database services
4. 🔄 Update all screens to use Firebase
5. 🔄 Test thoroughly
6. 🔄 Deploy to production

## Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firebase Auth Documentation](https://firebase.google.com/docs/auth)
- [Firebase Storage Documentation](https://firebase.google.com/docs/storage)
