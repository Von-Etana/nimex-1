/*
  # Create Demo Accounts for NIMEX Platform

  1. Purpose
    - Create demo user and vendor accounts for testing and demonstration
    - Populate with sample data for immediate platform exploration

  2. Demo Accounts Created
    - Demo Buyer Account: demo@buyer.nimex.ng / DemoPassword123!
    - Demo Vendor Account: demo@vendor.nimex.ng / DemoPassword123!

  3. Sample Data
    - Vendor profile with business information
    - Sample products for the demo vendor
    - Sample transactions for account history
    - Sample payout methods

  4. Important Notes
    - These are demonstration accounts with placeholder data
    - In production, remove or disable these accounts
    - Passwords should be changed immediately in production environment
*/

DO $$
DECLARE
  demo_buyer_id uuid;
  demo_vendor_id uuid;
  vendor_profile_id uuid;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'demo@buyer.nimex.ng'
  ) THEN
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      aud,
      role
    ) VALUES (
      gen_random_uuid(),
      '00000000-0000-0000-0000-000000000000',
      'demo@buyer.nimex.ng',
      crypt('DemoPassword123!', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Demo Buyer","user_type":"buyer"}'::jsonb,
      'authenticated',
      'authenticated'
    )
    RETURNING id INTO demo_buyer_id;

    INSERT INTO user_profiles (
      user_id,
      full_name,
      phone_number,
      user_type,
      created_at,
      updated_at
    ) VALUES (
      demo_buyer_id,
      'Demo Buyer',
      '+234 800 123 4567',
      'buyer',
      now(),
      now()
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'demo@vendor.nimex.ng'
  ) THEN
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      aud,
      role
    ) VALUES (
      gen_random_uuid(),
      '00000000-0000-0000-0000-000000000000',
      'demo@vendor.nimex.ng',
      crypt('DemoPassword123!', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Demo Vendor","user_type":"vendor"}'::jsonb,
      'authenticated',
      'authenticated'
    )
    RETURNING id INTO demo_vendor_id;

    INSERT INTO user_profiles (
      user_id,
      full_name,
      phone_number,
      user_type,
      created_at,
      updated_at
    ) VALUES (
      demo_vendor_id,
      'Demo Vendor Shop',
      '+234 800 765 4321',
      'vendor',
      now(),
      now()
    );

    INSERT INTO vendor_profiles (
      id,
      vendor_id,
      business_name,
      business_description,
      business_address,
      city,
      state,
      verification_status,
      rating,
      total_sales,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      demo_vendor_id,
      'Demo Artisan Crafts',
      'Authentic handmade Nigerian crafts, textiles, and home decor. Specializing in traditional Adire fabrics, wooden sculptures, and beaded jewelry. Family-owned business with over 20 years of craftsmanship experience.',
      '45 Craft Market Road, Ikeja',
      'Lagos',
      'Lagos',
      'verified',
      4.8,
      1250000.00,
      now(),
      now()
    )
    RETURNING id INTO vendor_profile_id;

    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_name = 'products'
    ) THEN
      INSERT INTO products (
        vendor_id,
        name,
        description,
        price,
        category,
        stock_quantity,
        image_url,
        is_active,
        created_at,
        updated_at
      ) VALUES
      (
        demo_vendor_id,
        'Handwoven Adire Fabric (5 yards)',
        'Authentic indigo-dyed Adire fabric featuring traditional Nigerian patterns. Perfect for making clothing, home decor, or crafts. 100% cotton, hand-woven by local artisans.',
        15000.00,
        'Fashion',
        25,
        '/image-1.png',
        true,
        now(),
        now()
      ),
      (
        demo_vendor_id,
        'Carved Wooden Mask - Yoruba Design',
        'Traditional Yoruba ceremonial mask hand-carved from premium African hardwood. Each piece is unique and showcases expert craftsmanship. Perfect for home decoration or cultural collections.',
        28000.00,
        'Home & Office',
        12,
        '/image-2.png',
        true,
        now(),
        now()
      ),
      (
        demo_vendor_id,
        'Beaded Jewelry Set (Necklace + Earrings)',
        'Stunning coral and gold beaded jewelry set inspired by traditional Benin royal adornments. Handmade with premium quality beads. Perfect for special occasions and cultural events.',
        35000.00,
        'Fashion',
        18,
        '/image-3.png',
        true,
        now(),
        now()
      ),
      (
        demo_vendor_id,
        'Woven Storage Basket Set (3 pieces)',
        'Beautiful set of three nesting storage baskets woven from natural raffia palm. Durable, eco-friendly, and perfect for organizing your home while adding authentic African aesthetic.',
        12500.00,
        'Home & Office',
        30,
        '/image-4.png',
        true,
        now(),
        now()
      ),
      (
        demo_vendor_id,
        'Hand-painted Calabash Bowl',
        'Decorative calabash bowl featuring intricate hand-painted traditional motifs. Can be used for display or functional purposes. Each bowl is unique and tells a story.',
        8900.00,
        'Home & Office',
        20,
        '/image-5.png',
        true,
        now(),
        now()
      );
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_name = 'vendor_accounts'
    ) THEN
      INSERT INTO vendor_accounts (
        vendor_id,
        balance,
        status,
        created_at,
        updated_at
      ) VALUES (
        demo_vendor_id,
        250500.00,
        'active',
        now(),
        now()
      );
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_name = 'vendor_transactions'
    ) THEN
      INSERT INTO vendor_transactions (
        vendor_id,
        transaction_date,
        description,
        type,
        amount,
        status,
        created_at
      ) VALUES
      (
        demo_vendor_id,
        CURRENT_DATE,
        'Sale: Handwoven Basket',
        'sale',
        15000.00,
        'completed',
        now()
      ),
      (
        demo_vendor_id,
        CURRENT_DATE - INTERVAL '1 day',
        'Payout: Bank Transfer',
        'payout',
        -20000.00,
        'completed',
        now()
      ),
      (
        demo_vendor_id,
        CURRENT_DATE - INTERVAL '2 days',
        'Ad Fee: Featured Listing',
        'fee',
        -2500.00,
        'completed',
        now()
      ),
      (
        demo_vendor_id,
        CURRENT_DATE - INTERVAL '3 days',
        'Sale: Artisan Necklace',
        'sale',
        8500.00,
        'completed',
        now()
      ),
      (
        demo_vendor_id,
        CURRENT_DATE - INTERVAL '4 days',
        'Payout: Mobile Money',
        'payout',
        -5000.00,
        'pending',
        now()
      ),
      (
        demo_vendor_id,
        CURRENT_DATE - INTERVAL '5 days',
        'Sale: Handmade Leather Bag',
        'sale',
        25000.00,
        'completed',
        now()
      );
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_name = 'vendor_payout_methods'
    ) THEN
      INSERT INTO vendor_payout_methods (
        vendor_id,
        type,
        name,
        details,
        is_primary,
        created_at,
        updated_at
      ) VALUES
      (
        demo_vendor_id,
        'bank',
        'Zenith Bank',
        '{"bank_name": "Zenith Bank", "account_number": "1234567890", "account_name": "Demo Artisan Crafts"}'::jsonb,
        true,
        now(),
        now()
      ),
      (
        demo_vendor_id,
        'mobile_money',
        'M-Pesa',
        '{"provider": "M-Pesa", "phone_number": "+234 801 567 8901"}'::jsonb,
        false,
        now(),
        now()
      );
    END IF;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS demo_account_info (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_type text NOT NULL,
  email text NOT NULL,
  password text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE demo_account_info ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Demo account info is public read"
  ON demo_account_info
  FOR SELECT
  USING (true);

INSERT INTO demo_account_info (account_type, email, password, description)
VALUES
('Buyer', 'demo@buyer.nimex.ng', 'DemoPassword123!', 'Demo buyer account for testing purchases and browsing products'),
('Vendor', 'demo@vendor.nimex.ng', 'DemoPassword123!', 'Demo vendor account with sample products, transactions, and account management features')
ON CONFLICT DO NOTHING;
