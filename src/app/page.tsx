"use client";

import Dashboard from "@/components/Dashboard";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { GoogleIcon } from "@/components/icons/GoogleIcon";

export default function Home() {
  const { user, loading, signInWithGoogle } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(80vh)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">Loading your dashboard...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(80vh)] text-center p-6 rounded-lg shadow-lg bg-card">
        <h1 className="text-4xl font-bold mb-6 text-card-foreground">Welcome to GoalTrackr!</h1>
        <p className="text-xl text-muted-foreground mb-10 max-w-md">
          Sign in with your Google account to start tracking your soccer team's performance, manage seasons, and view match details.
        </p>
        <Button 
          onClick={signInWithGoogle} 
          size="lg" 
          className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-transform hover:scale-105"
          aria-label="Sign in with Google to access GoalTrackr"
        >
          <GoogleIcon className="mr-3 h-5 w-5" />
          Sign in with Google
        </Button>
      </div>
    );
  }

  return <Dashboard />;
}
