# 🔥 Manual Deployment Guide for Cloud Functions

This guide will walk you through deploying the newly secured Cloud Functions manually from your terminal.

## Prerequisites

Ensure you are logged into Firebase CLI:
```bash
firebase login
```
*If not logged in, it will open a browser window to authenticate.*

---

## 🚀 Deployment Steps

### 1. Navigate to the Project Root
Open your terminal (PowerShell or Command Prompt) and ensure you are in the root directory:
```bash
cd c:\Users\Stephen\Documents\nimex
```

### 2. Install Function Dependencies
Before deploying, ensure the `functions` folder has all its dependencies installed:
```bash
cd functions
npm install
cd ..
```
*(We already did this in the session, but it's good practice to double-check).*

### 3. Deploy the Functions
Run the specific deploy command for functions only. This avoids re-deploying your hosting or other services if you don't want to.

```bash
firebase deploy --only functions
```

### 4. Deploy Firestore Security Rules
Since we updated `firestore.rules` to enforce backend-only writes for wallets, you **MUST** deploy these rules for the security to be active.

```bash
firebase deploy --only firestore:rules
```

---

## 🛠 Troubleshooting

**Error: "Error: No valid exports main found in package.json"**
*   **Fix:** Ensure your `functions/package.json` has `"main": "lib/index.js"`. The build script `npm run build` inside `functions` folder generates this.
*   **Manual Build:** If deployment fails saying code is missing, try building manually first:
    ```bash
    cd functions
    npm run build
    cd ..
    firebase deploy --only functions
    ```

**Error: "HTTP Error: 403, Unknown Error"**
*   **Fix:** This usually means you don't have permission. Ensure `firebase login` shows the correct account associated with the project.

**Error: "Engine node 20 is incompatible"**
*   **Fix:** If you see engine warnings, you can ignore them if it deploys, or update the `engines` field in `functions/package.json` to match your local node version (though Firebase recommends LTS versions like 18 or 20).

---

## ✅ Verifying Deployment

After successful deployment, you can verify your functions are active in the [Firebase Console](https://console.firebase.google.com/project/anima-project/functions/list).

You should see:
*   `initializePayment`
*   `verifyPayment`
*   `releaseEscrow`
*   `refundEscrow`
