# Complete Database Migration Guide

## 🎯 Goal
Migrate all database schema, demo users, and admin credentials to Supabase at once.

## 📋 Three Methods to Choose From

### **Method 1: Manual (Recommended - Most Reliable)**
Copy and paste each migration file into Supabase SQL Editor in order.

### **Method 2: Automated Script**
Use the PowerShell script to generate a combined SQL file.

### **Method 3: Supabase CLI**
Use Supabase CLI to push all migrations automatically.

---

## 🚀 Method 1: Manual Migration (RECOMMENDED)

This is the most reliable method and gives you control over each step.

### Step-by-Step Instructions:

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select project: `frlayqbmnpmjtwxrweke`
   - Click **SQL Editor** in left sidebar

2. **Run Migrations in This Order:**

   Copy and paste each file's contents into SQL Editor and click "Run":

   #### ✅ **Migration 1: Core Schema**
   ```
   File: supabase/migrations/20251105095128_complete_production_schema.sql
   Description: Creates all core tables (profiles, vendors, products, orders, etc.)
   ```

   #### ✅ **Migration 2: Admin Roles & Analytics**
   ```
   File: supabase/migrations/20251105095252_admin_roles_analytics_tables.sql
   Description: Sets up admin roles, permissions, and analytics
   ```

   #### ✅ **Migration 3: Chat System**
   ```
   File: supabase/migrations/20251022173018_create_chat_system.sql
   Description: Creates chat conversations and messages
   ```

   #### ✅ **Migration 4: Ads Management**
   ```
   File: supabase/migrations/20251022180653_create_ads_management_system.sql
   Description: Creates ads and campaigns tables
   ```

   #### ✅ **Migration 5: Escrow & Delivery**
   ```
   File: supabase/migrations/20251023120000_create_escrow_delivery_system.sql
   Description: Creates escrow transactions and delivery tracking
   ```

   #### ✅ **Migration 6: Market Locations & Tags**
   ```
   File: supabase/migrations/20251024070431_create_market_locations_and_product_tags.sql
   Description: Adds market locations and product tagging
   ```

   #### ✅ **Migration 7: Flutterwave Wallets**
   ```
   File: supabase/migrations/20251025020000_add_flutterwave_vendor_wallets.sql
   Description: Adds wallet integration for vendors
   ```

   #### ✅ **Migration 8: Referral & Commission System**
   ```
   File: supabase/migrations/20251105105227_create_referral_commission_system.sql
   Description: Creates marketer and vendor referral system
   ```

   #### ✅ **Migration 9: RLS Policy Fix**
   ```
   File: supabase/migrations/20251103081200_fix_profiles_rls_policy.sql
   Description: Fixes Row Level Security policies
   ```

   #### ✅ **Migration 10: Update Admin Role**
   ```
   File: supabase/migrations/20251111131500_update_admin_role.sql
   Description: Updates admin role configuration
   ```

   #### ✅ **Migration 11: Vendor Preferences**
   ```
   File: supabase/migrations/20251119100000_add_vendor_preferences.sql
   Description: Adds vendor notification preferences
   ```

   #### ✅ **Migration 12: Cart Tables**
   ```
   File: supabase/migrations/20251123120000_create_cart_tables.sql
   Description: Creates shopping cart tables
   ```

   #### ✅ **Migration 13: Marketer Dashboard**
   ```
   File: supabase/migrations/20251126000000_marketer_dashboard_sync.sql
   Description: Adds triggers and RLS for marketer dashboard
   ```

   #### ✅ **Migration 14: Demo Accounts & Admin** ⭐ **IMPORTANT**
   ```
   File: supabase/migrations/20251023000000_create_demo_accounts.sql
   Description: Creates demo users and admin accounts
   ```

3. **After Each Migration:**
   - Wait for "Success" message
   - Check for any errors
   - If error occurs, note it and continue (some errors are expected for existing objects)

---

## 🤖 Method 2: Automated Script

### Option A: Generate Combined SQL File

1. **Run the PowerShell Script:**
   ```powershell
   cd c:\Users\Stephen\Documents\nimex
   .\run-all-migrations.ps1
   ```

2. **Choose Option 3** (Generate combined SQL file)

3. **The script will create:**
   ```
   supabase/ALL_MIGRATIONS_COMBINED.sql
   ```

4. **Copy and paste this file into Supabase SQL Editor**

### Option B: Use Script to Run Migrations

If you have `psql` installed:

1. **Run the PowerShell Script:**
   ```powershell
   .\run-all-migrations.ps1
   ```

2. **Choose Option 2** (Use PostgreSQL client)

3. **The script will automatically run all migrations**

---

## 🔧 Method 3: Supabase CLI

### Prerequisites:
- Install Supabase CLI: `npm install -g supabase`

### Steps:

1. **Link to your project:**
   ```bash
   supabase link --project-ref frlayqbmnpmjtwxrweke
   ```

2. **Push all migrations:**
   ```bash
   supabase db push
   ```

3. **Done!** All migrations will be applied automatically.

---

## ✅ Verification

After running all migrations, verify with these queries in Supabase SQL Editor:

### 1. Check All Tables
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

**Expected: ~40+ tables**

### 2. Check Admin Accounts
```sql
SELECT 
  email,
  full_name,
  role,
  created_at
FROM profiles 
WHERE role = 'admin'
ORDER BY created_at;
```

**Expected: At least 1 admin account**

### 3. Check Demo Accounts
```sql
SELECT 
  p.email,
  p.full_name,
  p.role,
  v.business_name
FROM profiles p
LEFT JOIN vendors v ON v.user_id = p.id
WHERE p.email LIKE '%demo%' OR p.email LIKE '%test%'
ORDER BY p.role, p.email;
```

**Expected: Demo vendor, demo buyer accounts**

### 4. Check Triggers
```sql
SELECT 
  trigger_name, 
  event_object_table
FROM information_schema.triggers 
WHERE event_object_schema = 'public'
ORDER BY event_object_table, trigger_name;
```

**Expected: Multiple triggers including marketer referral code generation**

### 5. Check RLS Policies
```sql
SELECT 
  tablename, 
  policyname,
  cmd
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

**Expected: RLS policies on all major tables**

### 6. Check Marketer System
```sql
SELECT 
  (SELECT COUNT(*) FROM marketers) as total_marketers,
  (SELECT COUNT(*) FROM marketer_referrals) as marketer_referrals,
  (SELECT COUNT(*) FROM commission_settings) as commission_settings;
```

**Expected: Tables exist (counts may be 0)**

---

## 🔑 Default Credentials

After migration, you'll have these accounts:

### Admin Account
```
Email: admin@nimex.com
Password: [Check migration file 20251023000000_create_demo_accounts.sql]
Role: admin
```

### Demo Vendor
```
Email: vendor.demo@nimex.com
Password: [Check migration file]
Role: vendor
```

### Demo Buyer
```
Email: buyer.demo@nimex.com
Password: [Check migration file]
Role: buyer
```

**⚠️ IMPORTANT: Change these passwords in production!**

---

## 🐛 Troubleshooting

### Issue: "relation already exists"
**Solution:** This is normal if some tables already exist. Continue with next migration.

### Issue: "function already exists"
**Solution:** Migrations use `CREATE OR REPLACE`. This is normal.

### Issue: "policy already exists"
**Solution:** Migrations use `DROP POLICY IF EXISTS`. This is normal.

### Issue: Migration fails partway through
**Solution:** 
1. Note which migration failed
2. Check the error message
3. Continue with next migrations
4. Come back to failed one later

### Issue: Can't login with admin account
**Solution:**
1. Check if admin account exists:
   ```sql
   SELECT * FROM auth.users WHERE email = 'admin@nimex.com';
   ```
2. If not, re-run migration 14 (create_demo_accounts.sql)

---

## 📊 Post-Migration Checklist

After all migrations are complete:

- [ ] All tables created (verify with query)
- [ ] Admin account exists and can login
- [ ] Demo accounts exist
- [ ] Triggers are working (test referral code generation)
- [ ] RLS policies are active
- [ ] Can access admin dashboard at `/admin`
- [ ] Can register as marketer at `/marketer/register`
- [ ] Can create products as vendor
- [ ] Can place orders as buyer

---

## 🎉 Success!

Once all migrations are complete and verified, your database is fully set up with:

✅ Complete schema (all tables, relationships, constraints)  
✅ Admin roles and permissions  
✅ Chat system  
✅ Ads management  
✅ Escrow & delivery tracking  
✅ Market locations & product tags  
✅ Flutterwave wallet integration  
✅ Referral & commission system  
✅ Shopping cart  
✅ Marketer dashboard with auto-sync  
✅ Demo accounts for testing  
✅ Admin credentials  
✅ Row Level Security policies  
✅ Database triggers for automation  
✅ Performance indexes  

---

## 📞 Need Help?

If you encounter issues:
1. Check the error message carefully
2. Verify which migration failed
3. Check if tables/functions already exist
4. Try running the failed migration again
5. Check Supabase logs in dashboard

---

**Created:** November 26, 2025  
**Database:** frlayqbmnpmjtwxrweke  
**Total Migrations:** 14  
**Estimated Time:** 5-10 minutes (manual) or 2-3 minutes (automated)
