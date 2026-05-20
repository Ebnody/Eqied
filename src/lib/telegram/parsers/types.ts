export type TxDirection = "income" | "expense";

export interface ParsedSms {
  ok: boolean;
  provider: string;       // "telebirr" | "cbe" | "awash" | "dashen" | "generic"
  parserName: string;     // human-readable parser id
  type?: TxDirection;
  amountSantim?: number;  // amount in santim
  currency?: string;      // default "ETB"
  counterparty?: string;
  counterpartyPhone?: string;
  reference?: string;
  balanceAfterSantim?: number;
  occurredAt?: Date;
  rawAmountText?: string;
  notes?: string;
}

export type SmsParser = (text: string) => ParsedSms | null;

// Helpers used by all parsers
export function toSantimFromString(amountStr: string): number | undefined {
  // Remove commas, spaces, currency symbols
  const cleaned = amountStr
    .replace(/,/g, "")
    .replace(/\s/g, "")
    .replace(/etb|birr/gi, "")
    .trim();
  const n = Number(cleaned);
  if (!Number.isFinite(n)) return undefined;
  return Math.round(n * 100);
}

// Patterns ordered by specificity. We prefer amounts that are clearly tagged
// with a currency marker (ETB / Birr / Br) so we don't accidentally pick up
// account numbers, phone numbers, or dates.
const ANCHORED_PATTERNS: RegExp[] = [
  // "ETB 1,000.00", "ETB-1000.00", "ETB1000.00", "ETB 1000"
  /(?:ETB|Birr)\s*-?\s*([\d]{1,3}(?:,\d{3})+(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)/i,
  // "1,000.00 ETB", "1000 Birr"
  /([\d]{1,3}(?:,\d{3})+(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)\s*(?:ETB|Birr)\b/i,
  // "Br 1,000.00" (telebirr style)
  /\bBr\.?\s+([\d]{1,3}(?:,\d{3})+(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)/i,
];

// Last-resort: any number with a decimal part — much less likely to be an
// account number or phone. Numbers without decimals are skipped here.
const FALLBACK_PATTERN = /\b([\d]{1,3}(?:,\d{3})+\.\d{1,2}|\d+\.\d{1,2})\b/;

export function extractAmount(text: string): {
  amountSantim?: number;
  rawAmountText?: string;
} {
  for (const p of ANCHORED_PATTERNS) {
    const m = text.match(p);
    if (m) {
      const amountSantim = toSantimFromString(m[1]);
      if (amountSantim) return { amountSantim, rawAmountText: m[0] };
    }
  }
  const m = text.match(FALLBACK_PATTERN);
  if (m) {
    const amountSantim = toSantimFromString(m[1]);
    if (amountSantim) return { amountSantim, rawAmountText: m[0] };
  }
  return {};
}

// Extract a date from common SMS formats:
//   "2026-05-05 20:13:38", "05/05/2026", "05-05-2026 20:13"
export function extractDate(text: string): Date | undefined {
  // ISO-like: YYYY-MM-DD HH:MM:SS
  let m = text.match(
    /(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/
  );
  if (m) {
    const d = new Date(
      Number(m[1]),
      Number(m[2]) - 1,
      Number(m[3]),
      Number(m[4]),
      Number(m[5]),
      Number(m[6] ?? "0")
    );
    if (!isNaN(d.getTime())) return d;
  }
  // YYYY-MM-DD
  m = text.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (m) {
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    if (!isNaN(d.getTime())) return d;
  }
  // DD/MM/YYYY or DD-MM-YYYY (Ethiopian convention)
  m = text.match(/\b(\d{2})[\/\-](\d{2})[\/\-](\d{4})\b/);
  if (m) {
    const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
    if (!isNaN(d.getTime())) return d;
  }
  return undefined;
}

export function extractReference(text: string): string | undefined {
  // Common patterns: "Transaction Reference: ABC123" or "Ref. No: XYZ" or "TxnID: 12345"
  const patterns = [
    /(?:transaction\s+(?:reference|id|number)|ref(?:erence)?\.?\s*(?:no\.?|#|number)?|txn\s*id|ttn|trace\s*id)[:\s]+([A-Z0-9]{6,})/i,
    /\bwith\s+reference\s+([A-Z0-9]{6,})/i,
    /\bRef[:\s]+([A-Z0-9]{6,})/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[1];
  }
  return undefined;
}

export function extractPhoneNumber(text: string): string | undefined {
  // Ethiopian phone numbers: 09XXXXXXXX, +2519XXXXXXXX, 2519XXXXXXXX
  const m = text.match(/(?:\+?251|0)?9\d{8}/);
  return m ? m[0] : undefined;
}
