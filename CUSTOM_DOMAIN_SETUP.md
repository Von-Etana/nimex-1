# Setting up Custom Domain (nimex.ng) on Firebase Hosting

To connect your custom domain `nimex.ng` to your Firebase Hosting site, you need to perform the following steps in the Firebase Console and your Domain Registrar's dashboard.

## Step 1: Add Domain in Firebase Console

1.  Open the **[Firebase Console](https://console.firebase.google.com/project/nimex-ecommerce/hosting)**.
2.  Navigate to **Build** -> **Hosting** in the left sidebar.
3.  Click on the **"Add custom domain"** button.
4.  Enter your domain name: `nimex.ng`.
    *   (Optional) Check the box "Redirect 'www.nimex.ng' to 'nimex.ng'" if you want `www` to work as well.
5.  Click **Continue**.

## Step 2: Verify Ownership (TXT Record)

Firebase will likely ask you to verify that you own the domain by adding a temporary TXT record to your DNS settings.

1.  **Copy** the TXT record value provided by Firebase (it often looks like `google-site-verification=...`).
2.  Log in to your **Domain Registrar** (where you bought `nimex.ng`).
3.  Go to the **DNS Management** or **DNS Settings** page for `nimex.ng`.
4.  **Add a new record**:
    *   **Type**: `TXT`
    *   **Host/Name**: `@` (or leave blank)
    *   **Value/Content**: Paste the code from Firebase.
    *   **TTL**: Default or 3600.
5.  Wait a few minutes (DNS propagation can take time, but is usually fast for TXT setup).
6.  Go back to the Firebase Console and click **Verify**.

## Step 3: Point Domain to Firebase (A Records)

Once verified, Firebase will provide you with **A Records** (IP addresses) to point your domain to their servers.

1.  In the Firebase Console, you will see a list of IP addresses (usually two).
2.  Go back to your **Domain Registrar's DNS settings**.
3.  **Delete** any existing `A` records for your root domain (`@`) if there are any (e.g., pointing to "parking" pages).
4.  **Add new A records** for each IP provided by Firebase:
    *   **Record 1**:
        *   **Type**: `A`
        *   **Host**: `@`
        *   **Value**: `<First IP Address>`
    *   **Record 2**:
        *   **Type**: `A`
        *   **Host**: `@`
        *   **Value**: `<Second IP Address>`

## Step 4: SSL Certificate Provisioning

*   Once the DNS records are verified, Firebase will automatically provision a **Free SSL Certificate** for your domain.
*   This process can take anywhere from **15 minutes to 24 hours**, but usually happens within an hour.
*   Your site might show a security warning or be inaccessible during this short provisioning window.

## Status Check

After completing these steps, your site will be accessible at:
*   [https://nimex.ng](https://nimex.ng)
*   [https://www.nimex.ng](https://www.nimex.ng) (if you set up the redirect)
