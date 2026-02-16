import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, updateProfile, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, Timestamp, collection, addDoc } from 'firebase/firestore';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../.env') });

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
    measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
};

if (!firebaseConfig.apiKey) {
    console.error('❌ Missing Firebase configuration. Please check your .env file.');
    process.exit(1);
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const COLLECTIONS = {
    PROFILES: 'profiles',
    ADMIN_ROLES: 'admin_roles',
    ADMIN_PERMISSIONS: 'admin_permissions',
    ADMIN_ROLE_ASSIGNMENTS: 'admin_role_assignments',
    ROLE_PERMISSIONS: 'role_permissions'
};

// Define all permissions with categories
const PERMISSIONS = [
    // User Management
    { name: 'users.view', category: 'User Management', description: 'View user profiles and details' },
    { name: 'users.create', category: 'User Management', description: 'Create new user accounts' },
    { name: 'users.edit', category: 'User Management', description: 'Edit user profiles' },
    { name: 'users.delete', category: 'User Management', description: 'Delete user accounts' },
    { name: 'users.suspend', category: 'User Management', description: 'Suspend/unsuspend users' },
    { name: 'users.location', category: 'User Management', description: 'Access user location data' },

    // Vendor Management
    { name: 'vendors.view', category: 'Vendor Management', description: 'View vendor profiles' },
    { name: 'vendors.approve', category: 'Vendor Management', description: 'Approve vendor registrations' },
    { name: 'vendors.edit', category: 'Vendor Management', description: 'Edit vendor details' },
    { name: 'vendors.suspend', category: 'Vendor Management', description: 'Suspend/unsuspend vendors' },

    // KYC Management
    { name: 'kyc.view', category: 'KYC Management', description: 'View KYC submissions' },
    { name: 'kyc.approve', category: 'KYC Management', description: 'Approve KYC submissions' },
    { name: 'kyc.reject', category: 'KYC Management', description: 'Reject KYC submissions' },

    // Product Management
    { name: 'products.view', category: 'Product Management', description: 'View all products' },
    { name: 'products.edit', category: 'Product Management', description: 'Edit product details' },
    { name: 'products.delete', category: 'Product Management', description: 'Delete products' },
    { name: 'products.feature', category: 'Product Management', description: 'Feature/unfeature products' },

    // Order Management
    { name: 'orders.view', category: 'Order Management', description: 'View all orders' },
    { name: 'orders.edit', category: 'Order Management', description: 'Edit order details' },
    { name: 'orders.cancel', category: 'Order Management', description: 'Cancel orders' },

    // Financial Management
    { name: 'finance.view', category: 'Financial Management', description: 'View financial reports' },
    { name: 'finance.transactions', category: 'Financial Management', description: 'View all transactions' },
    { name: 'finance.escrow', category: 'Financial Management', description: 'Manage escrow transactions' },
    { name: 'finance.payouts', category: 'Financial Management', description: 'Process vendor payouts' },
    { name: 'finance.refunds', category: 'Financial Management', description: 'Process refunds' },

    // Support Management
    { name: 'support.view', category: 'Support Management', description: 'View support tickets' },
    { name: 'support.respond', category: 'Support Management', description: 'Respond to support tickets' },
    { name: 'support.close', category: 'Support Management', description: 'Close support tickets' },
    { name: 'support.escalate', category: 'Support Management', description: 'Escalate support tickets' },

    // Dispute Management
    { name: 'disputes.view', category: 'Dispute Management', description: 'View disputes' },
    { name: 'disputes.resolve', category: 'Dispute Management', description: 'Resolve disputes' },

    // Marketing Management
    { name: 'marketing.view', category: 'Marketing Management', description: 'View marketing campaigns' },
    { name: 'marketing.create', category: 'Marketing Management', description: 'Create marketing campaigns' },
    { name: 'marketing.edit', category: 'Marketing Management', description: 'Edit marketing campaigns' },
    { name: 'marketing.delete', category: 'Marketing Management', description: 'Delete marketing campaigns' },
    { name: 'marketing.analytics', category: 'Marketing Management', description: 'View marketing analytics' },

    // Marketer Management
    { name: 'marketers.view', category: 'Marketer Management', description: 'View marketers' },
    { name: 'marketers.approve', category: 'Marketer Management', description: 'Approve marketer registrations' },
    { name: 'marketers.commissions', category: 'Marketer Management', description: 'Manage marketer commissions' },

    // System Settings
    { name: 'settings.view', category: 'System Settings', description: 'View system settings' },
    { name: 'settings.edit', category: 'System Settings', description: 'Edit system settings' },
    { name: 'settings.security', category: 'System Settings', description: 'Manage security settings' },

    // Reports & Analytics
    { name: 'reports.view', category: 'Reports & Analytics', description: 'View reports' },
    { name: 'reports.export', category: 'Reports & Analytics', description: 'Export reports' },
    { name: 'analytics.view', category: 'Reports & Analytics', description: 'View analytics dashboard' },

    // Admin Management
    { name: 'admin.roles', category: 'Admin Management', description: 'Manage admin roles' },
    { name: 'admin.permissions', category: 'Admin Management', description: 'Manage admin permissions' },
    { name: 'admin.assign', category: 'Admin Management', description: 'Assign roles to admins' },
];

// Define roles with their permissions
const ROLES = [
    {
        name: 'super_admin',
        display_name: 'Super Admin',
        permissions: PERMISSIONS.map(p => p.name) // All permissions
    },
    {
        name: 'customer_support',
        display_name: 'Customer Support',
        permissions: [
            'users.view',
            'users.location',
            'vendors.view',
            'products.view',
            'orders.view',
            'orders.edit',
            'support.view',
            'support.respond',
            'support.close',
            'support.escalate',
            'disputes.view',
            'reports.view'
        ]
    },
    {
        name: 'accountant',
        display_name: 'Accountant',
        permissions: [
            'finance.view',
            'finance.transactions',
            'finance.escrow',
            'finance.payouts',
            'finance.refunds',
            'orders.view',
            'vendors.view',
            'reports.view',
            'reports.export',
            'analytics.view'
        ]
    },
    {
        name: 'head_of_marketing',
        display_name: 'Head of Marketing',
        permissions: [
            'marketing.view',
            'marketing.create',
            'marketing.edit',
            'marketing.delete',
            'marketing.analytics',
            'marketers.view',
            'marketers.approve',
            'marketers.commissions',
            'products.view',
            'products.feature',
            'vendors.view',
            'analytics.view',
            'reports.view',
            'reports.export'
        ]
    }
];

// Admin accounts to create
const ADMIN_ACCOUNTS = [
    {
        email: 'admin@nimex.ng',
        password: 'NimexAdmin2024!',
        fullName: 'NIMEX Super Admin',
        role: 'super_admin',
        phone: '+234 800 000 0001'
    },
    {
        email: 'support@nimex.ng',
        password: 'NimexSupport2024!',
        fullName: 'Customer Support Manager',
        role: 'customer_support',
        phone: '+234 800 000 0002'
    },
    {
        email: 'accountant@nimex.ng',
        password: 'NimexAcct2024!',
        fullName: 'Chief Accountant',
        role: 'accountant',
        phone: '+234 800 000 0003'
    },
    {
        email: 'marketing@nimex.ng',
        password: 'NimexMkt2024!',
        fullName: 'Head of Marketing',
        role: 'head_of_marketing',
        phone: '+234 800 000 0004'
    }
];

// Store created IDs for reference
const createdIds: any = {
    permissions: {},
    roles: {}
};

async function createPermissions() {
    console.log('📋 Creating permissions...\n');

    for (const permission of PERMISSIONS) {
        try {
            const permRef = await addDoc(collection(db, COLLECTIONS.ADMIN_PERMISSIONS), {
                name: permission.name,
                category: permission.category,
                description: permission.description,
                created_at: Timestamp.now(),
                updated_at: Timestamp.now()
            });

            createdIds.permissions[permission.name] = permRef.id;
            console.log(`  ✓ Created permission: ${permission.name}`);
        } catch (error) {
            console.error(`  ✗ Error creating permission ${permission.name}:`, error);
        }
    }

    console.log(`\n✅ Created ${Object.keys(createdIds.permissions).length} permissions\n`);
}

async function createRoles() {
    console.log('👥 Creating roles...\n');

    for (const role of ROLES) {
        try {
            // Create role document
            const roleRef = await addDoc(collection(db, COLLECTIONS.ADMIN_ROLES), {
                name: role.name,
                display_name: role.display_name,
                created_at: Timestamp.now(),
                updated_at: Timestamp.now()
            });

            createdIds.roles[role.name] = roleRef.id;
            console.log(`  ✓ Created role: ${role.display_name}`);

            // Assign permissions to role
            for (const permissionName of role.permissions) {
                const permissionId = createdIds.permissions[permissionName];
                if (permissionId) {
                    await addDoc(collection(db, COLLECTIONS.ROLE_PERMISSIONS), {
                        role_id: roleRef.id,
                        permission_id: permissionId,
                        created_at: Timestamp.now()
                    });
                }
            }

            console.log(`    → Assigned ${role.permissions.length} permissions`);
        } catch (error) {
            console.error(`  ✗ Error creating role ${role.name}:`, error);
        }
    }

    console.log(`\n✅ Created ${Object.keys(createdIds.roles).length} roles\n`);
}

async function createAdminAccount(account: any) {
    console.log(`👤 Creating admin account: ${account.email}...`);

    try {
        // 1. Create Auth User
        let userCredential;
        try {
            userCredential = await createUserWithEmailAndPassword(auth, account.email, account.password);
            console.log(`  ✓ Auth user created: ${userCredential.user.uid}`);
        } catch (error: any) {
            if (error.code === 'auth/email-already-in-use') {
                console.log(`  ℹ User already exists, signing in...`);
                userCredential = await signInWithEmailAndPassword(auth, account.email, account.password);
            } else {
                throw error;
            }
        }

        const user = userCredential.user;
        const uid = user.uid;

        // 2. Update Auth Profile
        await updateProfile(user, { displayName: account.fullName });
        console.log(`  ✓ Auth profile updated`);

        // 3. Create Firestore Profile
        const profileRef = doc(db, COLLECTIONS.PROFILES, uid);
        const profileData = {
            id: uid,
            email: account.email,
            full_name: account.fullName,
            role: 'admin',
            phone: account.phone || null,
            avatar_url: null,
            location: null,
            created_at: Timestamp.now(),
            updated_at: Timestamp.now()
        };

        await setDoc(profileRef, profileData, { merge: true });
        console.log(`  ✓ Firestore profile created/updated`);

        // 4. Assign admin role
        const roleId = createdIds.roles[account.role];
        if (roleId) {
            await addDoc(collection(db, COLLECTIONS.ADMIN_ROLE_ASSIGNMENTS), {
                user_id: uid,
                role_id: roleId,
                assigned_by: null, // System assigned
                assigned_at: Timestamp.now(),
                created_at: Timestamp.now(),
                updated_at: Timestamp.now()
            });
            console.log(`  ✓ Assigned role: ${account.role}`);
        }

        console.log(`✅ Admin account setup complete: ${account.fullName}\n`);

        return { uid, email: account.email, role: account.role };

    } catch (error) {
        console.error(`❌ Error creating admin account ${account.email}:`, error);
        return null;
    }
}

async function seed() {
    console.log('🚀 Starting Admin Setup...\n');
    console.log('═══════════════════════════════════════════════════\n');

    // Step 1: Create Super Admin first to establish permissions
    console.log('👑 Creating Super Admin first...\n');
    const superAdminAccount = ADMIN_ACCOUNTS.find(a => a.role === 'super_admin');
    if (superAdminAccount) {
        await createAdminAccount(superAdminAccount);
    }

    // Step 2: Create permissions (Now authenticated as Super Admin)
    await createPermissions();

    // Step 3: Create roles
    await createRoles();

    // Step 4: Create remaining admin accounts
    console.log('👥 Creating remaining admin accounts...\n');
    const createdAccounts = [];
    if (superAdminAccount) createdAccounts.push({ ...superAdminAccount, uid: auth.currentUser?.uid }); // Add Super Admin to list

    for (const account of ADMIN_ACCOUNTS) {
        if (account.role === 'super_admin') continue; // Skip already created
        const result = await createAdminAccount(account);
        if (result) {
            createdAccounts.push(result);
        }
    }

    // Summary
    console.log('═══════════════════════════════════════════════════\n');
    console.log('✨ Admin Setup Complete!\n');
    console.log('📊 Summary:');
    console.log(`  • Permissions created: ${Object.keys(createdIds.permissions).length}`);
    console.log(`  • Roles created: ${Object.keys(createdIds.roles).length}`);
    console.log(`  • Admin accounts created: ${createdAccounts.length}\n`);

    console.log('🔐 Admin Credentials:\n');
    console.log('Super Admin:');
    console.log('  Email: admin@nimex.ng');
    console.log('  Password: NimexAdmin2024!\n');

    console.log('Customer Support:');
    console.log('  Email: support@nimex.ng');
    console.log('  Password: NimexSupport2024!\n');

    console.log('Accountant:');
    console.log('  Email: accountant@nimex.ng');
    console.log('  Password: NimexAcct2024!\n');

    console.log('Head of Marketing:');
    console.log('  Email: marketing@nimex.ng');
    console.log('  Password: NimexMkt2024!\n');

    console.log('═══════════════════════════════════════════════════\n');
    console.log('⚠️  IMPORTANT: Change these passwords after first login!\n');

    process.exit(0);
}

seed();
