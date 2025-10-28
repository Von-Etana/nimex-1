/*
  # Create Ads Management System

  ## Overview
  This migration creates the database schema for vendor advertising campaigns on the NIMEX platform.
  
  ## New Tables
  
  ### 1. ad_campaigns
  Main advertising campaigns table
  - `id` (uuid, primary key) - Unique campaign identifier
  - `vendor_id` (uuid) - References vendors table
  - `title` (text) - Campaign name/title
  - `description` (text) - Campaign description
  - `image_url` (text) - Campaign banner/image URL
  - `status` (enum) - Campaign status: active, paused, ended
  - `budget` (decimal) - Total budget allocated
  - `spent` (decimal) - Amount spent so far
  - `start_date` (date) - Campaign start date
  - `end_date` (date) - Campaign end date
  - `target_audience` (jsonb) - Targeting criteria
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  
  ### 2. ad_metrics
  Campaign performance metrics
  - `id` (uuid, primary key) - Unique metric record identifier
  - `campaign_id` (uuid) - References ad_campaigns
  - `date` (date) - Metric date
  - `impressions` (integer) - Number of impressions
  - `clicks` (integer) - Number of clicks
  - `conversions` (integer) - Number of conversions
  - `ctr` (decimal) - Click-through rate
  - `cost` (decimal) - Daily cost
  - `created_at` (timestamptz) - Creation timestamp
  
  ## Security
  Row Level Security enabled with policies for vendors to manage their own ads
*/

CREATE TYPE ad_status AS ENUM ('active', 'paused', 'ended', 'draft');

CREATE TABLE IF NOT EXISTS ad_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  image_url text,
  status ad_status NOT NULL DEFAULT 'draft',
  budget decimal(12,2) NOT NULL DEFAULT 0,
  spent decimal(12,2) NOT NULL DEFAULT 0,
  start_date date NOT NULL,
  end_date date NOT NULL,
  target_audience jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_dates CHECK (end_date >= start_date),
  CONSTRAINT valid_budget CHECK (budget >= 0),
  CONSTRAINT valid_spent CHECK (spent >= 0 AND spent <= budget)
);

CREATE TABLE IF NOT EXISTS ad_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES ad_campaigns(id) ON DELETE CASCADE,
  date date NOT NULL,
  impressions integer NOT NULL DEFAULT 0,
  clicks integer NOT NULL DEFAULT 0,
  conversions integer NOT NULL DEFAULT 0,
  ctr decimal(5,2) NOT NULL DEFAULT 0,
  cost decimal(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_impressions CHECK (impressions >= 0),
  CONSTRAINT valid_clicks CHECK (clicks >= 0 AND clicks <= impressions),
  CONSTRAINT valid_conversions CHECK (conversions >= 0),
  CONSTRAINT valid_ctr CHECK (ctr >= 0 AND ctr <= 100),
  CONSTRAINT unique_campaign_date UNIQUE (campaign_id, date)
);

CREATE INDEX IF NOT EXISTS idx_ad_campaigns_vendor ON ad_campaigns(vendor_id);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_status ON ad_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_dates ON ad_campaigns(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_ad_metrics_campaign ON ad_metrics(campaign_id);
CREATE INDEX IF NOT EXISTS idx_ad_metrics_date ON ad_metrics(date);

ALTER TABLE ad_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors can view own campaigns"
  ON ad_campaigns FOR SELECT
  TO authenticated
  USING (
    vendor_id IN (
      SELECT id FROM vendors WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Vendors can create own campaigns"
  ON ad_campaigns FOR INSERT
  TO authenticated
  WITH CHECK (
    vendor_id IN (
      SELECT id FROM vendors WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Vendors can update own campaigns"
  ON ad_campaigns FOR UPDATE
  TO authenticated
  USING (
    vendor_id IN (
      SELECT id FROM vendors WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    vendor_id IN (
      SELECT id FROM vendors WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Vendors can delete own campaigns"
  ON ad_campaigns FOR DELETE
  TO authenticated
  USING (
    vendor_id IN (
      SELECT id FROM vendors WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Vendors can view own metrics"
  ON ad_metrics FOR SELECT
  TO authenticated
  USING (
    campaign_id IN (
      SELECT id FROM ad_campaigns
      WHERE vendor_id IN (
        SELECT id FROM vendors WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "System can insert metrics"
  ON ad_metrics FOR INSERT
  TO authenticated
  WITH CHECK (
    campaign_id IN (
      SELECT id FROM ad_campaigns
      WHERE vendor_id IN (
        SELECT id FROM vendors WHERE user_id = auth.uid()
      )
    )
  );

CREATE OR REPLACE FUNCTION update_ad_campaign_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ad_campaign_timestamp
  BEFORE UPDATE ON ad_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_ad_campaign_updated_at();
