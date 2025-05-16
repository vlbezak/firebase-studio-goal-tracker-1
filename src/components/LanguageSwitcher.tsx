
"use client";

import { useLanguage, useTranslations }from '@/context/LanguageContext';
import { Button } from '@/components/ui/button';

export const LanguageSwitcher = () => {
  const { language, setLanguage } = useLanguage();
  const t = useTranslations();

  const nextLang = language === 'en' ? 'hu' : 'en';
  // Display the current language on the button
  const buttonText = language.toUpperCase(); 
  
  const toggleLanguage = () => {
    setLanguage(nextLang);
  };

  // Tooltip should describe the action: switching to the *other* language
  const tooltipText = language === 'en' ? t('switchToHungarian') : t('switchToEnglish');

  return (
    <Button
      variant="outline"
      size="default" // Changed from sm to default for h-10
      onClick={toggleLanguage}
      aria-label={tooltipText}
      title={tooltipText} // Simple browser tooltip
    >
      {buttonText}
    </Button>
  );
};
