import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { toSantim } from "@/lib/utils";

const createSchema = z.object({
  type: z.enum(["income", "expense"]),
  amountEtb: z.number().positive().max(10_000_000),
  categoryKey: z.string().min(1),
  paymentMethod: z.string().optional(),
  counterparty: z.string().max(120).optional(),
  reference: z.string().max(120).optional(),
  occurredAt: z.string().datetime().optional(),
  notes: z.string().max(500).optional(),
});

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const status = sp.get("status"); // "uncategorized" | "categorized" | etc
  const type = sp.get("type"); // "income" | "expense"
  const limit = Math.min(Number(sp.get("limit") ?? 50), 200);
  const month = sp.get("month"); // "YYYY-MM"

  const where: Record<string, unknown> = { userId: user.id };
  if (status) where.status = status;
  if (type) where.type = type;
  if (month) {
    const [y, m] = month.split("-").map(Number);
    where.occurredAt = {
      gte: new Date(y, m - 1, 1),
      lt: new Date(y, m, 1),
    };
  }

  const transactions = await prisma.transaction.findMany({
    where,
    orderBy: { occurredAt: "desc" },
    take: limit,
  });

  return NextResponse.json({ transactions });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "validation" }, { status: 400 });

  const d = parsed.data;
  const txn = await prisma.transaction.create({
    data: {
      userId: user.id,
      type: d.type,
      amount: toSantim(d.amountEtb),
      categoryKey: d.categoryKey,
      status: "categorized",
      source: "manual",
      paymentMethod: d.paymentMethod ?? null,
      counterparty: d.counterparty ?? null,
      reference: d.reference ?? null,
      occurredAt: d.occurredAt ? new Date(d.occurredAt) : new Date(),
      notes: d.notes ?? null,
    },
  });

  return NextResponse.json({ ok: true, transaction: txn });
}
