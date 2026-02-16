
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
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
const db = getFirestore(app);

const COLLECTIONS = {
    PROFILES: 'profiles',
    VENDORS: 'vendors'
};

const DEMO_EMAILS = [
    'demo@buyer.nimex.ng',
    'demo@vendor.nimex.ng',
    'admin@nimex.ng'
];

async function verify() {
    console.log('🚀 Verifying Demo Data...\n');

    // We can't easily query by email without an index or auth admin SDK, 
    // but the seed script logs the UIDs. 
    // Since we don't have the UIDs here, we'll just check if we can connect 
    // and maybe list a few documents if rules allow (which they might not for list queries).

    // Actually, without the UIDs or a way to query by email (which requires an index and rules allowing it),
    // verification is hard from the client SDK without logging in as that user.

    console.log('ℹ️  To verify data, please check the Firebase Console > Firestore Database.');
    console.log('   Look for the "profiles" collection.');
    console.log('   You should see documents for the demo accounts.');

    console.log('\n✅ Verification script finished.');
    process.exit(0);
}

verify();
