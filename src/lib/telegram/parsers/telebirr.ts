import {
  ParsedSms,
  SmsParser,
  extractAmount,
  extractPhoneNumber,
  extractReference,
} from "./types";

// telebirr SMS messages typically include phrases like:
//   "You have received ETB 1,000.00 from John Doe (251911...)"
//   "You have transferred ETB 500.00 to Jane Smith (251922...)"
//   "Your account has been debited ETB ..."
//   "Your account has been credited ETB ..."
// Reference: "Transaction No: ABC12345" or "Txn No: ..."

export const telebirrParser: SmsParser = (text: string): ParsedSms | null => {
  const t = text.toLowerCase();
  const looksLikeTelebirr =
    t.includes("telebirr") ||
    /you\s+have\s+(received|transferred|paid)/i.test(text) ||
    /account\s+has\s+been\s+(debited|credited)/i.test(text);

  if (!looksLikeTelebirr) return null;

  const result: ParsedSms = {
    ok: false,
    provider: "telebirr",
    parserName: "telebirr-v1",
  };

  // Direction
  if (/received|credited/i.test(text)) result.type = "income";
  else if (/transferred|paid|debited|sent/i.test(text)) result.type = "expense";

  const { amountSantim, rawAmountText } = extractAmount(text);
  if (amountSantim) {
    result.amountSantim = amountSantim;
    result.rawAmountText = rawAmountText;
  }

  // Counterparty: e.g. "from <Name> (<phone>)" or "to <Name> (<phone>)"
  const cp = text.match(
    /(?:from|to)\s+([A-Za-z][A-Za-z\s.\-']{2,60}?)(?:\s*\(([^)]+)\))?(?=[.,\n]|$)/i
  );
  if (cp) {
    result.counterparty = cp[1].trim();
    if (cp[2]) result.counterpartyPhone = cp[2].trim();
  }
  if (!result.counterpartyPhone) {
    result.counterpartyPhone = extractPhoneNumber(text);
  }

  result.reference = extractReference(text);

  // Balance: e.g. "Your current balance is ETB 1,234.56"
  const bal = text.match(
    /balance(?:\s+is)?\s*[:.]?\s*(?:ETB|Birr)?\s*([\d,]+(?:\.\d{1,2})?)/i
  );
  if (bal) {
    const amt = extractAmount(bal[1]);
    result.balanceAfterSantim = amt.amountSantim;
  }

  result.ok = !!(result.amountSantim && result.type);
  result.currency = "ETB";
  return result;
};
