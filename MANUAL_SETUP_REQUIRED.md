# Manual Deployment & Seeding Steps

Since the automated environment is not logged into Firebase CLI, please follow these steps manually to complete the setup.

## 1. Login to Firebase CLI
Open a terminal in `c:\Users\Stephen\Documents\nimex` and run:
```powershell
firebase login
```
Follow the browser prompts to log in.

## 2. Deploy Storage Rules
Once logged in, deploy the storage rules:
```powershell
firebase deploy --only storage
```

## 3. Deploy Firestore Rules
Ensure Firestore rules are also up to date:
```powershell
firebase deploy --only firestore:rules
```

## 4. Seed Demo Data
Run the seed script to create the demo accounts (Buyer, Vendor, Admin):
```powershell
npx ts-node --esm scripts/seed-demo-data.ts
```

## 5. Verify
- Check the Firebase Console to see the created accounts in **Authentication** and **Firestore Database**.
- Try logging in to the application with:
  - **Buyer**: `demo@buyer.nimex.ng` / `DemoPassword123!`
  - **Vendor**: `demo@vendor.nimex.ng` / `DemoPassword123!`
  - **Admin**: `admin@nimex.ng` / `NimexAdmin2024!`
