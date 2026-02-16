/*
  # Create Referral and Commission Management System

  ## Overview
  This migration creates a comprehensive dual referral system:
  1. Vendor-to-Vendor referrals with commission tracking
  2. Marketer referral program with unique codes and commission management

  ## New Tables Created

  ### 1. `marketers` - Marketer profiles and registration
    - `id` (uuid, primary key)
    - `user_id` (uuid, references auth.users) - Optional linked user account
    - `full_name` (text) - Marketer's full name
    - `email` (text, unique) - Contact email
    - `phone` (text) - Contact phone number
    - `business_name` (text) - Business or company name
    - `referral_code` (text, unique) - Unique 8-character code for tracking
    - `status` (text) - pending, active, suspended, inactive
    - `total_referrals` (integer) - Count of successful vendor referrals
    - `total_commission_earned` (decimal) - Lifetime commission earnings
    - `bank_account_details` (jsonb) - Payment information
    - `approved_by` (uuid) - Admin who approved the marketer
    - `approved_at` (timestamptz) - Approval timestamp
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  ### 2. `vendor_referrals` - Vendor-to-vendor referral tracking
    - `id` (uuid, primary key)
    - `referrer_vendor_id` (uuid, references vendors) - Vendor who referred
    - `referred_vendor_id` (uuid, references vendors) - Vendor who was referred
    - `referral_code` (text) - Code used for tracking
    - `status` (text) - pending, completed, rejected
    - `commission_amount` (decimal) - Fixed commission for this referral
    - `commission_paid` (boolean) - Whether commission was paid
    - `commission_paid_at` (timestamptz) - Payment timestamp
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  ### 3. `marketer_referrals` - Marketer referral tracking
    - `id` (uuid, primary key)
    - `marketer_id` (uuid, references marketers) - Marketer who referred
    - `vendor_id` (uuid, references vendors) - Vendor who was referred
    - `referral_code` (text) - Marketer's code used
    - `status` (text) - pending, completed, rejected
    - `commission_amount` (decimal) - Fixed commission for this referral
    - `commission_paid` (boolean) - Whether commission was paid
    - `commission_paid_at` (timestamptz) - Payment timestamp
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  ### 4. `commission_settings` - Admin-configurable commission rates
    - `id` (uuid, primary key)
    - `type` (text) - vendor_referral or marketer_referral
    - `commission_amount` (decimal) - Fixed amount in Naira
    - `is_active` (boolean) - Whether this setting is active
    - `created_by` (uuid) - Admin who created/updated
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  ### 5. `commission_payments` - Payment history and tracking
    - `id` (uuid, primary key)
    - `recipient_type` (text) - vendor or marketer
    - `recipient_id` (uuid) - ID of vendor or marketer
    - `amount` (decimal) - Payment amount
    - `payment_method` (text) - wallet, bank_transfer, etc.
    - `reference_number` (text) - Transaction reference
    - `status` (text) - pending, processing, completed, failed
    - `referral_ids` (jsonb) - Array of referral IDs included in payment
    - `notes` (text) - Admin notes
    - `processed_by` (uuid) - Admin who processed payment
    - `processed_at` (timestamptz)
    - `created_at` (timestamptz)

  ## Security
  - RLS enabled on all tables
  - Vendors can view own referral data
  - Marketers can view own referral data
  - Admins have full access to all referral and commission data
  - Public can register as marketer (pending approval)
*/

-- Create enum types
DO $$ BEGIN
  CREATE TYPE marketer_status AS ENUM ('pending', 'active', 'suspended', 'inactive');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE referral_status AS ENUM ('pending', 'completed', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE commission_type AS ENUM ('vendor_referral', 'marketer_referral');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'completed', 'failed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add referral_code to vendors table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendors' AND column_name = 'referral_code'
  ) THEN
    ALTER TABLE vendors ADD COLUMN referral_code text UNIQUE;
    ALTER TABLE vendors ADD COLUMN total_referrals integer DEFAULT 0;
    ALTER TABLE vendors ADD COLUMN referred_by_vendor_id uuid REFERENCES vendors(id);
    ALTER TABLE vendors ADD COLUMN referred_by_marketer_id uuid;
  END IF;
END $$;

-- Create marketers table
CREATE TABLE IF NOT EXISTS marketers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text NOT NULL,
  business_name text,
  referral_code text UNIQUE NOT NULL,
  status marketer_status DEFAULT 'pending',
  total_referrals integer DEFAULT 0,
  total_commission_earned decimal(15,2) DEFAULT 0,
  bank_account_details jsonb,
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create vendor_referrals table
CREATE TABLE IF NOT EXISTS vendor_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_vendor_id uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  referred_vendor_id uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  referral_code text NOT NULL,
  status referral_status DEFAULT 'pending',
  commission_amount decimal(15,2) DEFAULT 0,
  commission_paid boolean DEFAULT false,
  commission_paid_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(referrer_vendor_id, referred_vendor_id)
);

-- Create marketer_referrals table
CREATE TABLE IF NOT EXISTS marketer_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  marketer_id uuid NOT NULL REFERENCES marketers(id) ON DELETE CASCADE,
  vendor_id uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  referral_code text NOT NULL,
  status referral_status DEFAULT 'pending',
  commission_amount decimal(15,2) DEFAULT 0,
  commission_paid boolean DEFAULT false,
  commission_paid_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(marketer_id, vendor_id)
);

-- Create commission_settings table
CREATE TABLE IF NOT EXISTS commission_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type commission_type NOT NULL UNIQUE,
  commission_amount decimal(15,2) NOT NULL DEFAULT 0,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create commission_payments table
CREATE TABLE IF NOT EXISTS commission_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_type text NOT NULL CHECK (recipient_type IN ('vendor', 'marketer')),
  recipient_id uuid NOT NULL,
  amount decimal(15,2) NOT NULL,
  payment_method text DEFAULT 'wallet',
  reference_number text UNIQUE,
  status payment_status DEFAULT 'pending',
  referral_ids jsonb,
  notes text,
  processed_by uuid REFERENCES auth.users(id),
  processed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Insert default commission settings
INSERT INTO commission_settings (type, commission_amount, is_active, created_at)
VALUES
  ('vendor_referral', 5000.00, true, now()),
  ('marketer_referral', 10000.00, true, now())
ON CONFLICT (type) DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_marketers_referral_code ON marketers(referral_code);
CREATE INDEX IF NOT EXISTS idx_marketers_status ON marketers(status);
CREATE INDEX IF NOT EXISTS idx_marketers_email ON marketers(email);
CREATE INDEX IF NOT EXISTS idx_vendors_referral_code ON vendors(referral_code);
CREATE INDEX IF NOT EXISTS idx_vendor_referrals_referrer ON vendor_referrals(referrer_vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_referrals_referred ON vendor_referrals(referred_vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_referrals_status ON vendor_referrals(status);
CREATE INDEX IF NOT EXISTS idx_marketer_referrals_marketer ON marketer_referrals(marketer_id);
CREATE INDEX IF NOT EXISTS idx_marketer_referrals_vendor ON marketer_referrals(vendor_id);
CREATE INDEX IF NOT EXISTS idx_marketer_referrals_status ON marketer_referrals(status);
CREATE INDEX IF NOT EXISTS idx_commission_payments_recipient ON commission_payments(recipient_type, recipient_id);
CREATE INDEX IF NOT EXISTS idx_commission_payments_status ON commission_payments(status);

-- Enable Row Level Security
ALTER TABLE marketers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketer_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for marketers table
CREATE POLICY "Anyone can register as marketer"
  ON marketers FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Marketers can view own profile"
  ON marketers FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Marketers can update own profile"
  ON marketers FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all marketers"
  ON marketers FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies for vendor_referrals table
CREATE POLICY "Vendors can view own referrals"
  ON vendor_referrals FOR SELECT
  TO authenticated
  USING (
    referrer_vendor_id IN (
      SELECT id FROM vendors WHERE user_id = auth.uid()
    )
    OR
    referred_vendor_id IN (
      SELECT id FROM vendors WHERE user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "System can create vendor referrals"
  ON vendor_referrals FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can manage vendor referrals"
  ON vendor_referrals FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies for marketer_referrals table
CREATE POLICY "Marketers can view own referrals"
  ON marketer_referrals FOR SELECT
  TO authenticated
  USING (
    marketer_id IN (
      SELECT id FROM marketers WHERE user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "System can create marketer referrals"
  ON marketer_referrals FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can manage marketer referrals"
  ON marketer_referrals FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies for commission_settings table
CREATE POLICY "Anyone can view commission settings"
  ON commission_settings FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage commission settings"
  ON commission_settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies for commission_payments table
CREATE POLICY "Recipients can view own payments"
  ON commission_payments FOR SELECT
  TO authenticated
  USING (
    (recipient_type = 'vendor' AND recipient_id IN (
      SELECT id FROM vendors WHERE user_id = auth.uid()
    ))
    OR
    (recipient_type = 'marketer' AND recipient_id IN (
      SELECT id FROM marketers WHERE user_id = auth.uid()
    ))
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage commission payments"
  ON commission_payments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS text AS $$
DECLARE
  chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result text := '';
  i integer;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Trigger to generate referral code for vendors
CREATE OR REPLACE FUNCTION create_vendor_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    LOOP
      NEW.referral_code := 'VND-' || generate_referral_code();
      EXIT WHEN NOT EXISTS (SELECT 1 FROM vendors WHERE referral_code = NEW.referral_code);
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  DROP TRIGGER IF EXISTS trigger_vendor_referral_code ON vendors;
  CREATE TRIGGER trigger_vendor_referral_code
    BEFORE INSERT ON vendors
    FOR EACH ROW
    EXECUTE FUNCTION create_vendor_referral_code();
END $$;

-- Trigger to generate referral code for marketers
CREATE OR REPLACE FUNCTION create_marketer_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    LOOP
      NEW.referral_code := 'MKT-' || generate_referral_code();
      EXIT WHEN NOT EXISTS (SELECT 1 FROM marketers WHERE referral_code = NEW.referral_code);
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  DROP TRIGGER IF EXISTS trigger_marketer_referral_code ON marketers;
  CREATE TRIGGER trigger_marketer_referral_code
    BEFORE INSERT ON marketers
    FOR EACH ROW
    EXECUTE FUNCTION create_marketer_referral_code();
END $$;

-- Function to update referral counts
CREATE OR REPLACE FUNCTION update_referral_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Update vendor referral count
    IF TG_TABLE_NAME = 'vendor_referrals' THEN
      UPDATE vendors
      SET total_referrals = total_referrals + 1
      WHERE id = NEW.referrer_vendor_id;
    END IF;

    -- Update marketer referral count
    IF TG_TABLE_NAME = 'marketer_referrals' THEN
      UPDATE marketers
      SET total_referrals = total_referrals + 1
      WHERE id = NEW.marketer_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  DROP TRIGGER IF EXISTS trigger_update_vendor_referral_count ON vendor_referrals;
  CREATE TRIGGER trigger_update_vendor_referral_count
    AFTER UPDATE ON vendor_referrals
    FOR EACH ROW
    EXECUTE FUNCTION update_referral_counts();

  DROP TRIGGER IF EXISTS trigger_update_marketer_referral_count ON marketer_referrals;
  CREATE TRIGGER trigger_update_marketer_referral_count
    AFTER UPDATE ON marketer_referrals
    FOR EACH ROW
    EXECUTE FUNCTION update_referral_counts();
END $$;

-- Update existing vendors to have referral codes
DO $$
DECLARE
  v_record RECORD;
  v_code text;
BEGIN
  FOR v_record IN SELECT id FROM vendors WHERE referral_code IS NULL
  LOOP
    LOOP
      v_code := 'VND-' || generate_referral_code();
      EXIT WHEN NOT EXISTS (SELECT 1 FROM vendors WHERE referral_code = v_code);
    END LOOP;
    UPDATE vendors SET referral_code = v_code WHERE id = v_record.id;
  END LOOP;
END $$;
