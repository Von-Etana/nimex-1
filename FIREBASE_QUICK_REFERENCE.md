# 🔥 Firebase Quick Reference - Nimex Platform

## 🚀 Quick Start

```bash
# Dev server is already running at:
http://localhost:5173

# Firebase Console:
https://console.firebase.google.com/project/nimex-ecommerce
```

## 📦 Import Statements

```typescript
// Authentication
import { authService } from '../services/firebaseAuthService';

// Database
import { firestoreService, where, orderBy, limit } from '../services/firestoreService';

// Storage
import { storageService } from '../services/firebaseStorageService';

// Core (if needed)
import { auth, db, storage, analytics } from '../lib/firebase';
```

## 🔐 Authentication

```typescript
// Sign Up
const { user, profile } = await authService.signUp(email, password, {
  full_name: 'John Doe',
  role: 'buyer', // or 'vendor', 'admin', 'marketer'
  phone: '+234...'
});

// Sign In
const { user, profile } = await authService.signIn(email, password);

// Sign Out
await authService.signOut();

// Get Current User
const user = authService.getCurrentUser();

// Get Profile
const profile = await authService.getCurrentUserProfile();

// Update Profile
await authService.updateUserProfile(userId, { full_name: 'New Name' });

// Listen to Auth Changes
const unsubscribe = authService.onAuthStateChange((user) => {
  console.log('User:', user);
});
```

## 💾 Database (Firestore)

```typescript
// Get Single Document
const product = await firestoreService.getDocument('products', productId);

// Get Multiple Documents
const products = await firestoreService.getDocuments('products');

// Query with Filters
const products = await firestoreService.getDocuments('products', [
  where('vendor_id', '==', vendorId),
  where('price', '>=', 1000),
  where('is_active', '==', true),
  orderBy('created_at', 'desc'),
  limit(10)
]);

// Create Document
const productId = await firestoreService.createDocument('products', {
  title: 'New Product',
  price: 5000,
  vendor_id: vendorId
});

// Create with Custom ID
await firestoreService.createDocument('products', productData, customId);

// Update Document
await firestoreService.updateDocument('products', productId, {
  price: 6000,
  stock_quantity: 50
});

// Delete Document
await firestoreService.deleteDocument('products', productId);

// Batch Operations
await firestoreService.batchWrite([
  { type: 'create', collection: 'products', data: product1 },
  { type: 'update', collection: 'products', id: id1, data: updates },
  { type: 'delete', collection: 'products', id: id2 }
]);

// Pagination
const { documents, lastDocument } = await firestoreService.queryWithPagination(
  'products',
  [where('vendor_id', '==', vendorId)],
  20, // page size
  lastDoc // from previous page
);

// Count Documents
const count = await firestoreService.countDocuments('products', [
  where('vendor_id', '==', vendorId)
]);
```

## 📁 Storage

```typescript
// Upload File
const url = await storageService.uploadFile(
  file,
  'products/image.jpg'
);

// Upload with Progress
const url = await storageService.uploadFile(
  file,
  'products/image.jpg',
  undefined,
  (progress) => {
    console.log(`${progress.percentage}% uploaded`);
  }
);

// Upload Multiple Files
const urls = await storageService.uploadMultipleFiles(
  [file1, file2, file3],
  'products'
);

// Upload Image (with validation)
const url = await storageService.uploadImage(file, 'avatars/user.jpg');

// Delete File
await storageService.deleteFile('products/image.jpg');

// Delete Multiple Files
await storageService.deleteMultipleFiles([
  'products/image1.jpg',
  'products/image2.jpg'
]);

// Get File URL
const url = await storageService.getFileURL('products/image.jpg');

// List Files
const urls = await storageService.listFiles('products/');

// Generate Unique Path
const path = storageService.generateFilePath('products', 'image.jpg');
// Returns: products/1733087654321_abc123_image.jpg
```

## 🔍 Query Operators

```typescript
// Comparison
where('price', '==', 1000)   // Equal
where('price', '!=', 1000)   // Not equal
where('price', '>', 1000)    // Greater than
where('price', '>=', 1000)   // Greater than or equal
where('price', '<', 1000)    // Less than
where('price', '<=', 1000)   // Less than or equal

// Array
where('tags', 'array-contains', 'featured')
where('tags', 'array-contains-any', ['featured', 'new'])
where('category_id', 'in', [id1, id2, id3])
where('category_id', 'not-in', [id1, id2])

// Ordering
orderBy('created_at', 'desc')  // Descending
orderBy('price', 'asc')        // Ascending

// Limiting
limit(10)  // First 10 results
```

## 📊 Collections Reference

```typescript
// Main Collections
COLLECTIONS.PROFILES = 'profiles'
COLLECTIONS.VENDORS = 'vendors'
COLLECTIONS.PRODUCTS = 'products'
COLLECTIONS.ORDERS = 'orders'
COLLECTIONS.CARTS = 'carts'
COLLECTIONS.CART_ITEMS = 'cart_items'
COLLECTIONS.MARKETERS = 'marketers'
COLLECTIONS.CATEGORIES = 'categories'
COLLECTIONS.REVIEWS = 'reviews'
COLLECTIONS.CHAT_CONVERSATIONS = 'chat_conversations'
COLLECTIONS.CHAT_MESSAGES = 'chat_messages'
```

## ⚡ Real-time Updates

```typescript
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

// Listen to collection changes
const unsubscribe = onSnapshot(
  query(collection(db, 'orders'), where('vendor_id', '==', vendorId)),
  (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        console.log('New order:', change.doc.data());
      }
      if (change.type === 'modified') {
        console.log('Modified order:', change.doc.data());
      }
      if (change.type === 'removed') {
        console.log('Removed order:', change.doc.data());
      }
    });
  }
);

// Stop listening
unsubscribe();
```

## 🐛 Error Handling

```typescript
try {
  const product = await firestoreService.getDocument('products', productId);
  if (!product) {
    throw new Error('Product not found');
  }
} catch (error) {
  console.error('Error:', error);
  // Handle error
}
```

## 📝 Common Patterns

### User Registration
```typescript
const { user } = await authService.signUp(email, password, {
  full_name,
  role: 'vendor',
  phone
});

// Create vendor profile
await firestoreService.createDocument('vendors', {
  user_id: user.uid,
  business_name,
  market_location
}, user.uid);
```

### Product Creation
```typescript
// Upload image
const imageUrl = await storageService.uploadImage(
  imageFile,
  `products/${Date.now()}_${imageFile.name}`
);

// Create product
const productId = await firestoreService.createDocument('products', {
  vendor_id: vendorId,
  title,
  description,
  price,
  images: [imageUrl],
  stock_quantity,
  category_id,
  is_active: true
});
```

### Order Placement
```typescript
const orderId = await firestoreService.createDocument('orders', {
  user_id: userId,
  vendor_id: vendorId,
  items: cartItems,
  total_amount,
  status: 'pending',
  shipping_address
});

// Clear cart
await firestoreService.deleteDocument('carts', cartId);
```

## 🔗 Useful Links

- [Firebase Console](https://console.firebase.google.com/project/nimex-ecommerce)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firebase Auth Documentation](https://firebase.google.com/docs/auth)
- [Firebase Storage Documentation](https://firebase.google.com/docs/storage)

---

**Quick Tip:** Use the compatibility layer (`import { supabase } from '../lib/supabase'`) for existing code, but migrate to direct Firebase services for new code.
