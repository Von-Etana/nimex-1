-- Create custom types
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('buyer', 'vendor', 'admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE kyc_status AS ENUM ('pending', 'approved', 'rejected', 'resubmit');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'disputed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'refunded');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE escrow_status AS ENUM ('held', 'released', 'refunded', 'disputed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE transaction_type AS ENUM ('sale', 'refund', 'payout', 'fee');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payout_status AS ENUM ('pending', 'processing', 'completed', 'failed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

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

DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
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

DROP POLICY IF EXISTS "Categories are publicly readable" ON categories;
CREATE POLICY "Categories are publicly readable"
  ON categories FOR SELECT
  USING (is_active = true);

-- 3. Vendors table
CREATE TABLE IF NOT EXISTS vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  business_name text DEFAULT '',
  business_description text,
  business_address text,
  business_phone text,
  business_email text,
  business_location_lat decimal,
  business_location_lng decimal,
  cac_number text,
  subscription_plan text DEFAULT 'free',
  subscription_status text DEFAULT 'active',
  subscription_start_date timestamptz DEFAULT now(),
  subscription_end_date timestamptz,
  verification_status verification_status DEFAULT 'pending',
  verification_badge text DEFAULT 'none',
  verification_date timestamptz,
  rating numeric DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  total_sales integer DEFAULT 0,
  response_time integer DEFAULT 0,
  wallet_balance numeric DEFAULT 0 CHECK (wallet_balance >= 0),
  bank_name text,
  account_number text,
  account_name text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Vendors can read own data" ON vendors;
CREATE POLICY "Vendors can read own data"
  ON vendors FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Vendors can update own data" ON vendors;
CREATE POLICY "Vendors can update own data"
  ON vendors FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Vendors can insert own data" ON vendors;
CREATE POLICY "Vendors can insert own data"
  ON vendors FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Verified vendors visible to all" ON vendors;
CREATE POLICY "Verified vendors visible to all"
  ON vendors FOR SELECT
  USING (verification_status = 'verified' AND is_active = true);

-- 4. Addresses table  
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
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own addresses" ON addresses;
CREATE POLICY "Users can manage own addresses"
  ON addresses FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
