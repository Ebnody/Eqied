import {
  ParsedSms,
  SmsParser,
  extractAmount,
  extractReference,
  extractDate,
  toSantimFromString,
} from "./types";

// Commercial Bank of Ethiopia (CBE) SMS examples:
//   "Dear Customer, your account 01320xxxxxx8000 has been debited with ETB-1000.00.
//    Commission 7.00 and VAT 1.05 applied on 2026-05-05 20:13:38. Current balance:
//    ETB1499.78. For enquiries, please call 8980. Thank you."
//   "Dear customer, ETB 1,500.00 has been credited to your account ...XXXX.
//    Available balance ETB 5,000.00."

export const cbeParser: SmsParser = (text: string): ParsedSms | null => {
  const looksLikeCbe =
    /commercial\s+bank|CBE\b|combanketh/i.test(text) ||
    /\bcall\s*8980\b/i.test(text) || // CBE customer care number
    (/dear\s+customer/i.test(text) &&
      /(credited|debited)\s+(?:to|from|with)\b/i.test(text));

  if (!looksLikeCbe) return null;

  const result: ParsedSms = {
    ok: false,
    provider: "cbe",
    parserName: "cbe-v2",
    currency: "ETB",
  };

  if (/credited/i.test(text)) result.type = "income";
  else if (/debited|withdrawn|transferred|purchased/i.test(text)) result.type = "expense";

  const { amountSantim, rawAmountText } = extractAmount(text);
  result.amountSantim = amountSantim;
  result.rawAmountText = rawAmountText;

  result.reference = extractReference(text);
  result.occurredAt = extractDate(text);

  // Counterparty for transfers: "To 1000713196348 (ZEMBA GAZEBO PLC)"
  const toMatch = text.match(/\bto\s+[\d\s]+\(([^)]+)\)/i);
  if (toMatch) {
    result.counterparty = toMatch[1].trim();
  } else {
    const fromMatch = text.match(/\bfrom\s+([A-Z][A-Za-z\s]+?)(?:\.|,|\s+with|\s+on\b)/i);
    if (fromMatch) result.counterparty = fromMatch[1].trim();
  }

  // Account number (last 4 digits, used as a hint of the account)
  const acct = text.match(/account\s+([\dx*]+)/i);
  if (acct) {
    const last = acct[1].slice(-4);
    if (/^\d{4}$/.test(last)) result.notes = `Account ending ${last}`;
  }

  // Balance line: "Current balance: ETB1499.78" or "Available balance ETB 5,000.00"
  const bal = text.match(
    /(?:available|current)\s+balance\s*[:.]?\s*(?:ETB|Birr)?\s*-?\s*([\d,]+(?:\.\d{1,2})?)/i
  );
  if (bal) {
    result.balanceAfterSantim = toSantimFromString(bal[1]);
  }

  result.ok = !!(result.amountSantim && result.type);
  return result;
};
