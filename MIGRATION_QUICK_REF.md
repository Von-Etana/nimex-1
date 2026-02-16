# 🚀 QUICK MIGRATION REFERENCE

## Fastest Method: Supabase CLI

```bash
# Install CLI
npm install -g supabase

# Link project
supabase link --project-ref frlayqbmnpmjtwxrweke

# Push all migrations
supabase db push
```

## Manual Method: Run in Order

Open Supabase Dashboard → SQL Editor, then run these files in order:

1. ✅ `20251105095128_complete_production_schema.sql` - Core tables
2. ✅ `20251105095252_admin_roles_analytics_tables.sql` - Admin system
3. ✅ `20251022173018_create_chat_system.sql` - Chat
4. ✅ `20251022180653_create_ads_management_system.sql` - Ads
5. ✅ `20251023120000_create_escrow_delivery_system.sql` - Escrow
6. ✅ `20251024070431_create_market_locations_and_product_tags.sql` - Locations
7. ✅ `20251025020000_add_flutterwave_vendor_wallets.sql` - Wallets
8. ✅ `20251105105227_create_referral_commission_system.sql` - Referrals
9. ✅ `20251103081200_fix_profiles_rls_policy.sql` - RLS fix
10. ✅ `20251111131500_update_admin_role.sql` - Admin update
11. ✅ `20251119100000_add_vendor_preferences.sql` - Preferences
12. ✅ `20251123120000_create_cart_tables.sql` - Cart
13. ✅ `20251126000000_marketer_dashboard_sync.sql` - Marketer dashboard
14. ✅ `20251023000000_create_demo_accounts.sql` - **Demo & Admin accounts** ⭐

## Quick Verify

```sql
-- Check tables
SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';
-- Expected: 40+

-- Check admin
SELECT email, role FROM profiles WHERE role = 'admin';
-- Expected: admin@nimex.com

-- Check demos
SELECT email, role FROM profiles WHERE email LIKE '%demo%';
-- Expected: vendor.demo@nimex.com, buyer.demo@nimex.com
```

## Default Credentials

- **Admin**: admin@nimex.com (check migration file for password)
- **Demo Vendor**: vendor.demo@nimex.com
- **Demo Buyer**: buyer.demo@nimex.com

⚠️ **Change passwords in production!**

## Connection String

```
postgresql://postgres:[@Nimex.online!#@123]@db.frlayqbmnpmjtwxrweke.supabase.co:5432/postgres
```

## Files Created

- ✅ `COMPLETE_MIGRATION_GUIDE.md` - Full detailed guide
- ✅ `run-all-migrations.ps1` - Automated PowerShell script
- ✅ `supabase/MASTER_MIGRATION_GUIDE.sql` - SQL reference
- ✅ `SUPABASE_MIGRATION_INSTRUCTIONS.md` - Marketer dashboard migration

## Need Help?

See `COMPLETE_MIGRATION_GUIDE.md` for detailed instructions and troubleshooting.
