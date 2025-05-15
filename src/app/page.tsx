
"use client";

import Dashboard from "@/components/Dashboard";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react"; 
import { GoogleIcon } from "@/components/icons/GoogleIcon";
import { useTranslations } from '@/context/LanguageContext'; // Added

export default function Home() {
  const { user, loading, signInWithGoogle } = useAuth();
  const t = useTranslations(); // Added

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(80vh)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">{t('loadingYourDashboard')}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(80vh)] text-center p-6 rounded-lg shadow-lg bg-card">
        <h1 className="text-4xl font-bold mb-6 text-card-foreground">{t('welcomeToApp')}</h1>
        <p className="text-xl text-muted-foreground mb-10 max-w-md">
          {t('signInPrompt')}
        </p>
        <Button 
          onClick={signInWithGoogle} 
          size="lg" 
          className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-transform hover:scale-105"
          aria-label={t('signInWithGoogle')}
        >
          <GoogleIcon className="mr-3 h-5 w-5" />
          {t('signInWithGoogle')}
        </Button>
      </div>
    );
  }

  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <Dashboard />
  );
}
