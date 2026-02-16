-- Migration: Create marketer user account sync and dashboard integration
-- This migration ensures that when a marketer is approved, they can log in and access their dashboard
-- It also ensures data syncs properly with the admin dashboard

-- Function to generate a unique referral code for marketers
CREATE OR REPLACE FUNCTION generate_marketer_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  -- Only generate code if it doesn't exist
  IF NEW.referral_code IS NULL OR NEW.referral_code = '' THEN
    NEW.referral_code := 'MKT-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate referral code
DROP TRIGGER IF EXISTS trigger_generate_marketer_referral_code ON marketers;
CREATE TRIGGER trigger_generate_marketer_referral_code
  BEFORE INSERT ON marketers
  FOR EACH ROW
  EXECUTE FUNCTION generate_marketer_referral_code();

-- Function to update marketer stats when referrals change
CREATE OR REPLACE FUNCTION update_marketer_stats()
RETURNS TRIGGER AS $$
DECLARE
  v_total_referrals INT;
  v_total_commission DECIMAL(10, 2);
BEGIN
  -- Calculate total referrals
  SELECT COUNT(*) INTO v_total_referrals
  FROM marketer_referrals
  WHERE marketer_id = COALESCE(NEW.marketer_id, OLD.marketer_id);

  -- Calculate total commission earned (only completed and paid)
  SELECT COALESCE(SUM(commission_amount), 0) INTO v_total_commission
  FROM marketer_referrals
  WHERE marketer_id = COALESCE(NEW.marketer_id, OLD.marketer_id)
    AND status = 'completed'
    AND commission_paid = true;

  -- Update marketer record
  UPDATE marketers
  SET 
    total_referrals = v_total_referrals,
    total_commission_earned = v_total_commission,
    updated_at = NOW()
  WHERE id = COALESCE(NEW.marketer_id, OLD.marketer_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update marketer stats
DROP TRIGGER IF EXISTS trigger_update_marketer_stats ON marketer_referrals;
CREATE TRIGGER trigger_update_marketer_stats
  AFTER INSERT OR UPDATE OR DELETE ON marketer_referrals
  FOR EACH ROW
  EXECUTE FUNCTION update_marketer_stats();

-- Add RLS policies for marketers table
ALTER TABLE marketers ENABLE ROW LEVEL SECURITY;

-- Policy: Marketers can view their own data
DROP POLICY IF EXISTS "Marketers can view own data" ON marketers;
CREATE POLICY "Marketers can view own data" ON marketers
  FOR SELECT
  USING (
    auth.uid()::text = user_id::text
    OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Policy: Admins can view all marketers
DROP POLICY IF EXISTS "Admins can view all marketers" ON marketers;
CREATE POLICY "Admins can view all marketers" ON marketers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Policy: Admins can update marketers
DROP POLICY IF EXISTS "Admins can update marketers" ON marketers;
CREATE POLICY "Admins can update marketers" ON marketers
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Policy: Anyone can insert (for registration)
DROP POLICY IF EXISTS "Anyone can register as marketer" ON marketers;
CREATE POLICY "Anyone can register as marketer" ON marketers
  FOR INSERT
  WITH CHECK (true);

-- Add RLS policies for marketer_referrals table
ALTER TABLE marketer_referrals ENABLE ROW LEVEL SECURITY;

-- Policy: Marketers can view their own referrals
DROP POLICY IF EXISTS "Marketers can view own referrals" ON marketer_referrals;
CREATE POLICY "Marketers can view own referrals" ON marketer_referrals
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM marketers
      WHERE marketers.id = marketer_referrals.marketer_id
      AND (
        marketers.user_id::text = auth.uid()::text
        OR marketers.email = (SELECT email FROM auth.users WHERE id = auth.uid())
      )
    )
  );

-- Policy: Admins can view all marketer referrals
DROP POLICY IF EXISTS "Admins can view all marketer referrals" ON marketer_referrals;
CREATE POLICY "Admins can view all marketer referrals" ON marketer_referrals
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Policy: System can insert marketer referrals (when vendor signs up with referral code)
DROP POLICY IF EXISTS "System can create marketer referrals" ON marketer_referrals;
CREATE POLICY "System can create marketer referrals" ON marketer_referrals
  FOR INSERT
  WITH CHECK (true);

-- Policy: Admins can update marketer referrals (for commission payments)
DROP POLICY IF EXISTS "Admins can update marketer referrals" ON marketer_referrals;
CREATE POLICY "Admins can update marketer referrals" ON marketer_referrals
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_marketers_email ON marketers(email);
CREATE INDEX IF NOT EXISTS idx_marketers_user_id ON marketers(user_id);
CREATE INDEX IF NOT EXISTS idx_marketers_status ON marketers(status);
CREATE INDEX IF NOT EXISTS idx_marketers_referral_code ON marketers(referral_code);
CREATE INDEX IF NOT EXISTS idx_marketer_referrals_marketer_id ON marketer_referrals(marketer_id);
CREATE INDEX IF NOT EXISTS idx_marketer_referrals_vendor_id ON marketer_referrals(vendor_id);
CREATE INDEX IF NOT EXISTS idx_marketer_referrals_status ON marketer_referrals(status);

-- Add comment to document the system
COMMENT ON TABLE marketers IS 'Stores marketer/partner information for the referral program. Marketers can refer vendors and earn commissions.';
COMMENT ON TABLE marketer_referrals IS 'Tracks vendor referrals made by marketers and their commission status.';
