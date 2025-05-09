"use client";

import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button"; // Assuming you have a Button component

export const AuthButton = () => {
  const { user, loading, signInWithGoogle, signOut } = useAuth();

  if (loading) {
    return <Button variant="outline" disabled>Loading...</Button>; // Or a spinner, or null
  }

  if (user) {
    return (
      <div className="flex items-center gap-2">
        {/* You can add user.displayName or user.email here if desired */}
        {/* For example: <span className="text-sm">Welcome, {user.displayName || user.email}</span> */}
        <Button variant="outline" onClick={signOut}>
          Sign Out
        </Button>
      </div>
    );
  }

  return (
    <Button onClick={signInWithGoogle}>
      Sign in with Google
    </Button>
  );
};