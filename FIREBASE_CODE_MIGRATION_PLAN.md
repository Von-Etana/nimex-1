# Firebase Migration - Code Update Plan

## Current Status

✅ **Phase 1 Complete:** Firebase services created and configured
🔄 **Phase 2 In Progress:** Updating code to use Firebase

## Files Requiring Updates

### 1. Screens with Supabase Imports (12 files)

| File | Priority | Status |
|------|----------|--------|
| `ProfileScreen.tsx` | High | ⏳ Pending |
| `VendorsScreen.tsx` | High | ⏳ Pending |
| `VendorProfileScreen.tsx` | High | ⏳ Pending |
| `ProductDetailScreen.tsx` | High | ⏳ Pending |
| `ProductSearchScreen.tsx` | High | ⏳ Pending |
| `CheckoutScreen.tsx` | High | ⏳ Pending |
| `OrdersScreen.tsx` | Medium | ⏳ Pending |
| `OrderTrackingScreen.tsx` | Medium | ⏳ Pending |
| `ChatScreen.tsx` | Medium | ⏳ Pending |
| `NotificationsScreen.tsx` | Low | ⏳ Pending |
| `SupportScreen.tsx` | Low | ⏳ Pending |
| `AuthContext.test.tsx` | Low | ⏳ Pending |

### 2. Services to Check

- `recommendationService.ts`
- `referralService.ts`
- `deliveryService.ts`
- All vendor services

## Migration Strategy

### Step 1: Create Supabase Compatibility Layer (Quick Fix)
Create a temporary compatibility file that maps Supabase calls to Firebase.

### Step 2: Update High Priority Screens
Focus on core user flows:
1. Product browsing
2. Vendor profiles
3. Checkout process
4. User profile

### Step 3: Update Services
Migrate all service files to use Firebase directly.

### Step 4: Remove Compatibility Layer
Once all files are migrated, remove the compatibility layer.

## Common Migration Patterns

### Pattern 1: Simple Query
**Before (Supabase):**
```typescript
const { data, error } = await supabase
  .from('products')
  .select('*')
  .eq('id', productId)
  .single();
```

**After (Firebase):**
```typescript
const product = await firestoreService.getDocument('products', productId);
```

### Pattern 2: Query with Filters
**Before:**
```typescript
const { data } = await supabase
  .from('products')
  .select('*')
  .eq('vendor_id', vendorId)
  .gte('price', minPrice)
  .order('created_at', { ascending: false });
```

**After:**
```typescript
import { where, orderBy } from '../services/firestoreService';

const products = await firestoreService.getDocuments('products', [
  where('vendor_id', '==', vendorId),
  where('price', '>=', minPrice),
  orderBy('created_at', 'desc')
]);
```

### Pattern 3: Insert
**Before:**
```typescript
const { data, error } = await supabase
  .from('orders')
  .insert({ user_id, total_amount })
  .select()
  .single();
```

**After:**
```typescript
const orderId = await firestoreService.createDocument('orders', {
  user_id,
  total_amount
});
```

### Pattern 4: Update
**Before:**
```typescript
const { error } = await supabase
  .from('products')
  .update({ stock_quantity })
  .eq('id', productId);
```

**After:**
```typescript
await firestoreService.updateDocument('products', productId, {
  stock_quantity
});
```

### Pattern 5: Real-time Subscription
**Before:**
```typescript
const subscription = supabase
  .channel('orders')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'orders'
  }, (payload) => {
    console.log('New order:', payload);
  })
  .subscribe();
```

**After:**
```typescript
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

const unsubscribe = onSnapshot(
  query(collection(db, 'orders')),
  (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        console.log('New order:', change.doc.data());
      }
    });
  }
);
```

## Next Actions

1. ✅ Create this migration plan
2. ⏳ Create Supabase compatibility layer
3. ⏳ Update high-priority screens
4. ⏳ Test each screen after migration
5. ⏳ Update services
6. ⏳ Remove compatibility layer
7. ⏳ Final testing

## Testing Checklist

After each file migration:
- [ ] File compiles without errors
- [ ] Screen loads correctly
- [ ] Data fetching works
- [ ] User interactions work
- [ ] No console errors

---

**Created:** December 1, 2025, 9:10 PM
**Status:** Planning Complete, Ready for Implementation
