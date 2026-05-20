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

  // Counterparty for transfers: "To 1000713196348 (ZEMBA GAZEBO PLC)"
  const toMatch = text.match(/\bto\s+[\d\s]+\(([^)]+)\)/i);
  if (toMatch) {
    result.counterparty = toMatch[1].trim();
  } else {
    const fromMatch = text.match(/\bfrom\s+([A-Z][A-Za-z\s]+?)(?:\.|,|\s+with|\s+on\b)/i);
    if (fromMatch) result.counterparty = fromMatch[1].trim();
  }

  // Only successful if we extracted at least an amount
  result.ok = !!result.amountSantim;
  return result;
};
