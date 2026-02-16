# Firebase Database Verification Guide

## Your Firebase Project Details

Based on your configuration:

**Project ID**: `nimex-ecommerce`  
**Project URL**: https://console.firebase.google.com/project/nimex-ecommerce  
**Auth Domain**: nimex-ecommerce.firebaseapp.com  
**Storage Bucket**: nimex-ecommerce.firebasestorage.app

---

## How to Verify Your Firestore Database

### Step 1: Open Firebase Console
1. Go to: **https://console.firebase.google.com/**
2. You should see your project: **nimex-ecommerce**
3. Click on it to open

### Step 2: Check Firestore Database

#### Option A: Database Exists
If Firestore is already created, you'll see:
- **Left sidebar** → "Firestore Database" (with icon)
- Click it to see:
  - **Data tab** - Shows your collections
  - **Rules tab** - Shows security rules
  - **Indexes tab** - Shows database indexes
  - **Usage tab** - Shows usage statistics

#### Option B: Database NOT Created Yet
If Firestore hasn't been created, you'll see:
- **Left sidebar** → "Firestore Database" (grayed out or with "Create" badge)
- When you click it, you'll see a button: **"Create database"**

---

## Creating Firestore Database (If Needed)

If the database doesn't exist yet, here's how to create it:

### Step 1: Click "Create Database"
1. In Firebase Console, go to **Firestore Database**
2. Click **"Create database"** button

### Step 2: Choose Location
1. **Production mode** or **Test mode**:
   - Choose **"Production mode"** (we'll set custom rules)
   - Click **Next**

2. **Select location**:
   - Choose closest to Nigeria: **"eur3 (europe-west)"** or **"us-central"**
   - Click **Enable**

### Step 3: Wait for Creation
- Takes 1-2 minutes
- You'll see a loading screen
- Once done, you'll see the Firestore interface

### Step 4: Deploy Security Rules
After database is created:
1. Go to **Rules** tab
2. Follow `DEPLOY_RULES_MANUAL.md` to deploy your rules

---

## What to Look For

### ✅ Database Exists If You See:

1. **Collections** (may be empty):
   - profiles
   - vendors
   - products
   - orders
   - etc.

2. **Rules Tab** with content:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Your rules here
     }
   }
   ```

3. **No "Create Database" button**

### ❌ Database NOT Created If You See:

1. **"Create database" button**
2. **Empty Firestore section**
3. **Message**: "Get started by creating a database"

---

## Quick Verification Checklist

Check these in Firebase Console:

- [ ] **Project exists**: nimex-ecommerce
- [ ] **Firestore Database** menu item visible
- [ ] **Database created** (no "Create" button)
- [ ] **Collections visible** (or empty state)
- [ ] **Rules tab** accessible
- [ ] **Security rules deployed** (not default rules)

---

## Current Status Based on Your Config

Your `.env` file shows:
- ✅ Firebase project configured: `nimex-ecommerce`
- ✅ All required credentials present
- ✅ Firebase initialized in code
- ⚠️ **Unknown**: Whether Firestore database is created
- ⚠️ **Unknown**: Whether security rules are deployed

---

## What Happens When You Try to Sign Up

### If Database Exists + Rules Deployed:
```
✅ Signup form loads
✅ User enters details
✅ Firebase Auth creates user
✅ Profile created in Firestore
✅ Vendor record created (for vendors)
✅ Signup successful!
```

### If Database Exists + Rules NOT Deployed:
```
✅ Signup form loads
✅ User enters details
✅ Firebase Auth creates user
❌ Profile creation fails: "Missing or insufficient permissions"
❌ Vendor record creation fails
❌ Signup fails with error
```

### If Database NOT Created:
```
✅ Signup form loads
✅ User enters details
✅ Firebase Auth creates user
❌ Firestore operations fail: "Database not found"
❌ Signup fails with error
```

---

## How to Verify Right Now

### Method 1: Firebase Console (Recommended)
1. Open: https://console.firebase.google.com/project/nimex-ecommerce/firestore
2. Look for:
   - ✅ Database interface (collections, rules, etc.)
   - ❌ "Create database" button

### Method 2: Try Signup (Quick Test)
1. Open your app: http://localhost:5174/signup
2. Try to create an account
3. Check browser console (F12) for errors:
   - **"Missing or insufficient permissions"** = Database exists, rules not deployed
   - **"Database not found"** = Database not created
   - **Success** = Everything is set up correctly!

### Method 3: Check Browser Console
1. Open your app: http://localhost:5174
2. Press F12 to open Developer Tools
3. Go to Console tab
4. Look for Firebase initialization logs:
   - ✅ "Firebase initialized successfully"
   - ❌ Any Firebase errors

---

## Next Steps Based on Status

### If Database Exists + Rules Deployed:
✅ **You're all set!** Test signup flows.

### If Database Exists + Rules NOT Deployed:
1. Follow `DEPLOY_RULES_MANUAL.md`
2. Deploy security rules
3. Test signup

### If Database NOT Created:
1. Create database (see instructions above)
2. Deploy security rules
3. Test signup

---

## Common Scenarios

### Scenario 1: Fresh Firebase Project
- Database: ❌ Not created
- Rules: ❌ Not deployed
- **Action**: Create database, then deploy rules

### Scenario 2: Database Created, Default Rules
- Database: ✅ Created
- Rules: ❌ Still default (deny all)
- **Action**: Deploy custom rules

### Scenario 3: Fully Set Up
- Database: ✅ Created
- Rules: ✅ Custom rules deployed
- **Action**: Test and use!

---

## Verification Commands

You can also check from your app's browser console:

```javascript
// Open browser console (F12) and run:
console.log('Firebase Project:', import.meta.env.VITE_FIREBASE_PROJECT_ID);
// Should show: nimex-ecommerce

// Check if Firestore is accessible
import { db } from './src/lib/firebase.config';
console.log('Firestore instance:', db);
// Should show Firestore object, not error
```

---

## Summary

**Your Firebase Project**: `nimex-ecommerce` ✅  
**Configuration**: Complete ✅  
**Database Status**: **Unknown** - Please verify in console  
**Rules Status**: **Unknown** - Please verify in console

**To Confirm**:
1. Visit: https://console.firebase.google.com/project/nimex-ecommerce/firestore
2. Check if database interface is visible
3. Check if rules are deployed

---

**Need Help?**
- If database doesn't exist: Follow "Creating Firestore Database" section above
- If rules not deployed: Follow `DEPLOY_RULES_MANUAL.md`
- If everything exists: Test signup at http://localhost:5174/signup

---

**Last Updated**: December 4, 2025  
**Project**: nimex-ecommerce  
**Status**: Awaiting manual verification
