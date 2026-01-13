import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};

// Check if Firebase config is valid
const isConfigValid = () => {
  return !!(
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId
  );
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

// Initialize Firebase function
const initFirebase = () => {
  if (app && auth && db) {
    return; // Already initialized
  }

  if (!isConfigValid()) {
    console.warn('Firebase config is not valid. Please check your environment variables.');
    return;
  }

  try {
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (error) {
    console.error('Firebase initialization error:', error);
  }
};

// Only initialize Firebase on the client side
// This prevents build-time errors when env vars are not available
if (typeof window !== 'undefined') {
  initFirebase();
}

// Export getters that initialize if needed (for client-side use)
export const getAuthInstance = (): Auth | null => {
  if (typeof window !== 'undefined' && !auth) {
    initFirebase();
  }
  return auth;
};

export const getDbInstance = (): Firestore | null => {
  if (typeof window !== 'undefined' && !db) {
    initFirebase();
  }
  return db;
};

// Export the instances (may be null during build)
export { auth, db };
export default app;
