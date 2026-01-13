'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { getAuthInstance } from '@/services/firebase';
import { getUser, createUser, updateUserLastLogin, UserData } from '@/services/db';

interface AuthContextType {
  user: FirebaseUser | null;
  userData: UserData | null;
  loading: boolean;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  refreshUserData: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUserData = async (firebaseUser: FirebaseUser) => {
    // Get or create user data
    let data = await getUser(firebaseUser.uid);
    if (!data) {
      await createUser(firebaseUser);
      data = await getUser(firebaseUser.uid);
    } else {
      await updateUserLastLogin(firebaseUser.uid);
    }
    return data;
  };

  const refreshUserData = async () => {
    if (user) {
      const data = await getUser(user.uid);
      setUserData(data);
    }
  };

  useEffect(() => {
    // Get auth instance (will initialize if needed)
    const authInstance = getAuthInstance();
    
    // Only initialize auth listener if Firebase is initialized
    if (!authInstance) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(authInstance, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const data = await loadUserData(firebaseUser);
        setUserData(data);
      } else {
        setUser(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, userData, loading, refreshUserData }}>
      {children}
    </AuthContext.Provider>
  );
}
