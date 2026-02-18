import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, Auth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, Firestore } from 'firebase/firestore';
import { getStorage, connectStorageEmulator, FirebaseStorage } from 'firebase/storage';
import { getAnalytics, Analytics } from 'firebase/analytics';
import { getFunctions, connectFunctionsEmulator, Functions } from 'firebase/functions';
import { logger } from './logger';

// Firebase configuration interface
export interface FirebaseConfig {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    measurementId?: string;
}

// Firebase configuration from environment variables
const firebaseConfig: FirebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Validate Firebase configuration
const validateConfig = () => {
    const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'appId'];
    const missingKeys = requiredKeys.filter(key => !firebaseConfig[key as keyof typeof firebaseConfig]);

    if (missingKeys.length > 0) {
        logger.error('Missing Firebase configuration keys:', missingKeys);
        throw new Error(`Missing Firebase configuration: ${missingKeys.join(', ')}`);
    }
};

// Initialize Firebase
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;
let functions: Functions;
let analytics: Analytics | null = null;

try {
    validateConfig();

    // Check if app is already initialized to avoid duplicate app errors
    if (getApps().length === 0) {
        app = initializeApp(firebaseConfig);
        logger.info('Firebase initialized successfully');
    } else {
        app = getApp();
        logger.info('Firebase app already initialized, using existing instance');
    }

    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    functions = getFunctions(app, 'europe-west1'); // Or your region

    // Initialize Analytics (only in browser environment)
    if (typeof window !== 'undefined') {
        analytics = getAnalytics(app);
    }

    // Connect to emulators in development
    if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
        // Only connect if not already connected (naive check, but emulators usually set up once)
        // Note: Firebase SDK warns if you try to connect twice, but it's generally safe.
        // For strictness we could check a global flag.
        try {
            connectAuthEmulator(auth, 'http://localhost:9099');
            connectFirestoreEmulator(db, 'localhost', 8080);
            connectStorageEmulator(storage, 'localhost', 9199);
            connectFunctionsEmulator(functions, 'localhost', 5001);
            logger.info('Connected to Firebase emulators');
        } catch (e) {
            // Ignore errors if already connected
            logger.warn('Failed to connect to emulators (might be already connected)', e);
        }
    }

} catch (error) {
    logger.error('Error initializing Firebase:', error);
    throw error;
}

export { app, auth, db, storage, functions, analytics, GoogleAuthProvider };
