# Firebase Hosting Deployment Fix

## The Problem

You're getting this error:
```
The user-provided container failed to start and listen on the port defined provided by the PORT=8080 environment variable
```

### Root Cause:
You're accidentally using **Firebase App Hosting** (Cloud Run backend) instead of **Firebase Hosting** (static site hosting).

- **Firebase App Hosting** = For server-side applications (Node.js, Python, etc.) that need to run on Cloud Run
- **Firebase Hosting** = For static sites (React, Vue, Angular built with Vite/Webpack)

Your Nimex app is a **static React application** built with Vite. It doesn't need a server running on port 8080.

---

## Solution: Use Traditional Firebase Hosting

### Step 1: Remove Firebase App Hosting Backend

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **nimex-ecommerce**
3. Navigate to **App Hosting** in the left sidebar
4. Find the backend named **nimex-1**
5. Click on it and select **Delete** or **Stop rollout**

### Step 2: Verify Your Firebase Configuration

Your `firebase.json` should look like this (static hosting only):

```json
{
    "firestore": {
        "rules": "firestore.rules",
        "indexes": "firestore.indexes.json"
    },
    "storage": {
        "rules": "storage.rules"
    },
    "hosting": {
        "public": "dist",
        "ignore": [
            "firebase.json",
            "**/.*",
            "**/node_modules/**"
        ],
        "rewrites": [
            {
                "source": "**",
                "destination": "/index.html"
            }
        ]
    }
}
```

✅ Your configuration is already correct!

### Step 3: Deploy Using Firebase CLI (Not App Hosting)

```powershell
# 1. Make sure you're in the project directory
cd c:\Users\Stephen\Documents\nimex

# 2. Build the application (already done)
npm run build

# 3. Login to Firebase
firebase login

# 4. Initialize/Set your project
firebase use nimex-ecommerce

# 5. Deploy ONLY hosting (not App Hosting)
firebase deploy --only hosting
```

---

## Why This Happened

Firebase App Hosting is a newer service that was likely enabled when you:
- Used `firebase init` and selected App Hosting by mistake
- Or connected your GitHub repository to Firebase App Hosting

### How to Prevent This:
When deploying, always use:
```powershell
firebase deploy --only hosting
```

NOT:
- ❌ Firebase Console → App Hosting → Deploy
- ❌ GitHub integration with App Hosting
- ❌ `firebase apphosting:backends:create`

---

## Alternative: If You Want to Keep Using Firebase Console

If you prefer deploying through the Firebase Console web interface:

### Option 1: Manual Upload
1. Build your app: `npm run build`
2. Go to Firebase Console → Hosting
3. Click "Add another site" or use existing site
4. Drag and drop the `dist` folder

### Option 2: GitHub Actions (Recommended for CI/CD)
Create `.github/workflows/firebase-hosting.yml`:

```yaml
name: Deploy to Firebase Hosting

on:
  push:
    branches:
      - main

jobs:
  build_and_deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build
        run: npm run build
        
      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
          projectId: nimex-ecommerce
```

---

## Quick Deployment Commands

### First Time Setup:
```powershell
# Login
firebase login

# Set project
firebase use nimex-ecommerce

# Create .firebaserc file
echo '{"projects":{"default":"nimex-ecommerce"}}' > .firebaserc
```

### Every Deployment:
```powershell
# Build and deploy
npm run build
firebase deploy --only hosting
```

---

## Verify Deployment

After successful deployment, you'll see:
```
✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/nimex-ecommerce/overview
Hosting URL: https://nimex-ecommerce.web.app
```

Visit the Hosting URL to verify your app is live!

---

## Troubleshooting

### Issue: "No project active"
```powershell
firebase use --add
# Select: nimex-ecommerce
```

### Issue: "dist folder not found"
```powershell
npm run build
```

### Issue: "Permission denied"
```powershell
firebase login --reauth
```

### Issue: Still seeing Cloud Run errors
- Make sure you deleted the App Hosting backend in Firebase Console
- Use `firebase deploy --only hosting` (not just `firebase deploy`)

---

## Understanding the Difference

| Feature | Firebase Hosting | Firebase App Hosting |
|---------|-----------------|---------------------|
| **Use Case** | Static sites (React, Vue, Angular) | Server-side apps (Node.js, Python) |
| **Deployment** | Upload built files | Deploy container to Cloud Run |
| **Port** | Not needed | Requires PORT=8080 |
| **Cost** | Free tier: 10GB storage, 360MB/day | Cloud Run pricing |
| **Your App** | ✅ **Use This** | ❌ Not needed |

---

## Next Steps

1. ✅ Delete the App Hosting backend from Firebase Console
2. ✅ Use `firebase deploy --only hosting` from CLI
3. ✅ Verify deployment at `https://nimex-ecommerce.web.app`
4. ✅ Set up custom domain (optional)

---

**Last Updated**: December 4, 2025
