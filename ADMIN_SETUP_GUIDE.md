# Admin Dashboard Setup Guide

## Overview
This document outlines the admin roles, permissions, and credentials for the NIMEX admin dashboard.

## Admin Roles

### 1. Super Admin
**Email:** admin@nimex.ng  
**Password:** NimexAdmin2024!  
**Full Access:** All permissions across the entire system

**Capabilities:**
- Complete system control
- User and vendor management
- Financial oversight
- System settings configuration
- Role and permission management

---

### 2. Customer Support
**Email:** support@nimex.ng  
**Password:** NimexSupport2024!  
**Focus:** Customer service and support operations

**Permissions:**
- ✅ View user profiles and location data
- ✅ View vendor profiles
- ✅ View products
- ✅ View and edit orders
- ✅ View, respond to, close, and escalate support tickets
- ✅ View disputes
- ✅ View reports

**Use Cases:**
- Handle customer inquiries
- Resolve support tickets
- Track user locations for delivery issues
- Assist with order-related problems
- Escalate complex issues

---

### 3. Accountant
**Email:** accountant@nimex.ng  
**Password:** NimexAcct2024!  
**Focus:** Financial management and reporting

**Permissions:**
- ✅ View all financial reports
- ✅ View all transactions
- ✅ Manage escrow transactions
- ✅ Process vendor payouts
- ✅ Process refunds
- ✅ View orders
- ✅ View vendor profiles
- ✅ View and export reports
- ✅ View analytics dashboard

**Use Cases:**
- Process vendor payments
- Handle refunds
- Monitor escrow transactions
- Generate financial reports
- Audit transactions

---

### 4. Head of Marketing
**Email:** marketing@nimex.ng  
**Password:** NimexMkt2024!  
**Focus:** Marketing campaigns and growth

**Permissions:**
- ✅ View, create, edit, and delete marketing campaigns
- ✅ View marketing analytics
- ✅ View and approve marketers
- ✅ Manage marketer commissions
- ✅ View products
- ✅ Feature/unfeature products
- ✅ View vendor profiles
- ✅ View analytics dashboard
- ✅ View and export reports

**Use Cases:**
- Create and manage marketing campaigns
- Approve marketer registrations
- Track marketing performance
- Feature products on homepage
- Manage affiliate commissions

---

## Permission Categories

### User Management
- View, create, edit, delete, and suspend users
- **Access user location data** for delivery and support purposes

### Vendor Management
- View, approve, edit, and suspend vendors

### KYC Management
- View, approve, and reject KYC submissions

### Product Management
- View, edit, delete, and feature products

### Order Management
- View, edit, and cancel orders

### Financial Management
- View financial reports
- Manage transactions, escrow, payouts, and refunds

### Support Management
- View, respond to, close, and escalate support tickets

### Dispute Management
- View and resolve disputes

### Marketing Management
- Manage campaigns, analytics, and marketers

### System Settings
- View and edit system settings
- Manage security settings

### Reports & Analytics
- View, export reports, and access analytics

### Admin Management
- Manage roles, permissions, and assignments

---

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Admin Seeding Script
```bash
npm run seed:admin
```

This script will:
- Create all permission records (50+ permissions)
- Create 4 admin roles with appropriate permissions
- Create 4 admin user accounts
- Assign roles to each admin user

### 3. First Login
1. Navigate to `/login`
2. Use one of the admin credentials above
3. You'll be redirected to `/admin` dashboard
4. **IMPORTANT:** Change your password immediately after first login

---

## User Location Access

The system includes user location tracking for:
- **Delivery optimization:** Track delivery addresses and zones
- **Support purposes:** Help customers with location-specific issues
- **Analytics:** Understand geographic distribution of users

**Roles with location access:**
- Super Admin (full access)
- Customer Support (view only for support purposes)

**Privacy Compliance:**
- Location data is only used for operational purposes
- Access is logged in audit trails
- Users consent to location tracking during registration

---

## Security Best Practices

1. **Change Default Passwords:** All admin accounts should change passwords after first login
2. **Use Strong Passwords:** Minimum 12 characters with uppercase, lowercase, numbers, and symbols
3. **Enable 2FA:** (To be implemented) Enable two-factor authentication
4. **Regular Audits:** Review admin access logs regularly
5. **Principle of Least Privilege:** Only assign necessary permissions
6. **Revoke Access:** Immediately revoke access for departed staff

---

## Adding New Admin Users

### Via Super Admin Dashboard
1. Login as Super Admin
2. Navigate to Admin > Users
3. Click "Add Admin User"
4. Fill in details and assign role
5. Send credentials securely to new admin

### Via Script (for bulk creation)
Edit `scripts/seed-admin-accounts.ts` and add new accounts to `ADMIN_ACCOUNTS` array.

---

## Modifying Roles and Permissions

### Add New Permission
1. Edit `scripts/seed-admin-accounts.ts`
2. Add permission to `PERMISSIONS` array
3. Assign to appropriate roles in `ROLES` array
4. Re-run seeding script

### Modify Role Permissions
1. Edit role in `ROLES` array
2. Add/remove permission names
3. Re-run seeding script

---

## Troubleshooting

### Script Fails to Run
- Ensure `.env` file has correct Firebase credentials
- Check Firebase project permissions
- Verify network connectivity

### Admin Can't Login
- Verify email and password are correct
- Check Firebase Authentication console
- Ensure user role is set to 'admin' in Firestore

### Missing Permissions
- Re-run seeding script: `npm run seed:admin`
- Check role assignments in Firestore
- Verify permission IDs match in role_permissions collection

---

## Support

For issues with admin setup:
1. Check Firebase Console for errors
2. Review Firestore collections: `admin_roles`, `admin_permissions`, `admin_role_assignments`
3. Contact system administrator

---

**Last Updated:** December 12, 2024  
**Version:** 1.0.0
