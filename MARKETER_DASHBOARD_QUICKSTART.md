# Quick Start Guide: Marketer Dashboard

## Prerequisites
- Supabase project set up and linked
- Admin account created
- Application running locally

## Step-by-Step Setup

### 1. Apply Database Migration

Run the migration to set up triggers and RLS policies:

```bash
# Option 1: Using Supabase CLI (if linked)
npx supabase db push

# Option 2: Using Supabase Dashboard
# 1. Go to your Supabase project dashboard
# 2. Navigate to SQL Editor
# 3. Copy contents of: supabase/migrations/20251126000000_marketer_dashboard_sync.sql
# 4. Paste and execute
```

### 2. Verify Migration

Check that triggers were created:

```sql
-- In Supabase SQL Editor
SELECT 
  trigger_name, 
  event_object_table, 
  action_statement 
FROM information_schema.triggers 
WHERE trigger_name LIKE '%marketer%';
```

Expected results:
- `trigger_generate_marketer_referral_code` on `marketers`
- `trigger_update_marketer_stats` on `marketer_referrals`

### 3. Test Marketer Registration

1. Navigate to: `http://localhost:5173/marketer/register`
2. Fill out the registration form:
   - Full Name: Test Marketer
   - Email: testmarketer@example.com
   - Phone: +1234567890
   - Business Name: Test Marketing Co.
3. Submit the form
4. You should see: "Registration Submitted!" message

### 4. Verify Database Entry

```sql
-- Check marketer was created
SELECT 
  id, 
  full_name, 
  email, 
  referral_code, 
  status 
FROM marketers 
WHERE email = 'testmarketer@example.com';
```

Expected:
- `status` should be `'pending'`
- `referral_code` should be auto-generated (format: `MKT-XXXXXXXX`)

### 5. Approve Marketer (As Admin)

1. Log in as admin
2. Navigate to: `http://localhost:5173/admin/marketers`
3. Find the pending marketer
4. Click the green checkmark (✓) button to approve
5. Status should change to "Active"

### 6. Access Marketer Dashboard

**Option A: If marketer has an account**
1. Log in with marketer email
2. Navigate to: `http://localhost:5173/marketer/dashboard`
3. You should see the full dashboard

**Option B: If marketer needs to create account**
1. Go to: `http://localhost:5173/signup`
2. Sign up with the same email used for marketer registration
3. After signup, navigate to: `http://localhost:5173/marketer/dashboard`

### 7. Test Referral Link

1. On marketer dashboard, find the "Your Referral Link" section
2. Click "Copy" button
3. Open a new incognito/private window
4. Paste the link (should look like: `http://localhost:5173/signup?ref=MKT-XXXXXXXX`)
5. Sign up as a vendor using this link
6. Complete vendor onboarding

### 8. Verify Stats Update

After vendor completes onboarding:

```sql
-- Check referral was created
SELECT * FROM marketer_referrals 
WHERE marketer_id = '[your-marketer-id]';

-- Check stats were updated
SELECT 
  total_referrals, 
  total_commission_earned 
FROM marketers 
WHERE id = '[your-marketer-id]';
```

Expected:
- `total_referrals` should be `1`
- New entry in `marketer_referrals` table

### 9. Verify Dashboard Updates

1. Go back to marketer dashboard
2. Refresh the page
3. You should see:
   - Total Referrals: 1
   - Active Referrals: 1 (if status is 'completed')
   - The new vendor in the referrals table

## Common Issues & Solutions

### Issue: "Marketer Profile Not Found"
**Cause**: Email mismatch between logged-in user and marketer record
**Solution**: 
```sql
-- Update marketer record with user_id
UPDATE marketers 
SET user_id = '[auth-user-id]'
WHERE email = '[marketer-email]';
```

### Issue: Referral code not generated
**Cause**: Trigger not installed
**Solution**: Re-run the migration or manually execute:
```sql
UPDATE marketers 
SET referral_code = 'MKT-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8))
WHERE referral_code IS NULL;
```

### Issue: Stats not updating
**Cause**: Trigger not working
**Solution**: Manually update stats:
```sql
-- Update marketer stats
WITH stats AS (
  SELECT 
    marketer_id,
    COUNT(*) as total_refs,
    COALESCE(SUM(CASE WHEN commission_paid THEN commission_amount ELSE 0 END), 0) as total_comm
  FROM marketer_referrals
  WHERE marketer_id = '[your-marketer-id]'
  GROUP BY marketer_id
)
UPDATE marketers m
SET 
  total_referrals = s.total_refs,
  total_commission_earned = s.total_comm
FROM stats s
WHERE m.id = s.marketer_id;
```

### Issue: Can't access dashboard (403 or redirect)
**Cause**: RLS policies not applied or user not authenticated
**Solution**: 
1. Verify user is logged in
2. Check RLS policies are enabled:
```sql
SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('marketers', 'marketer_referrals');
```

## Testing Checklist

Use this checklist to verify everything works:

- [ ] Migration applied successfully
- [ ] Triggers created and working
- [ ] RLS policies enabled
- [ ] Can register as marketer
- [ ] Referral code auto-generated
- [ ] Admin can see pending marketer
- [ ] Admin can approve marketer
- [ ] Approved marketer can access dashboard
- [ ] Dashboard shows correct data
- [ ] Can copy referral link
- [ ] Vendor can sign up with referral link
- [ ] Referral appears in marketer dashboard
- [ ] Stats update automatically
- [ ] Pending marketer sees waiting message
- [ ] Suspended marketer sees disabled message

## Quick Commands Reference

```bash
# Start development server
npm run dev

# Open Supabase dashboard
npx supabase start

# Check database status
npx supabase status

# View database logs
npx supabase db logs

# Reset database (WARNING: deletes all data)
npx supabase db reset
```

## SQL Quick Reference

```sql
-- View all marketers
SELECT * FROM marketers ORDER BY created_at DESC;

-- View all marketer referrals
SELECT 
  mr.*,
  m.full_name as marketer_name,
  v.business_name as vendor_name
FROM marketer_referrals mr
JOIN marketers m ON m.id = mr.marketer_id
JOIN vendors v ON v.id = mr.vendor_id
ORDER BY mr.created_at DESC;

-- Check marketer stats
SELECT 
  full_name,
  email,
  referral_code,
  status,
  total_referrals,
  total_commission_earned
FROM marketers
WHERE status = 'active';

-- View pending commissions
SELECT 
  m.full_name,
  mr.commission_amount,
  mr.created_at,
  v.business_name
FROM marketer_referrals mr
JOIN marketers m ON m.id = mr.marketer_id
JOIN vendors v ON v.id = mr.vendor_id
WHERE mr.commission_paid = false
  AND mr.status = 'completed'
ORDER BY mr.created_at DESC;
```

## Next Steps

After successful setup:

1. **Create Test Data**: Register multiple marketers and vendors to test the system
2. **Test Edge Cases**: Try suspending/reactivating marketers, rejecting applications
3. **Monitor Performance**: Check query performance with larger datasets
4. **Implement Enhancements**: Add email notifications, additional pages, analytics

## Support

If you encounter issues:
1. Check the browser console for errors
2. Check Supabase logs for database errors
3. Verify all migrations were applied
4. Review the `MARKETER_DASHBOARD_SYSTEM.md` documentation
5. Test SQL queries manually in Supabase SQL Editor

---

**Last Updated**: November 26, 2025
**Version**: 1.0
