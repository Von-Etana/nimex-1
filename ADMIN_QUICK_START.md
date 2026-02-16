# Admin Setup - Quick Reference

## ✅ What Has Been Created

### 1. Documentation Files
- ✅ `ADMIN_SETUP_GUIDE.md` - Complete guide to admin roles and permissions
- ✅ `ADMIN_MANUAL_SETUP.md` - Step-by-step manual setup instructions
- ✅ `ADMIN_CREDENTIALS.md` - **CONFIDENTIAL** credentials file (gitignored)

### 2. Setup Scripts
- ✅ `scripts/seed-admin-accounts.ts` - Client-side seeding script (requires manual first admin)
- ✅ `scripts/seed-admin-accounts-server.ts` - Server-side script (requires Firebase Admin SDK)

### 3. Admin Accounts Created
- ✅ `admin@nimex.ng` - Super Admin (Full Access)
- ✅ `support@nimex.ng` - Customer Support (includes user location access)
- ✅ `accountant@nimex.ng` - Accountant (financial management)
- ✅ `marketing@nimex.ng` - Head of Marketing (campaigns & growth)

**Note:** Accounts were created in Firebase Authentication and profiles collection, but roles and permissions need to be set up manually (see below).

---

## 🚀 Next Steps

### Option 1: Manual Setup (Recommended for First Time)

Follow the instructions in `ADMIN_MANUAL_SETUP.md`:

1. **Verify admin accounts in Firebase Console**
   - Go to Firebase Console > Authentication
   - Confirm all 4 admin accounts exist

2. **Test login**
   - Go to http://localhost:5173/login
   - Login with `admin@nimex.ng` / `NimexAdmin2024!`
   - Should redirect to `/admin` dashboard

3. **Create roles and permissions**
   - Use the admin dashboard UI to create roles
   - Or manually create in Firestore (see ADMIN_MANUAL_SETUP.md)

### Option 2: Automated Setup with Firebase Admin SDK

If you have Firebase Admin SDK service account:

1. Download service account key from Firebase Console
2. Add to `.env`: `FIREBASE_SERVICE_ACCOUNT_KEY='...'`
3. Run: `npm install firebase-admin`
4. Run: `npm run seed:admin:server`

---

## 📋 Admin Credentials

See `ADMIN_CREDENTIALS.md` for complete list.

**Quick Access:**
- Super Admin: `admin@nimex.ng` / `NimexAdmin2024!`
- Customer Support: `support@nimex.ng` / `NimexSupport2024!`
- Accountant: `accountant@nimex.ng` / `NimexAcct2024!`
- Marketing: `marketing@nimex.ng` / `NimexMkt2024!`

**⚠️ Change all passwords after first login!**

---

## 🔑 Key Features

### User Location Access
- **Available to:** Super Admin, Customer Support
- **Purpose:** Delivery optimization and customer support
- **Permission:** `users.location`
- **Compliance:** All access is logged for audit

### Role-Based Permissions

**Super Admin:**
- Complete system control
- All permissions

**Customer Support:**
- View users, vendors, products, orders
- **Access user location data**
- Manage support tickets
- View disputes and reports

**Accountant:**
- Financial reports and analytics
- Transaction management
- Escrow and payouts
- Refund processing

**Head of Marketing:**
- Marketing campaigns
- Marketer management
- Product featuring
- Marketing analytics

---

## 🔒 Security Checklist

- ☐ All admin accounts created
- ☐ Tested login for each account
- ☐ Changed default passwords
- ☐ Verified role assignments
- ☐ Tested key permissions
- ☐ Reviewed Firestore security rules
- ☐ Enabled audit logging
- ☐ Set up 2FA (when available)
- ☐ Documented access procedures
- ☐ Scheduled password rotation (90 days)

---

## 📚 Documentation

| File | Purpose |
|------|---------|
| `ADMIN_SETUP_GUIDE.md` | Complete guide to roles, permissions, and features |
| `ADMIN_MANUAL_SETUP.md` | Step-by-step manual setup instructions |
| `ADMIN_CREDENTIALS.md` | Confidential credentials (gitignored) |
| `scripts/seed-admin-accounts.ts` | Client-side seeding script |
| `scripts/seed-admin-accounts-server.ts` | Server-side seeding script |

---

## 🛠️ Troubleshooting

### Can't login?
- Check Firebase Authentication console
- Verify email/password
- Check browser console for errors

### Not redirected to admin dashboard?
- Verify `role: "admin"` in Firestore profiles
- Check AuthContext loading
- Clear browser cache

### Permissions not working?
- Verify role assignments exist
- Check role_permissions collection
- Ensure permission documents exist

---

## 📞 Support

For issues with admin setup:
1. Check Firebase Console for errors
2. Review Firestore collections
3. Check application logs
4. Contact system administrator

---

**Created:** December 12, 2024  
**Status:** ✅ Admin accounts created, roles/permissions pending setup  
**Next Review:** After first admin login
