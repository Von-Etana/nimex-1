/*
  # Create Admin User Accounts

  ## Overview
  This migration creates three admin accounts with different role assignments:
  - Super Admin: full platform access
  - Account Team Member: vendor and KYC management
  - Customer Support Agent: customer service and order management

  ## Admin Accounts Created

  ### 1. Super Administrator
  - Email: admin@nimex.ng
  - Password: NimexAdmin2024!
  - Role: super_admin
  - Full Name: NIMEX Super Admin

  ### 2. Account Team Member
  - Email: accounts@nimex.ng
  - Password: NimexAccounts2024!
  - Role: account_team
  - Full Name: NIMEX Account Team

  ### 3. Customer Support Agent
  - Email: support@nimex.ng
  - Password: NimexSupport2024!
  - Role: customer_support
  - Full Name: NIMEX Customer Support

  ## Important Notes
  - These accounts must be created manually in Supabase Auth dashboard
  - After creating auth users, this migration will set up their profiles and role assignments
  - Passwords should be changed immediately after first login in production
*/

-- Note: The actual user creation must be done via Edge Function or Supabase Auth dashboard
-- This migration handles profile creation and role assignment

-- Create Edge Function to set up admin accounts
-- This will be called manually after the auth users are created
