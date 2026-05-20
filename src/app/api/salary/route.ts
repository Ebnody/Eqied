import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { ensureBudgetForMonth } from "@/lib/budget";
import { currentMonthKey, toSantim } from "@/lib/utils";

const schema = z.object({
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/)
    .optional(),
  amountEtb: z.number().positive().max(10_000_000),
  source: z.string().max(60).default("salary"),
  receivedAt: z.string().datetime().optional(),
  isReceived: z.boolean().default(false),
  notes: z.string().max(500).optional(),
  generateBudget: z.boolean().default(true),
});

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation" }, { status: 400 });
  }

  const data = parsed.data;
  const month = data.month ?? currentMonthKey();
  const amount = toSantim(data.amountEtb);

  const salary = await prisma.monthlySalary.upsert({
    where: { userId_month: { userId: user.id, month } },
    create: {
      userId: user.id,
      month,
      amount,
      source: data.source,
      isReceived: data.isReceived,
      receivedAt: data.receivedAt ? new Date(data.receivedAt) : null,
      notes: data.notes,
    },
    update: {
      amount,
      source: data.source,
      isReceived: data.isReceived,
      receivedAt: data.receivedAt ? new Date(data.receivedAt) : null,
      notes: data.notes,
    },
  });

  let budget = null;
  if (data.generateBudget) {
    // Delete existing budget so we regenerate fresh from the new salary.
    // (Cascading delete removes BudgetCategory rows automatically.)
    await prisma.budget.deleteMany({
      where: { userId: user.id, month },
    });
    budget = await ensureBudgetForMonth(user.id, month, amount);
  }

  return NextResponse.json({ ok: true, salary, budget });
}

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const month = req.nextUrl.searchParams.get("month") ?? currentMonthKey();
  const salary = await prisma.monthlySalary.findUnique({
    where: { userId_month: { userId: user.id, month } },
  });
  return NextResponse.json({ salary });
}
