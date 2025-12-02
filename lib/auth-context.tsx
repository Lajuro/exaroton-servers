'use client';

import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { 
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from './firebase';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
});

// Helper function to log auth actions
async function logAuthAction(action: 'login' | 'logout' | 'register') {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    
    const token = await currentUser.getIdToken();
    await fetch('/api/auth/log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ action }),
    });
  } catch (error) {
    console.error('Error logging auth action:', error);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const lastLoggedUserId = useRef<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        // Get user data from Firestore
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || '',
            photoURL: firebaseUser.photoURL || '',
            isAdmin: userData.isAdmin || false,
            serverAccess: userData.serverAccess || [],
            createdAt: userData.createdAt?.toDate() || new Date(),
            updatedAt: userData.updatedAt?.toDate() || new Date(),
          });
          
          // Log login only if this is a new session (not a page reload with existing session)
          if (lastLoggedUserId.current !== firebaseUser.uid) {
            lastLoggedUserId.current = firebaseUser.uid;
            logAuthAction('login');
          }
        } else {
          // Create new user document if it doesn't exist
          const newUser: User = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || '',
            photoURL: firebaseUser.photoURL || '',
            isAdmin: false,
            serverAccess: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          
          await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
          setUser(newUser);
          
          // Log registration
          lastLoggedUserId.current = firebaseUser.uid;
          logAuthAction('register');
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      // Log logout before signing out (while we still have the token)
      await logAuthAction('logout');
      lastLoggedUserId.current = null;
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
