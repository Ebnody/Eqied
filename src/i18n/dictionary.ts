import { en } from "./locales/en";
import { am } from "./locales/am";
import { om } from "./locales/om";
import { ti } from "./locales/ti";
import type { Dictionary } from "./locales/en";
import { type Locale, DEFAULT_LOCALE } from "./config";

const DICTIONARIES: Record<Locale, Dictionary> = {
  en,
  am,
  om,
  ti,
};

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale] ?? DICTIONARIES[DEFAULT_LOCALE];
}

// Dot-path translator. Example: t("nav.dashboard").
// Supports {placeholder} interpolation: t("bot.welcomeBack", { name: "Sara" }).
export function makeTranslator(dict: Dictionary) {
  return function t(
    path: string,
    vars?: Record<string, string | number>
  ): string {
    const parts = path.split(".");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let value: any = dict;
    for (const p of parts) {
      if (value == null) break;
      value = value[p];
    }
    if (typeof value !== "string") {
      // Fallback: return the path so missing keys are easy to spot.
      return path;
    }
    if (!vars) return value;
    return value.replace(/\{(\w+)\}/g, (_, key: string) =>
      vars[key] != null ? String(vars[key]) : `{${key}}`
    );
  };
}

export type Translator = ReturnType<typeof makeTranslator>;
