-- Update admin roles for all admin accounts
UPDATE profiles
SET role = 'admin'
WHERE email IN ('admin@nimex.ng', 'accounts@nimex.ng', 'support@nimex.ng');

-- Assign specific admin roles to admin accounts
INSERT INTO admin_role_assignments (user_id, role_id)
SELECT
  p.id,
  ar.id
FROM profiles p
CROSS JOIN admin_roles ar
WHERE (p.email = 'admin@nimex.ng' AND ar.name = 'super_admin')
   OR (p.email = 'accounts@nimex.ng' AND ar.name = 'account_team')
   OR (p.email = 'support@nimex.ng' AND ar.name = 'customer_support')
ON CONFLICT (user_id, role_id) DO NOTHING;