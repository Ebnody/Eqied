import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resolveMiniAppUser } from "@/lib/telegram/webapp-auth";
import { parseTransactionSms } from "@/lib/telegram/parsers";

const schema = z.object({
  initData: z.string().min(10),
  text: z.string().min(3).max(2000),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation" }, { status: 400 });
  }

  const auth = await resolveMiniAppUser(parsed.data.initData);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.reason }, { status: 401 });
  }

  const result = parseTransactionSms(parsed.data.text);

  return NextResponse.json({
    ok: result.ok,
    provider: result.provider,
    type: result.type ?? null,
    amountSantim: result.amountSantim ?? null,
    counterparty: result.counterparty ?? null,
    reference: result.reference ?? null,
    occurredAt: result.occurredAt ?? null,
  });
}
