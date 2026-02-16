# Alternative Ways to Deploy Firebase Rules

If you cannot use the Firebase CLI, you can deploy rules manually via the Firebase Console.

## Option 1: Firebase Console (Web Interface)

### 1. Firestore Database Rules
1.  Go to the [Firebase Console](https://console.firebase.google.com/).
2.  Select your project: **nimex-ecommerce**.
3.  In the left sidebar, navigate to **Build** > **Firestore Database**.
4.  Click on the **Rules** tab.
5.  **Copy** the content from your local file:
    - `c:\Users\Stephen\Documents\nimex\firestore.rules`
6.  **Paste** it into the editor in the Firebase Console.
7.  Click **Publish**.

### 2. Storage Rules
1.  In the left sidebar, navigate to **Build** > **Storage**.
2.  Click on the **Rules** tab.
3.  **Copy** the content from your local file:
    - `c:\Users\Stephen\Documents\nimex\storage.rules`
4.  **Paste** it into the editor in the Firebase Console.
5.  Click **Publish**.

## Option 2: CI/CD Pipeline (GitHub Actions)
If you have this project connected to GitHub, you can set up a GitHub Action to deploy rules automatically on push.

1.  Create a file `.github/workflows/deploy-rules.yml`.
2.  Add the following configuration (requires `FIREBASE_SERVICE_ACCOUNT_NIMEX_ECOMMERCE` secret in GitHub):

```yaml
name: Deploy Firebase Rules
on:
  push:
    paths:
      - 'firestore.rules'
      - 'storage.rules'
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: firebase/firebase-tools@master
        with:
          args: deploy --only firestore:rules,storage
        env:
          FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN }}
```

## Option 3: Firebase Emulator (Local Only)
If you only want to test locally without deploying to the live server:

1.  Start the emulator:
    ```powershell
    firebase emulators:start
    ```
2.  The emulator will automatically load the rules from `firestore.rules` and `storage.rules` in your project directory.
3.  Configure your app to connect to the emulator by setting `VITE_USE_FIREBASE_EMULATOR=true` in your `.env` file.
