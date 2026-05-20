import { prisma } from "./prisma";
import { currentMonthKey } from "./utils";

function monthBounds(monthKey: string): { start: Date; end: Date } {
  const [y, m] = monthKey.split("-").map(Number);
  return {
    start: new Date(y, m - 1, 1, 0, 0, 0, 0),
    end: new Date(y, m, 1, 0, 0, 0, 0),
  };
}

export async function getMonthlySummary(
  userId: string,
  monthKey: string = currentMonthKey()
) {
  const { start, end } = monthBounds(monthKey);

  const [salary, txns, budget] = await Promise.all([
    prisma.monthlySalary.findUnique({
      where: { userId_month: { userId, month: monthKey } },
    }),
    prisma.transaction.findMany({
      where: {
        userId,
        occurredAt: { gte: start, lt: end },
        status: { in: ["categorized", "uncategorized"] },
      },
      orderBy: { occurredAt: "desc" },
    }),
    prisma.budget.findUnique({
      where: { userId_month: { userId, month: monthKey } },
      include: { categories: { orderBy: { sortOrder: "asc" } } },
    }),
  ]);

  let totalIncome = 0;
  let totalExpense = 0;
  let uncategorizedCount = 0;
  const byCategory: Record<string, { income: number; expense: number }> = {};

  for (const t of txns) {
    if (t.status === "uncategorized") uncategorizedCount++;
    if (t.type === "income") totalIncome += t.amount;
    else totalExpense += t.amount;

    if (t.categoryKey && t.status === "categorized") {
      const c = (byCategory[t.categoryKey] ??= { income: 0, expense: 0 });
      if (t.type === "income") c.income += t.amount;
      else c.expense += t.amount;
    }
  }

  const budgetAmount = salary?.amount ?? 0;
  const remaining = totalIncome - totalExpense;

  return {
    monthKey,
    salary,
    budget,
    totalIncome,
    totalExpense,
    totalSalary: budgetAmount,
    remaining,
    uncategorizedCount,
    byCategory,
    transactions: txns,
  };
}

export async function getRecentTransactions(userId: string, limit = 10) {
  return prisma.transaction.findMany({
    where: { userId },
    orderBy: { occurredAt: "desc" },
    take: limit,
  });
}

export async function getDailyTrend(
  userId: string,
  monthKey: string = currentMonthKey()
) {
  const { start, end } = monthBounds(monthKey);
  const txns = await prisma.transaction.findMany({
    where: {
      userId,
      occurredAt: { gte: start, lt: end },
      status: { in: ["categorized", "uncategorized"] },
    },
    select: { type: true, amount: true, occurredAt: true },
  });

  // Build a map keyed by day-of-month
  const days: Record<string, { income: number; expense: number }> = {};
  const lastDay = new Date(end.getTime() - 1).getDate();
  for (let d = 1; d <= lastDay; d++) {
    const k = String(d).padStart(2, "0");
    days[k] = { income: 0, expense: 0 };
  }
  for (const t of txns) {
    const k = String(new Date(t.occurredAt).getDate()).padStart(2, "0");
    if (!days[k]) days[k] = { income: 0, expense: 0 };
    if (t.type === "income") days[k].income += t.amount;
    else days[k].expense += t.amount;
  }
  return Object.entries(days)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, v]) => ({ day, ...v }));
}

export async function getMonthOverMonth(userId: string, months = 6) {
  const now = new Date();
  const buckets: { monthKey: string; label: string; income: number; expense: number }[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-US", { month: "short" });
    const start = d;
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    const txns = await prisma.transaction.findMany({
      where: {
        userId,
        occurredAt: { gte: start, lt: end },
        status: { in: ["categorized", "uncategorized"] },
      },
      select: { type: true, amount: true },
    });
    let income = 0,
      expense = 0;
    for (const t of txns) {
      if (t.type === "income") income += t.amount;
      else expense += t.amount;
    }
    buckets.push({ monthKey, label, income, expense });
  }
  return buckets;
}

export async function getDailySummary(userId: string, date: Date = new Date()) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const txns = await prisma.transaction.findMany({
    where: {
      userId,
      occurredAt: { gte: start, lt: end },
      status: "categorized",
    },
    orderBy: { occurredAt: "desc" },
  });

  let totalIncome = 0;
  let totalExpense = 0;
  for (const t of txns) {
    if (t.type === "income") totalIncome += t.amount;
    else totalExpense += t.amount;
  }

  return {
    date: start,
    totalIncome,
    totalExpense,
    transactions: txns,
  };
}
