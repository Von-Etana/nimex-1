# Firebase Hosting Deployment Guide

## Understanding the Audit Log Message

When you attempted to deploy, you received:
```
audit_log, method: "google.devtools.cloudbuild.v1.CloudBuild.CreateBuild"
principal_email: service-252020605812@gcp-sa-firebaseapphosting.iam.gserviceaccount.com
```

### What This Means:
- **Firebase App Hosting** (a newer service) was triggered instead of traditional Firebase Hosting
- It attempted to use **Google Cloud Build** to build your application automatically
- The service account `service-252020605812@gcp-sa-firebaseapphosting.iam.gserviceaccount.com` indicates your project ID is likely `252020605812`

### The Difference:
1. **Firebase Hosting** (Traditional): You build locally, then deploy the `dist` folder
2. **Firebase App Hosting** (New): Firebase builds your app in the cloud using Cloud Build

---

## Recommended Deployment Method: Traditional Firebase Hosting

For your Vite + React application, I recommend using **traditional Firebase Hosting** with a local build.

### Step 1: Build Your Application Locally

```powershell
# Navigate to your project directory
cd c:\Users\Stephen\Documents\nimex

# Install dependencies (if not already done)
npm install

# Build the production bundle
npm run build
```

This will create a `dist` folder with your compiled application.

### Step 2: Verify Your Firebase Configuration

Your `firebase.json` is already configured correctly:
```json
{
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

### Step 3: Login to Firebase (If Not Already Logged In)

```powershell
firebase login
```

This will open a browser window for you to authenticate with your Google account.

### Step 4: Initialize Firebase Project (If Not Already Done)

```powershell
# Check current project
firebase use

# If no project is set, list available projects
firebase projects:list

# Set your project (replace with your actual project ID)
firebase use <your-project-id>
```

### Step 5: Deploy to Firebase Hosting

```powershell
# Deploy hosting only
firebase deploy --only hosting

# Or deploy everything (hosting, firestore rules, storage rules)
firebase deploy
```

---

## Alternative: Using the PowerShell Deployment Script

You already have a deployment script! Use it:

```powershell
# Make sure you can run scripts
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Run the deployment script
.\deploy-firebase.ps1
```

---

## Troubleshooting Common Issues

### Issue 1: "Failed to authenticate"
**Solution:**
```powershell
firebase logout
firebase login
```

### Issue 2: "No project active"
**Solution:**
```powershell
# Create .firebaserc file
firebase use --add
# Select your project from the list
```

### Issue 3: "dist folder not found"
**Solution:**
```powershell
# Build the application first
npm run build
```

### Issue 4: Cloud Build Errors
If you're still getting Cloud Build errors, you may need to:

1. **Disable Firebase App Hosting** (if accidentally enabled):
   - Go to Firebase Console → App Hosting
   - Delete any App Hosting backends

2. **Check Cloud Build API**:
   - Go to Google Cloud Console
   - Navigate to APIs & Services → Enabled APIs
   - Ensure Cloud Build API is enabled

3. **Check Service Account Permissions**:
   - The service account needs proper permissions
   - Go to IAM & Admin in Google Cloud Console
   - Ensure `service-252020605812@gcp-sa-firebaseapphosting.iam.gserviceaccount.com` has necessary roles

---

## Quick Deployment Checklist

- [ ] Build the application: `npm run build`
- [ ] Verify `dist` folder exists
- [ ] Login to Firebase: `firebase login`
- [ ] Set active project: `firebase use <project-id>`
- [ ] Deploy: `firebase deploy --only hosting`
- [ ] Verify deployment at the provided URL

---

## Environment Variables

If your application uses environment variables, ensure they're properly configured:

1. **Local Development** (`.env`):
   ```
   VITE_FIREBASE_API_KEY=your-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
   # ... other variables
   ```

2. **Production Build**:
   - Vite automatically includes `VITE_*` prefixed variables in the build
   - Ensure all necessary variables are in your `.env` file before building

---

## Post-Deployment Verification

After deployment:

1. **Visit your hosting URL**: `https://<your-project-id>.web.app`
2. **Check Firebase Console**: 
   - Go to Hosting section
   - Verify the deployment timestamp
   - Check the deployed version

3. **Test Core Functionality**:
   - Authentication
   - Firestore database access
   - Storage (if used)

---

## Next Steps

1. **Set up Custom Domain** (Optional):
   ```powershell
   firebase hosting:channel:deploy production
   ```

2. **Configure CI/CD** (Optional):
   - Use GitHub Actions for automatic deployments
   - Deploy on every push to main branch

3. **Monitor Performance**:
   - Use Firebase Performance Monitoring
   - Check Firebase Analytics

---

## Need Help?

If you encounter issues:
1. Check Firebase Console → Hosting for error messages
2. Review build logs: `npm run build`
3. Check browser console for runtime errors
4. Verify Firestore rules are deployed: `firebase deploy --only firestore:rules`

---

**Last Updated**: December 4, 2025
