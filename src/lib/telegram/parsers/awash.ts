import {
  ParsedSms,
  SmsParser,
  extractAmount,
  extractReference,
} from "./types";

// Awash Bank SMS pattern (illustrative):
//   "Awash Bank: Your acc XXXX has been credited with ETB 2,000.00. Bal ETB 10,000.00. Ref: 12345"
//   "Awash Bank: Your acc XXXX has been debited with ETB 300.00. Bal ETB 9,700.00."

export const awashParser: SmsParser = (text: string): ParsedSms | null => {
  if (!/awash\s*bank/i.test(text)) return null;

  const result: ParsedSms = {
    ok: false,
    provider: "awash",
    parserName: "awash-v1",
    currency: "ETB",
  };

  if (/credited/i.test(text)) result.type = "income";
  else if (/debited/i.test(text)) result.type = "expense";

  const { amountSantim, rawAmountText } = extractAmount(text);
  result.amountSantim = amountSantim;
  result.rawAmountText = rawAmountText;

  result.reference = extractReference(text);

  const bal = text.match(
    /\bbal(?:ance)?\b\s*[:.]?\s*(?:ETB|Birr)?\s*([\d,]+(?:\.\d{1,2})?)/i
  );
  if (bal) {
    const a = extractAmount(bal[1]);
    result.balanceAfterSantim = a.amountSantim;
  }

  result.ok = !!(result.amountSantim && result.type);
  return result;
};
