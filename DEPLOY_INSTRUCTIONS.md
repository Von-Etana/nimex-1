# Deployment Instructions

Your codebase is updated and pushed to GitHub! 🚀

Since I cannot deploy to Firebase on your behalf (requires login), please follow these manual steps:

## 1. Login to Firebase
```bash
firebase login
```

## 2. Set Secret Keys
You must set your real keys for the backend to work:
```bash
firebase functions:config:set flutterwave.public_key="YOUR_REAL_KEY" flutterwave.secret_key="YOUR_REAL_KEY"
```

## 3. Deploy
Run the deployment scripts in order:

**Step A: Fix Checkout Error**
```bash
deploy_rules.bat
```

**Step B: Enable Backend Features**
```bash
deploy_functions.bat
```

## Summary of Changes
- **Checkout**: Switched to Flutterwave (via backend).
- **Vendor**: Wallet & Withdrawals fully implemented.
- **Security**: SendGrid & Payment logic moved to Cloud Functions.
- **Code**: Cleanup of unused files and env vars.
