# Walkthrough: Verify Marketer Signup Flow

## Objective
Verify that a new marketer can sign up, create an account, and access the dashboard in a "pending" state.

## Prerequisites
- Application running locally (`npm run dev`).
- Firebase Emulator running (if applicable) or connected to a dev project.

## Steps

1.  **Navigate to Marketer Registration**
    - Go to `http://localhost:5173/marketer/register` (or appropriate port).

2.  **Fill Registration Form**
    - **Full Name**: Test Marketer
    - **Email**: `marketer_test_${Date.now()}@example.com` (use a unique email)
    - **Phone**: +1234567890
    - **Business Name**: Test Marketing Agency
    - **Password**: `Password123!`
    - **Confirm Password**: `Password123!`

3.  **Submit Form**
    - Click "Register as Marketer".
    - Observe the button state changing to "Creating Account...".

4.  **Verify Redirection**
    - Ensure you are redirected to `/marketer/dashboard`.

5.  **Verify Dashboard State**
    - You should see the "Application Pending" screen.
    - Message: "Your marketer application is currently under review."

6.  **Verify Database (Optional)**
    - Check Firestore `marketers` collection.
    - Find the document with the email used.
    - Verify `status` is `pending`.
    - Verify `user_id` is set (matches the Auth UID).

7.  **Verify Login (Optional)**
    - Log out.
    - Go to `/login`.
    - Log in with the new email and password.
    - Verify you are redirected to the dashboard (or can navigate there).

## Troubleshooting
- If you see "Missing or insufficient permissions", check `firestore.rules`.
- If you see "Marketer Profile Not Found" on the dashboard, check if the `marketers` document was created and if the email matches.
