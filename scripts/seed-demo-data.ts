
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, updateProfile, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, Timestamp } from 'firebase/firestore';
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
        // 1. Create Auth User
        let userCredential;
        try {
            userCredential = await createUserWithEmailAndPassword(auth, account.email, account.password);
            console.log(`  - Auth user created: ${userCredential.user.uid}`);
        } catch (error: any) {
            if (error.code === 'auth/email-already-in-use') {
                console.log(`  - User already exists, signing in...`);
                userCredential = await signInWithEmailAndPassword(auth, account.email, account.password);
            } else {
                throw error;
            }
        }

        const user = userCredential.user;
        const uid = user.uid;

        // 2. Update Auth Profile
        await updateProfile(user, { displayName: account.fullName });
        console.log(`  - Auth profile updated`);

        // 3. Create Firestore Profile
        const profileRef = doc(db, COLLECTIONS.PROFILES, uid);
        const profileData = {
            id: uid,
            email: account.email,
            full_name: account.fullName,
            role: account.role,
            phone: account.phone || null,
            created_at: Timestamp.now(),
            updated_at: Timestamp.now(),
            is_active: true
        };

        await setDoc(profileRef, profileData, { merge: true });
        console.log(`  - Firestore profile created/updated`);

        // 4. Create Vendor Document (if vendor)
        if (account.role === 'vendor') {
            const vendorRef = doc(db, COLLECTIONS.VENDORS, uid);

            // For new vendors or when document doesn't exist
            const vendorData = {
                user_id: uid,
                business_name: account.businessName,
                business_description: account.businessDescription,
                business_address: account.businessAddress,
                business_phone: account.phone,
                subscription_status: 'active',
                subscription_plan: 'premium',
                market_location: 'Lagos, Nigeria',
                is_active: true,
                created_at: Timestamp.now(),
                updated_at: Timestamp.now()
            };
            await setDoc(vendorRef, vendorData, { merge: true });
            console.log(`  - Vendor document created/updated with active subscription`);
        }

        console.log(`✅ ${account.role} account setup complete.\n`);

    } catch (error) {
        console.error(`❌ Error creating ${account.role} account:`, error);
    }
}

async function seed() {
    console.log('🚀 Starting Demo Data Seeding...\n');

    await createAccount(DEMO_ACCOUNTS.buyer);
    await createAccount(DEMO_ACCOUNTS.vendor);
    await createAccount(DEMO_ACCOUNTS.admin);

    console.log('✨ Seeding complete!');
    process.exit(0);
}

seed();
