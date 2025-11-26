# Marketer Dashboard System

## Overview
The Marketer Dashboard system allows marketing partners to register, get approved by admins, and track their vendor referrals and commission earnings. This document outlines the complete flow and integration with the admin dashboard.

## System Components

### 1. **Marketer Registration**
- **Screen**: `MarketerRegistrationScreen.tsx`
- **Route**: `/marketer/register`
- **Access**: Public (anyone can register)
- **Process**:
  1. User fills out registration form (name, email, phone, business name)
  2. Data is submitted to `marketers` table with status `pending`
  3. Referral code is auto-generated via database trigger (format: `MKT-XXXXXXXX`)
  4. User sees success message and waits for admin approval

### 2. **Admin Approval**
- **Screen**: `AdminMarketersScreen.tsx`
- **Route**: `/admin/marketers`
- **Access**: Admin only
- **Process**:
  1. Admin views all marketer applications
  2. Can filter by status: all, pending, active, suspended
  3. For pending marketers, admin can:
     - **Approve**: Changes status to `active`, sets `approved_at` timestamp
     - **Reject**: Changes status to `inactive`
  4. For active marketers, admin can:
     - **Suspend**: Changes status to `suspended`
  5. For suspended marketers, admin can:
     - **Reactivate**: Changes status back to `active`

### 3. **Marketer Dashboard**
- **Screen**: `MarketerDashboardScreen.tsx`
- **Route**: `/marketer/dashboard`
- **Access**: Protected (requires login)
- **Layout**: `MarketerLayout.tsx`
- **Features**:
  - **Status Checks**:
    - If status is `pending`: Shows waiting message
    - If status is `suspended` or `inactive`: Shows account disabled message
    - If status is `active`: Shows full dashboard
  - **Referral Link Section**:
    - Displays unique referral link
    - Copy to clipboard functionality
    - Shows referral code
  - **Statistics Cards**:
    - Total Referrals
    - Active Referrals (completed)
    - Pending Referrals
    - Total Commission Earned
  - **Commission Overview**:
    - Paid Commission
    - Pending Commission
  - **Referrals Table**:
    - Lists all vendor referrals
    - Shows vendor name, date, status, commission amount, payment status
    - Real-time data from database

## Database Schema

### `marketers` Table
```sql
- id: uuid (primary key)
- user_id: uuid (nullable, links to auth.users)
- full_name: text
- email: text (unique)
- phone: text
- business_name: text (nullable)
- referral_code: text (unique, auto-generated)
- status: enum ('pending', 'active', 'suspended', 'inactive')
- total_referrals: integer (auto-updated via trigger)
- total_commission_earned: decimal (auto-updated via trigger)
- bank_account_details: jsonb (nullable)
- approved_by: uuid (nullable)
- approved_at: timestamp (nullable)
- created_at: timestamp
- updated_at: timestamp
```

### `marketer_referrals` Table
```sql
- id: uuid (primary key)
- marketer_id: uuid (foreign key to marketers)
- vendor_id: uuid (foreign key to vendors)
- referral_code: text
- status: enum ('pending', 'completed', 'rejected')
- commission_amount: decimal
- commission_paid: boolean
- commission_paid_at: timestamp (nullable)
- created_at: timestamp
- updated_at: timestamp
```

## Data Synchronization

### Admin Dashboard → Marketer Data
When admin performs actions on `AdminMarketersScreen`:
- **Approve Marketer**: Updates `status` to `active` and sets `approved_at`
- **Suspend Marketer**: Updates `status` to `suspended`
- **Reject Marketer**: Updates `status` to `inactive`

These changes are immediately reflected in:
- Marketer's dashboard (if they're logged in)
- Admin dashboard statistics
- Marketer list filters

### Marketer Referrals → Stats Update
When a vendor signs up using a marketer's referral code:
1. New record created in `marketer_referrals` table
2. Database trigger `update_marketer_stats()` automatically:
   - Counts total referrals
   - Calculates total commission earned (completed + paid only)
   - Updates `marketers` table with new stats
3. Changes are immediately visible in:
   - Marketer dashboard
   - Admin marketers screen
   - Admin dashboard (marketer statistics)

### Commission Payment Flow
1. Admin navigates to `/admin/commissions`
2. Views pending commission payments
3. Marks commission as paid
4. Updates `marketer_referrals.commission_paid = true`
5. Sets `commission_paid_at` timestamp
6. Trigger updates `marketers.total_commission_earned`
7. Marketer sees updated "Paid Commission" in their dashboard

## Authentication & Access Control

### Row Level Security (RLS) Policies

#### Marketers Table
- **SELECT**: 
  - Marketers can view their own data (matched by email or user_id)
  - Admins can view all marketers
- **INSERT**: 
  - Anyone can register (for public registration)
- **UPDATE**: 
  - Admins only
- **DELETE**: 
  - Not allowed

#### Marketer Referrals Table
- **SELECT**: 
  - Marketers can view their own referrals
  - Admins can view all referrals
- **INSERT**: 
  - System/Service (when vendor signs up with referral code)
- **UPDATE**: 
  - Admins only (for commission payments)
- **DELETE**: 
  - Not allowed

## User Flow

### New Marketer Registration
1. User visits `/marketer/register`
2. Fills out registration form
3. Submits form → Creates record in `marketers` table with `status = 'pending'`
4. Sees success message: "Application submitted, pending approval"
5. Receives email notification (future enhancement)

### Admin Approval
1. Admin logs in and visits `/admin/marketers`
2. Sees pending marketer applications
3. Reviews marketer details
4. Clicks "Approve" button
5. Marketer status changes to `active`
6. Marketer receives approval email (future enhancement)

### Marketer Login & Dashboard Access
1. Marketer logs in with their email (must have created account)
2. System checks if user email matches a marketer record
3. If status is `active`, redirects to `/marketer/dashboard`
4. If status is `pending`, shows waiting message
5. If status is `suspended` or `inactive`, shows account disabled message

### Sharing Referral Link
1. Marketer copies referral link from dashboard
2. Shares link via social media, email, etc.
3. Vendor clicks link and signs up
4. System detects referral code in URL
5. Creates `marketer_referrals` record when vendor completes onboarding
6. Marketer sees new referral in dashboard

## API/Service Methods

### `referralService.ts`
- `registerMarketer(data)`: Creates new marketer record
- `getMarketerByEmail(email)`: Fetches marketer info by email
- `getMarketerReferrals(marketerId)`: Gets all referrals for a marketer
- `validateReferralCode(code)`: Validates if referral code exists and is active
- `createMarketerReferral(...)`: Creates new referral record
- `generateReferralLink(code)`: Generates shareable referral URL
- `copyReferralLink(code)`: Copies link to clipboard

## Routes

### Public Routes
- `/marketer/register` - Marketer registration form

### Protected Routes (Require Login)
- `/marketer/dashboard` - Main marketer dashboard

### Admin Routes
- `/admin/marketers` - Marketer management
- `/admin/commissions` - Commission payments management

## Future Enhancements

1. **Email Notifications**
   - Send email when marketer is approved
   - Send email when commission is paid
   - Weekly/monthly referral summary emails

2. **Additional Marketer Pages**
   - `/marketer/referrals` - Detailed referrals page
   - `/marketer/earnings` - Earnings history and analytics
   - `/marketer/settings` - Profile and bank account settings

3. **Analytics**
   - Referral conversion rates
   - Top performing marketers
   - Commission trends over time

4. **Payout Integration**
   - Automated payout requests
   - Integration with payment providers
   - Payout history tracking

5. **Marketing Materials**
   - Downloadable promotional materials
   - Social media templates
   - Email templates

## Testing Checklist

- [ ] Marketer can register successfully
- [ ] Admin can view pending marketers
- [ ] Admin can approve marketer
- [ ] Admin can reject marketer
- [ ] Admin can suspend active marketer
- [ ] Admin can reactivate suspended marketer
- [ ] Approved marketer can log in and access dashboard
- [ ] Pending marketer sees waiting message
- [ ] Suspended marketer sees account disabled message
- [ ] Marketer can copy referral link
- [ ] Referral stats update when new vendor signs up
- [ ] Commission stats update when admin marks payment as paid
- [ ] RLS policies prevent unauthorized access
- [ ] Database triggers work correctly

## Troubleshooting

### Marketer can't access dashboard
- Check if marketer status is `active`
- Verify marketer email matches logged-in user email
- Check if user_id is linked in marketers table

### Stats not updating
- Verify database triggers are installed
- Check if migration `20251126000000_marketer_dashboard_sync.sql` was run
- Manually run trigger function to test

### Referral code not working
- Verify referral code format (should be `MKT-XXXXXXXX`)
- Check if marketer status is `active`
- Verify referral code exists in database

## Migration Instructions

1. Run the migration:
   ```bash
   supabase db push
   ```

2. Verify triggers are created:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname LIKE '%marketer%';
   ```

3. Test referral code generation:
   ```sql
   INSERT INTO marketers (full_name, email, phone) 
   VALUES ('Test Marketer', 'test@example.com', '+1234567890');
   
   SELECT referral_code FROM marketers WHERE email = 'test@example.com';
   ```

4. Test stats update:
   ```sql
   -- Should automatically update marketer stats
   INSERT INTO marketer_referrals (marketer_id, vendor_id, referral_code, commission_amount, status, commission_paid)
   VALUES ('[marketer-id]', '[vendor-id]', 'MKT-12345678', 10000, 'completed', true);
   
   SELECT total_referrals, total_commission_earned FROM marketers WHERE id = '[marketer-id]';
   ```
