# Marketer Dashboard System Flow

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     MARKETER DASHBOARD SYSTEM                    │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐         ┌──────────────────┐         ┌──────────────────┐
│                  │         │                  │         │                  │
│  PUBLIC USERS    │────────▶│  MARKETERS       │◀────────│  ADMINS          │
│                  │         │                  │         │                  │
└──────────────────┘         └──────────────────┘         └──────────────────┘
        │                            │                            │
        │                            │                            │
        ▼                            ▼                            ▼
┌──────────────────┐         ┌──────────────────┐         ┌──────────────────┐
│ Register as      │         │ View Dashboard   │         │ Manage Marketers │
│ Marketer         │         │ Share Ref Link   │         │ Approve/Suspend  │
│ /marketer/       │         │ Track Referrals  │         │ Pay Commissions  │
│ register         │         │ View Earnings    │         │ /admin/marketers │
└──────────────────┘         └──────────────────┘         └──────────────────┘
```

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          REGISTRATION FLOW                               │
└─────────────────────────────────────────────────────────────────────────┘

1. User Registration
   ┌──────────┐
   │  User    │
   │  Visits  │──────▶ /marketer/register
   │  Page    │
   └──────────┘
        │
        ▼
   ┌──────────────────────────────┐
   │  Fills Registration Form     │
   │  - Full Name                 │
   │  - Email                     │
   │  - Phone                     │
   │  - Business Name (optional)  │
   └──────────────────────────────┘
        │
        ▼
   ┌──────────────────────────────┐
   │  Submit to Database          │
   │  referralService.            │
   │  registerMarketer()          │
   └──────────────────────────────┘
        │
        ▼
   ┌──────────────────────────────┐
   │  Database Trigger Fires      │
   │  generate_marketer_          │
   │  referral_code()             │
   │  → Creates: MKT-XXXXXXXX     │
   └──────────────────────────────┘
        │
        ▼
   ┌──────────────────────────────┐
   │  Record Created              │
   │  status: 'pending'           │
   │  referral_code: MKT-XXXXXXXX │
   └──────────────────────────────┘
        │
        ▼
   ┌──────────────────────────────┐
   │  Success Message Displayed   │
   │  "Application Submitted"     │
   └──────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────┐
│                          APPROVAL FLOW                                   │
└─────────────────────────────────────────────────────────────────────────┘

2. Admin Approval
   ┌──────────┐
   │  Admin   │
   │  Logs In │──────▶ /admin/marketers
   └──────────┘
        │
        ▼
   ┌──────────────────────────────┐
   │  Views Pending Marketers     │
   │  Filter: status='pending'    │
   └──────────────────────────────┘
        │
        ▼
   ┌──────────────────────────────┐
   │  Reviews Application         │
   │  - Name, Email, Phone        │
   │  - Business Name             │
   │  - Referral Code             │
   └──────────────────────────────┘
        │
        ├────────────┬────────────┐
        ▼            ▼            ▼
   ┌─────────┐  ┌─────────┐  ┌─────────┐
   │ Approve │  │ Reject  │  │ Suspend │
   └─────────┘  └─────────┘  └─────────┘
        │            │            │
        ▼            ▼            ▼
   status:      status:      status:
   'active'     'inactive'   'suspended'
        │
        ▼
   ┌──────────────────────────────┐
   │  Database Updated            │
   │  - status = 'active'         │
   │  - approved_at = NOW()       │
   └──────────────────────────────┘
        │
        ▼
   ┌──────────────────────────────┐
   │  Marketer Can Now Login      │
   │  and Access Dashboard        │
   └──────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────┐
│                          DASHBOARD ACCESS FLOW                           │
└─────────────────────────────────────────────────────────────────────────┘

3. Marketer Dashboard Access
   ┌──────────┐
   │ Marketer │
   │ Logs In  │──────▶ /marketer/dashboard
   └──────────┘
        │
        ▼
   ┌──────────────────────────────┐
   │  Check Marketer Status       │
   │  Query: marketers table      │
   │  WHERE email = user.email    │
   └──────────────────────────────┘
        │
        ├─────────────┬─────────────┬─────────────┐
        ▼             ▼             ▼             ▼
   ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐
   │ Pending │  │ Active  │  │Suspended│  │Inactive │
   └─────────┘  └─────────┘  └─────────┘  └─────────┘
        │             │             │             │
        ▼             ▼             ▼             ▼
   Show Wait    Show Full    Show Disabled  Show Disabled
   Message      Dashboard    Message        Message


┌─────────────────────────────────────────────────────────────────────────┐
│                          REFERRAL FLOW                                   │
└─────────────────────────────────────────────────────────────────────────┘

4. Referral Process
   ┌──────────────────────────────┐
   │  Marketer Dashboard          │
   │  Displays Referral Link:     │
   │  /signup?ref=MKT-XXXXXXXX    │
   └──────────────────────────────┘
        │
        ▼
   ┌──────────────────────────────┐
   │  Marketer Copies Link        │
   │  Shares via Social Media,    │
   │  Email, WhatsApp, etc.       │
   └──────────────────────────────┘
        │
        ▼
   ┌──────────────────────────────┐
   │  Vendor Clicks Link          │
   │  Lands on Signup Page        │
   │  with ref=MKT-XXXXXXXX       │
   └──────────────────────────────┘
        │
        ▼
   ┌──────────────────────────────┐
   │  Vendor Completes Signup     │
   │  System Validates Ref Code   │
   │  referralService.            │
   │  validateReferralCode()      │
   └──────────────────────────────┘
        │
        ▼
   ┌──────────────────────────────┐
   │  Vendor Completes Onboarding │
   │  Creates Vendor Record       │
   │  referred_by_marketer_id set │
   └──────────────────────────────┘
        │
        ▼
   ┌──────────────────────────────┐
   │  Create Referral Record      │
   │  referralService.            │
   │  createMarketerReferral()    │
   └──────────────────────────────┘
        │
        ▼
   ┌──────────────────────────────┐
   │  Insert into                 │
   │  marketer_referrals table    │
   │  - marketer_id               │
   │  - vendor_id                 │
   │  - referral_code             │
   │  - commission_amount         │
   │  - status: 'completed'       │
   └──────────────────────────────┘
        │
        ▼
   ┌──────────────────────────────┐
   │  Database Trigger Fires      │
   │  update_marketer_stats()     │
   └──────────────────────────────┘
        │
        ▼
   ┌──────────────────────────────┐
   │  Update Marketers Table      │
   │  - total_referrals += 1      │
   │  - total_commission_earned   │
   │    (if commission paid)      │
   └──────────────────────────────┘
        │
        ▼
   ┌──────────────────────────────┐
   │  Stats Visible in:           │
   │  - Marketer Dashboard        │
   │  - Admin Marketers Screen    │
   │  - Admin Dashboard           │
   └──────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────┐
│                          COMMISSION PAYMENT FLOW                         │
└─────────────────────────────────────────────────────────────────────────┘

5. Commission Payment
   ┌──────────┐
   │  Admin   │
   │  Reviews │──────▶ /admin/commissions
   │ Payments │
   └──────────┘
        │
        ▼
   ┌──────────────────────────────┐
   │  Views Pending Commissions   │
   │  WHERE commission_paid=false │
   │  AND status='completed'      │
   └──────────────────────────────┘
        │
        ▼
   ┌──────────────────────────────┐
   │  Marks Commission as Paid    │
   │  UPDATE marketer_referrals   │
   │  SET commission_paid = true  │
   │  SET commission_paid_at=NOW()│
   └──────────────────────────────┘
        │
        ▼
   ┌──────────────────────────────┐
   │  Database Trigger Fires      │
   │  update_marketer_stats()     │
   └──────────────────────────────┘
        │
        ▼
   ┌──────────────────────────────┐
   │  Recalculates Stats          │
   │  total_commission_earned =   │
   │  SUM(paid commissions)       │
   └──────────────────────────────┘
        │
        ▼
   ┌──────────────────────────────┐
   │  Marketer Dashboard Updates  │
   │  - Paid Commission increases │
   │  - Pending Commission reduces│
   └──────────────────────────────┘
```

## Database Schema Relationships

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          DATABASE SCHEMA                                 │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐
│   auth.users         │
│  (Supabase Auth)     │
├──────────────────────┤
│ id (uuid)            │
│ email                │
│ ...                  │
└──────────────────────┘
         │
         │ 1:1
         ▼
┌──────────────────────┐
│   profiles           │
├──────────────────────┤
│ id (uuid) PK         │
│ email                │
│ full_name            │
│ role                 │
│ ...                  │
└──────────────────────┘
         │
         │ 1:1 (optional)
         ▼
┌──────────────────────┐
│   marketers          │
├──────────────────────┤
│ id (uuid) PK         │
│ user_id (uuid) FK    │◀─── Links to auth.users
│ full_name            │
│ email                │
│ phone                │
│ business_name        │
│ referral_code        │◀─── Auto-generated: MKT-XXXXXXXX
│ status               │◀─── pending/active/suspended/inactive
│ total_referrals      │◀─── Auto-updated by trigger
│ total_commission_    │◀─── Auto-updated by trigger
│   earned             │
│ approved_by (uuid)   │
│ approved_at          │
│ created_at           │
│ updated_at           │
└──────────────────────┘
         │
         │ 1:N
         ▼
┌──────────────────────┐
│ marketer_referrals   │
├──────────────────────┤
│ id (uuid) PK         │
│ marketer_id (uuid)   │◀─── FK to marketers.id
│ vendor_id (uuid)     │◀─── FK to vendors.id
│ referral_code        │
│ status               │◀─── pending/completed/rejected
│ commission_amount    │
│ commission_paid      │◀─── boolean
│ commission_paid_at   │
│ created_at           │
│ updated_at           │
└──────────────────────┘
         │
         │ N:1
         ▼
┌──────────────────────┐
│   vendors            │
├──────────────────────┤
│ id (uuid) PK         │
│ user_id (uuid) FK    │
│ business_name        │
│ referred_by_         │
│   marketer_id        │◀─── FK to marketers.id
│ ...                  │
└──────────────────────┘
```

## Trigger Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          DATABASE TRIGGERS                               │
└─────────────────────────────────────────────────────────────────────────┘

Trigger 1: Generate Referral Code
┌──────────────────────────────────┐
│ INSERT INTO marketers            │
└──────────────────────────────────┘
              │
              ▼
┌──────────────────────────────────┐
│ BEFORE INSERT TRIGGER            │
│ generate_marketer_referral_code()│
└──────────────────────────────────┘
              │
              ▼
┌──────────────────────────────────┐
│ IF referral_code IS NULL         │
│ THEN                             │
│   referral_code := 'MKT-' ||     │
│   UPPER(SUBSTRING(MD5(           │
│     RANDOM()::TEXT               │
│   ) FROM 1 FOR 8))               │
│ END IF                           │
└──────────────────────────────────┘
              │
              ▼
┌──────────────────────────────────┐
│ Record inserted with code        │
│ Example: MKT-A1B2C3D4            │
└──────────────────────────────────┘


Trigger 2: Update Marketer Stats
┌──────────────────────────────────┐
│ INSERT/UPDATE/DELETE ON          │
│ marketer_referrals               │
└──────────────────────────────────┘
              │
              ▼
┌──────────────────────────────────┐
│ AFTER INSERT/UPDATE/DELETE       │
│ TRIGGER                          │
│ update_marketer_stats()          │
└──────────────────────────────────┘
              │
              ▼
┌──────────────────────────────────┐
│ Calculate:                       │
│ - total_referrals = COUNT(*)     │
│ - total_commission_earned =      │
│   SUM(commission_amount)         │
│   WHERE commission_paid = true   │
│   AND status = 'completed'       │
└──────────────────────────────────┘
              │
              ▼
┌──────────────────────────────────┐
│ UPDATE marketers                 │
│ SET total_referrals = ...        │
│     total_commission_earned = ...│
│     updated_at = NOW()           │
│ WHERE id = marketer_id           │
└──────────────────────────────────┘
```

## Security: Row Level Security (RLS)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          RLS POLICIES                                    │
└─────────────────────────────────────────────────────────────────────────┘

Table: marketers
┌──────────────────────────────────┐
│ SELECT Policies:                 │
│ 1. Marketers can view own data   │
│    WHERE user_id = auth.uid()    │
│    OR email = auth.email()       │
│                                  │
│ 2. Admins can view all           │
│    WHERE EXISTS (                │
│      SELECT 1 FROM profiles      │
│      WHERE id = auth.uid()       │
│      AND role = 'admin'          │
│    )                             │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│ INSERT Policies:                 │
│ 1. Anyone can register           │
│    WITH CHECK (true)             │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│ UPDATE Policies:                 │
│ 1. Admins only                   │
│    WHERE EXISTS (                │
│      SELECT 1 FROM profiles      │
│      WHERE id = auth.uid()       │
│      AND role = 'admin'          │
│    )                             │
└──────────────────────────────────┘


Table: marketer_referrals
┌──────────────────────────────────┐
│ SELECT Policies:                 │
│ 1. Marketers can view own refs   │
│    WHERE EXISTS (                │
│      SELECT 1 FROM marketers     │
│      WHERE id = marketer_id      │
│      AND user_id = auth.uid()    │
│    )                             │
│                                  │
│ 2. Admins can view all           │
│    WHERE EXISTS (                │
│      SELECT 1 FROM profiles      │
│      WHERE id = auth.uid()       │
│      AND role = 'admin'          │
│    )                             │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│ INSERT Policies:                 │
│ 1. System can create (for        │
│    vendor signup with ref code)  │
│    WITH CHECK (true)             │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│ UPDATE Policies:                 │
│ 1. Admins only (for commission   │
│    payment updates)              │
│    WHERE EXISTS (                │
│      SELECT 1 FROM profiles      │
│      WHERE id = auth.uid()       │
│      AND role = 'admin'          │
│    )                             │
└──────────────────────────────────┘
```

---

**Visual Flow Diagrams**
**Created**: November 26, 2025
**Version**: 1.0
