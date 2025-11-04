# NIMEX Platform - Demo Account Credentials

**Last Updated:** November 4, 2025

---

## Quick Access Demo Accounts

Use these credentials to explore the full functionality of the NIMEX marketplace platform. All accounts are pre-configured with sample data for immediate testing.

---

## 🛍️ Demo Buyer Account

**Use this account to:**
- Browse products and marketplace
- Add items to cart
- Complete checkout process
- Track orders
- Manage delivery addresses
- Chat with vendors
- Leave product reviews
- Manage profile and preferences

### Login Credentials

```
Email:    demo@buyer.nimex.ng
Password: DemoPassword123!
```

### Account Features

- **Profile**: Complete buyer profile with contact information
- **Phone**: +234 800 123 4567
- **Role**: Buyer
- **Status**: Active and verified
- **Sample Data**: Pre-configured delivery addresses for testing checkout

### How to Login

1. Navigate to the NIMEX platform
2. Click "Login" button
3. Enter the email: `demo@buyer.nimex.ng`
4. Enter the password: `DemoPassword123!`
5. Click "Sign In"

### Test Scenarios

**Shopping Flow:**
1. Browse products on the homepage
2. Search for specific items
3. Add products to cart
4. Proceed to checkout
5. Select delivery address (or add new one with map)
6. Choose delivery type (Standard/Express/Same Day)
7. Complete payment (use Paystack test card)
8. View order confirmation
9. Track order delivery

**Order Management:**
1. View all orders in "Orders" section
2. Track delivery status
3. View delivery route on map
4. Confirm delivery when received
5. Leave product review
6. Contact vendor via chat

---

## 🏪 Demo Vendor Account

**Use this account to:**
- Manage vendor dashboard
- Create and manage products
- Process orders
- Handle deliveries with GIGL
- Manage wallet and payouts
- View analytics and reports
- Respond to customer messages
- Manage business profile

### Login Credentials

```
Email:    demo@vendor.nimex.ng
Password: DemoPassword123!
```

### Account Features

- **Business Name**: Demo Artisan Crafts
- **Business Type**: Handmade crafts and textiles
- **Verification**: ✅ Verified Vendor
- **Rating**: ⭐ 4.8/5.0
- **Total Sales**: ₦1,250,000
- **Wallet Balance**: ₦250,500
- **Phone**: +234 800 765 4321
- **Location**: 45 Craft Market Road, Ikeja, Lagos
- **Status**: Active with full access

### Pre-loaded Sample Data

**Sample Products (5 items):**
1. Handwoven Adire Fabric (5 yards) - ₦15,000
2. Carved Wooden Mask - Yoruba Design - ₦28,000
3. Beaded Jewelry Set (Necklace + Earrings) - ₦35,000
4. Woven Storage Basket Set (3 pieces) - ₦12,500
5. Hand-painted Calabash Bowl - ₦8,900

**Transaction History:**
- Recent sales transactions
- Payout history
- Platform fee records
- Balance adjustments

**Payout Methods Configured:**
- Zenith Bank Account (Primary)
- M-Pesa Mobile Money

### How to Login

1. Navigate to the NIMEX platform
2. Click "Login" button
3. Enter the email: `demo@vendor.nimex.ng`
4. Enter the password: `DemoPassword123!`
5. Click "Sign In"
6. Access Vendor Dashboard

### Test Scenarios

**Product Management:**
1. View existing products in Products section
2. Create new product listing
3. Upload product images
4. Set prices and inventory
5. Add product tags for search
6. Activate/deactivate listings

**Order Fulfillment:**
1. Receive new order notification
2. Review order details
3. Confirm order and update status
4. Create GIGL delivery shipment
5. Get tracking number
6. Update delivery status
7. Monitor until delivered

**Financial Management:**
1. Check wallet balance
2. View transaction history
3. Review escrow holdings
4. Request payout
5. View payout history
6. Monitor revenue analytics

**Business Operations:**
1. Update business profile
2. Set location on map
3. Manage bank details
4. View analytics dashboard
5. Check customer reviews
6. Respond to customer messages

---

## 👨‍💼 Demo Admin Accounts

**Use these accounts to:**
- Manage platform users
- Approve vendor KYC
- Moderate product listings
- Monitor transactions
- Resolve disputes
- View platform analytics
- Configure system settings
- Manage admin permissions

### 1. Super Administrator Account

**Full platform access with all permissions**

```
Email:    admin@nimex.ng
Password: NimexAdmin2024!
```

**Role**: Super Admin
**Permissions**: ALL
- User management (view, create, edit, delete)
- Vendor management (approve, suspend, verify)
- Product moderation (approve, reject, remove)
- Order management (view all, modify, cancel)
- Financial operations (view, process refunds, release escrow)
- System settings (configure platform)
- Content moderation (manage reviews, flags)
- Dispute resolution (all cases)
- Admin management (create admins, assign roles)

**Dashboard Access:**
- Platform metrics and KPIs
- User growth analytics
- Revenue reports
- Transaction monitoring
- System health status

---

### 2. Account Team Member

**Focus on vendor management and financial operations**

```
Email:    accounts@nimex.ng
Password: NimexAccounts2024!
```

**Role**: Account Team
**Permissions**:
- ✅ Vendor management (KYC approval, verification)
- ✅ Financial operations (transaction monitoring)
- ✅ Payout processing
- ✅ Account verification
- ❌ User deletion
- ❌ System settings
- ❌ Admin management

**Typical Tasks:**
- Review and approve vendor KYC documents
- Verify business registrations
- Assign verification badges
- Monitor vendor transactions
- Process payout requests
- Investigate financial discrepancies

---

### 3. Customer Support Agent

**Focus on customer service and order management**

```
Email:    support@nimex.ng
Password: NimexSupport2024!
```

**Role**: Customer Support
**Permissions**:
- ✅ User management (view, limited edit)
- ✅ Order management (view, status updates)
- ✅ Dispute resolution
- ✅ Content moderation (reviews)
- ✅ Customer messaging
- ❌ Financial operations
- ❌ System settings
- ❌ Admin management

**Typical Tasks:**
- Respond to customer inquiries
- Update order statuses
- Resolve buyer-vendor disputes
- Moderate product reviews
- Handle customer complaints
- Escalate complex issues

---

## 🚀 Quick Start Guide

### For First-Time Setup

**Step 1: Create Demo Accounts**
```bash
# These accounts need to be created via Supabase Edge Functions
# Call these endpoints once to set up all demo accounts:

# Create buyer and vendor demo accounts
POST {SUPABASE_URL}/functions/v1/create-demo-accounts

# Create admin accounts
POST {SUPABASE_URL}/functions/v1/create-admin-accounts
```

**Step 2: Verify Accounts**
1. Try logging in with buyer account
2. Verify buyer can browse products
3. Try logging in with vendor account
4. Verify vendor dashboard loads
5. Try logging in with admin account
6. Verify admin dashboard loads

---

## 📋 Account Testing Checklist

### Buyer Account Tests

- [ ] Login successful
- [ ] Profile displays correctly
- [ ] Can browse products
- [ ] Can search and filter
- [ ] Can add to cart
- [ ] Can proceed to checkout
- [ ] Can select/add delivery address
- [ ] Address picker map works
- [ ] Can view order history
- [ ] Can track orders
- [ ] Can chat with vendors
- [ ] Can leave reviews

### Vendor Account Tests

- [ ] Login successful
- [ ] Dashboard loads with metrics
- [ ] Sample products display
- [ ] Can create new product
- [ ] Can upload images
- [ ] Wallet balance shows
- [ ] Transaction history displays
- [ ] Can view orders (if any)
- [ ] Can update business profile
- [ ] Location picker map works
- [ ] Analytics charts display
- [ ] Can access all vendor sections

### Admin Account Tests

#### Super Admin
- [ ] Login successful
- [ ] Full dashboard access
- [ ] Can view all users
- [ ] Can view all vendors
- [ ] Can access KYC approvals
- [ ] Can view transactions
- [ ] Can access all settings
- [ ] All permissions granted

#### Account Team
- [ ] Login successful
- [ ] Can access KYC section
- [ ] Can approve vendors
- [ ] Can view transactions
- [ ] Cannot access system settings
- [ ] Cannot delete users

#### Support Agent
- [ ] Login successful
- [ ] Can view user support tickets
- [ ] Can access dispute resolution
- [ ] Can view orders
- [ ] Cannot access financial operations
- [ ] Cannot modify system settings

---

## 🔐 Security Notes

### Important Security Information

⚠️ **CRITICAL**: These are DEMO accounts for testing purposes only.

**For Production Deployment:**

1. **Delete or Disable Demo Accounts**
   - Remove all demo accounts before going live
   - Or disable login for demo emails

2. **Change All Passwords**
   - All passwords are public in this document
   - Change immediately if keeping accounts

3. **Restrict Admin Access**
   - Limit number of super admin accounts
   - Use role-based access for team members
   - Enable 2FA for admin accounts

4. **Monitor Demo Activity**
   - If keeping demo accounts, monitor for abuse
   - Set up alerts for suspicious activity
   - Regularly review demo account transactions

### Password Requirements

Production passwords should:
- Be at least 12 characters long
- Include uppercase and lowercase letters
- Include numbers and special characters
- Be unique per account
- Be changed regularly
- Never be shared or documented

---

## 🔄 Resetting Demo Accounts

If demo accounts become corrupted or need fresh data:

**Option 1: Re-run Edge Function**
```bash
# This will recreate all demo accounts with fresh data
POST {SUPABASE_URL}/functions/v1/create-demo-accounts
```

**Option 2: Manual Reset via Supabase Dashboard**
1. Delete users from Auth section
2. Re-run the edge function
3. Verify accounts are recreated

**Option 3: Run Migration Again**
```sql
-- Re-run the demo accounts migration
-- File: supabase/migrations/20251023000000_create_demo_accounts.sql
```

---

## 📞 Support

### Issues with Demo Accounts?

**Common Issues:**

**Problem**: Cannot login with demo credentials
- **Solution**: Verify accounts were created via edge functions
- **Check**: Supabase Auth dashboard for user existence

**Problem**: Demo vendor has no products
- **Solution**: Re-run create-demo-accounts edge function
- **Check**: Products table in database

**Problem**: Admin account has no permissions
- **Solution**: Run create-admin-accounts edge function
- **Check**: admin_role_assignments table

**Problem**: Buyer cannot complete checkout
- **Solution**: Ensure payment gateway is configured
- **Check**: Paystack API keys in environment variables

### Getting Help

For issues with demo accounts or platform testing:
1. Check the COMPREHENSIVE_TEST_REPORT.md file
2. Review the deployment documentation
3. Verify all environment variables are set
4. Check Supabase logs for errors

---

## 📊 Demo Data Summary

### Buyer Account
- Profile: Complete
- Addresses: None (user can add during checkout)
- Orders: None initially (user creates via purchase)
- Wishlist: Empty
- Reviews: None initially

### Vendor Account
- Profile: Complete with verification
- Products: 5 sample products
- Orders: None initially (depends on buyer purchases)
- Wallet: ₦250,500 balance
- Transactions: Sample transaction history
- Payout Methods: 2 configured
- Analytics: Sample data from past sales

### Admin Accounts
- Profiles: Complete for all 3 admins
- Roles: Assigned per account type
- Permissions: Configured per role
- Activity Logs: Start fresh
- Dashboard Data: Pulls from live database

---

## 🎯 Testing Best Practices

### Complete User Flow Test

**End-to-End Purchase Flow:**

1. **As Buyer** (demo@buyer.nimex.ng):
   - Login and browse products
   - Add demo vendor's products to cart
   - Proceed to checkout
   - Add delivery address using map
   - Complete payment (test mode)
   - View order confirmation

2. **As Vendor** (demo@vendor.nimex.ng):
   - Login to vendor dashboard
   - View new order notification
   - Process the order
   - Create GIGL delivery
   - Update order status to shipped

3. **As Buyer** (demo@buyer.nimex.ng):
   - View order tracking
   - See delivery route on map
   - Confirm delivery
   - Leave product review

4. **As Vendor** (demo@vendor.nimex.ng):
   - See escrow release notification
   - Check wallet balance increased
   - View new transaction
   - Request payout

5. **As Admin** (admin@nimex.ng):
   - Monitor transaction
   - View escrow status
   - Check platform metrics
   - Review vendor performance

---

**Remember:** These credentials are for testing purposes only. Never use in production without changing passwords and implementing proper security measures!

**Need Help?** Refer to COMPREHENSIVE_TEST_REPORT.md for detailed testing procedures and troubleshooting.
