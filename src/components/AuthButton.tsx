
"use client";

import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { GoogleIcon } from "@/components/icons/GoogleIcon";
import { LogOut, UserCircle } from "lucide-react";
import { useTranslations } from '@/context/LanguageContext';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const AuthButton = () => {
  const { user, loading, signInWithGoogle, signOut } = useAuth();
  const t = useTranslations();

  if (loading) {
    return <Button variant="outline" disabled size="sm">{t('loading')}</Button>;
  }

  if (user) {
    return (
      <div className="flex items-center gap-2">
        {user.photoURL ? (
          <img src={user.photoURL} alt={user.displayName || "User"} className="h-8 w-8 rounded-full" />
        ) : (
          <UserCircle className="h-7 w-7 text-muted-foreground" />
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" onClick={signOut} size="icon" aria-label={t('signOut')}>
              <LogOut className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('signOut')}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    );
  }

  return (
    <Button 
      onClick={signInWithGoogle} 
      variant="outline" // Changed to outline variant
      size="sm" // Using sm size for consistency with other text buttons in header
      className="border-input hover:bg-accent/50 shadow-sm"
    >
      <GoogleIcon className="mr-2 h-4 w-4" />
      {t('signInWithGoogle')}
    </Button>
  );
};

