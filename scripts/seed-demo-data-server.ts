import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../.env') });

// Initialize Firebase Admin SDK
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}');

if (!serviceAccount.project_id) {
    console.error('❌ Missing FIREBASE_SERVICE_ACCOUNT_KEY in .env file.');
    console.log('   Please add your Firebase service account JSON key to the .env file.');
    console.log('   You can get it from: Firebase Console → Project Settings → Service Accounts → Generate New Private Key');
    process.exit(1);
}

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.VITE_FIREBASE_PROJECT_ID
});

const db = admin.firestore();
const auth = admin.auth();

const COLLECTIONS = {
    PROFILES: 'profiles',
    VENDORS: 'vendors'
};

const DEMO_ACCOUNTS = {
    buyer: {
        email: 'demo@buyer.nimex.ng',
        password: 'DemoPassword123!',
        fullName: 'Demo Buyer',
        phone: '+234 800 123 4567',
        role: 'buyer'
    },
    vendor: {
        email: 'demo@vendor.nimex.ng',
        password: 'DemoPassword123!',
        fullName: 'Demo Vendor',
        phone: '+234 800 765 4321',
        role: 'vendor',
        businessName: 'Demo Artisan Crafts',
        businessDescription: 'Authentic handmade Nigerian crafts and textiles',
        businessAddress: '45 Craft Market Road, Ikeja, Lagos'
    },
    admin: {
        email: 'admin@nimex.ng',
        password: 'NimexAdmin2024!',
        fullName: 'NIMEX Super Admin',
        role: 'admin'
    }
};

async function createAccount(account: any) {
    console.log(`Creating ${account.role} account: ${account.email}...`);

    try {
        // 1. Create or get Auth User
        let userRecord;
        try {
            userRecord = await auth.createUser({
                email: account.email,
                password: account.password,
                displayName: account.fullName,
                emailVerified: true // Pre-verify demo accounts
            });
            console.log(`  - Auth user created: ${userRecord.uid}`);
        } catch (error: any) {
            if (error.code === 'auth/email-already-exists') {
                console.log(`  - User already exists, fetching...`);
                userRecord = await auth.getUserByEmail(account.email);

                // Update the display name if needed
                await auth.updateUser(userRecord.uid, {
                    displayName: account.fullName,
                    emailVerified: true
                });
            } else {
                throw error;
            }
        }

        const uid = userRecord.uid;

        // 2. Create Firestore Profile (bypasses security rules)
        await db.collection(COLLECTIONS.PROFILES).doc(uid).set({
            id: uid,
            email: account.email,
            full_name: account.fullName,
            role: account.role,
            phone: account.phone || null,
            avatar_url: null,
            location: null,
            is_active: true,
            created_at: admin.firestore.FieldValue.serverTimestamp(),
            updated_at: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        console.log(`  - Firestore profile created/updated`);

        // 3. Create Vendor Document (if vendor) - bypasses security rules
        if (account.role === 'vendor') {
            await db.collection(COLLECTIONS.VENDORS).doc(uid).set({
                user_id: uid,
                business_name: account.businessName,
                business_description: account.businessDescription,
                business_address: account.businessAddress,
                business_phone: account.phone,
                market_location: 'Lagos, Nigeria',
                verification_status: 'verified',
                verification_badge: 'verified',
                subscription_status: 'active',
                subscription_plan: 'premium',
                subscription_start_date: new Date().toISOString(),
                subscription_end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
                rating: 4.8,
                total_sales: 125,
                wallet_balance: 250500,
                response_time: 30,
                is_active: true,
                created_at: admin.firestore.FieldValue.serverTimestamp(),
                updated_at: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            console.log(`  - Vendor document created/updated with active subscription`);
        }

        console.log(`✅ ${account.role} account setup complete.\n`);
        return { uid, email: account.email, role: account.role };

    } catch (error) {
        console.error(`❌ Error creating ${account.role} account:`, error);
        return null;
    }
}

async function seed() {
    console.log('🚀 Starting Demo Data Seeding (Server-side with Admin SDK)...\n');
    console.log('═══════════════════════════════════════════════════\n');

    const results = [];

    results.push(await createAccount(DEMO_ACCOUNTS.buyer));
    results.push(await createAccount(DEMO_ACCOUNTS.vendor));
    results.push(await createAccount(DEMO_ACCOUNTS.admin));

    // Summary
    console.log('═══════════════════════════════════════════════════\n');
    console.log('✨ Demo Data Seeding Complete!\n');

    console.log('🔐 Demo Credentials:\n');
    console.log('BUYER:');
    console.log('  Email: demo@buyer.nimex.ng');
    console.log('  Password: DemoPassword123!\n');

    console.log('VENDOR (with active subscription):');
    console.log('  Email: demo@vendor.nimex.ng');
    console.log('  Password: DemoPassword123!\n');

    console.log('ADMIN:');
    console.log('  Email: admin@nimex.ng');
    console.log('  Password: NimexAdmin2024!\n');

    console.log('═══════════════════════════════════════════════════\n');
    console.log('⚠️  IMPORTANT: These are demo accounts with known passwords!');
    console.log('   Do not use in production or change passwords if deploying.\n');

    process.exit(0);
}

seed().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
