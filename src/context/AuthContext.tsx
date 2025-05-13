"use client"; // Required for components using hooks like useState, useEffect, and context

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from '@/lib/firebase'; // Make sure this path is correct

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

// Create the context with a default undefined value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    // Listen for authentication state changes
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      setIsSigningIn(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []); // Empty dependency array means this effect runs once on mount and cleanup on unmount

  const signInWithGoogle = async () => {
    if (isSigningIn) {
      console.log('Sign in already in progress');
      return;
    }

    try {
      setIsSigningIn(true);
      const provider = new GoogleAuthProvider();
      
      // Configure the provider
      provider.setCustomParameters({
        prompt: 'select_account'
      });

      // Add a small delay to ensure any previous auth attempts are cleared
      await new Promise(resolve => setTimeout(resolve, 100));

      const result = await signInWithPopup(auth, provider);
      console.log('Sign in successful:', result.user.email);
    } catch (error: any) {
      console.error("Error signing in with Google: ", error);
      
      // Only reset signing in state if it's not a popup closed error
      if (error.code !== 'auth/cancelled-popup-request') {
        setIsSigningIn(false);
      }
      
      // If it's a popup blocked error, try redirect method
      if (error.code === 'auth/popup-blocked') {
        console.log('Popup was blocked, trying redirect method...');
        // You could implement redirect method here if needed
      }
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut }}>
      {!loading && children} {/* Optionally, only render children when not loading, or handle loading state in consuming components */}
    </AuthContext.Provider>
  );
};

// Custom hook to use the AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};