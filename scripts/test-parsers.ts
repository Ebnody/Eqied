// Quick smoke test for SMS parsers.
// Run: npx tsx scripts/test-parsers.mjs
import { parseTransactionSms } from "../src/lib/telegram/parsers/index";

const cases = [
  {
    label: "CBE debit (real)",
    text: "Dear Customer, your account 01320xxxxxx8000 has been debited with ETB-1000.00. Commission 7.00 and VAT 1.05 applied on 2026-05-05 20:13:38. Current balance: ETB1499.78. For enquiries, please call 8980. Thank you.",
    expect: { provider: "cbe", type: "expense", amountSantim: 100000 },
  },
  {
    label: "CBE credit",
    text: "Dear customer, ETB 1,500.00 has been credited to your account ...1234. Available balance ETB 5,000.00.",
    expect: { provider: "cbe", type: "income", amountSantim: 150000 },
  },
  {
    label: "telebirr received",
    text: "You have received Br 1500.00 from ABEBE KEBEDE (251911234567) on your telebirr account. Transaction No. CH123ABC456. Your balance is Br 12,400.00.",
    expect: { provider: "telebirr", type: "income", amountSantim: 150000 },
  },
  {
    label: "Dashen sent",
    text: "Dashen Bank: ETB 320.00 sent to MEKDES T. Bal: 4,200.00",
    expect: { provider: "dashen", type: "expense", amountSantim: 32000 },
  },
];

let pass = 0;
let fail = 0;

for (const c of cases) {
  const r = parseTransactionSms(c.text);
  const ok =
    r.ok &&
    r.provider === c.expect.provider &&
    r.type === c.expect.type &&
    r.amountSantim === c.expect.amountSantim;
  if (ok) {
    pass++;
    console.log(`✓ ${c.label}`);
  } else {
    fail++;
    console.log(`✗ ${c.label}`);
    console.log(`  expected:`, c.expect);
    console.log(`  got:`, {
      ok: r.ok,
      provider: r.provider,
      type: r.type,
      amountSantim: r.amountSantim,
      reference: r.reference,
    });
  }
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
