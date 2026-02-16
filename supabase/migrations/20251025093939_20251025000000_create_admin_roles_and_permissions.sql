/*
  # Admin Roles and Permissions System

  ## Overview
  This migration creates a comprehensive role-based access control (RBAC) system for
  NIMEX platform administrators with three distinct admin types: Super Admin, Account Team,
  and Customer Support.

  ## New Tables Created

  ### 1. admin_roles
  Defines the three types of admin roles with their descriptions
  - `id` (uuid, primary key)
  - `name` (text, unique) - Role name: super_admin, account_team, customer_support
  - `display_name` (text) - Human-readable role name
  - `description` (text) - Role responsibilities
  - `is_active` (boolean) - Whether role can be assigned
  - `created_at` (timestamptz)

  ### 2. admin_permissions
  Granular permissions for all administrative actions
  - `id` (uuid, primary key)
  - `name` (text, unique) - Permission identifier
  - `category` (text) - Permission grouping (users, vendors, content, etc.)
  - `description` (text) - What this permission allows
  - `created_at` (timestamptz)

  ### 3. role_permissions
  Maps permissions to roles (many-to-many relationship)
  - `role_id` (uuid) - References admin_roles
  - `permission_id` (uuid) - References admin_permissions

  ### 4. admin_role_assignments
  Assigns admin roles to users
  - `id` (uuid, primary key)
  - `user_id` (uuid) - References profiles
  - `role_id` (uuid) - References admin_roles
  - `assigned_by` (uuid) - References profiles (who assigned this role)
  - `assigned_at` (timestamptz)

  ## Permission Categories
  - users: User management and moderation
  - vendors: Vendor verification and management
  - products: Product listing moderation
  - orders: Order management and disputes
  - transactions: Financial transaction oversight
  - kyc: KYC approval and verification
  - content: Platform content management
  - settings: System configuration
  - reports: Analytics and reporting

  ## Security
  All tables have Row Level Security enabled with admin-only access policies.
*/

-- 1. Create admin_roles table
CREATE TABLE IF NOT EXISTS admin_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  display_name text NOT NULL,
  description text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view roles"
  ON admin_roles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 2. Create admin_permissions table
CREATE TABLE IF NOT EXISTS admin_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  category text NOT NULL,
  description text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view permissions"
  ON admin_permissions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 3. Create role_permissions junction table
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id uuid NOT NULL REFERENCES admin_roles(id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES admin_permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view role permissions"
  ON role_permissions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 4. Create admin_role_assignments table
CREATE TABLE IF NOT EXISTS admin_role_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES admin_roles(id) ON DELETE CASCADE,
  assigned_by uuid REFERENCES profiles(id),
  assigned_at timestamptz DEFAULT now(),
  UNIQUE(user_id, role_id)
);

ALTER TABLE admin_role_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view role assignments"
  ON admin_role_assignments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Super admins can assign roles"
  ON admin_role_assignments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_role_assignments ara
      JOIN admin_roles ar ON ara.role_id = ar.id
      WHERE ara.user_id = auth.uid()
      AND ar.name = 'super_admin'
    )
  );

-- Insert the three admin roles
INSERT INTO admin_roles (name, display_name, description) VALUES
  ('super_admin', 'Super Administrator', 'Full platform access with all permissions including user management, system configuration, and administrative oversight'),
  ('account_team', 'Account Team', 'Manages vendor accounts, KYC verification, vendor onboarding, and business account operations'),
  ('customer_support', 'Customer Support', 'Handles customer inquiries, order disputes, user issues, and content moderation')
ON CONFLICT (name) DO NOTHING;

-- Insert admin permissions by category

-- Users permissions
INSERT INTO admin_permissions (name, category, description) VALUES
  ('users.view', 'users', 'View user profiles and account information'),
  ('users.edit', 'users', 'Edit user profiles and account details'),
  ('users.suspend', 'users', 'Suspend or ban user accounts'),
  ('users.delete', 'users', 'Permanently delete user accounts')
ON CONFLICT (name) DO NOTHING;

-- Vendors permissions
INSERT INTO admin_permissions (name, category, description) VALUES
  ('vendors.view', 'vendors', 'View vendor profiles and business information'),
  ('vendors.verify', 'vendors', 'Approve or reject vendor verification'),
  ('vendors.edit', 'vendors', 'Edit vendor business details'),
  ('vendors.suspend', 'vendors', 'Suspend or deactivate vendor accounts')
ON CONFLICT (name) DO NOTHING;

-- Products permissions
INSERT INTO admin_permissions (name, category, description) VALUES
  ('products.view', 'products', 'View all product listings'),
  ('products.moderate', 'products', 'Approve, reject, or flag product listings'),
  ('products.edit', 'products', 'Edit product information'),
  ('products.delete', 'products', 'Remove product listings from platform')
ON CONFLICT (name) DO NOTHING;

-- Orders permissions
INSERT INTO admin_permissions (name, category, description) VALUES
  ('orders.view', 'orders', 'View all orders and order details'),
  ('orders.manage', 'orders', 'Update order status and manage order flow'),
  ('orders.disputes', 'orders', 'Handle order disputes and resolutions'),
  ('orders.refund', 'orders', 'Process refunds and cancellations')
ON CONFLICT (name) DO NOTHING;

-- Transactions permissions
INSERT INTO admin_permissions (name, category, description) VALUES
  ('transactions.view', 'transactions', 'View all financial transactions'),
  ('transactions.escrow', 'transactions', 'Manage escrow holds and releases'),
  ('transactions.payouts', 'transactions', 'Approve and process vendor payouts')
ON CONFLICT (name) DO NOTHING;

-- KYC permissions
INSERT INTO admin_permissions (name, category, description) VALUES
  ('kyc.view', 'kyc', 'View KYC submissions and documents'),
  ('kyc.approve', 'kyc', 'Approve KYC verification submissions'),
  ('kyc.reject', 'kyc', 'Reject KYC submissions with feedback')
ON CONFLICT (name) DO NOTHING;

-- Content permissions
INSERT INTO admin_permissions (name, category, description) VALUES
  ('content.view', 'content', 'View platform content and reviews'),
  ('content.moderate', 'content', 'Moderate reviews, comments, and user content'),
  ('content.delete', 'content', 'Remove inappropriate content')
ON CONFLICT (name) DO NOTHING;

-- Settings permissions
INSERT INTO admin_permissions (name, category, description) VALUES
  ('settings.view', 'settings', 'View platform settings and configuration'),
  ('settings.edit', 'settings', 'Modify platform settings and parameters'),
  ('settings.api', 'settings', 'Manage API keys and integrations')
ON CONFLICT (name) DO NOTHING;

-- Reports permissions
INSERT INTO admin_permissions (name, category, description) VALUES
  ('reports.view', 'reports', 'View analytics and reports'),
  ('reports.export', 'reports', 'Export reports and data'),
  ('reports.advanced', 'reports', 'Access advanced analytics and insights')
ON CONFLICT (name) DO NOTHING;

-- Assign permissions to Super Admin role (all permissions)
INSERT INTO role_permissions (role_id, permission_id)
SELECT
  (SELECT id FROM admin_roles WHERE name = 'super_admin'),
  id
FROM admin_permissions
ON CONFLICT DO NOTHING;

-- Assign permissions to Account Team role
INSERT INTO role_permissions (role_id, permission_id)
SELECT
  (SELECT id FROM admin_roles WHERE name = 'account_team'),
  id
FROM admin_permissions
WHERE name IN (
  'vendors.view', 'vendors.verify', 'vendors.edit', 'vendors.suspend',
  'kyc.view', 'kyc.approve', 'kyc.reject',
  'users.view', 'users.edit',
  'transactions.view', 'transactions.payouts',
  'reports.view', 'reports.export'
)
ON CONFLICT DO NOTHING;

-- Assign permissions to Customer Support role
INSERT INTO role_permissions (role_id, permission_id)
SELECT
  (SELECT id FROM admin_roles WHERE name = 'customer_support'),
  id
FROM admin_permissions
WHERE name IN (
  'users.view', 'users.edit',
  'orders.view', 'orders.manage', 'orders.disputes', 'orders.refund',
  'products.view', 'products.moderate',
  'content.view', 'content.moderate', 'content.delete',
  'transactions.view',
  'reports.view'
)
ON CONFLICT DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_role_assignments_user ON admin_role_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_role_assignments_role ON admin_role_assignments(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON role_permissions(permission_id);

-- Create function to check if user has specific permission
CREATE OR REPLACE FUNCTION has_admin_permission(user_id uuid, permission_name text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM admin_role_assignments ara
    JOIN role_permissions rp ON ara.role_id = rp.role_id
    JOIN admin_permissions ap ON rp.permission_id = ap.id
    WHERE ara.user_id = user_id
    AND ap.name = permission_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get all user permissions
CREATE OR REPLACE FUNCTION get_user_permissions(user_id uuid)
RETURNS TABLE (permission_name text, category text, description text) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ap.name, ap.category, ap.description
  FROM admin_role_assignments ara
  JOIN role_permissions rp ON ara.role_id = rp.role_id
  JOIN admin_permissions ap ON rp.permission_id = ap.id
  WHERE ara.user_id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
