import {
  ParsedSms,
  SmsParser,
  extractAmount,
  extractReference,
  extractDate,
  toSantimFromString,
} from "./types";

// Comprehensive parser for ALL Ethiopian banks and mobile money services.
// Detects bank by name, then extracts transaction details from common SMS patterns.

const ETHIOPIAN_BANKS = [
  { names: ["commercial bank of ethiopia", "cbe", "combanketh"], provider: "cbe" },
  { names: ["awash bank", "awash"], provider: "awash" },
  { names: ["dashen bank", "dashen"], provider: "dashen" },
  { names: ["bank of abyssinia", "abyssinia", "boa bank"], provider: "abyssinia" },
  { names: ["wegagen bank", "wegagen"], provider: "wegagen" },
  { names: ["nib international bank", "nib bank", "nib"], provider: "nib" },
  { names: ["united bank", "ub"], provider: "united" },
  { names: ["berhan bank", "berhan"], provider: "berhan" },
  { names: ["zemen bank", "zemen"], provider: "zemen" },
  { names: ["abay bank", "abay"], provider: "abay" },
  { names: ["cooperative bank of oromia", "cooperative bank", "cbo"], provider: "cooperative" },
  { names: ["lion bank", "lion"], provider: "lion" },
  { names: ["oromia international bank", "oromia bank"], provider: "oromia" },
  { names: ["enat bank", "enat"], provider: "enat" },
  { names: ["bunna bank", "bunna"], provider: "bunna" },
  { names: ["hijra bank", "hijra"], provider: "hijra" },
  { names: ["amhara bank", "amhara"], provider: "amhara" },
  { names: ["tsedey bank", "tsedey"], provider: "tsedey" },
  { names: ["sidama bank", "sidama"], provider: "sidama" },
  { names: ["goh betoch bank", "goh betoch"], provider: "gohbetoch" },
  { names: ["telebirr", "tele birr", "tele-birr"], provider: "telebirr" },
];

// Common Ethiopian bank SMS patterns that indicate a transaction
const TRANSACTION_KEYWORDS = [
  /\b(?:credited|debited|transferred|withdrawn|deposited|received|paid|purchase|bought|sent)\b/i,
  /\b(?:account\s+(?:has been|was|is))\s+(?:credited|debited)/i,
  /\b(?:you have (?:transferred|withdrawn|received|deposited|paid))\b/i,
  /\b(?:your acc(?:ount)?\s+(?:has been|was))\s+(?:credited|debited)/i,
  /\b(?:etb|birr)\s*[\d,]+/i, // Any ETB amount is suspicious for bank SMS
];

function detectProvider(text: string): string {
  const lower = text.toLowerCase();
  for (const bank of ETHIOPIAN_BANKS) {
    for (const name of bank.names) {
      if (lower.includes(name)) return bank.provider;
    }
  }
  // Fallback: detect by common phone numbers
  if (/\b8980\b/.test(text)) return "cbe";     // CBE call center
  if (/\b955\b/.test(text)) return "dashen";    // Dashen call center
  if (/\b6300\b/.test(text)) return "awash";     // Awash
  if (/\b8400\b/.test(text)) return "nib";       // NIB
  if (/\btelebirr\b/i.test(text)) return "telebirr";
  return "ethiopian-bank";
}

function looksLikeBankSms(text: string): boolean {
  // Must have a transaction keyword AND an amount
  const hasKeyword = TRANSACTION_KEYWORDS.some((p) => p.test(text));
  const hasAmount = /(?:ETB|Birr)\s*[\d,]+/i.test(text) || /\bETB\b/i.test(text);
  const hasBank = ETHIOPIAN_BANKS.some((b) =>
    b.names.some((n) => text.toLowerCase().includes(n))
  );
  const hasPhone = /\b(?:8980|955|6300|8400|555|8000)\b/.test(text);
  return (hasKeyword && hasAmount) || (hasBank && hasAmount) || (hasPhone && hasAmount);
}

function extractCounterparty(text: string): string | undefined {
  // "To 1000713196348 (ZEMBA GAZEBO PLC)"
  const toMatch = text.match(/\bto\s+[\d\s]+\(([^)]+)\)/i);
  if (toMatch) return toMatch[1].trim();

  // "To: John Doe" or "To John Doe"
  const toSimple = text.match(/\bto[:\s]+([A-Z][A-Za-z\s]+?)(?:\.|,|\s+on\b|\s+with\b|\s+Ref|\s+ref)/i);
  if (toSimple) return toSimple[1].trim();

  // "from Awash" or "from Telebirr C2B"
  const fromMatch = text.match(/\bfrom\s+([A-Z][A-Za-z\s]+?)(?:\.|,|\s+with|\s+on\b|\s+to\b)/i);
  if (fromMatch) return fromMatch[1].trim();

  // "by TeleBirr C2B"
  const byMatch = text.match(/\bby\s+([A-Z][A-Za-z\s]+?)(?:\.|,|\s+to\b|\s+with\b)/i);
  if (byMatch) return byMatch[1].trim();

  return undefined;
}

function extractBalance(text: string): number | undefined {
  // "Your balance now is ETB 2226.88"
  // "Your available Balance is ETB 226.88"
  // "Current balance: ETB1499.78"
  const patterns = [
    /(?:balance now is|available balance is|current balance[:\s]+)\s*(?:ETB|Birr)?\s*([\d,]+(?:\.\d{1,2})?)/i,
    /(?:balance|bal)[:\s]+\s*(?:ETB|Birr)?\s*([\d,]+(?:\.\d{1,2})?)/i,
    /(?:ETB|Birr)\s*([\d,]+(?:\.\d{1,2})?)\s*(?:is your|as your|remaining|left)/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      const s = toSantimFromString(m[1]);
      if (s) return s;
    }
  }
  return undefined;
}

export const ethiopianBanksParser: SmsParser = (text: string): ParsedSms | null => {
  if (!looksLikeBankSms(text)) return null;

  const provider = detectProvider(text);

  const result: ParsedSms = {
    ok: false,
    provider,
    parserName: "ethiopian-banks-v1",
    currency: "ETB",
  };

  // Determine transaction type
  if (/\b(?:credited|received|deposited|incoming|has been credited)\b/i.test(text)) {
    result.type = "income";
  } else if (/\b(?:debited|transferred|withdrawn|sent|paid|purchase|bought|outgoing|has been debited)\b/i.test(text)) {
    result.type = "expense";
  }

  const { amountSantim, rawAmountText } = extractAmount(text);
  result.amountSantim = amountSantim;
  result.rawAmountText = rawAmountText;

  result.reference = extractReference(text);
  result.counterparty = extractCounterparty(text);
  result.balanceAfterSantim = extractBalance(text);
  result.occurredAt = extractDate(text);

  // Account number hint
  const acct = text.match(/(?:account|acc|acct)[:\s#]+([\dx*]+)/i);
  if (acct) {
    const last = acct[1].slice(-4);
    if (/^\d{4}$/.test(last)) {
      result.notes = `Account ending ${last}`;
    }
  }

  result.ok = !!(result.amountSantim && result.type);
  return result;
};
