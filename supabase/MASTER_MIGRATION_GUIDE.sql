-- ============================================================================
-- NIMEX E-COMMERCE PLATFORM - COMPLETE DATABASE MIGRATION
-- ============================================================================
-- This script contains all migrations in chronological order
-- Run this in Supabase SQL Editor to set up the complete database
-- 
-- Includes:
-- - Core schema (tables, relationships, constraints)
-- - Chat system
-- - Ads management
-- - Escrow & delivery system
-- - Market locations & product tags
-- - Admin roles & permissions
-- - Flutterwave vendor wallets
-- - Referral & commission system
-- - Cart tables
-- - Marketer dashboard system
-- - Demo accounts & admin credentials
-- 
-- Created: November 26, 2025
-- ============================================================================

-- IMPORTANT: Run this script in your Supabase SQL Editor
-- Project: frlayqbmnpmjtwxrweke
-- Database: postgres
-- ============================================================================

-- Note: This is a master migration file that references all individual migrations
-- For the complete setup, you need to run each migration file in order
-- OR use the consolidated script below

-- ============================================================================
-- MIGRATION ORDER (Run these files in Supabase SQL Editor in this order)
-- ============================================================================

/*
1. Core Schema & Tables
   File: 20251105095128_complete_production_schema.sql
   Description: Creates all core tables (profiles, vendors, products, orders, etc.)

2. Admin Roles & Permissions
   File: 20251105095252_admin_roles_analytics_tables.sql
   Description: Sets up admin roles, permissions, and analytics tables

3. Chat System
   File: 20251022173018_create_chat_system.sql
   Description: Creates chat conversations and messages tables

4. Ads Management
   File: 20251022180653_create_ads_management_system.sql
   Description: Creates ads and campaigns tables

5. Escrow & Delivery System
   File: 20251023120000_create_escrow_delivery_system.sql
   Description: Creates escrow transactions and delivery tracking

6. Market Locations & Product Tags
   File: 20251024070431_create_market_locations_and_product_tags.sql
   Description: Adds market locations and product tagging system

7. Flutterwave Vendor Wallets
   File: 20251025020000_add_flutterwave_vendor_wallets.sql
   Description: Adds wallet integration for vendors

8. Referral & Commission System
   File: 20251105105227_create_referral_commission_system.sql
   Description: Creates marketer and vendor referral system

9. RLS Policy Fix
   File: 20251103081200_fix_profiles_rls_policy.sql
   Description: Fixes Row Level Security policies for profiles

10. Update Admin Role
    File: 20251111131500_update_admin_role.sql
    Description: Updates admin role configuration

11. Vendor Preferences
    File: 20251119100000_add_vendor_preferences.sql
    Description: Adds vendor notification preferences

12. Cart Tables
    File: 20251123120000_create_cart_tables.sql
    Description: Creates shopping cart tables

13. Marketer Dashboard Sync
    File: 20251126000000_marketer_dashboard_sync.sql
    Description: Adds triggers and RLS for marketer dashboard

14. Demo Accounts & Admin Credentials
    File: 20251023000000_create_demo_accounts.sql
    Description: Creates demo users and admin accounts
*/

-- ============================================================================
-- QUICK START INSTRUCTIONS
-- ============================================================================

/*
OPTION 1: Run Individual Migration Files (RECOMMENDED)
--------------------------------------------------------
1. Go to Supabase Dashboard → SQL Editor
2. For each file listed above (in order):
   a. Open the migration file from supabase/migrations/
   b. Copy the entire contents
   c. Paste into SQL Editor
   d. Click "Run" or press Ctrl+Enter
   e. Wait for success confirmation
   f. Move to next file

OPTION 2: Use Supabase CLI (If Available)
------------------------------------------
If you have Supabase CLI installed:

# Link to your project
supabase link --project-ref frlayqbmnpmjtwxrweke

# Push all migrations
supabase db push

OPTION 3: Use PostgreSQL Client (If psql is installed)
-------------------------------------------------------
# Set password
$env:PGPASSWORD='@Nimex.online!#@123'

# Run all migrations in order
Get-ChildItem "supabase\migrations\*.sql" | 
  Sort-Object Name | 
  ForEach-Object {
    Write-Host "Running: $($_.Name)"
    psql -h db.frlayqbmnpmjtwxrweke.supabase.co -U postgres -d postgres -p 5432 -f $_.FullName
  }
*/

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- After running all migrations, verify with these queries:

-- 1. Check all tables were created
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. Check triggers
SELECT 
  trigger_name, 
  event_object_table, 
  action_timing,
  event_manipulation
FROM information_schema.triggers 
WHERE event_object_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- 3. Check RLS policies
SELECT 
  schemaname,
  tablename, 
  policyname,
  cmd
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 4. Check indexes
SELECT 
  schemaname,
  tablename,
  indexname
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 5. Check admin accounts
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.role,
  p.created_at
FROM profiles p
WHERE p.role = 'admin'
ORDER BY p.created_at;

-- 6. Check demo accounts
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.role,
  v.business_name
FROM profiles p
LEFT JOIN vendors v ON v.user_id = p.id
WHERE p.email LIKE '%demo%' OR p.email LIKE '%test%'
ORDER BY p.role, p.email;

-- 7. Check marketers table
SELECT COUNT(*) as total_marketers FROM marketers;

-- 8. Check referral system
SELECT 
  (SELECT COUNT(*) FROM marketers) as total_marketers,
  (SELECT COUNT(*) FROM marketer_referrals) as total_marketer_referrals,
  (SELECT COUNT(*) FROM vendor_referrals) as total_vendor_referrals,
  (SELECT COUNT(*) FROM commission_settings) as commission_settings;

-- ============================================================================
-- POST-MIGRATION SETUP
-- ============================================================================

/*
After all migrations are complete:

1. Verify Admin Access
   - Try logging in with admin credentials
   - Check admin dashboard at /admin

2. Test Demo Accounts
   - Try logging in with demo vendor account
   - Try logging in with demo buyer account

3. Test Marketer Registration
   - Go to /marketer/register
   - Register a test marketer
   - Approve as admin
   - Access marketer dashboard

4. Configure Commission Settings
   - Set vendor referral commission amount
   - Set marketer referral commission amount

5. Test Complete User Flows
   - Vendor registration with referral code
   - Product creation
   - Order placement
   - Escrow transaction
   - Commission tracking
*/

-- ============================================================================
-- TROUBLESHOOTING
-- ============================================================================

/*
Common Issues:

1. "relation already exists"
   - Some tables may already exist
   - Check which migrations have been run
   - Skip those migrations or use DROP TABLE IF EXISTS

2. "function already exists"
   - Use CREATE OR REPLACE FUNCTION instead
   - Or drop the function first

3. "policy already exists"
   - Migrations use DROP POLICY IF EXISTS
   - If error persists, manually drop the policy

4. "permission denied"
   - Ensure you're logged in as postgres user
   - Check RLS policies aren't blocking operations

5. "auth.uid() does not exist"
   - This is a Supabase auth function
   - Ensure you're running on Supabase, not local PostgreSQL
*/

-- ============================================================================
-- IMPORTANT NOTES
-- ============================================================================

/*
1. Order Matters
   - Run migrations in the order listed above
   - Some migrations depend on tables from previous migrations

2. Demo Accounts
   - Demo account passwords are in the migration file
   - Change these in production!

3. Admin Credentials
   - Default admin email: admin@nimex.com
   - Change password after first login

4. RLS Policies
   - All tables have Row Level Security enabled
   - Policies control data access based on user role

5. Triggers
   - Auto-generate referral codes
   - Auto-update statistics
   - Auto-update timestamps

6. Indexes
   - Created for performance optimization
   - May take time on large datasets
*/

-- ============================================================================
-- END OF MASTER MIGRATION GUIDE
-- ============================================================================

-- For detailed information about each migration, see the individual files
-- in the supabase/migrations/ directory
