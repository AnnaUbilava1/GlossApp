import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { DEFAULT_LOCALE, getTranslation, type Locale } from "../i18n/translations";

const STORAGE_KEY = "@glossapp/locale";

type LanguageContextValue = {
  language: Locale;
  setLanguage: (locale: Locale) => Promise<void>;
  t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Locale>(DEFAULT_LOCALE);
  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (cancelled) return;
        if (stored === "ka" || stored === "en") {
          setLanguageState(stored);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const setLanguage = useCallback(async (locale: Locale) => {
    setLanguageState(locale);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, locale);
    } catch (_) {}
  }, []);

  const t = useCallback(
    (key: string) => getTranslation(language, key),
    [language]
  );

  const value: LanguageContextValue = {
    language,
    setLanguage,
    t,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    return {
      language: DEFAULT_LOCALE,
      setLanguage: async () => {},
      t: (key: string) => getTranslation(DEFAULT_LOCALE, key),
    };
  }
  return ctx;
}
