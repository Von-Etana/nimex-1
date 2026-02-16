/*
  # Market Locations and Product Tags System

  ## Overview
  This migration adds market location tracking for vendors and a product tags system
  with auto-suggestions for better product discovery and vendor searchability.

  ## New Tables

  ### 1. markets
  Popular Nigerian markets that vendors can register their stores in
  - `id` (uuid, primary key)
  - `name` (text) - Market name (e.g., "Balogun Market")
  - `city` (text) - City where market is located
  - `state` (text) - State where market is located
  - `description` (text) - Brief description of the market
  - `is_active` (boolean) - Whether market is active in the system
  - `vendor_count` (integer) - Number of vendors in this market
  - `created_at` (timestamptz)

  ### 2. product_tags
  Tags for products that act as sub-categories for better search
  - `id` (uuid, primary key)
  - `tag_name` (text) - Tag name (lowercase, normalized)
  - `display_name` (text) - Display name with proper casing
  - `category_id` (uuid) - Associated category
  - `usage_count` (integer) - How many products use this tag
  - `created_by` (uuid) - Vendor who first created this tag
  - `is_approved` (boolean) - Admin approval status
  - `created_at` (timestamptz)

  ### 3. product_tag_associations
  Many-to-many relationship between products and tags
  - `product_id` (uuid)
  - `tag_id` (uuid)
  - `created_at` (timestamptz)

  ## Schema Changes

  ### vendors table
  - Add `market_id` (uuid) - Reference to markets table
  - Add `market_location_details` (text) - Specific location within market (e.g., "Shop 45, Block B")

  ## Security
  - RLS enabled on all tables
  - Vendors can create and manage tags in their categories
  - All users can read active markets and approved tags
  - Tag suggestions based on category usage

  ## Indexes
  - markets: name, city, state for search
  - product_tags: tag_name, category_id for suggestions
  - Composite index on product_tag_associations for lookups
*/

-- Create markets table
CREATE TABLE IF NOT EXISTS markets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  city text NOT NULL,
  state text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  vendor_count integer DEFAULT 0 CHECK (vendor_count >= 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE markets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Markets are publicly readable"
  ON markets FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage markets"
  ON markets FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create indexes for markets
CREATE INDEX IF NOT EXISTS idx_markets_name ON markets(name);
CREATE INDEX IF NOT EXISTS idx_markets_city ON markets(city);
CREATE INDEX IF NOT EXISTS idx_markets_state ON markets(state);
CREATE INDEX IF NOT EXISTS idx_markets_active ON markets(is_active);

-- Add market location columns to vendors table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendors' AND column_name = 'market_id'
  ) THEN
    ALTER TABLE vendors ADD COLUMN market_id uuid REFERENCES markets(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendors' AND column_name = 'market_location_details'
  ) THEN
    ALTER TABLE vendors ADD COLUMN market_location_details text;
  END IF;
END $$;

-- Create index for vendor market lookups
CREATE INDEX IF NOT EXISTS idx_vendors_market_id ON vendors(market_id);

-- Create product_tags table
CREATE TABLE IF NOT EXISTS product_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_name text NOT NULL,
  display_name text NOT NULL,
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  usage_count integer DEFAULT 0 CHECK (usage_count >= 0),
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  is_approved boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(tag_name, category_id)
);

ALTER TABLE product_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Product tags are publicly readable"
  ON product_tags FOR SELECT
  TO authenticated
  USING (is_approved = true);

CREATE POLICY "Vendors can create tags in their categories"
  ON product_tags FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('vendor', 'admin')
    )
  );

CREATE POLICY "Tag creators can update their tags"
  ON product_tags FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Create indexes for product_tags
CREATE INDEX IF NOT EXISTS idx_product_tags_name ON product_tags(tag_name);
CREATE INDEX IF NOT EXISTS idx_product_tags_category ON product_tags(category_id);
CREATE INDEX IF NOT EXISTS idx_product_tags_usage ON product_tags(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_product_tags_approved ON product_tags(is_approved);

-- Create product_tag_associations table
CREATE TABLE IF NOT EXISTS product_tag_associations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES product_tags(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(product_id, tag_id)
);

ALTER TABLE product_tag_associations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Product tag associations are publicly readable"
  ON product_tag_associations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Vendors can manage tags for their products"
  ON product_tag_associations FOR ALL
  TO authenticated
  USING (
    product_id IN (
      SELECT p.id FROM products p
      INNER JOIN vendors v ON v.id = p.vendor_id
      WHERE v.user_id = auth.uid()
    )
  )
  WITH CHECK (
    product_id IN (
      SELECT p.id FROM products p
      INNER JOIN vendors v ON v.id = p.vendor_id
      WHERE v.user_id = auth.uid()
    )
  );

-- Create indexes for product_tag_associations
CREATE INDEX IF NOT EXISTS idx_product_tag_assoc_product ON product_tag_associations(product_id);
CREATE INDEX IF NOT EXISTS idx_product_tag_assoc_tag ON product_tag_associations(tag_id);

-- Function to update tag usage count
CREATE OR REPLACE FUNCTION update_tag_usage_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE product_tags
    SET usage_count = usage_count + 1
    WHERE id = NEW.tag_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE product_tags
    SET usage_count = usage_count - 1
    WHERE id = OLD.tag_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update tag usage count
DROP TRIGGER IF EXISTS trigger_update_tag_usage ON product_tag_associations;
CREATE TRIGGER trigger_update_tag_usage
  AFTER INSERT OR DELETE ON product_tag_associations
  FOR EACH ROW
  EXECUTE FUNCTION update_tag_usage_count();

-- Function to update market vendor count
CREATE OR REPLACE FUNCTION update_market_vendor_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.market_id IS NOT NULL THEN
    UPDATE markets
    SET vendor_count = vendor_count + 1
    WHERE id = NEW.market_id;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.market_id IS NOT NULL AND NEW.market_id IS NULL THEN
      UPDATE markets
      SET vendor_count = vendor_count - 1
      WHERE id = OLD.market_id;
    ELSIF OLD.market_id IS NULL AND NEW.market_id IS NOT NULL THEN
      UPDATE markets
      SET vendor_count = vendor_count + 1
      WHERE id = NEW.market_id;
    ELSIF OLD.market_id IS NOT NULL AND NEW.market_id IS NOT NULL AND OLD.market_id != NEW.market_id THEN
      UPDATE markets
      SET vendor_count = vendor_count - 1
      WHERE id = OLD.market_id;
      UPDATE markets
      SET vendor_count = vendor_count + 1
      WHERE id = NEW.market_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' AND OLD.market_id IS NOT NULL THEN
    UPDATE markets
    SET vendor_count = vendor_count - 1
    WHERE id = OLD.market_id;
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update market vendor count
DROP TRIGGER IF EXISTS trigger_update_market_vendor_count ON vendors;
CREATE TRIGGER trigger_update_market_vendor_count
  AFTER INSERT OR UPDATE OR DELETE ON vendors
  FOR EACH ROW
  EXECUTE FUNCTION update_market_vendor_count();

-- Insert popular Nigerian markets
INSERT INTO markets (name, city, state, description) VALUES
  ('Balogun Market', 'Lagos', 'Lagos', 'One of Lagos'' largest and busiest markets for wholesale and retail fashion, textiles, and accessories'),
  ('Computer Village', 'Lagos', 'Lagos', 'West Africa''s largest technology market for electronics, computers, phones, and accessories'),
  ('Tejuosho Market', 'Lagos', 'Lagos', 'Major wholesale market for fashion, fabrics, shoes, and accessories'),
  ('Yaba Market', 'Lagos', 'Lagos', 'Popular market for clothing, shoes, bags, and fashion accessories'),
  ('Idumota Market', 'Lagos', 'Lagos', 'Historic market specializing in cosmetics, toiletries, and general goods'),
  ('Oshodi Market', 'Lagos', 'Lagos', 'Large market for electronics, fashion, household items, and groceries'),
  ('Trade Fair Complex', 'Lagos', 'Lagos', 'Massive market complex with diverse products including electronics, furniture, and building materials'),
  ('Wuse Market', 'Abuja', 'FCT', 'Abuja''s largest market for fresh produce, fashion, and household goods'),
  ('Garki Market', 'Abuja', 'FCT', 'Popular market for fabrics, textiles, and traditional materials'),
  ('Utako Market', 'Abuja', 'FCT', 'Modern market for fresh foods, groceries, and general merchandise'),
  ('Kugbo Market', 'Abuja', 'FCT', 'Major furniture and home decor market'),
  ('Onitsha Main Market', 'Onitsha', 'Anambra', 'One of Africa''s largest markets for wholesale trade in diverse goods'),
  ('Ariaria International Market', 'Aba', 'Abia', 'Famous for leather goods, shoes, bags, and fashion items'),
  ('Kurmi Market', 'Kano', 'Kano', 'Historic market in Northern Nigeria for textiles, grains, and traditional items'),
  ('Bodija Market', 'Ibadan', 'Oyo', 'Major market for foodstuff, fashion, and household items'),
  ('Dugbe Market', 'Ibadan', 'Oyo', 'Central market for diverse goods including electronics and fashion'),
  ('Oba Market', 'Benin City', 'Edo', 'Popular market for traditional items, fashion, and foodstuff'),
  ('New Benin Market', 'Benin City', 'Edo', 'Modern market for electronics, fashion, and general merchandise'),
  ('Ochanja Market', 'Onitsha', 'Anambra', 'Major textile and fashion market'),
  ('Owode Onirin Market', 'Lagos', 'Lagos', 'Large market for building materials, furniture, and home improvement')
ON CONFLICT (name) DO NOTHING;
