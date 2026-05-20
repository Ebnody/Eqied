import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { currentMonthKey, toSantim } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const month = req.nextUrl.searchParams.get("month") ?? currentMonthKey();
  const budget = await prisma.budget.findUnique({
    where: { userId_month: { userId: user.id, month } },
    include: { categories: { orderBy: { sortOrder: "asc" } } },
  });
  return NextResponse.json({ budget });
}

const updateSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  categories: z.array(
    z.object({
      categoryKey: z.string().min(1),
      name: z.string().min(1),
      plannedAmountEtb: z.number().min(0).max(10_000_000),
      plannedPercent: z.number().min(0).max(100),
    })
  ),
});

export async function PUT(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "validation" }, { status: 400 });

  const month = parsed.data.month ?? currentMonthKey();
  const cats = parsed.data.categories;
  const total = cats.reduce(
    (sum, c) => sum + toSantim(c.plannedAmountEtb),
    0
  );

  const budget = await prisma.budget.upsert({
    where: { userId_month: { userId: user.id, month } },
    create: {
      userId: user.id,
      month,
      totalPlanned: total,
      categories: {
        create: cats.map((c, idx) => ({
          categoryKey: c.categoryKey,
          name: c.name,
          plannedAmount: toSantim(c.plannedAmountEtb),
          plannedPercent: c.plannedPercent,
          sortOrder: idx,
        })),
      },
    },
    update: { totalPlanned: total },
    include: { categories: true },
  });

  // Replace categories
  await prisma.budgetCategory.deleteMany({ where: { budgetId: budget.id } });
  await prisma.budgetCategory.createMany({
    data: cats.map((c, idx) => ({
      budgetId: budget.id,
      categoryKey: c.categoryKey,
      name: c.name,
      plannedAmount: toSantim(c.plannedAmountEtb),
      plannedPercent: c.plannedPercent,
      sortOrder: idx,
    })),
  });

  const updated = await prisma.budget.findUnique({
    where: { id: budget.id },
    include: { categories: { orderBy: { sortOrder: "asc" } } },
  });

  return NextResponse.json({ ok: true, budget: updated });
}
