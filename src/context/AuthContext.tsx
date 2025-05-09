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
  const [loading, setLoading] = useState(true); // Start with loading true

  useEffect(() => {
    // Listen for authentication state changes
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []); // Empty dependency array means this effect runs once on mount and cleanup on unmount

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      // No need to setLoading(true) here as onAuthStateChanged will handle it
      await signInWithPopup(auth, provider);
      // onAuthStateChanged will automatically update the user state and set loading to false
    } catch (error) {
      console.error("Error signing in with Google: ", error);
      // You might want to add user-facing error handling here
      setLoading(false); // Ensure loading is false in case of an error during sign-in attempt
    }
  };

  const signOut = async () => {
    try {
      // No need to setLoading(true) here
      await firebaseSignOut(auth);
      // onAuthStateChanged will automatically update the user state to null and set loading to false
    } catch (error) {
      console.error("Error signing out: ", error);
      // You might want to add user-facing error handling here
      setLoading(false); // Ensure loading is false in case of an error during sign-out
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