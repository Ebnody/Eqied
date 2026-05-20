import {
  ParsedSms,
  SmsParser,
  extractAmount,
  extractReference,
} from "./types";

// Dashen Bank SMS pattern (illustrative):
//   "Dashen Bank: Acc XXXX credited ETB 1,000.00. Avail Bal: ETB 12,000.00"
//   "Dashen Bank: Acc XXXX debited ETB 200.00. Avail Bal: ETB 11,800.00"

export const dashenParser: SmsParser = (text: string): ParsedSms | null => {
  if (!/dashen\s*bank/i.test(text)) return null;

  const result: ParsedSms = {
    ok: false,
    provider: "dashen",
    parserName: "dashen-v1",
    currency: "ETB",
  };

  if (/credited|received\b/i.test(text)) result.type = "income";
  else if (/debited|\bsent\s+to\b|\bpaid\b|\btransfer(?:red)?\s+to\b/i.test(text))
    result.type = "expense";

  const { amountSantim, rawAmountText } = extractAmount(text);
  result.amountSantim = amountSantim;
  result.rawAmountText = rawAmountText;

  result.reference = extractReference(text);

  const bal = text.match(
    /(?:avail(?:able)?|current)?\s*bal(?:ance)?\s*[:.]?\s*(?:ETB|Birr)?\s*([\d,]+(?:\.\d{1,2})?)/i
  );
  if (bal) {
    result.balanceAfterSantim = (() => {
      const a = extractAmount(bal[0]);
      return a.amountSantim;
    })();
  }

  // Counterparty: "sent to NAME" / "received from NAME"
  const cp = text.match(/(?:sent\s+to|to|from|received\s+from)\s+([A-Z][A-Z .'-]{1,40}?)(?:[.,]|\s+(?:Bal|Ref|on)\b|$)/);
  if (cp) result.counterparty = cp[1].trim();

  result.ok = !!(result.amountSantim && result.type);
  return result;
};
