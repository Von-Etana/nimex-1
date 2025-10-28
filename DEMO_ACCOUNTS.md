# NIMEX Demo Accounts

## Demo Account Credentials

### Buyer Account
- **Email**: `demo@buyer.nimex.ng`
- **Password**: `DemoPassword123!`
- **Role**: Buyer
- **Features**: Browse products, add to cart, place orders, track deliveries

### Vendor Account
- **Email**: `demo@vendor.nimex.ng`
- **Password**: `DemoPassword123!`
- **Role**: Vendor
- **Business Name**: Demo Artisan Crafts
- **Features**:
  - Vendor dashboard access
  - Order management
  - Delivery management with GIGL integration
  - Escrow dashboard (₦250,500 wallet balance)
  - Product management
  - Analytics and reporting

## Login Instructions

1. Go to the login page: `/login`
2. Enter one of the demo account credentials above
3. Click "Login" or press Enter
4. You'll be redirected to the appropriate dashboard

## Account Details

### Demo Buyer
- **User ID**: `e4507814-fb28-49c9-8028-831fc82ba775`
- **Full Name**: Demo Buyer
- **Phone**: +234 800 123 4567
- **Status**: Active, Email Confirmed

### Demo Vendor
- **User ID**: `53a50309-db8d-4a04-934d-eee461033436`
- **Full Name**: Demo Vendor
- **Phone**: +234 800 765 4321
- **Business**: Demo Artisan Crafts
- **Verification**: Verified
- **Rating**: 4.8/5
- **Total Sales**: 125 orders
- **Wallet Balance**: ₦250,500.00
- **Status**: Active, Email Confirmed

## Features to Test

### As Buyer
1. ✅ Browse products and categories
2. ✅ Search for products
3. ✅ Add items to cart
4. ✅ Proceed to checkout
5. ✅ Add delivery address
6. ✅ Select delivery type (Standard/Express/Same-Day)
7. ✅ Make payment (use Paystack test cards)
8. ✅ Track orders in real-time
9. ✅ Confirm delivery
10. ✅ View escrow status
11. ✅ File disputes if needed
12. ✅ Chat with vendors
13. ✅ Leave reviews

### As Vendor
1. ✅ Access vendor dashboard
2. ✅ View order management
3. ✅ Create GIGL shipments with one click
4. ✅ Upload delivery proof
5. ✅ Track deliveries
6. ✅ View escrow dashboard
7. ✅ Monitor held and released funds
8. ✅ View transaction history
9. ✅ Manage products
10. ✅ View analytics
11. ✅ Manage advertisements
12. ✅ Handle customer messages

## Test Payment Information

When testing checkout with the demo buyer account, use these Paystack test cards:

### Successful Payment
- **Card Number**: `4084 0840 8408 4081`
- **CVV**: `408`
- **Expiry**: Any future date
- **PIN**: `0000`
- **OTP**: `123456`

### Failed Payment (for testing)
- **Card Number**: `5060 6666 6666 6666`
- **CVV**: `666`
- **Expiry**: Any future date

## Recreating Demo Accounts

If you need to recreate the demo accounts (e.g., after database reset), call this Edge Function:

```bash
curl -X POST "https://[your-project].supabase.co/functions/v1/create-demo-accounts" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [your-anon-key]"
```

Or simply access it via your browser:
```
https://[your-project].supabase.co/functions/v1/create-demo-accounts
```

The function will:
- Create both demo accounts if they don't exist
- Set up user profiles with correct roles
- Create vendor business profile
- Set up initial wallet balance
- Skip creation if accounts already exist

## Security Notes

⚠️ **IMPORTANT**: These are demonstration accounts for testing purposes only.

- Passwords are intentionally simple for demo purposes
- In production, these accounts should be:
  - Disabled or removed
  - Have complex passwords changed
  - Have limited permissions
  - Be clearly marked as demo accounts

## Troubleshooting

### "Invalid login credentials" error
If you receive this error:
1. Make sure you're using the exact credentials listed above
2. Check that the demo accounts exist by calling the create-demo-accounts function
3. Verify email confirmation status in Supabase Auth dashboard

### Demo vendor can't access vendor features
1. Check that the vendor profile exists in the `vendors` table
2. Verify the user role is set to 'vendor' in the `profiles` table
3. Ensure `verification_status` is 'verified'

### Missing wallet balance or transactions
1. The initial wallet balance is ₦250,500
2. If missing, call the create-demo-accounts function again
3. The function uses upsert, so it won't duplicate data

## Support

For issues with demo accounts:
1. Check the Edge Function logs in Supabase dashboard
2. Verify database tables: `profiles`, `vendors`, `auth.users`
3. Ensure RLS policies allow access
4. Call create-demo-accounts function to reset

---

**Last Updated**: October 23, 2025
**Status**: ✅ Active and Working
