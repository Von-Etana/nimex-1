# Demo Accounts - Quick Reference Card

**NIMEX Marketplace Platform**
**Demo Environment Credentials**

---

## 🎯 Quick Login Credentials

### Customer Account
```
👤 Role:     Buyer/Customer
📧 Email:    demo@buyer.nimex.ng
🔐 Password: DemoPassword123!
📱 Phone:    +234 800 123 4567
```
**Use for:** Shopping, checkout, order tracking, reviews

---

### Vendor Account
```
🏪 Role:     Vendor/Seller
📧 Email:    demo@vendor.nimex.ng
🔐 Password: DemoPassword123!
🏢 Business: Demo Artisan Crafts
📱 Phone:    +234 800 765 4321
💰 Balance:  ₦250,500
⭐ Rating:   4.8/5.0
```
**Use for:** Product management, order fulfillment, analytics

**Pre-loaded:**
- 5 sample products
- Transaction history
- Bank account configured
- Verified vendor status

---

### Admin Accounts

#### Super Administrator
```
👨‍💼 Role:     Super Admin
📧 Email:    admin@nimex.ng
🔐 Password: NimexAdmin2024!
🔑 Access:   FULL PLATFORM ACCESS
```
**Use for:** Complete system control, all permissions

#### Account Team
```
💼 Role:     Account Manager
📧 Email:    accounts@nimex.ng
🔐 Password: NimexAccounts2024!
🔑 Access:   KYC, Vendors, Transactions
```
**Use for:** Vendor approval, financial operations

#### Customer Support
```
🎧 Role:     Support Agent
📧 Email:    support@nimex.ng
🔐 Password: NimexSupport2024!
🔑 Access:   Orders, Disputes, Customers
```
**Use for:** Customer service, dispute resolution

---

## 🚀 Setup Commands

**Create all demo accounts:**
```bash
# Option 1: Via Edge Functions
POST /functions/v1/create-demo-accounts
POST /functions/v1/create-admin-accounts

# Option 2: Apply migrations
Run: supabase/migrations/20251023000000_create_demo_accounts.sql
```

---

## ✅ Test Checklist

### Buyer Flow
- [ ] Login successful
- [ ] Browse products
- [ ] Add to cart
- [ ] Checkout with map address
- [ ] Complete payment (test mode)
- [ ] Track order

### Vendor Flow
- [ ] Login successful
- [ ] View dashboard
- [ ] See 5 sample products
- [ ] Create new product
- [ ] View wallet balance
- [ ] Check analytics

### Admin Flow
- [ ] Login successful
- [ ] Access dashboard
- [ ] View all users
- [ ] Approve vendor KYC
- [ ] Monitor transactions

---

## ⚠️ Security Notice

**THESE ARE TEST ACCOUNTS**
- Credentials are PUBLIC
- DO NOT use in production
- Delete before going live
- Change passwords if keeping

---

## 📚 More Information

- **Full Details:** DEMO_CREDENTIALS.md
- **Setup Guide:** SETUP_DEMO_ACCOUNTS.md
- **Test Report:** COMPREHENSIVE_TEST_REPORT.md

---

**Need Help?**
All accounts are pre-configured and ready to use.
Just login with the credentials above!

