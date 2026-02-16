/*
  # Add Flutterwave Wallet Support for Vendors

  ## Overview
  This migration adds Flutterwave wallet integration fields to the vendors table,
  allowing vendors to create digital wallets for receiving order payments.

  ## Changes Made

  ### 1. Add Flutterwave fields to vendors table
  - `flutterwave_wallet_id` (text) - Flutterwave virtual account reference
  - `flutterwave_account_number` (text) - Virtual account number for deposits
  - `flutterwave_bank_name` (text) - Bank name for the virtual account
  - `flutterwave_account_name` (text) - Account holder name

  ### 2. Create vendor_payout_accounts table
  - Stores bank account information for vendor withdrawals
  - Supports multiple bank accounts per vendor

  ## Security
  RLS policies ensure vendors can only manage their own wallet information
*/

-- Add Flutterwave wallet fields to vendors table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendors' AND column_name = 'flutterwave_wallet_id'
  ) THEN
    ALTER TABLE vendors ADD COLUMN flutterwave_wallet_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendors' AND column_name = 'flutterwave_account_number'
  ) THEN
    ALTER TABLE vendors ADD COLUMN flutterwave_account_number text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendors' AND column_name = 'flutterwave_bank_name'
  ) THEN
    ALTER TABLE vendors ADD COLUMN flutterwave_bank_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendors' AND column_name = 'flutterwave_account_name'
  ) THEN
    ALTER TABLE vendors ADD COLUMN flutterwave_account_name text;
  END IF;
END $$;

-- Create vendor_payout_accounts table if not exists
CREATE TABLE IF NOT EXISTS vendor_payout_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  bank_name text NOT NULL,
  bank_code text NOT NULL,
  account_number text NOT NULL,
  account_name text NOT NULL,
  is_default boolean DEFAULT false,
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(vendor_id, account_number, bank_code)
);

ALTER TABLE vendor_payout_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors can manage own payout accounts"
  ON vendor_payout_accounts FOR ALL
  TO authenticated
  USING (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()))
  WITH CHECK (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_vendor_payout_accounts_vendor ON vendor_payout_accounts(vendor_id);

-- Create function to ensure only one default payout account per vendor
CREATE OR REPLACE FUNCTION ensure_single_default_payout_account()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE vendor_payout_accounts
    SET is_default = false
    WHERE vendor_id = NEW.vendor_id
    AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for default payout account management
DROP TRIGGER IF EXISTS trigger_ensure_single_default_payout_account ON vendor_payout_accounts;
CREATE TRIGGER trigger_ensure_single_default_payout_account
  BEFORE INSERT OR UPDATE ON vendor_payout_accounts
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_default_payout_account();
