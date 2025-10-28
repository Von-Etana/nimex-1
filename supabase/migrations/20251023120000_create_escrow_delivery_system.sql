/*
  # NIMEX Escrow and Delivery System with GIGL Integration

  ## Overview
  This migration creates the complete escrow payment and delivery management system
  for NIMEX platform with GIGL (God is Good Logistics) API integration.

  ## New Tables

  ### 1. delivery_zones
  Manages shipping zones and rates for GIGL delivery service
  - `id` (uuid, primary key)
  - `name` (text) - Zone name (e.g., "Lagos Mainland", "Abuja FCT")
  - `state` (text) - Nigerian state
  - `cities` (jsonb) - Array of cities in this zone
  - `base_rate` (numeric) - Base shipping cost
  - `per_kg_rate` (numeric) - Additional cost per kilogram
  - `express_multiplier` (numeric) - Multiplier for express delivery
  - `is_active` (boolean) - Zone availability status
  - `gigl_zone_code` (text) - GIGL API zone identifier

  ### 2. deliveries
  Tracks all shipment information and GIGL integration data
  - `id` (uuid, primary key)
  - `order_id` (uuid) - Reference to orders table
  - `vendor_id` (uuid) - Vendor shipping the order
  - `buyer_id` (uuid) - Buyer receiving the order
  - `gigl_shipment_id` (text) - GIGL tracking number
  - `gigl_tracking_url` (text) - GIGL tracking page URL
  - `pickup_address` (jsonb) - Vendor pickup location
  - `delivery_address` (jsonb) - Customer delivery location
  - `delivery_type` (text) - standard, express, same_day
  - `package_weight` (numeric) - Weight in kg
  - `package_dimensions` (jsonb) - Length, width, height
  - `delivery_cost` (numeric) - Total delivery cost
  - `estimated_delivery_date` (date) - Expected delivery date
  - `actual_delivery_date` (timestamptz) - Actual delivery completion
  - `delivery_status` (text) - pending, pickup_scheduled, in_transit, out_for_delivery, delivered, failed, returned
  - `delivery_notes` (text) - Special delivery instructions
  - `delivery_proof_url` (text) - Photo proof of delivery
  - `recipient_name` (text) - Who received the package
  - `recipient_signature_url` (text) - Signature image
  - `failed_attempt_count` (integer) - Number of failed delivery attempts
  - `last_status_update` (timestamptz) - Last GIGL status update time
  - `gigl_response_data` (jsonb) - Raw GIGL API responses for debugging
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 3. delivery_status_history
  Logs all delivery status changes for tracking timeline
  - `id` (uuid, primary key)
  - `delivery_id` (uuid) - Reference to deliveries table
  - `status` (text) - Status value
  - `location` (text) - Current location of package
  - `notes` (text) - Status change notes
  - `updated_by` (text) - System, vendor, or gigl_webhook
  - `created_at` (timestamptz)

  ### 4. payment_transactions
  Records all payment gateway transactions
  - `id` (uuid, primary key)
  - `order_id` (uuid) - Reference to orders table
  - `buyer_id` (uuid) - Buyer making payment
  - `payment_gateway` (text) - paystack, flutterwave, etc.
  - `gateway_reference` (text) - Payment gateway transaction reference
  - `amount` (numeric) - Total payment amount
  - `currency` (text) - NGN
  - `payment_method` (text) - card, bank_transfer, ussd
  - `status` (text) - pending, successful, failed, abandoned
  - `gateway_response` (jsonb) - Raw gateway response data
  - `paid_at` (timestamptz) - Payment completion time
  - `created_at` (timestamptz)

  ### 5. escrow_releases
  Tracks escrow release conditions and triggers
  - `id` (uuid, primary key)
  - `escrow_transaction_id` (uuid) - Reference to escrow_transactions
  - `release_type` (text) - auto_delivery, manual_buyer, admin_override, dispute_resolution
  - `release_condition_met` (boolean) - Whether condition is satisfied
  - `auto_release_date` (date) - Date for automatic release if no issues
  - `buyer_confirmed_delivery` (boolean) - Buyer confirmed receipt
  - `delivery_confirmed_at` (timestamptz) - Delivery confirmation time
  - `release_requested_by` (uuid) - User who requested release
  - `release_approved_by` (uuid) - Admin who approved (if manual)
  - `notes` (text) - Release notes or comments
  - `created_at` (timestamptz)

  ### 6. disputes
  Manages order and escrow disputes
  - `id` (uuid, primary key)
  - `order_id` (uuid) - Disputed order
  - `escrow_transaction_id` (uuid) - Related escrow transaction
  - `filed_by` (uuid) - User who filed dispute
  - `filed_by_type` (text) - buyer or vendor
  - `dispute_type` (text) - non_delivery, wrong_item, damaged_item, quality_issue, other
  - `description` (text) - Dispute details
  - `evidence_urls` (jsonb) - Array of evidence image URLs
  - `status` (text) - open, investigating, resolved, closed
  - `resolution` (text) - Resolution outcome
  - `resolved_by` (uuid) - Admin who resolved
  - `resolved_at` (timestamptz)
  - `created_at` (timestamptz)

  ### 7. vendor_payout_accounts
  Stores vendor bank account information for payouts
  - `id` (uuid, primary key)
  - `vendor_id` (uuid) - Reference to vendors table
  - `account_type` (text) - bank_account, mobile_money
  - `bank_name` (text) - Bank name
  - `account_number` (text) - Account number
  - `account_name` (text) - Account holder name
  - `is_default` (boolean) - Default payout account
  - `is_verified` (boolean) - Account verification status
  - `created_at` (timestamptz)

  ### 8. platform_settings
  Global platform configuration for fees and limits
  - `id` (uuid, primary key)
  - `setting_key` (text, unique) - Setting identifier
  - `setting_value` (jsonb) - Setting value
  - `description` (text) - Setting description
  - `updated_at` (timestamptz)

  ## Security
  All tables have Row Level Security enabled with appropriate policies for buyers, vendors, and admins.

  ## Important Notes
  1. Escrow funds are held in escrow_transactions with status 'held' until delivery confirmation
  2. Auto-release triggers after 7 days of delivery confirmation if buyer doesn't dispute
  3. Platform fee is deducted during escrow release
  4. GIGL API integration requires valid API credentials stored in Edge Functions environment
  5. Payment gateway webhooks must be configured to update payment_transactions table
*/

-- Create delivery_zones table
CREATE TABLE IF NOT EXISTS delivery_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  state text NOT NULL,
  cities jsonb DEFAULT '[]'::jsonb,
  base_rate numeric NOT NULL CHECK (base_rate >= 0),
  per_kg_rate numeric DEFAULT 0 CHECK (per_kg_rate >= 0),
  express_multiplier numeric DEFAULT 1.5 CHECK (express_multiplier >= 1),
  is_active boolean DEFAULT true,
  gigl_zone_code text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE delivery_zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Delivery zones are publicly readable"
  ON delivery_zones FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Create deliveries table
CREATE TABLE IF NOT EXISTS deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  vendor_id uuid NOT NULL REFERENCES vendors(id),
  buyer_id uuid NOT NULL REFERENCES profiles(id),
  gigl_shipment_id text,
  gigl_tracking_url text,
  pickup_address jsonb NOT NULL,
  delivery_address jsonb NOT NULL,
  delivery_type text DEFAULT 'standard' CHECK (delivery_type IN ('standard', 'express', 'same_day')),
  package_weight numeric CHECK (package_weight > 0),
  package_dimensions jsonb DEFAULT '{}'::jsonb,
  delivery_cost numeric NOT NULL CHECK (delivery_cost >= 0),
  estimated_delivery_date date,
  actual_delivery_date timestamptz,
  delivery_status text DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'pickup_scheduled', 'in_transit', 'out_for_delivery', 'delivered', 'failed', 'returned')),
  delivery_notes text,
  delivery_proof_url text,
  recipient_name text,
  recipient_signature_url text,
  failed_attempt_count integer DEFAULT 0,
  last_status_update timestamptz DEFAULT now(),
  gigl_response_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers can view own deliveries"
  ON deliveries FOR SELECT
  TO authenticated
  USING (buyer_id = auth.uid());

CREATE POLICY "Vendors can view own deliveries"
  ON deliveries FOR SELECT
  TO authenticated
  USING (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));

CREATE POLICY "Vendors can update own deliveries"
  ON deliveries FOR UPDATE
  TO authenticated
  USING (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()))
  WITH CHECK (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));

-- Create delivery_status_history table
CREATE TABLE IF NOT EXISTS delivery_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id uuid NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
  status text NOT NULL,
  location text,
  notes text,
  updated_by text DEFAULT 'system',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE delivery_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Status history visible with delivery access"
  ON delivery_status_history FOR SELECT
  TO authenticated
  USING (
    delivery_id IN (
      SELECT id FROM deliveries
      WHERE buyer_id = auth.uid()
      OR vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
    )
  );

-- Create payment_transactions table
CREATE TABLE IF NOT EXISTS payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL REFERENCES profiles(id),
  payment_gateway text NOT NULL,
  gateway_reference text UNIQUE NOT NULL,
  amount numeric NOT NULL CHECK (amount >= 0),
  currency text DEFAULT 'NGN',
  payment_method text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'successful', 'failed', 'abandoned')),
  gateway_response jsonb DEFAULT '{}'::jsonb,
  paid_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers can view own payment transactions"
  ON payment_transactions FOR SELECT
  TO authenticated
  USING (buyer_id = auth.uid());

CREATE POLICY "Vendors can view related payment transactions"
  ON payment_transactions FOR SELECT
  TO authenticated
  USING (
    order_id IN (
      SELECT id FROM orders
      WHERE vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
    )
  );

-- Create escrow_releases table
CREATE TABLE IF NOT EXISTS escrow_releases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escrow_transaction_id uuid NOT NULL REFERENCES escrow_transactions(id) ON DELETE CASCADE,
  release_type text NOT NULL CHECK (release_type IN ('auto_delivery', 'manual_buyer', 'admin_override', 'dispute_resolution')),
  release_condition_met boolean DEFAULT false,
  auto_release_date date,
  buyer_confirmed_delivery boolean DEFAULT false,
  delivery_confirmed_at timestamptz,
  release_requested_by uuid REFERENCES profiles(id),
  release_approved_by uuid REFERENCES profiles(id),
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE escrow_releases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Escrow releases visible to transaction parties"
  ON escrow_releases FOR SELECT
  TO authenticated
  USING (
    escrow_transaction_id IN (
      SELECT id FROM escrow_transactions
      WHERE buyer_id = auth.uid()
      OR vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
    )
  );

-- Create disputes table
CREATE TABLE IF NOT EXISTS disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  escrow_transaction_id uuid REFERENCES escrow_transactions(id),
  filed_by uuid NOT NULL REFERENCES profiles(id),
  filed_by_type text NOT NULL CHECK (filed_by_type IN ('buyer', 'vendor')),
  dispute_type text NOT NULL CHECK (dispute_type IN ('non_delivery', 'wrong_item', 'damaged_item', 'quality_issue', 'other')),
  description text NOT NULL,
  evidence_urls jsonb DEFAULT '[]'::jsonb,
  status text DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'closed')),
  resolution text,
  resolved_by uuid REFERENCES profiles(id),
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dispute parties can view related disputes"
  ON disputes FOR SELECT
  TO authenticated
  USING (
    filed_by = auth.uid()
    OR order_id IN (
      SELECT id FROM orders
      WHERE buyer_id = auth.uid()
      OR vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Buyers and vendors can file disputes"
  ON disputes FOR INSERT
  TO authenticated
  WITH CHECK (filed_by = auth.uid());

-- Create vendor_payout_accounts table
CREATE TABLE IF NOT EXISTS vendor_payout_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  account_type text DEFAULT 'bank_account' CHECK (account_type IN ('bank_account', 'mobile_money')),
  bank_name text NOT NULL,
  account_number text NOT NULL,
  account_name text NOT NULL,
  is_default boolean DEFAULT false,
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE vendor_payout_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors can manage own payout accounts"
  ON vendor_payout_accounts FOR ALL
  TO authenticated
  USING (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()))
  WITH CHECK (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));

-- Create platform_settings table
CREATE TABLE IF NOT EXISTS platform_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value jsonb NOT NULL,
  description text,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Settings are publicly readable"
  ON platform_settings FOR SELECT
  TO authenticated
  USING (true);

-- Insert default platform settings
INSERT INTO platform_settings (setting_key, setting_value, description) VALUES
  ('platform_fee_percentage', '5', 'Platform commission percentage on sales'),
  ('escrow_auto_release_days', '7', 'Days after delivery before auto-release of escrow'),
  ('min_payout_amount', '5000', 'Minimum amount vendors can withdraw (NGN)'),
  ('max_delivery_weight_kg', '50', 'Maximum package weight for delivery (kg)'),
  ('buyer_protection_days', '14', 'Days buyer can file dispute after delivery')
ON CONFLICT (setting_key) DO NOTHING;

-- Insert sample delivery zones for Nigerian major cities
INSERT INTO delivery_zones (name, state, cities, base_rate, per_kg_rate, express_multiplier, gigl_zone_code) VALUES
  ('Lagos Mainland', 'Lagos', '["Yaba", "Ikeja", "Surulere", "Maryland", "Mushin"]', 1500, 200, 1.5, 'LAG-ML'),
  ('Lagos Island', 'Lagos', '["Victoria Island", "Ikoyi", "Lekki", "Ajah", "Lagos Island"]', 2000, 200, 1.5, 'LAG-IL'),
  ('Abuja Central', 'FCT', '["Wuse", "Maitama", "Garki", "Asokoro", "Central Business District"]', 2500, 250, 1.5, 'ABJ-CT'),
  ('Port Harcourt', 'Rivers', '["Port Harcourt", "Obio-Akpor", "Eleme"]', 3000, 300, 1.5, 'PHC-01'),
  ('Kano City', 'Kano', '["Kano Municipal", "Fagge", "Dala", "Gwale"]', 3500, 300, 1.5, 'KAN-01'),
  ('Ibadan', 'Oyo', '["Ibadan North", "Ibadan South", "Akinyele", "Lagelu"]', 2800, 250, 1.5, 'IBD-01'),
  ('Benin City', 'Edo', '["Benin City", "Ikpoba-Okha", "Oredo"]', 2800, 250, 1.5, 'BEN-01'),
  ('Enugu', 'Enugu', '["Enugu North", "Enugu South", "Enugu East"]', 3000, 250, 1.5, 'ENU-01')
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_deliveries_order ON deliveries(order_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_vendor ON deliveries(vendor_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_buyer ON deliveries(buyer_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON deliveries(delivery_status);
CREATE INDEX IF NOT EXISTS idx_deliveries_gigl_shipment ON deliveries(gigl_shipment_id);
CREATE INDEX IF NOT EXISTS idx_delivery_status_history_delivery ON delivery_status_history(delivery_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_order ON payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_buyer ON payment_transactions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_reference ON payment_transactions(gateway_reference);
CREATE INDEX IF NOT EXISTS idx_escrow_releases_escrow ON escrow_releases(escrow_transaction_id);
CREATE INDEX IF NOT EXISTS idx_disputes_order ON disputes(order_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status);
CREATE INDEX IF NOT EXISTS idx_vendor_payout_accounts_vendor ON vendor_payout_accounts(vendor_id);

-- Function to automatically create escrow transaction when order is paid
CREATE OR REPLACE FUNCTION create_escrow_on_payment()
RETURNS TRIGGER AS $$
DECLARE
  v_platform_fee numeric;
  v_vendor_amount numeric;
BEGIN
  IF NEW.payment_status = 'paid' AND OLD.payment_status != 'paid' THEN
    -- Calculate platform fee (5%)
    v_platform_fee := NEW.total_amount * 0.05;
    v_vendor_amount := NEW.total_amount - v_platform_fee;

    -- Create escrow transaction
    INSERT INTO escrow_transactions (
      order_id,
      buyer_id,
      vendor_id,
      amount,
      platform_fee,
      vendor_amount,
      status
    ) VALUES (
      NEW.id,
      NEW.buyer_id,
      NEW.vendor_id,
      NEW.total_amount,
      v_platform_fee,
      v_vendor_amount,
      'held'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic escrow creation
DROP TRIGGER IF EXISTS trigger_create_escrow_on_payment ON orders;
CREATE TRIGGER trigger_create_escrow_on_payment
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION create_escrow_on_payment();

-- Function to auto-release escrow after delivery confirmation period
CREATE OR REPLACE FUNCTION auto_release_escrow()
RETURNS void AS $$
BEGIN
  -- Release escrow for deliveries confirmed more than 7 days ago
  UPDATE escrow_transactions
  SET
    status = 'released',
    released_at = now(),
    release_reason = 'Auto-released after buyer protection period'
  WHERE
    status = 'held'
    AND id IN (
      SELECT et.id
      FROM escrow_transactions et
      JOIN deliveries d ON d.order_id = et.order_id
      WHERE d.delivery_status = 'delivered'
      AND d.actual_delivery_date < (now() - interval '7 days')
      AND et.status = 'held'
    );
END;
$$ LANGUAGE plpgsql;
