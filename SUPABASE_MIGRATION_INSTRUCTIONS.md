# Supabase Migration Instructions

## How to Apply the Marketer Dashboard Migration

Since we don't have `psql` installed locally, follow these steps to apply the migration directly in your Supabase dashboard:

### Step 1: Access Supabase SQL Editor

1. Go to: https://supabase.com/dashboard
2. Select your project: **frlayqbmnpmjtwxrweke**
3. Click on **SQL Editor** in the left sidebar

### Step 2: Run the Migration

1. Click **New Query** button
2. Copy the entire contents of the file:
   `supabase/migrations/20251126000000_marketer_dashboard_sync.sql`
3. Paste it into the SQL Editor
4. Click **Run** or press `Ctrl+Enter`

### Step 3: Verify Migration Success

After running the migration, you should see success messages for:
- ✅ Functions created (2)
- ✅ Triggers created (2)
- ✅ RLS policies created (8)
- ✅ Indexes created (7)

### Step 4: Verify Triggers

Run this query to confirm triggers were created:

```sql
SELECT 
  trigger_name, 
  event_object_table, 
  action_timing,
  event_manipulation
FROM information_schema.triggers 
WHERE trigger_name LIKE '%marketer%'
ORDER BY trigger_name;
```

**Expected Results:**
- `trigger_generate_marketer_referral_code` on `marketers` (BEFORE INSERT)
- `trigger_update_marketer_stats` on `marketer_referrals` (AFTER INSERT/UPDATE/DELETE)

### Step 5: Verify RLS Policies

Run this query to confirm RLS policies were created:

```sql
SELECT 
  schemaname,
  tablename, 
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN ('marketers', 'marketer_referrals')
ORDER BY tablename, policyname;
```

**Expected Results:**
- 4 policies on `marketers` table
- 4 policies on `marketer_referrals` table

### Step 6: Test Referral Code Generation

Test that the trigger auto-generates referral codes:

```sql
-- Insert a test marketer (will be auto-deleted after test)
INSERT INTO marketers (full_name, email, phone, status)
VALUES ('Test Marketer', 'test-migration@example.com', '+1234567890', 'pending')
RETURNING id, referral_code;

-- Check the referral code was generated
SELECT id, full_name, email, referral_code, status
FROM marketers
WHERE email = 'test-migration@example.com';

-- Clean up test data
DELETE FROM marketers WHERE email = 'test-migration@example.com';
```

**Expected Result:**
- `referral_code` should be auto-generated in format: `MKT-XXXXXXXX`

### Step 7: Test Stats Update Trigger

Test that stats update automatically:

```sql
-- First, create a real test marketer
INSERT INTO marketers (full_name, email, phone, status)
VALUES ('Stats Test Marketer', 'stats-test@example.com', '+1234567890', 'active')
RETURNING id;

-- Note the marketer ID from above, then create a test referral
-- Replace [MARKETER_ID] and [VENDOR_ID] with actual IDs
INSERT INTO marketer_referrals (
  marketer_id, 
  vendor_id, 
  referral_code, 
  commission_amount, 
  status, 
  commission_paid
)
VALUES (
  '[MARKETER_ID]',  -- Replace with actual marketer ID
  (SELECT id FROM vendors LIMIT 1),  -- Uses first vendor
  'MKT-TEST123',
  10000,
  'completed',
  true
);

-- Check that stats were updated automatically
SELECT 
  full_name,
  email,
  total_referrals,
  total_commission_earned
FROM marketers
WHERE email = 'stats-test@example.com';

-- Clean up test data
DELETE FROM marketer_referrals WHERE referral_code = 'MKT-TEST123';
DELETE FROM marketers WHERE email = 'stats-test@example.com';
```

**Expected Result:**
- `total_referrals` should be `1`
- `total_commission_earned` should be `10000`

### Troubleshooting

#### Error: "relation marketers does not exist"
**Solution**: The marketers table needs to be created first. Check if the table exists:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'marketers';
```

If it doesn't exist, you need to run the referral system migration first:
`supabase/migrations/20251105105227_create_referral_commission_system.sql`

#### Error: "function auth.uid() does not exist"
**Solution**: This is a Supabase auth function. Make sure you're running this on your Supabase project, not a local PostgreSQL instance.

#### Error: "policy already exists"
**Solution**: The migration uses `DROP POLICY IF EXISTS` so this shouldn't happen. If it does, you can manually drop the policies:
```sql
DROP POLICY IF EXISTS "Marketers can view own data" ON marketers;
-- Repeat for other policies, then re-run migration
```

### Alternative: Use Supabase CLI (If Available)

If you have Supabase CLI installed and linked:

```bash
# Link to your project
supabase link --project-ref frlayqbmnpmjtwxrweke

# Push migrations
supabase db push
```

### Connection Details (For Reference)

- **Host**: db.frlayqbmnpmjtwxrweke.supabase.co
- **Port**: 5432
- **Database**: postgres
- **User**: postgres
- **Project Reference**: frlayqbmnpmjtwxrweke

---

## After Migration is Complete

Once the migration is successfully applied:

1. ✅ Test marketer registration at `/marketer/register`
2. ✅ Approve a marketer as admin at `/admin/marketers`
3. ✅ Test marketer dashboard access at `/marketer/dashboard`
4. ✅ Verify stats update when vendors sign up with referral codes

## Need Help?

If you encounter any issues:
1. Check the Supabase logs in the dashboard
2. Verify all previous migrations have been applied
3. Ensure the `marketers` and `marketer_referrals` tables exist
4. Review the error messages carefully

---

**Created**: November 26, 2025
**Migration File**: `20251126000000_marketer_dashboard_sync.sql`
