import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resolveMiniAppUserWithFallback } from "@/lib/telegram/webapp-auth";
import { parseTransactionSms } from "@/lib/telegram/parsers";
import { prisma } from "@/lib/prisma";
import { toSantim } from "@/lib/utils";

const schema = z.object({
  initData: z.string().optional(),
  text: z.string().max(2000).optional(),
  // optional manual overrides if parser gets it wrong
  type: z.enum(["income", "expense"]).optional(),
  amountEtb: z.number().positive().max(10_000_000).optional(),
  categoryKey: z.string().min(1),
  counterparty: z.string().max(120).optional(),
  notes: z.string().max(500).optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation" }, { status: 400 });
  }

  const fallbackToken = req.headers.get("x-ethiobudget-token");
  const auth = await resolveMiniAppUserWithFallback(parsed.data.initData, fallbackToken);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.reason }, { status: 401 });
  }

  const userId = auth.user.id;
  const d = parsed.data;

  // Try to parse SMS for additional fields (provider, reference, balance, date)
  const parsedSms = d.text ? parseTransactionSms(d.text) : null;

  const finalType = d.type ?? parsedSms?.type;
  const finalAmount =
    d.amountEtb !== undefined
      ? toSantim(d.amountEtb)
      : parsedSms?.amountSantim;

  if (!finalType || !finalAmount) {
    return NextResponse.json(
      { error: "missing_amount_or_type" },
      { status: 400 }
    );
  }

  // Save the forwarded SMS (if provided) for audit
  let smsId: string | null = null;
  if (d.text) {
    const sms = await prisma.forwardedSms.create({
      data: {
        userId,
        rawText: d.text,
        provider: parsedSms?.provider ?? "miniapp",
        parsedOk: !!parsedSms?.ok,
        parsedData: parsedSms ? JSON.stringify(parsedSms) : null,
        parserName: parsedSms?.parserName ?? "miniapp-manual",
      },
    });
    smsId = sms.id;
  }

  // Duplicate check by reference
  if (parsedSms?.reference) {
    const dup = await prisma.transaction.findFirst({
      where: {
        userId,
        reference: parsedSms.reference,
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    });
    if (dup) {
      return NextResponse.json(
        { error: "duplicate", transactionId: dup.id },
        { status: 409 }
      );
    }
  }

  const txn = await prisma.transaction.create({
    data: {
      userId,
      type: finalType,
      amount: finalAmount,
      categoryKey: d.categoryKey,
      status: "categorized",
      source: "miniapp",
      paymentMethod:
        parsedSms?.provider === "telebirr" ? "telebirr" : null,
      provider: parsedSms?.provider ?? null,
      counterparty: d.counterparty ?? parsedSms?.counterparty ?? null,
      counterpartyPhone: parsedSms?.counterpartyPhone ?? null,
      reference: parsedSms?.reference ?? null,
      balanceAfter: parsedSms?.balanceAfterSantim ?? null,
      occurredAt: parsedSms?.occurredAt ?? new Date(),
      notes: d.notes ?? null,
      forwardedSmsId: smsId,
    },
  });

  return NextResponse.json({ ok: true, transaction: txn });
}
