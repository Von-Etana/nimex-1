// Firebase Configuration and Initialization
// Re-export from the main firebase.ts file to ensure singleton instances
import { app, auth, db, storage, FirebaseConfig, GoogleAuthProvider } from './firebase';

export { app, auth, db, storage, GoogleAuthProvider };
export type { FirebaseConfig };
