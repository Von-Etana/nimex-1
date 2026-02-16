# Nimex Application Testing Guide

## Issue: "Missing or Insufficient Permission" on Vendor Signup

### Root Cause
The Firebase Firestore security rules are correctly configured, but there might be a deployment issue or the rules haven't been deployed to Firebase yet.

### Quick Fix Steps

#### Option 1: Deploy Firestore Rules via Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your Nimex project
3. Navigate to **Firestore Database** → **Rules**
4. Copy the contents from `firestore.rules` file in your project
5. Paste into the Firebase Console rules editor
6. Click **Publish**

#### Option 2: Deploy via Command Line (if Firebase CLI is set up)
```bash
# Install Firebase CLI globally (if not already installed)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Deploy only the Firestore rules
firebase deploy --only firestore:rules
```

#### Option 3: Temporary Fix - Make Rules More Permissive (DEVELOPMENT ONLY)
**WARNING: Only use this for testing in development. Never use in production!**

Replace the content of `firestore.rules` with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // TEMPORARY: Allow all authenticated users to read/write
    // TODO: Revert to proper security rules before production
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

Then deploy the rules using Option 1 or 2 above.

---

## Comprehensive Testing Checklist

### 1. Authentication Testing

#### A. User Registration
- [ ] **Buyer Registration**
  - Navigate to signup page
  - Fill in email, password, full name
  - Select "Buyer" role
  - Click "Create Account"
  - Verify email verification email is sent
  - Verify user is redirected to appropriate page
  
- [ ] **Vendor Registration**
  - Navigate to signup page
  - Fill in email, password, full name
  - Select "Vendor" role
  - Click "Create Account"
  - Verify no permission errors
  - Verify vendor record is created in Firestore
  - Verify user is redirected to vendor onboarding

- [ ] **Marketer Registration**
  - Navigate to signup page
  - Fill in email, password, full name
  - Select "Marketer" role
  - Click "Create Account"
  - Verify marketer record is created

#### B. User Login
- [ ] Login with valid credentials
- [ ] Login with invalid email
- [ ] Login with invalid password
- [ ] Verify proper error messages
- [ ] Verify redirect based on user role

#### C. Password Reset
- [ ] Request password reset
- [ ] Verify email is sent
- [ ] Complete password reset flow

### 2. Vendor Flow Testing

#### A. Vendor Onboarding
- [ ] Complete business information
- [ ] Upload business documents
- [ ] Submit KYC information
- [ ] Verify onboarding completion

#### B. Product Management
- [ ] Create new product
- [ ] Upload product images
- [ ] Edit product details
- [ ] Delete product
- [ ] Verify product visibility

#### C. Order Management
- [ ] View incoming orders
- [ ] Accept/reject orders
- [ ] Update order status
- [ ] Mark order as delivered

### 3. Buyer Flow Testing

#### A. Product Discovery
- [ ] Browse products
- [ ] Search for products
- [ ] Filter by category
- [ ] Filter by price range
- [ ] View product details

#### B. Shopping Cart
- [ ] Add product to cart
- [ ] Update quantity
- [ ] Remove from cart
- [ ] View cart total
- [ ] Clear cart

#### C. Checkout Process
- [ ] Enter shipping address
- [ ] Select payment method
- [ ] Complete payment (test mode)
- [ ] Verify order confirmation
- [ ] Receive order confirmation email

#### D. Order Tracking
- [ ] View order history
- [ ] Track order status
- [ ] View order details

### 4. Admin Dashboard Testing

#### A. User Management
- [ ] View all users
- [ ] Search users
- [ ] Filter by role
- [ ] View user details
- [ ] Suspend/activate users

#### B. Vendor Management
- [ ] View all vendors
- [ ] Approve/reject vendor applications
- [ ] View vendor details
- [ ] Manage vendor subscriptions

#### C. Product Moderation
- [ ] View all products
- [ ] Approve/reject products
- [ ] Remove inappropriate content

#### D. Order Management
- [ ] View all orders
- [ ] Filter by status
- [ ] Resolve disputes
- [ ] Process refunds

### 5. Payment Integration Testing

#### A. Flutterwave Integration
- [ ] Test card payment
- [ ] Test bank transfer
- [ ] Test mobile money
- [ ] Verify webhook handling
- [ ] Verify payment confirmation

#### B. Paystack Integration
- [ ] Test card payment
- [ ] Test bank transfer
- [ ] Verify webhook handling
- [ ] Verify payment confirmation

### 6. Real-time Features Testing

#### A. Chat System
- [ ] Send message to vendor
- [ ] Receive message from buyer
- [ ] View chat history
- [ ] Real-time message updates

#### B. Notifications
- [ ] Receive order notifications
- [ ] Receive payment notifications
- [ ] Receive chat notifications
- [ ] Mark notifications as read

### 7. Performance Testing

- [ ] Page load times < 3 seconds
- [ ] Image optimization working
- [ ] Lazy loading functional
- [ ] No console errors
- [ ] No memory leaks

### 8. Mobile Responsiveness

- [ ] Test on mobile viewport
- [ ] Test on tablet viewport
- [ ] Touch interactions work
- [ ] Navigation menu responsive
- [ ] Forms usable on mobile

### 9. Security Testing

- [ ] Unauthorized access blocked
- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] CSRF protection
- [ ] Secure headers present

### 10. Error Handling

- [ ] Network error handling
- [ ] Invalid input validation
- [ ] Graceful degradation
- [ ] User-friendly error messages
- [ ] Error logging functional

---

## Test User Accounts

Create these test accounts for comprehensive testing:

### Buyer Account
- Email: `buyer@test.com`
- Password: `Test123!@#`
- Role: Buyer

### Vendor Account
- Email: `vendor@test.com`
- Password: `Test123!@#`
- Role: Vendor

### Admin Account
- Email: `admin@test.com`
- Password: `Test123!@#`
- Role: Admin

### Marketer Account
- Email: `marketer@test.com`
- Password: `Test123!@#`
- Role: Marketer

---

## Automated Testing

### Running Unit Tests
```bash
npm test
```

### Running Tests with Coverage
```bash
npm run test:coverage
```

### Running Tests in Watch Mode
```bash
npm run test:ui
```

---

## Common Issues and Solutions

### Issue: "Missing or Insufficient Permission"
**Solution**: Deploy Firestore security rules (see Quick Fix Steps above)

### Issue: "Firebase not initialized"
**Solution**: Check `.env` file has correct Firebase configuration

### Issue: "Payment gateway error"
**Solution**: Verify API keys in `.env` file

### Issue: "Images not uploading"
**Solution**: Check Firebase Storage rules and permissions

### Issue: "Real-time updates not working"
**Solution**: Verify Firestore real-time listeners are properly set up

---

## Browser Testing Matrix

Test on the following browsers:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

---

## Performance Benchmarks

### Target Metrics
- **First Contentful Paint (FCP)**: < 1.8s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Time to Interactive (TTI)**: < 3.8s
- **Cumulative Layout Shift (CLS)**: < 0.1
- **First Input Delay (FID)**: < 100ms

### Tools for Testing
- Chrome DevTools Lighthouse
- WebPageTest
- GTmetrix
- Google PageSpeed Insights

---

## Deployment Checklist

Before deploying to production:
- [ ] All tests passing
- [ ] Security rules properly configured
- [ ] Environment variables set
- [ ] API keys secured
- [ ] Error tracking configured
- [ ] Analytics set up
- [ ] Backup strategy in place
- [ ] SSL certificate configured
- [ ] CDN configured
- [ ] Database indexes created

---

## Monitoring and Logging

### Firebase Console Monitoring
- Check Firestore usage
- Monitor authentication activity
- Review storage usage
- Check function executions

### Error Tracking
- Review error logs
- Monitor error rates
- Track user-reported issues

---

## Next Steps After Testing

1. **Fix Critical Bugs**: Address any blocking issues found during testing
2. **Optimize Performance**: Improve any metrics below target
3. **Security Audit**: Conduct thorough security review
4. **User Acceptance Testing**: Get feedback from real users
5. **Production Deployment**: Deploy to production environment
6. **Post-Deployment Monitoring**: Monitor for issues in production

---

## Support and Documentation

- **Firebase Documentation**: https://firebase.google.com/docs
- **React Documentation**: https://react.dev/
- **Vite Documentation**: https://vitejs.dev/

---

**Last Updated**: December 4, 2025
**Version**: 1.0.0
