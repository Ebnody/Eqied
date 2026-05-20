"use client";

import { createContext, useContext, useMemo } from "react";
import { type Locale, DEFAULT_LOCALE } from "./config";
import { getDictionary, makeTranslator, type Translator } from "./dictionary";
import type { Dictionary } from "./locales/en";

interface I18nContextValue {
  locale: Locale;
  t: Translator;
  dict: Dictionary;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  const value = useMemo<I18nContextValue>(() => {
    const dict = getDictionary(locale);
    return { locale, t: makeTranslator(dict), dict };
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    // Sensible fallback for components rendered outside the provider
    const dict = getDictionary(DEFAULT_LOCALE);
    return { locale: DEFAULT_LOCALE, t: makeTranslator(dict), dict };
  }
  return ctx;
}
