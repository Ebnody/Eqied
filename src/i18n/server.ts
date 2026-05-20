// Server-side locale resolution. Order of preference:
//   1. Explicit cookie (set by LocaleSwitcher)
//   2. User.preferredLocale from DB (when authenticated)
//   3. Accept-Language header
//   4. DEFAULT_LOCALE

import { cookies, headers } from "next/headers";
import {
  type Locale,
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  isValidLocale,
} from "./config";
import { getDictionary, makeTranslator } from "./dictionary";

export async function resolveLocale(opts?: {
  userPreferredLocale?: string | null;
}): Promise<Locale> {
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get(LOCALE_COOKIE)?.value;
  if (isValidLocale(fromCookie)) return fromCookie;

  if (isValidLocale(opts?.userPreferredLocale ?? undefined)) {
    return opts!.userPreferredLocale as Locale;
  }

  const headerStore = await headers();
  const accept = headerStore.get("accept-language") ?? "";
  // pick the first sub-tag that maps to a known locale
  for (const part of accept.split(",")) {
    const code = part.split(";")[0].trim().toLowerCase().split("-")[0];
    if (isValidLocale(code)) return code;
  }

  return DEFAULT_LOCALE;
}

export async function getServerT(opts?: {
  userPreferredLocale?: string | null;
}) {
  const locale = await resolveLocale(opts);
  const dict = getDictionary(locale);
  return { locale, t: makeTranslator(dict), dict };
}

// Convenience for the bot which already knows the user's locale.
export function tForLocale(locale: Locale) {
  return makeTranslator(getDictionary(locale));
}
