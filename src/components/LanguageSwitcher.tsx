
"use client";

import { useLanguage } from '@/context/LanguageContext';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react'; // Using a generic globe icon for now

export const LanguageSwitcher = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-1">
      <Button
        variant={language === 'en' ? 'secondary' : 'ghost'}
        size="sm"
        onClick={() => setLanguage('en')}
        className={language === 'en' ? 'font-bold' : ''}
      >
        EN
      </Button>
      <Button
        variant={language === 'hu' ? 'secondary' : 'ghost'}
        size="sm"
        onClick={() => setLanguage('hu')}
        className={language === 'hu' ? 'font-bold' : ''}
      >
        HU
      </Button>
    </div>
  );
};
