import {
  ParsedSms,
  SmsParser,
  extractAmount,
  extractReference,
} from "./types";

// Best-effort fallback parser. Used when no provider matches.

export const genericParser: SmsParser = (text: string): ParsedSms | null => {
  const result: ParsedSms = {
    ok: false,
    provider: "generic",
    parserName: "generic-v1",
    currency: "ETB",
  };

  if (/(received|credited|deposit|incoming)/i.test(text)) result.type = "income";
  else if (/(sent|paid|transferred|debited|withdrawn|outgoing|purchase)/i.test(text))
    result.type = "expense";

  const { amountSantim, rawAmountText } = extractAmount(text);
  result.amountSantim = amountSantim;
  result.rawAmountText = rawAmountText;

  result.reference = extractReference(text);

  // Only successful if we extracted at least an amount
  result.ok = !!result.amountSantim;
  return result;
};
