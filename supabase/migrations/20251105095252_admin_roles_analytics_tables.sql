/*
  # Admin Roles, Analytics, and Supporting Tables
  
  ## Tables Created
  - admin_roles
  - admin_permissions
  - role_permissions
  - admin_role_assignments
  - notifications
  - system_logs
  - analytics_daily
  - content_flags
  - subscription_history
  - vendor_analytics
  - promo_codes
  - platform_fees
  - webhook_logs
  - email_templates
  - support_tickets
  - vendor_documents
  - order_notes
*/

-- =====================================================
-- TABLE: admin_roles
-- =====================================================

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
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- =====================================================
-- TABLE: admin_permissions
-- =====================================================

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
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- =====================================================
-- TABLE: role_permissions
-- =====================================================

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
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- =====================================================
-- TABLE: admin_role_assignments
-- =====================================================

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
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

CREATE POLICY "Super admins can assign roles"
  ON admin_role_assignments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_role_assignments ara
      JOIN admin_roles ar ON ara.role_id = ar.id
      WHERE ara.user_id = auth.uid() AND ar.name = 'super_admin'
    )
  );

CREATE INDEX idx_admin_role_assignments_user ON admin_role_assignments(user_id);
CREATE INDEX idx_admin_role_assignments_role ON admin_role_assignments(role_id);

-- =====================================================
-- TABLE: notifications
-- =====================================================

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  link text,
  is_read boolean DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- =====================================================
-- TABLE: system_logs
-- =====================================================

CREATE TABLE IF NOT EXISTS system_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  level log_level NOT NULL DEFAULT 'info',
  source text NOT NULL,
  event text NOT NULL,
  message text,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view system logs"
  ON system_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

CREATE POLICY "System can create logs"
  ON system_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE INDEX idx_system_logs_level ON system_logs(level);
CREATE INDEX idx_system_logs_created_at ON system_logs(created_at DESC);
CREATE INDEX idx_system_logs_user_id ON system_logs(user_id);

-- =====================================================
-- TABLE: analytics_daily
-- =====================================================

CREATE TABLE IF NOT EXISTS analytics_daily (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL UNIQUE,
  total_users integer DEFAULT 0,
  new_users integer DEFAULT 0,
  total_vendors integer DEFAULT 0,
  active_vendors integer DEFAULT 0,
  total_products integer DEFAULT 0,
  new_products integer DEFAULT 0,
  total_orders integer DEFAULT 0,
  completed_orders integer DEFAULT 0,
  total_revenue numeric DEFAULT 0,
  platform_fees numeric DEFAULT 0,
  total_refunds numeric DEFAULT 0,
  avg_order_value numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE analytics_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view analytics"
  ON analytics_daily FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

CREATE POLICY "Admins can manage analytics"
  ON analytics_daily FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

CREATE INDEX idx_analytics_daily_date ON analytics_daily(date DESC);

-- =====================================================
-- TABLE: content_flags
-- =====================================================

CREATE TABLE IF NOT EXISTS content_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type text NOT NULL CHECK (content_type IN ('product', 'review', 'vendor', 'message')),
  content_id uuid NOT NULL,
  reported_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason flag_reason NOT NULL,
  description text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  reviewed_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  resolution_notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE content_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create flags"
  ON content_flags FOR INSERT
  TO authenticated
  WITH CHECK (reported_by = auth.uid());

CREATE POLICY "Users can view own flags"
  ON content_flags FOR SELECT
  TO authenticated
  USING (reported_by = auth.uid());

CREATE POLICY "Admins can view all flags"
  ON content_flags FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

CREATE POLICY "Admins can update flags"
  ON content_flags FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

CREATE INDEX idx_content_flags_status ON content_flags(status);
CREATE INDEX idx_content_flags_content ON content_flags(content_type, content_id);

-- =====================================================
-- TABLE: subscription_history
-- =====================================================

CREATE TABLE IF NOT EXISTS subscription_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  previous_plan text,
  new_plan text NOT NULL,
  change_type text NOT NULL CHECK (change_type IN ('upgrade', 'downgrade', 'renewal', 'cancellation')),
  amount numeric DEFAULT 0,
  payment_reference text,
  effective_date timestamptz NOT NULL,
  expiry_date timestamptz,
  changed_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE subscription_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors can view own subscription history"
  ON subscription_history FOR SELECT
  TO authenticated
  USING (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));

CREATE POLICY "Admins can view all subscription history"
  ON subscription_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

CREATE INDEX idx_subscription_history_vendor ON subscription_history(vendor_id);

-- =====================================================
-- TABLE: vendor_analytics
-- =====================================================

CREATE TABLE IF NOT EXISTS vendor_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  date date NOT NULL,
  product_views integer DEFAULT 0,
  profile_views integer DEFAULT 0,
  total_orders integer DEFAULT 0,
  completed_orders integer DEFAULT 0,
  cancelled_orders integer DEFAULT 0,
  total_revenue numeric DEFAULT 0,
  total_refunds numeric DEFAULT 0,
  avg_order_value numeric DEFAULT 0,
  new_customers integer DEFAULT 0,
  returning_customers integer DEFAULT 0,
  avg_rating numeric DEFAULT 0,
  total_reviews integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(vendor_id, date)
);

ALTER TABLE vendor_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors can view own analytics"
  ON vendor_analytics FOR SELECT
  TO authenticated
  USING (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));

CREATE POLICY "Admins can view all vendor analytics"
  ON vendor_analytics FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

CREATE INDEX idx_vendor_analytics_vendor ON vendor_analytics(vendor_id);
CREATE INDEX idx_vendor_analytics_date ON vendor_analytics(date DESC);

-- =====================================================
-- TABLE: promo_codes
-- =====================================================

CREATE TABLE IF NOT EXISTS promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  type promo_type NOT NULL,
  discount_value numeric NOT NULL CHECK (discount_value > 0),
  max_discount_amount numeric,
  min_order_amount numeric DEFAULT 0,
  usage_limit integer,
  used_count integer DEFAULT 0,
  vendor_id uuid REFERENCES vendors(id) ON DELETE CASCADE,
  valid_from timestamptz DEFAULT now(),
  valid_until timestamptz,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active promo codes are publicly readable"
  ON promo_codes FOR SELECT
  TO authenticated
  USING (is_active = true AND (valid_until IS NULL OR valid_until > now()));

CREATE POLICY "Vendors can manage own promo codes"
  ON promo_codes FOR ALL
  TO authenticated
  USING (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()))
  WITH CHECK (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage all promo codes"
  ON promo_codes FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

CREATE INDEX idx_promo_codes_code ON promo_codes(code);
CREATE INDEX idx_promo_codes_vendor ON promo_codes(vendor_id);

-- =====================================================
-- TABLE: platform_fees
-- =====================================================

CREATE TABLE IF NOT EXISTS platform_fees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  vendor_id uuid REFERENCES vendors(id) ON DELETE CASCADE,
  fee_type text NOT NULL CHECK (fee_type IN ('percentage', 'fixed', 'tiered')),
  fee_value numeric NOT NULL CHECK (fee_value >= 0),
  min_fee numeric DEFAULT 0,
  max_fee numeric,
  is_active boolean DEFAULT true,
  effective_from timestamptz DEFAULT now(),
  effective_until timestamptz,
  notes text,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE platform_fees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors can view applicable fees"
  ON platform_fees FOR SELECT
  TO authenticated
  USING (
    is_active = true 
    AND (vendor_id IS NULL OR vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()))
  );

CREATE POLICY "Admins can manage platform fees"
  ON platform_fees FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- =====================================================
-- TABLE: webhook_logs
-- =====================================================

CREATE TABLE IF NOT EXISTS webhook_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL CHECK (source IN ('paystack', 'flutterwave', 'gigl', 'other')),
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  headers jsonb,
  response_status integer,
  response_body jsonb,
  processed boolean DEFAULT false,
  error_message text,
  retry_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz
);

ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view webhook logs"
  ON webhook_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

CREATE POLICY "System can create webhook logs"
  ON webhook_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE INDEX idx_webhook_logs_source ON webhook_logs(source);
CREATE INDEX idx_webhook_logs_processed ON webhook_logs(processed);

-- =====================================================
-- TABLE: email_templates
-- =====================================================

CREATE TABLE IF NOT EXISTS email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key text UNIQUE NOT NULL,
  name text NOT NULL,
  subject text NOT NULL,
  body_html text NOT NULL,
  body_text text NOT NULL,
  variables jsonb DEFAULT '[]'::jsonb,
  category text NOT NULL,
  is_active boolean DEFAULT true,
  version integer DEFAULT 1,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage email templates"
  ON email_templates FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- =====================================================
-- TABLE: support_tickets
-- =====================================================

CREATE TABLE IF NOT EXISTS support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number text UNIQUE NOT NULL,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  priority ticket_priority DEFAULT 'medium',
  status ticket_status DEFAULT 'open',
  assigned_to uuid REFERENCES profiles(id) ON DELETE SET NULL,
  order_id uuid REFERENCES orders(id),
  attachments jsonb DEFAULT '[]'::jsonb,
  tags text[],
  resolved_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tickets"
  ON support_tickets FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create tickets"
  ON support_tickets FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Support team can view all tickets"
  ON support_tickets FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

CREATE POLICY "Support team can manage tickets"
  ON support_tickets FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

CREATE INDEX idx_support_tickets_user ON support_tickets(user_id);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);

-- =====================================================
-- TABLE: vendor_documents
-- =====================================================

CREATE TABLE IF NOT EXISTS vendor_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  document_type document_type NOT NULL,
  document_url text NOT NULL,
  document_number text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  verified_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  verified_at timestamptz,
  rejection_reason text,
  expiry_date date,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE vendor_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors can view own documents"
  ON vendor_documents FOR SELECT
  TO authenticated
  USING (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));

CREATE POLICY "Vendors can upload documents"
  ON vendor_documents FOR INSERT
  TO authenticated
  WITH CHECK (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));

CREATE POLICY "Admins can view all documents"
  ON vendor_documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

CREATE POLICY "Admins can update documents"
  ON vendor_documents FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

CREATE INDEX idx_vendor_documents_vendor ON vendor_documents(vendor_id);
CREATE INDEX idx_vendor_documents_status ON vendor_documents(status);

-- =====================================================
-- TABLE: order_notes
-- =====================================================

CREATE TABLE IF NOT EXISTS order_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  note_type text DEFAULT 'internal' CHECK (note_type IN ('internal', 'customer', 'vendor')),
  content text NOT NULL,
  is_important boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE order_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Order participants can view notes"
  ON order_notes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_notes.order_id
      AND (
        o.buyer_id = auth.uid()
        OR o.vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
      )
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

CREATE POLICY "Order participants can create notes"
  ON order_notes FOR INSERT
  TO authenticated
  WITH CHECK (author_id = auth.uid());

CREATE INDEX idx_order_notes_order ON order_notes(order_id);

-- =====================================================
-- INSERT DEFAULT DATA
-- =====================================================

-- Insert admin roles
INSERT INTO admin_roles (name, display_name, description) VALUES
  ('super_admin', 'Super Administrator', 'Full platform access with all permissions'),
  ('account_team', 'Account Team', 'Manages vendor accounts and KYC verification'),
  ('customer_support', 'Customer Support', 'Handles customer inquiries and order disputes')
ON CONFLICT (name) DO NOTHING;

-- Insert admin permissions
INSERT INTO admin_permissions (name, category, description) VALUES
  ('users.view', 'users', 'View user profiles and account information'),
  ('users.edit', 'users', 'Edit user profiles and account details'),
  ('users.suspend', 'users', 'Suspend or ban user accounts'),
  ('vendors.view', 'vendors', 'View vendor profiles and business information'),
  ('vendors.verify', 'vendors', 'Approve or reject vendor verification'),
  ('vendors.edit', 'vendors', 'Edit vendor business details'),
  ('products.view', 'products', 'View all product listings'),
  ('products.moderate', 'products', 'Approve, reject, or flag product listings'),
  ('products.edit', 'products', 'Edit product information'),
  ('orders.view', 'orders', 'View all orders and order details'),
  ('orders.manage', 'orders', 'Update order status and manage order flow'),
  ('orders.disputes', 'orders', 'Handle order disputes and resolutions'),
  ('transactions.view', 'transactions', 'View all financial transactions'),
  ('transactions.escrow', 'transactions', 'Manage escrow holds and releases'),
  ('transactions.payouts', 'transactions', 'Approve and process vendor payouts'),
  ('kyc.view', 'kyc', 'View KYC submissions and documents'),
  ('kyc.approve', 'kyc', 'Approve KYC verification submissions'),
  ('kyc.reject', 'kyc', 'Reject KYC submissions with feedback'),
  ('content.view', 'content', 'View platform content and reviews'),
  ('content.moderate', 'content', 'Moderate reviews, comments, and user content'),
  ('settings.view', 'settings', 'View platform settings and configuration'),
  ('settings.edit', 'settings', 'Modify platform settings and parameters'),
  ('reports.view', 'reports', 'View analytics and reports'),
  ('reports.export', 'reports', 'Export reports and data')
ON CONFLICT (name) DO NOTHING;

-- Assign all permissions to Super Admin
INSERT INTO role_permissions (role_id, permission_id)
SELECT
  (SELECT id FROM admin_roles WHERE name = 'super_admin'),
  id
FROM admin_permissions
ON CONFLICT DO NOTHING;

-- Assign permissions to Account Team
INSERT INTO role_permissions (role_id, permission_id)
SELECT
  (SELECT id FROM admin_roles WHERE name = 'account_team'),
  id
FROM admin_permissions
WHERE name IN (
  'vendors.view', 'vendors.verify', 'vendors.edit',
  'kyc.view', 'kyc.approve', 'kyc.reject',
  'users.view', 'users.edit',
  'transactions.view', 'transactions.payouts',
  'reports.view', 'reports.export'
)
ON CONFLICT DO NOTHING;

-- Assign permissions to Customer Support
INSERT INTO role_permissions (role_id, permission_id)
SELECT
  (SELECT id FROM admin_roles WHERE name = 'customer_support'),
  id
FROM admin_permissions
WHERE name IN (
  'users.view', 'users.edit',
  'orders.view', 'orders.manage', 'orders.disputes',
  'products.view', 'products.moderate',
  'content.view', 'content.moderate',
  'transactions.view',
  'reports.view'
)
ON CONFLICT DO NOTHING;

-- Insert default platform fee
INSERT INTO platform_fees (fee_type, fee_value, notes, is_active) VALUES
  ('percentage', 5.0, 'Default platform commission rate', true)
ON CONFLICT DO NOTHING;

-- Insert default email templates
INSERT INTO email_templates (template_key, name, subject, body_html, body_text, category, variables) VALUES
  ('welcome', 'Welcome Email', 'Welcome to NIMEX!', '<h1>Welcome {{name}}!</h1><p>Thank you for joining NIMEX.</p>', 'Welcome {{name}}! Thank you for joining NIMEX.', 'onboarding', '["name", "email"]'),
  ('order_confirmation', 'Order Confirmation', 'Order Confirmed - {{order_number}}', '<h1>Order Confirmed</h1><p>Your order {{order_number}} has been confirmed.</p>', 'Order {{order_number}} confirmed.', 'orders', '["name", "order_number", "total_amount"]'),
  ('kyc_approved', 'KYC Approved', 'Your KYC Verification is Approved', '<h1>Congratulations!</h1><p>Your KYC verification has been approved.</p>', 'Your KYC verification has been approved.', 'kyc', '["name", "business_name"]'),
  ('kyc_rejected', 'KYC Rejected', 'KYC Verification Needs Attention', '<h1>KYC Update Required</h1><p>Your KYC submission needs to be updated.</p>', 'Your KYC submission needs to be updated.', 'kyc', '["name", "reason"]')
ON CONFLICT (template_key) DO NOTHING;

-- Helper function to check if user has permission
CREATE OR REPLACE FUNCTION has_admin_permission(user_uuid uuid, permission_name text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM admin_role_assignments ara
    JOIN role_permissions rp ON ara.role_id = rp.role_id
    JOIN admin_permissions ap ON rp.permission_id = ap.id
    WHERE ara.user_id = user_uuid
    AND ap.name = permission_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user permissions
CREATE OR REPLACE FUNCTION get_user_permissions(user_uuid uuid)
RETURNS TABLE (permission_name text, category text, description text) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ap.name, ap.category, ap.description
  FROM admin_role_assignments ara
  JOIN role_permissions rp ON ara.role_id = rp.role_id
  JOIN admin_permissions ap ON rp.permission_id = ap.id
  WHERE ara.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
