# Quick Admin Login Guide

## How to Access the Admin Dashboard

### Step 1: Navigate to Login Page
Go to: `http://your-domain.com/login` or `http://your-domain.com/signin`

### Step 2: Choose Your Admin Account

#### Option A: Super Administrator (Full Access)
```
Email: admin@nimex.ng
Password: NimexAdmin2024!
```
**Access:** All features (Dashboard, Users, Listings, Transactions, KYC, Settings)

#### Option B: Account Team (Vendor Management)
```
Email: accounts@nimex.ng
Password: NimexAccounts2024!
```
**Access:** Dashboard, Users, Transactions, KYC, Settings
**No Access:** Listings

#### Option C: Customer Support (Customer Service)
```
Email: support@nimex.ng
Password: NimexSupport2024!
```
**Access:** Dashboard, Users, Listings, Transactions
**No Access:** KYC, Settings

### Step 3: Automatic Redirect
After successful login, you will be automatically redirected to:
**→ `/admin` (Admin Dashboard)**

### Step 4: Navigate the Admin Panel

**Sidebar Menu (Desktop):**
```
┌─────────────────────────┐
│ 🛡️ NIMEX               │
│    Admin Panel          │
├─────────────────────────┤
│ 👤 [Your Name]         │
│    [Your Role]          │
├─────────────────────────┤
│ 📊 Dashboard           │
│ 👥 Users               │
│ 📦 Listings            │
│ 💳 Transactions        │
│ ✅ KYC Approvals       │
│ ⚙️  Settings           │
├─────────────────────────┤
│ 🚪 Sign Out            │
└─────────────────────────┘
```

**Mobile Menu:**
- Tap hamburger icon (☰) in top-left
- Sidebar slides in from left
- Tap outside to close

### Step 5: Use Admin Features

**Dashboard:**
- View platform metrics
- Quick access to key features
- Recent activity overview

**Users:**
- View all registered users
- Filter by role (buyer/vendor/admin)
- Search users by name/email
- View user details

**Listings:**
- Moderate product listings
- Approve/reject new products
- Flag inappropriate content
- View product analytics

**Transactions:**
- View all financial transactions
- Monitor escrow holdings
- Track vendor payouts
- Export transaction reports

**KYC Approvals:**
- Review vendor verification requests
- Approve/reject KYC submissions
- View uploaded documents
- Manage verification workflow

**Settings:**
- Configure platform settings
- Manage API keys
- Set commission rates
- Regional configuration

## Quick Troubleshooting

### Issue: "Cannot access admin pages"
**Solution:** Make sure you're logged in with an admin account (ends with @nimex.ng)

### Issue: "Some menu items are missing"
**Solution:** This is normal - menu items are filtered by your role permissions

### Issue: "Redirected to homepage instead of admin"
**Solution:** You're not logged in as an admin. Use one of the three admin credentials above.

### Issue: "Permission denied on certain pages"
**Solution:** Your admin role doesn't have permission for that page. Contact super admin for access.

## URL Reference

Direct links (requires admin login):
- Dashboard: `/admin`
- Users: `/admin/users`
- Listings: `/admin/listings`
- Transactions: `/admin/transactions`
- KYC Approvals: `/admin/kyc`
- Settings: `/admin/settings`

## Security Notes

1. **Never share admin credentials** - Each admin has their own account
2. **Change default passwords** - Update passwords after first login in production
3. **Use HTTPS** - Always access admin panel over secure connection
4. **Session timeout** - You'll be logged out after period of inactivity
5. **Audit trail** - All admin actions may be logged

## Support

For admin access issues or questions:
- Check `ADMIN_DASHBOARD_COMPLETE.md` for technical details
- Review permission matrices in `IMPLEMENTATION_SUMMARY.md`
- Contact system administrator for role changes

---

**Quick Start Checklist:**
- [ ] Navigate to login page
- [ ] Enter admin credentials
- [ ] Verify automatic redirect to /admin
- [ ] Confirm sidebar menu appears
- [ ] Test navigation between pages
- [ ] Verify permissions match your role

**You're now ready to manage the NIMEX platform!** 🎉
