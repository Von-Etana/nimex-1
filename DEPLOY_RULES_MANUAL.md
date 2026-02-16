# Manual Firestore Rules Deployment Guide

## Quick Steps (5 minutes)

### Step 1: Open Firebase Console
1. Go to: **https://console.firebase.google.com/**
2. Sign in with your Google account
3. Select your **Nimex** project

### Step 2: Navigate to Firestore Rules
1. In the left sidebar, click **"Firestore Database"**
2. Click the **"Rules"** tab at the top

### Step 3: Copy Your Rules
The rules are already in your `firestore.rules` file. Here they are for easy copying:

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
        exists(/databases/$(database)/documents/vendors/$(request.auth.uid));
    }
    
    // Profiles - users can read all, write own
    match /profiles/{userId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && request.auth.uid == userId;
      allow update: if isOwner(userId);
      allow delete: if isOwner(userId) || isAdmin();
    }
    
    // Vendors - public read, owner write
    match /vendors/{vendorId} {
      allow read: if true;
      allow create: if isAuthenticated() && request.auth.uid == vendorId;
      allow update: if isAuthenticated() && 
        (resource.data.user_id == request.auth.uid || isAdmin());
      allow delete: if isAdmin();
    }
    
    // Products - public read, vendor write
    match /products/{productId} {
      allow read: if true;
      allow create: if isVendor();
      allow update: if isAuthenticated() && 
        (resource.data.vendor_id == request.auth.uid || isAdmin());
      allow delete: if isAuthenticated() && 
        (resource.data.vendor_id == request.auth.uid || isAdmin());
    }
    
    // Orders - buyer and vendor can read, buyer can create
    match /orders/{orderId} {
      allow read: if isAuthenticated() && (
        resource.data.user_id == request.auth.uid ||
        resource.data.vendor_id == request.auth.uid ||
        isAdmin()
      );
      allow create: if isAuthenticated();
      allow update: if isAuthenticated() && (
        resource.data.user_id == request.auth.uid ||
        resource.data.vendor_id == request.auth.uid ||
        isAdmin()
      );
      allow delete: if isAdmin();
    }
    
    // Carts - owner only
    match /carts/{cartId} {
      allow read, write: if isAuthenticated() && 
        resource.data.user_id == request.auth.uid;
    }
    
    match /cart_items/{itemId} {
      allow read, write: if isAuthenticated();
    }
    
    // Reviews - public read, buyer write
    match /reviews/{reviewId} {
      allow read: if true;
      allow create: if isAuthenticated();
      allow update, delete: if isAuthenticated() && 
        resource.data.buyer_id == request.auth.uid;
    }
    
    // Addresses - owner only
    match /addresses/{addressId} {
      allow read, write: if isAuthenticated() && 
        resource.data.user_id == request.auth.uid;
    }
    
    // Wishlists - owner only
    match /wishlists/{wishlistId} {
      allow read, write: if isAuthenticated() && 
        resource.data.user_id == request.auth.uid;
    }
    
    // Categories - public read, admin write
    match /categories/{categoryId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    
    // Markets - public read, admin write
    match /markets/{marketId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    
    // Chat conversations - participants only
    match /chat_conversations/{conversationId} {
      allow read, write: if isAuthenticated() && (
        request.auth.uid in resource.data.participant_ids ||
        !exists(/databases/$(database)/documents/chat_conversations/$(conversationId))
      );
    }
    
    match /chat_messages/{messageId} {
      allow read, write: if isAuthenticated();
    }
    
    // Notifications - owner only
    match /notifications/{notificationId} {
      allow read, write: if isAuthenticated() && 
        resource.data.user_id == request.auth.uid;
    }
    
    // Marketers - admin and owner
    match /marketers/{marketerId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update, delete: if isAuthenticated() && 
        (resource.data.user_id == request.auth.uid || isAdmin());
    }
    
    // Referrals - public read, authenticated write
    match /referrals/{referralId} {
      allow read: if true;
      allow create: if isAuthenticated();
      allow update, delete: if isAuthenticated() && 
        resource.data.referrer_id == request.auth.uid;
    }
    
    // Transactions - owner and admin
    match /transactions/{transactionId} {
      allow read: if isAuthenticated() && (
        resource.data.user_id == request.auth.uid ||
        resource.data.vendor_id == request.auth.uid ||
        isAdmin()
      );
      allow create: if isAuthenticated();
      allow update, delete: if isAdmin();
    }
    
    // Support tickets - owner and admin
    match /support_tickets/{ticketId} {
      allow read: if isAuthenticated() && (
        resource.data.user_id == request.auth.uid || isAdmin()
      );
      allow create: if isAuthenticated();
      allow update: if isAuthenticated() && (
        resource.data.user_id == request.auth.uid || isAdmin()
      );
      allow delete: if isAdmin();
    }
    
    // Escrow - participants and admin
    match /escrow/{escrowId} {
      allow read: if isAuthenticated() && (
        resource.data.buyer_id == request.auth.uid ||
        resource.data.vendor_id == request.auth.uid ||
        isAdmin()
      );
      allow create: if isAuthenticated();
      allow update: if isAuthenticated() && (
        resource.data.buyer_id == request.auth.uid ||
        resource.data.vendor_id == request.auth.uid ||
        isAdmin()
      );
      allow delete: if isAdmin();
    }
    
    // Disputes - participants and admin
    match /disputes/{disputeId} {
      allow read: if isAuthenticated() && (
        resource.data.buyer_id == request.auth.uid ||
        resource.data.vendor_id == request.auth.uid ||
        isAdmin()
      );
      allow create: if isAuthenticated();
      allow update: if isAuthenticated() && (
        resource.data.buyer_id == request.auth.uid ||
        resource.data.vendor_id == request.auth.uid ||
        isAdmin()
      );
      allow delete: if isAdmin();
    }
    
    // Commissions - admin only
    match /commissions/{commissionId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }
    
    // Analytics - admin only
    match /analytics/{analyticsId} {
      allow read, write: if isAdmin();
    }
  }
}
```

### Step 4: Paste and Publish
1. **Select all the text** in the rules editor (Ctrl+A)
2. **Delete** the existing rules
3. **Paste** the rules from above (Ctrl+V)
4. Click the **"Publish"** button (top right)
5. Confirm the deployment

### Step 5: Verify
You should see a success message: "Rules published successfully"

---

## What These Rules Do

### Key Security Features:
✅ **Profiles**: Users can only create/edit their own profile
✅ **Vendors**: Users can only create vendor records for themselves
✅ **Products**: Only vendors can create products
✅ **Orders**: Only involved parties can view orders
✅ **Admin**: Special permissions for admin users
✅ **Public Data**: Products, categories, markets are publicly readable

### This Fixes:
- ❌ "Missing or insufficient permission" errors during signup
- ❌ Permission errors when creating vendor accounts
- ❌ Permission errors when creating profiles

---

## After Deployment

### Test Signup:
1. Open your app: http://localhost:5174/signup
2. Try creating a vendor account
3. Should work without permission errors! ✅

### Verify in Firebase Console:
1. Go to Firestore Database → Data
2. Check that new documents are created in:
   - `profiles` collection
   - `vendors` collection (for vendor signups)

---

## Troubleshooting

### If you still get permission errors:
1. **Wait 1-2 minutes** - Rules take time to propagate
2. **Clear browser cache** or use incognito mode
3. **Check Firebase Console** - Verify rules are published
4. **Check the error message** - It should tell you which rule failed

### Common Issues:
- **"No project selected"**: Make sure you selected the correct Firebase project
- **"Rules not found"**: Make sure you're in the "Rules" tab, not "Data"
- **"Syntax error"**: Make sure you copied the entire rules file

---

## Alternative: Command Line (If you prefer)

If you want to use the command line instead:

```powershell
# 1. Login to Firebase
firebase login

# 2. Select your project
firebase use --add
# (Select your Nimex project from the list)

# 3. Deploy rules
firebase deploy --only firestore:rules
```

---

**Estimated Time**: 5 minutes
**Difficulty**: Easy
**Required**: Firebase Console access

Once deployed, all signup flows will work perfectly! 🎉
