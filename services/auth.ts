import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as firebaseSignOut,
  User as FirebaseUser 
} from 'firebase/auth';
import { getAuthInstance } from './firebase';

const provider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  const auth = getAuthInstance();
  if (!auth) {
    throw new Error('Firebase not initialized');
  }
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
};

export const signOut = async () => {
  const auth = getAuthInstance();
  if (!auth) {
    throw new Error('Firebase not initialized');
  }
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

export type { FirebaseUser };
