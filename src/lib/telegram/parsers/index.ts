import { ParsedSms, SmsParser } from "./types";
import { telebirrParser } from "./telebirr";
import { cbeParser } from "./cbe";
import { awashParser } from "./awash";
import { dashenParser } from "./dashen";
import { genericParser } from "./generic";

const PARSERS: SmsParser[] = [
  telebirrParser,
  awashParser,
  cbeParser,
  dashenParser,
  genericParser,
];

/**
 * Try each provider-specific parser in order. Returns the first successful match,
 * or the result of the generic parser as a best-effort fallback.
 */
export function parseTransactionSms(text: string): ParsedSms {
  for (const parser of PARSERS) {
    const result = parser(text);
    if (result && result.ok) return result;
  }
  // No parser succeeded - return a stub with provider="generic" so we still record it
  return {
    ok: false,
    provider: "unknown",
    parserName: "none",
    currency: "ETB",
  };
}

export type { ParsedSms } from "./types";
