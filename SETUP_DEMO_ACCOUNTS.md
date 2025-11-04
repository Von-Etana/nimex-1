# Setup Demo Accounts - Quick Guide

This guide will help you create all demo accounts for the NIMEX platform.

---

## Prerequisites

Before creating demo accounts, ensure:

1. ✅ Supabase project is set up
2. ✅ All database migrations have been applied
3. ✅ Edge functions are deployed
4. ✅ Environment variables are configured

---

## Method 1: Via Edge Functions (Recommended)

### Step 1: Create Demo Buyer and Vendor Accounts

**Using cURL:**
```bash
curl -X POST \
  'https://YOUR_PROJECT.supabase.co/functions/v1/create-demo-accounts' \
  -H 'Authorization: Bearer YOUR_SUPABASE_ANON_KEY' \
  -H 'Content-Type: application/json'
```

**Using JavaScript/Fetch:**
```javascript
const response = await fetch(
  'https://YOUR_PROJECT.supabase.co/functions/v1/create-demo-accounts',
  {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_SUPABASE_ANON_KEY',
      'Content-Type': 'application/json'
    }
  }
);

const result = await response.json();
console.log(result);
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Database cleanup and demo accounts setup completed",
  "results": {
    "buyer": { "id": "...", "email": "demo@buyer.nimex.ng" },
    "vendor": { "id": "...", "email": "demo@vendor.nimex.ng" }
  },
  "credentials": {
    "buyer": {
      "email": "demo@buyer.nimex.ng",
      "password": "DemoPassword123!"
    },
    "vendor": {
      "email": "demo@vendor.nimex.ng",
      "password": "DemoPassword123!"
    }
  }
}
```

### Step 2: Create Admin Accounts

**Using cURL:**
```bash
curl -X POST \
  'https://YOUR_PROJECT.supabase.co/functions/v1/create-admin-accounts' \
  -H 'Authorization: Bearer YOUR_SUPABASE_ANON_KEY' \
  -H 'Content-Type: application/json'
```

**Using JavaScript/Fetch:**
```javascript
const response = await fetch(
  'https://YOUR_PROJECT.supabase.co/functions/v1/create-admin-accounts',
  {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_SUPABASE_ANON_KEY',
      'Content-Type': 'application/json'
    }
  }
);

const result = await response.json();
console.log(result);
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Admin accounts setup completed",
  "results": {
    "created": [
      { "email": "admin@nimex.ng", "role": "super_admin" },
      { "email": "accounts@nimex.ng", "role": "account_team" },
      { "email": "support@nimex.ng", "role": "customer_support" }
    ]
  },
  "credentials": [
    { "email": "admin@nimex.ng", "password": "NimexAdmin2024!", "role": "super_admin" },
    { "email": "accounts@nimex.ng", "password": "NimexAccounts2024!", "role": "account_team" },
    { "email": "support@nimex.ng", "password": "NimexSupport2024!", "role": "customer_support" }
  ]
}
```

---

## Method 2: Via Supabase Dashboard

### Create Buyer Account

1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add User"
3. Fill in:
   - Email: `demo@buyer.nimex.ng`
   - Password: `DemoPassword123!`
   - Email Confirmed: ✅ Yes
4. Click "Create User"
5. Note the User ID
6. Go to SQL Editor and run:

```sql
-- Create profile
INSERT INTO profiles (id, email, full_name, phone, role)
VALUES (
  'USER_ID_FROM_STEP_5',
  'demo@buyer.nimex.ng',
  'Demo Buyer',
  '+234 800 123 4567',
  'buyer'
);
```

### Create Vendor Account

1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add User"
3. Fill in:
   - Email: `demo@vendor.nimex.ng`
   - Password: `DemoPassword123!`
   - Email Confirmed: ✅ Yes
4. Click "Create User"
5. Note the User ID
6. Go to SQL Editor and run:

```sql
-- Create profile
INSERT INTO profiles (id, email, full_name, phone, role)
VALUES (
  'USER_ID_FROM_STEP_5',
  'demo@vendor.nimex.ng',
  'Demo Vendor',
  '+234 800 765 4321',
  'vendor'
);

-- Create vendor business profile
INSERT INTO vendors (
  user_id,
  business_name,
  business_description,
  business_address,
  business_phone,
  verification_status,
  rating,
  total_sales,
  wallet_balance,
  is_active
) VALUES (
  'USER_ID_FROM_STEP_5',
  'Demo Artisan Crafts',
  'Authentic handmade Nigerian crafts and textiles',
  '45 Craft Market Road, Ikeja, Lagos',
  '+234 800 765 4321',
  'verified',
  4.8,
  125,
  250500,
  true
);
```

### Create Admin Accounts

Repeat for each admin account:

**Super Admin:**
```sql
-- Email: admin@nimex.ng
-- Password: NimexAdmin2024!

INSERT INTO profiles (id, email, full_name, role)
VALUES ('USER_ID', 'admin@nimex.ng', 'NIMEX Super Admin', 'admin');

-- Assign super_admin role
INSERT INTO admin_role_assignments (user_id, role_id)
VALUES ('USER_ID', (SELECT id FROM admin_roles WHERE name = 'super_admin'));
```

**Account Team:**
```sql
-- Email: accounts@nimex.ng
-- Password: NimexAccounts2024!

INSERT INTO profiles (id, email, full_name, role)
VALUES ('USER_ID', 'accounts@nimex.ng', 'NIMEX Account Team', 'admin');

INSERT INTO admin_role_assignments (user_id, role_id)
VALUES ('USER_ID', (SELECT id FROM admin_roles WHERE name = 'account_team'));
```

**Support Agent:**
```sql
-- Email: support@nimex.ng
-- Password: NimexSupport2024!

INSERT INTO profiles (id, email, full_name, role)
VALUES ('USER_ID', 'support@nimex.ng', 'NIMEX Customer Support', 'admin');

INSERT INTO admin_role_assignments (user_id, role_id)
VALUES ('USER_ID', (SELECT id FROM admin_roles WHERE name = 'customer_support'));
```

---

## Method 3: Via Migration File

Run the demo accounts migration directly in Supabase SQL Editor:

```sql
-- Copy and paste contents from:
-- supabase/migrations/20251023000000_create_demo_accounts.sql

-- This will create buyer and vendor accounts with sample data
```

---

## Verification

### Test Login for Each Account

**1. Test Buyer Account:**
```
URL: https://your-app-url.com/login
Email: demo@buyer.nimex.ng
Password: DemoPassword123!
Expected: Login successful, redirect to home/dashboard
```

**2. Test Vendor Account:**
```
URL: https://your-app-url.com/login
Email: demo@vendor.nimex.ng
Password: DemoPassword123!
Expected: Login successful, redirect to vendor dashboard
```

**3. Test Admin Accounts:**
```
URL: https://your-app-url.com/login
Email: admin@nimex.ng (or accounts@/support@)
Password: NimexAdmin2024! (or respective password)
Expected: Login successful, redirect to admin dashboard
```

### Verify Account Data

**Check Buyer Profile:**
```sql
SELECT p.*, a.email
FROM profiles p
JOIN auth.users a ON a.id = p.id
WHERE p.role = 'buyer' AND a.email = 'demo@buyer.nimex.ng';
```

**Check Vendor Profile:**
```sql
SELECT p.*, v.*, a.email
FROM profiles p
JOIN auth.users a ON a.id = p.id
JOIN vendors v ON v.user_id = p.id
WHERE p.role = 'vendor' AND a.email = 'demo@vendor.nimex.ng';
```

**Check Admin Profiles:**
```sql
SELECT p.*, a.email, r.name as role_name
FROM profiles p
JOIN auth.users a ON a.id = p.id
LEFT JOIN admin_role_assignments ara ON ara.user_id = p.id
LEFT JOIN admin_roles r ON r.id = ara.role_id
WHERE p.role = 'admin';
```

---

## Troubleshooting

### Issue: Edge function returns 404

**Solution:**
- Ensure edge functions are deployed
- Check function names are correct
- Verify Supabase URL is correct

### Issue: User already exists error

**Solution:**
- Accounts already created, try logging in
- Or delete existing accounts first
- Edge function handles this automatically

### Issue: Permission denied errors

**Solution:**
- Check RLS policies are created
- Verify migrations are applied
- Use service role key for admin operations

### Issue: Login fails with "Invalid credentials"

**Solution:**
- Verify email spelling is exact
- Check password is exact (case-sensitive)
- Ensure email is confirmed in Supabase Auth
- Check user exists in auth.users table

### Issue: Vendor has no products

**Solution:**
- Run create-demo-accounts edge function
- Or manually create products for demo vendor
- Check products table has data

### Issue: Admin can't access dashboard

**Solution:**
- Verify admin role is assigned
- Check admin_role_assignments table
- Ensure profile.role = 'admin'
- Run create-admin-accounts function

---

## Post-Setup Tasks

After creating demo accounts:

1. ✅ Test each account login
2. ✅ Verify buyer can browse products
3. ✅ Verify vendor can access dashboard
4. ✅ Verify admin can access admin panel
5. ✅ Test complete purchase flow
6. ✅ Test vendor order processing
7. ✅ Test admin moderation features

---

## Security Reminder

⚠️ **IMPORTANT:** These demo accounts have publicly known credentials.

**For Production:**
- Delete or disable all demo accounts
- Never use these credentials in production
- Change all passwords if keeping accounts
- Enable 2FA for admin accounts
- Monitor for unauthorized access

---

## Quick Reference

### All Demo Credentials

```
BUYER:
Email: demo@buyer.nimex.ng
Password: DemoPassword123!

VENDOR:
Email: demo@vendor.nimex.ng
Password: DemoPassword123!

ADMIN (Super):
Email: admin@nimex.ng
Password: NimexAdmin2024!

ADMIN (Accounts):
Email: accounts@nimex.ng
Password: NimexAccounts2024!

ADMIN (Support):
Email: support@nimex.ng
Password: NimexSupport2024!
```

---

## Need More Help?

- Check DEMO_CREDENTIALS.md for detailed account information
- Review COMPREHENSIVE_TEST_REPORT.md for testing procedures
- Consult Supabase documentation for Auth issues
- Check edge function logs for errors

---

**Setup Complete!** 🎉

You now have fully functional demo accounts for testing all aspects of the NIMEX platform.
