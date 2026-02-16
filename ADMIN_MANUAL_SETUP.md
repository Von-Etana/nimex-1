# Admin Setup Instructions

## Quick Setup (Recommended)

Since we're using Firestore security rules that require admin authentication, we need to set up the first admin manually through Firebase Console, then use that account to create the rest.

### Step 1: Create First Admin via Firebase Console

1. **Go to Firebase Console**: https://console.firebase.google.com
2. **Select your project**: nimex (or your project name)
3. **Navigate to Authentication**:
   - Click "Authentication" in the left sidebar
   - Click "Users" tab
   - Click "Add user"
   - Email: `admin@nimex.ng`
   - Password: `NimexAdmin2024!`
   - Click "Add user"

4. **Copy the User UID** (you'll need this in the next step)

### Step 2: Create Admin Profile in Firestore

1. **Navigate to Firestore Database**:
   - Click "Firestore Database" in the left sidebar
   - Click "Start collection" if this is your first collection

2. **Create `profiles` collection**:
   - Collection ID: `profiles`
   - Document ID: [paste the UID from step 1]
   - Add fields:
     ```
     id: [same UID]
     email: admin@nimex.ng
     full_name: NIMEX Super Admin
     role: admin
     phone: +234 800 000 0001
     avatar_url: null
     location: null
     created_at: [timestamp - click "timestamp" type]
     updated_at: [timestamp - click "timestamp" type]
     ```
   - Click "Save"

### Step 3: Login and Create Other Admins

1. **Login to your app**: http://localhost:5173/login
2. Use credentials:
   - Email: admin@nimex.ng
   - Password: NimexAdmin2024!

3. You should now be redirected to `/admin` dashboard

### Step 4: Create Roles and Permissions (Optional - via UI)

You can now create the roles and permissions through the admin dashboard UI, or continue with the automated script below.

---

## Alternative: Automated Setup with Firebase Admin SDK

If you have Firebase Admin SDK service account key:

### Prerequisites

1. **Download Service Account Key**:
   - Go to Firebase Console > Project Settings > Service Accounts
   - Click "Generate new private key"
   - Save the JSON file

2. **Add to .env**:
   ```env
   FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"your-project-id",...}'
   ```

### Run the Script

```bash
npm install firebase-admin
npm run seed:admin:server
```

This will create all permissions, roles, and admin accounts automatically.

---

## Manual Creation of All Admins (Detailed)

If you prefer to create all admins manually:

### 1. Super Admin
**Firebase Authentication:**
- Email: admin@nimex.ng
- Password: NimexAdmin2024!

**Firestore `profiles/{uid}`:**
```json
{
  "id": "{uid}",
  "email": "admin@nimex.ng",
  "full_name": "NIMEX Super Admin",
  "role": "admin",
  "phone": "+234 800 000 0001",
  "avatar_url": null,
  "location": null,
  "created_at": {timestamp},
  "updated_at": {timestamp}
}
```

### 2. Customer Support
**Firebase Authentication:**
- Email: support@nimex.ng
- Password: NimexSupport2024!

**Firestore `profiles/{uid}`:**
```json
{
  "id": "{uid}",
  "email": "support@nimex.ng",
  "full_name": "Customer Support Manager",
  "role": "admin",
  "phone": "+234 800 000 0002",
  "avatar_url": null,
  "location": null,
  "created_at": {timestamp},
  "updated_at": {timestamp}
}
```

### 3. Accountant
**Firebase Authentication:**
- Email: accountant@nimex.ng
- Password: NimexAcct2024!

**Firestore `profiles/{uid}`:**
```json
{
  "id": "{uid}",
  "email": "accountant@nimex.ng",
  "full_name": "Chief Accountant",
  "role": "admin",
  "phone": "+234 800 000 0003",
  "avatar_url": null,
  "location": null,
  "created_at": {timestamp},
  "updated_at": {timestamp}
}
```

### 4. Head of Marketing
**Firebase Authentication:**
- Email: marketing@nimex.ng
- Password: NimexMkt2024!

**Firestore `profiles/{uid}`:**
```json
{
  "id": "{uid}",
  "email": "marketing@nimex.ng",
  "full_name": "Head of Marketing",
  "role": "admin",
  "phone": "+234 800 000 0004",
  "avatar_url": null,
  "location": null,
  "created_at": {timestamp},
  "updated_at": {timestamp}
}
```

---

## Creating Roles and Permissions

### Option 1: Through Admin Dashboard UI

Once logged in as Super Admin, navigate to:
- **Admin > Settings > Roles & Permissions**
- Create roles and assign permissions through the UI

### Option 2: Manually in Firestore

Create the following collections and documents:

#### `admin_permissions` collection

Create documents for each permission (see ADMIN_SETUP_GUIDE.md for full list):

```json
{
  "name": "users.view",
  "category": "User Management",
  "description": "View user profiles and details",
  "created_at": {timestamp},
  "updated_at": {timestamp}
}
```

#### `admin_roles` collection

Create role documents:

```json
{
  "name": "super_admin",
  "display_name": "Super Admin",
  "created_at": {timestamp},
  "updated_at": {timestamp}
}
```

#### `role_permissions` collection

Link roles to permissions:

```json
{
  "role_id": "{role_document_id}",
  "permission_id": "{permission_document_id}",
  "created_at": {timestamp}
}
```

#### `admin_role_assignments` collection

Assign roles to users:

```json
{
  "user_id": "{user_uid}",
  "role_id": "{role_document_id}",
  "assigned_by": null,
  "assigned_at": {timestamp},
  "created_at": {timestamp},
  "updated_at": {timestamp}
}
```

---

## Verification

After setup, verify:

1. ✅ All 4 admin accounts can login
2. ✅ Each admin is redirected to `/admin` dashboard
3. ✅ Permissions are properly assigned
4. ✅ User location access works for Super Admin and Customer Support

---

## Troubleshooting

### Can't login
- Check Firebase Authentication console for the user
- Verify email and password
- Check browser console for errors

### Redirected to home instead of admin dashboard
- Verify `role: "admin"` in Firestore profiles collection
- Check AuthContext is loading profile correctly
- Clear browser cache and try again

### Permissions not working
- Verify role assignments in `admin_role_assignments`
- Check role permissions in `role_permissions`
- Ensure permission documents exist in `admin_permissions`

---

**Need Help?** Check the main ADMIN_SETUP_GUIDE.md for more details.
