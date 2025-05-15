
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

type Language = 'en' | 'hu';

interface Translations {
  [key: string]: string | ((params: Record<string, string | number>) => string);
}

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  translations: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const defaultLanguage: Language = 'en';

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(defaultLanguage);
  const [translations, setTranslations] = useState<Translations>({});

  useEffect(() => {
    const storedLanguage = localStorage.getItem('appLanguage') as Language | null;
    if (storedLanguage && (storedLanguage === 'en' || storedLanguage === 'hu')) {
      setLanguageState(storedLanguage);
    }
  }, []);

  useEffect(() => {
    const loadTranslations = async () => {
      try {
        const translationModule = await import(`../../locales/${language}.json`);
        setTranslations(translationModule.default);
      } catch (error) {
        console.error(`Could not load translations for ${language}:`, error);
        // Fallback to English if current language fails
        if (language !== 'en') {
          const fallbackModule = await import(`../../locales/en.json`);
          setTranslations(fallbackModule.default);
        }
      }
    };
    loadTranslations();
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('appLanguage', lang);
  };

  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    const translation = translations[key];
    if (typeof translation === 'function') {
      return translation(params || {});
    }
    if (typeof translation === 'string') {
      if (!params) {
        return translation;
      }
      return translation.replace(/\{(\w+)\}/g, (_, paramKey) => {
        const value = params[paramKey];
        return value !== undefined ? String(value) : `{${paramKey}}`;
      });
    }
    console.warn(`Translation key "${key}" not found for language "${language}".`);
    return key; // Fallback to key if not found
  }, [translations, language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, translations }}>
      {Object.keys(translations).length > 0 ? children : <div>Loading translations...</div>}
    </LanguageContext.Provider>
  );
};

export const useTranslations = (): ((key: string, params?: Record<string, string | number>) => string) => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useTranslations must be used within a LanguageProvider');
  }
  return context.t;
};

export const useLanguage = (): { language: Language; setLanguage: (language: Language) => void } => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return { language: context.language, setLanguage: context.setLanguage };
};
