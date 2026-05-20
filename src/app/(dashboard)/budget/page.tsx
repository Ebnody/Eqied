import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { currentMonthKey, monthLabel } from "@/lib/utils";
import { getMonthlySummary } from "@/lib/queries";
import { SalaryForm } from "./salary-form";
import { BudgetPlanCard } from "./budget-plan-card";
import { MonthNavigator } from "./month-navigator";
import { getServerT } from "@/i18n/server";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ month?: string }>;
}

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

export default async function BudgetPage({ searchParams }: PageProps) {
  const user = await requireUser();
  const { t } = await getServerT({ userPreferredLocale: user.preferredLocale });

  const params = await searchParams;
  const requested = params.month;
  const monthKey =
    requested && MONTH_RE.test(requested) ? requested : currentMonthKey();
  const isPast = monthKey < currentMonthKey();

  const [salary, budget, summary, savedMonths] = await Promise.all([
    prisma.monthlySalary.findUnique({
      where: { userId_month: { userId: user.id, month: monthKey } },
    }),
    prisma.budget.findUnique({
      where: { userId_month: { userId: user.id, month: monthKey } },
      include: { categories: { orderBy: { sortOrder: "asc" } } },
    }),
    getMonthlySummary(user.id, monthKey),
    // Distinct list of months that have either a saved budget or a salary entry.
    Promise.all([
      prisma.budget.findMany({
        where: { userId: user.id },
        select: { month: true },
      }),
      prisma.monthlySalary.findMany({
        where: { userId: user.id },
        select: { month: true },
      }),
    ]).then(([b, s]) => {
      const set = new Set<string>([
        ...b.map((x) => x.month),
        ...s.map((x) => x.month),
      ]);
      return Array.from(set).sort().reverse();
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t("budget.title")}</h1>
        <p className="text-sm text-slate-500">
          {monthLabel(monthKey)}
          {isPast && (
            <span className="ml-2 text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-xs">
              Viewing past month
            </span>
          )}
        </p>
      </div>

      <MonthNavigator currentMonth={monthKey} savedMonths={savedMonths} />

      <SalaryForm
        month={monthKey}
        initialAmountEtb={salary ? salary.amount / 100 : undefined}
        initialIsReceived={salary?.isReceived ?? false}
      />

      {budget && (
        <BudgetPlanCard
          month={monthKey}
          categories={budget.categories}
          totalPlanned={budget.totalPlanned}
          summaryByCategory={summary.byCategory}
        />
      )}

      {!budget && !salary && (
        <div className="rounded-xl border border-dashed bg-slate-50 p-6 text-center text-sm text-slate-600">
          No budget or salary recorded for {monthLabel(monthKey)}. Enter a
          monthly amount above to create one.
        </div>
      )}
    </div>
  );
}
