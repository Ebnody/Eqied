// Locale configuration. Adding a new locale requires:
//   1. Adding its code here in LOCALES
//   2. Creating a dictionary file at src/i18n/locales/<code>.ts
//   3. Importing & registering it in src/i18n/dictionary.ts

export const LOCALES = ["en", "am", "om", "ti"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_LABELS: Record<Locale, { native: string; english: string; flag: string }> = {
  en: { native: "English", english: "English", flag: "🇬🇧" },
  am: { native: "አማርኛ", english: "Amharic", flag: "🇪🇹" },
  om: { native: "Afaan Oromoo", english: "Afaan Oromo", flag: "🇪🇹" },
  ti: { native: "ትግርኛ", english: "Tigrinya", flag: "🇪🇹" },
};

// Scripts: Amharic and Tigrinya use Ge'ez (Ethiopic). Afaan Oromo uses Latin.
export function isEthiopicLocale(locale: Locale): boolean {
  return locale === "am" || locale === "ti";
}

export function isValidLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

export const LOCALE_COOKIE = "ethiobudget_locale";
