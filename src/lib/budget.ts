import { prisma } from "./prisma";
import { EXPENSE_CATEGORIES } from "./categories";

export interface BudgetCategoryPlan {
  categoryKey: string;
  name: string;
  plannedPercent: number;
  plannedAmount: number; // santim
}

/**
 * Generate a default monthly budget plan based on Ethiopian middle-class lifestyle.
 * Takes monthly salary in santim and returns a list of planned categories.
 */
export function generateDefaultBudgetPlan(
  monthlySalarySantim: number
): BudgetCategoryPlan[] {
  return EXPENSE_CATEGORIES.filter(
    (c) => (c.defaultPercent ?? 0) > 0
  ).map((c) => ({
    categoryKey: c.key,
    name: c.name,
    plannedPercent: c.defaultPercent ?? 0,
    plannedAmount: Math.round(
      (monthlySalarySantim * (c.defaultPercent ?? 0)) / 100
    ),
  }));
}

/**
 * Create or update the user's monthly budget for the given month using default percentages.
 */
export async function ensureBudgetForMonth(
  userId: string,
  monthKey: string,
  monthlySalarySantim: number
) {
  const plan = generateDefaultBudgetPlan(monthlySalarySantim);
  const total = plan.reduce((sum, p) => sum + p.plannedAmount, 0);

  const existing = await prisma.budget.findUnique({
    where: { userId_month: { userId, month: monthKey } },
  });

  if (existing) {
    return existing;
  }

  return prisma.budget.create({
    data: {
      userId,
      month: monthKey,
      totalPlanned: total,
      categories: {
        create: plan.map((p, idx) => ({
          categoryKey: p.categoryKey,
          name: p.name,
          plannedPercent: p.plannedPercent,
          plannedAmount: p.plannedAmount,
          sortOrder: idx,
        })),
      },
    },
    include: { categories: { orderBy: { sortOrder: "asc" } } },
  });
}
