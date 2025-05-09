"use client";

import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { GoogleIcon } from "@/components/icons/GoogleIcon"; // Added import
import { LogOut, UserCircle } from "lucide-react"; // Added UserCircle and LogOut

export const AuthButton = () => {
  const { user, loading, signInWithGoogle, signOut } = useAuth();

  if (loading) {
    return <Button variant="outline" disabled size="sm">Loading...</Button>;
  }

  if (user) {
    return (
      <div className="flex items-center gap-2">
        {user.photoURL ? (
          <img src={user.photoURL} alt={user.displayName || "User"} className="h-8 w-8 rounded-full" />
        ) : (
          <UserCircle className="h-7 w-7 text-muted-foreground" />
        )}
        <Button variant="outline" onClick={signOut} size="sm" className="group">
          <LogOut className="h-4 w-4 mr-2 group-hover:text-destructive" />
          Sign Out
        </Button>
      </div>
    );
  }

  return (
    <Button onClick={signInWithGoogle} variant="outline" className="border-input hover:bg-accent/50 shadow-sm">
      <GoogleIcon className="mr-2 h-4 w-4" /> {/* Google Icon added */}
      Sign in with Google
    </Button>
  );
};
