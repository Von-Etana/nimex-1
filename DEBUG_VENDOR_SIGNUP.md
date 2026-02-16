# Vendor Signup Permission Error - Debugging Guide

## Current Issue

**Error**: "Missing or insufficient permissions"  
**When**: Creating vendor account  
**Status**: Firestore rules deployed but still failing

---

## Quick Diagnosis Checklist

### 1. ✅ Check Rules Are Actually Deployed

**Go to Firebase Console**:
1. Open: https://console.firebase.google.com/project/nimex-ecommerce/firestore/rules
2. Look at the **published rules** (not your local file)
3. Verify you see these exact lines:

```javascript
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
```

**If they don't match**: The rules weren't deployed correctly. Redeploy them.

---

### 2. ✅ Check When Rules Were Last Published

In Firebase Console → Firestore → Rules:
- Look for "Last published" timestamp
- Should be recent (within last 30 minutes)
- If it's old, rules weren't deployed

---

### 3. ✅ Get the Exact Error from Browser Console

This is CRITICAL for debugging:

1. Open your app: `http://localhost:5174/signup`
2. Press **F12** to open Developer Tools
3. Go to **Console** tab
4. Try vendor signup
5. Look for red error messages

**Common errors and meanings**:

```
FirebaseError: Missing or insufficient permissions
  at path: /profiles/[userId]
```
→ Profile creation rule is wrong

```
FirebaseError: Missing or insufficient permissions
  at path: /vendors/[vendorId]
```
→ Vendor creation rule is wrong

```
FirebaseError: [PERMISSION_DENIED]
```
→ Rules not deployed or wrong project

---

## Most Likely Causes

### Cause 1: Rules Not Actually Deployed ⚠️

**Symptoms**:
- You clicked "Publish" but nothing happened
- Last published timestamp is old
- Rules in console don't match local file

**Solution**:
1. Go to Firebase Console → Firestore → Rules
2. **Delete ALL text** in the editor
3. Copy **entire** `firestore.rules` file
4. Paste into editor
5. Click **Publish**
6. Wait for "Rules published successfully" message
7. Wait 2 minutes for propagation

---

### Cause 2: Wrong Firebase Project ⚠️

**Symptoms**:
- Rules look correct in console
- Still getting permission errors
- Might be deploying to wrong project

**Solution**:
1. Check `.env` file:
   ```
   VITE_FIREBASE_PROJECT_ID=nimex-ecommerce
   ```
2. Check Firebase Console URL:
   ```
   https://console.firebase.google.com/project/nimex-ecommerce/...
   ```
3. Verify they match!

---

### Cause 3: Firestore Database Not Created ⚠️

**Symptoms**:
- Can't find Firestore in Firebase Console
- "Create database" button visible
- Rules tab not accessible

**Solution**:
1. Go to Firebase Console → Firestore Database
2. If you see "Create database" button, click it
3. Choose "Production mode"
4. Select location: "eur3 (europe-west)"
5. Click "Enable"
6. Wait for database creation
7. Then deploy rules

---

### Cause 4: Browser Cache ⚠️

**Symptoms**:
- Rules are correct and deployed
- Still seeing old error
- Works in incognito mode

**Solution**:
1. Clear browser cache completely
2. Or use incognito/private window
3. Try signup again

---

## Step-by-Step Debugging Process

### Step 1: Verify Firebase Project

```bash
# Check your .env file
cat .env | grep FIREBASE_PROJECT_ID
# Should show: VITE_FIREBASE_PROJECT_ID=nimex-ecommerce
```

### Step 2: Check Firestore Database Exists

1. Go to: https://console.firebase.google.com/project/nimex-ecommerce/firestore
2. Should see database interface (not "Create database" button)
3. Should see tabs: Data, Rules, Indexes, Usage

### Step 3: Verify Rules Are Deployed

1. Go to: https://console.firebase.google.com/project/nimex-ecommerce/firestore/rules
2. Check "Last published" timestamp
3. Verify rules match your local `firestore.rules` file

### Step 4: Test with Console Logs

Add console logs to see where it fails:

1. Open browser console (F12)
2. Try vendor signup
3. Look for these logs:
   - "Firebase initialized successfully" ✅
   - "Creating new user account for: [email]" ✅
   - Then check where it fails

### Step 5: Check Authentication

The error might be in the auth step, not Firestore:

1. Go to: https://console.firebase.google.com/project/nimex-ecommerce/authentication
2. Check if "Email/Password" provider is enabled
3. If not, enable it

---

## Manual Test in Firebase Console

You can test if rules work directly in Firebase Console:

### Test Profile Creation:

1. Go to: https://console.firebase.google.com/project/nimex-ecommerce/firestore/rules
2. Click "Rules Playground" tab
3. Set:
   - **Location**: `/profiles/test123`
   - **Operation**: `create`
   - **Authenticated**: `Yes`
   - **Auth UID**: `test123`
4. Click "Run"
5. Should show: ✅ **Allowed**

### Test Vendor Creation:

1. Same as above but:
   - **Location**: `/vendors/test123`
   - **Operation**: `create`
   - **Authenticated**: `Yes`
   - **Auth UID**: `test123`
2. Should show: ✅ **Allowed**

If these tests fail, your rules are wrong or not deployed.

---

## Complete Re-deployment Process

If nothing else works, do a complete re-deployment:

### 1. Backup Current Rules
```bash
# Save current rules
cp firestore.rules firestore.rules.backup
```

### 2. Deploy Fresh Rules

**Option A: Firebase Console**
1. Go to: https://console.firebase.google.com/project/nimex-ecommerce/firestore/rules
2. Delete everything
3. Copy this minimal working version:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Profiles
    match /profiles/{userId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && request.auth.uid == userId;
      allow update: if isAuthenticated() && request.auth.uid == userId;
      allow delete: if isAuthenticated() && request.auth.uid == userId;
    }
    
    // Vendors
    match /vendors/{vendorId} {
      allow read: if true;
      allow create: if isAuthenticated() && request.auth.uid == vendorId;
      allow update: if isAuthenticated();
      allow delete: if isAuthenticated();
    }
    
    // Marketers (for your marketer registration)
    match /marketers/{marketerId} {
      allow read: if isAuthenticated();
      allow create: if true;
      allow update: if isAuthenticated();
      allow delete: if isAuthenticated();
    }
  }
}
```

4. Click "Publish"
5. Wait 2 minutes
6. Test vendor signup

**Option B: Command Line**
```bash
firebase deploy --only firestore:rules
```

---

## Test Sequence

After deploying rules, test in this order:

### 1. Test Authentication
```
1. Go to /signup
2. Try to create buyer account (simpler, no vendor record)
3. If this works, auth is fine
4. If this fails, auth provider not enabled
```

### 2. Test Vendor Signup
```
1. Go to /signup
2. Select "I Want to Sell"
3. Fill form
4. Submit
5. Check browser console for exact error
```

### 3. Check Firestore
```
1. Go to Firebase Console → Firestore → Data
2. Look for:
   - profiles collection (should have documents)
   - vendors collection (should have documents)
3. If empty, writes are failing
```

---

## Common Error Messages Decoded

### "Missing or insufficient permissions"
**Meaning**: Firestore rules are blocking the operation  
**Check**: Rules are deployed and correct

### "PERMISSION_DENIED: Permission denied"
**Meaning**: Same as above  
**Check**: Rules deployment

### "Database not found"
**Meaning**: Firestore database doesn't exist  
**Check**: Create database in Firebase Console

### "Network error"
**Meaning**: Can't connect to Firebase  
**Check**: Internet connection, Firebase project exists

### "Email already in use"
**Meaning**: Account exists (this is actually good!)  
**Check**: Use different email or delete existing user

---

## Emergency Workaround (TEMPORARY ONLY)

If you need to test immediately and can't fix rules:

**⚠️ WARNING: INSECURE - ONLY FOR TESTING**

Deploy these ultra-permissive rules temporarily:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

This allows all authenticated users to do anything. Use ONLY for testing, then revert to proper rules!

---

## What to Share for Help

If you still can't fix it, share these:

1. **Exact error from browser console** (screenshot or text)
2. **Last published timestamp** from Firebase Console
3. **Screenshot of Firebase Console → Firestore → Rules**
4. **Output of**: `cat .env | grep FIREBASE_PROJECT_ID`
5. **Does database exist?** (yes/no)
6. **Does auth provider enabled?** (yes/no)

---

## Success Indicators

You'll know it's working when:

1. ✅ No error messages in console
2. ✅ User redirected to `/vendor/onboarding`
3. ✅ New document in `profiles` collection
4. ✅ New document in `vendors` collection
5. ✅ User appears in Authentication → Users

---

## Next Steps After Fix

Once vendor signup works:

1. ✅ Test buyer signup
2. ✅ Test marketer registration (after deploying marketer fix)
3. ✅ Deploy storage rules
4. ✅ Full application testing

---

**Generated**: December 4, 2025, 12:24 PM  
**Issue**: Vendor signup permission error  
**Priority**: CRITICAL  
**Status**: Awaiting diagnosis

---

## Quick Commands

```bash
# Check Firebase project
cat .env | grep FIREBASE_PROJECT_ID

# View current rules
cat firestore.rules

# Deploy rules (if Firebase CLI set up)
firebase deploy --only firestore:rules
```

---

**Remember**: The browser console error is the key to solving this. Get that exact error message!
