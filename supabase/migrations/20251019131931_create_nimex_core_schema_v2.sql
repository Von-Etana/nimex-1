/*
  # NIMEX Platform Core Database Schema

  ## Overview
  This migration creates the complete database schema for NIMEX, a trusted multi-vendor 
  e-commerce platform for Nigeria. The schema supports buyers, vendors, and admins with 
  comprehensive features including escrow, KYC verification, real-time chat, and order management.

  ## New Tables

  ### 1. profiles
  Extends auth.users with additional user information
  - `id` (uuid, primary key) - References auth.users
  - `email` (text) - User email
  - `full_name` (text) - User's full name
  - `phone` (text) - Nigerian phone number
  - `role` (text) - User role: buyer, vendor, admin
  - `avatar_url` (text) - Profile picture URL
  - `location` (text) - City/state in Nigeria
  - `created_at` (timestamptz) - Account creation date
  - `updated_at` (timestamptz) - Last profile update

  ### 2. categories
  Product categories for marketplace organization

  ### 3. vendors
  Vendor business information and verification status

  ### 4. kyc_submissions
  KYC verification documents for vendors

  ### 5. products
  Product listings from vendors

  ### 6. addresses
  Saved delivery addresses for buyers

  ### 7. orders
  Customer orders and order tracking

  ### 8. order_items
  Individual items in orders

  ### 9. escrow_transactions
  Escrow payment holding and release

  ### 10. wallet_transactions
  Vendor wallet activity log

  ### 11. payouts
  Vendor withdrawal requests

  ### 12. reviews
  Product and vendor reviews

  ### 13. chat_conversations
  Chat threads between buyers and vendors

  ### 14. chat_messages
  Individual chat messages

  ### 15. wishlists
  Saved products for buyers

  ### 16. admin_logs
  Platform activity and moderation logs

  ## Security
  All tables have Row Level Security enabled with appropriate policies for buyers, vendors, and admins.
*/

-- Create custom types
CREATE TYPE user_role AS ENUM ('buyer', 'vendor', 'admin');
CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'rejected');
CREATE TYPE kyc_status AS ENUM ('pending', 'approved', 'rejected', 'resubmit');
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'disputed');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'refunded');
CREATE TYPE escrow_status AS ENUM ('held', 'released', 'refunded', 'disputed');
CREATE TYPE transaction_type AS ENUM ('sale', 'refund', 'payout', 'fee');
CREATE TYPE payout_status AS ENUM ('pending', 'processing', 'completed', 'failed');

-- 1. Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  phone text,
  role user_role NOT NULL DEFAULT 'buyer',
  avatar_url text,
  location text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 2. Categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  icon text,
  parent_id uuid REFERENCES categories(id),
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories are publicly readable"
  ON categories FOR SELECT
  TO authenticated
  USING (is_active = true);

-- 3. Vendors table
CREATE TABLE IF NOT EXISTS vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  business_name text NOT NULL,
  business_description text,
  business_address text,
  business_phone text,
  cac_number text,
  verification_status verification_status DEFAULT 'pending',
  verification_date timestamptz,
  rating numeric DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  total_sales integer DEFAULT 0,
  response_time integer DEFAULT 0,
  wallet_balance numeric DEFAULT 0 CHECK (wallet_balance >= 0),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors can read own data"
  ON vendors FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Vendors can update own data"
  ON vendors FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Verified vendors visible to all users"
  ON vendors FOR SELECT
  TO authenticated
  USING (verification_status = 'verified' AND is_active = true);

-- 4. KYC submissions table
CREATE TABLE IF NOT EXISTS kyc_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  id_type text NOT NULL,
  id_number text NOT NULL,
  id_document_url text NOT NULL,
  selfie_url text NOT NULL,
  cac_document_url text,
  status kyc_status DEFAULT 'pending',
  admin_notes text,
  submitted_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES profiles(id)
);

ALTER TABLE kyc_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own KYC submissions"
  ON kyc_submissions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own KYC submissions"
  ON kyc_submissions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 5. Products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES categories(id),
  title text NOT NULL,
  description text NOT NULL,
  price numeric NOT NULL CHECK (price >= 0),
  compare_at_price numeric CHECK (compare_at_price >= 0),
  images jsonb DEFAULT '[]'::jsonb,
  stock_quantity integer DEFAULT 0 CHECK (stock_quantity >= 0),
  location text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'out_of_stock', 'moderation')),
  views_count integer DEFAULT 0,
  favorites_count integer DEFAULT 0,
  rating numeric DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  is_featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors can manage own products"
  ON products FOR ALL
  TO authenticated
  USING (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()))
  WITH CHECK (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));

CREATE POLICY "Active products visible to all users"
  ON products FOR SELECT
  TO authenticated
  USING (status = 'active');

-- 6. Addresses table
CREATE TABLE IF NOT EXISTS addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone text NOT NULL,
  address_line1 text NOT NULL,
  address_line2 text,
  city text NOT NULL,
  state text NOT NULL,
  postal_code text,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own addresses"
  ON addresses FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 7. Orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL,
  buyer_id uuid NOT NULL REFERENCES profiles(id),
  vendor_id uuid NOT NULL REFERENCES vendors(id),
  delivery_address_id uuid REFERENCES addresses(id),
  status order_status DEFAULT 'pending',
  subtotal numeric NOT NULL CHECK (subtotal >= 0),
  shipping_fee numeric DEFAULT 0 CHECK (shipping_fee >= 0),
  total_amount numeric NOT NULL CHECK (total_amount >= 0),
  payment_status payment_status DEFAULT 'pending',
  payment_method text,
  payment_reference text,
  tracking_number text,
  delivery_proof_url text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  delivered_at timestamptz
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers can view own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (buyer_id = auth.uid());

CREATE POLICY "Vendors can view own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));

CREATE POLICY "Buyers can create orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (buyer_id = auth.uid());

CREATE POLICY "Vendors can update own orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()))
  WITH CHECK (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));

-- 8. Order items table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id),
  product_title text NOT NULL,
  product_image text,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price numeric NOT NULL CHECK (unit_price >= 0),
  total_price numeric NOT NULL CHECK (total_price >= 0)
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Order items visible with order access"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    order_id IN (
      SELECT id FROM orders 
      WHERE buyer_id = auth.uid() 
      OR vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
    )
  );

-- 9. Escrow transactions table
CREATE TABLE IF NOT EXISTS escrow_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL REFERENCES profiles(id),
  vendor_id uuid NOT NULL REFERENCES vendors(id),
  amount numeric NOT NULL CHECK (amount >= 0),
  platform_fee numeric DEFAULT 0 CHECK (platform_fee >= 0),
  vendor_amount numeric NOT NULL CHECK (vendor_amount >= 0),
  status escrow_status DEFAULT 'held',
  held_at timestamptz DEFAULT now(),
  released_at timestamptz,
  release_reason text,
  dispute_reason text
);

ALTER TABLE escrow_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Escrow visible to transaction parties"
  ON escrow_transactions FOR SELECT
  TO authenticated
  USING (
    buyer_id = auth.uid() 
    OR vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
  );

-- 10. Wallet transactions table
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  type transaction_type NOT NULL,
  amount numeric NOT NULL,
  balance_after numeric NOT NULL CHECK (balance_after >= 0),
  reference text,
  description text,
  status text DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors can view own wallet transactions"
  ON wallet_transactions FOR SELECT
  TO authenticated
  USING (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));

-- 11. Payouts table
CREATE TABLE IF NOT EXISTS payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount > 0),
  bank_name text NOT NULL,
  account_number text NOT NULL,
  account_name text NOT NULL,
  status payout_status DEFAULT 'pending',
  reference text,
  requested_at timestamptz DEFAULT now(),
  processed_at timestamptz
);

ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors can manage own payouts"
  ON payouts FOR ALL
  TO authenticated
  USING (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()))
  WITH CHECK (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));

-- 12. Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  order_id uuid REFERENCES orders(id),
  buyer_id uuid NOT NULL REFERENCES profiles(id),
  vendor_id uuid NOT NULL REFERENCES vendors(id),
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text text,
  images jsonb DEFAULT '[]'::jsonb,
  is_verified_purchase boolean DEFAULT false,
  helpful_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews are publicly readable"
  ON reviews FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Buyers can create reviews"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (buyer_id = auth.uid());

CREATE POLICY "Buyers can update own reviews"
  ON reviews FOR UPDATE
  TO authenticated
  USING (buyer_id = auth.uid())
  WITH CHECK (buyer_id = auth.uid());

-- 13. Chat conversations table
CREATE TABLE IF NOT EXISTS chat_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vendor_id uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id),
  last_message text,
  last_message_at timestamptz DEFAULT now(),
  unread_buyer integer DEFAULT 0,
  unread_vendor integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(buyer_id, vendor_id, product_id)
);

ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Chat participants can view conversations"
  ON chat_conversations FOR SELECT
  TO authenticated
  USING (
    buyer_id = auth.uid() 
    OR vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
  );

CREATE POLICY "Buyers can create conversations"
  ON chat_conversations FOR INSERT
  TO authenticated
  WITH CHECK (buyer_id = auth.uid());

CREATE POLICY "Chat participants can update conversations"
  ON chat_conversations FOR UPDATE
  TO authenticated
  USING (
    buyer_id = auth.uid() 
    OR vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
  )
  WITH CHECK (
    buyer_id = auth.uid() 
    OR vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
  );

-- 14. Chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES profiles(id),
  message_text text,
  image_url text,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Chat participants can view messages"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (
    conversation_id IN (
      SELECT id FROM chat_conversations 
      WHERE buyer_id = auth.uid() 
      OR vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Chat participants can create messages"
  ON chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = auth.uid());

-- 15. Wishlists table
CREATE TABLE IF NOT EXISTS wishlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);

ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own wishlists"
  ON wishlists FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 16. Admin logs table
CREATE TABLE IF NOT EXISTS admin_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES profiles(id),
  action text NOT NULL,
  target_type text NOT NULL,
  target_id uuid,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view logs"
  ON admin_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_vendors_user_id ON vendors(user_id);
CREATE INDEX IF NOT EXISTS idx_vendors_verification ON vendors(verification_status);
CREATE INDEX IF NOT EXISTS idx_products_vendor ON products(vendor_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_orders_buyer ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_vendor ON orders(vendor_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_buyer ON chat_conversations(buyer_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_vendor ON chat_conversations(vendor_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_buyer ON reviews(buyer_id);