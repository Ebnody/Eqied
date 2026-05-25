import { requireUser } from "@/lib/auth";
import {
  getMonthlySummary,
  getDailySummary,
  getDailyTrend,
  getMonthOverMonth,
} from "@/lib/queries";
import { formatETB, monthLabel, currentMonthKey } from "@/lib/utils";
import { getCategoryEmoji, getCategoryName } from "@/lib/categories";
import {
  CategoryBarChart,
  DailyTrendChart,
  MonthOverMonthChart,
  PlannedVsActualChart,
  NetTrendLineChart,
} from "@/components/dashboard/charts";
import { TrendingDown, TrendingUp, AlertTriangle } from "lucide-react";
import { getServerT } from "@/i18n/server";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const user = await requireUser();
  const { t } = await getServerT({ userPreferredLocale: user.preferredLocale });
  const monthKey = currentMonthKey();
  const [monthly, daily, trend, mom] = await Promise.all([
    getMonthlySummary(user.id, monthKey),
    getDailySummary(user.id),
    getDailyTrend(user.id, monthKey),
    getMonthOverMonth(user.id, 6),
  ]);

  const sorted = Object.entries(monthly.byCategory)
    .map(([key, v]) => ({ key, categoryKey: key, ...v }))
    .sort((a, b) => b.expense - a.expense);

  const biggest = sorted[0];
  const overspent =
    monthly.budget?.categories.filter((c) => {
      const spent = monthly.byCategory[c.categoryKey]?.expense ?? 0;
      return spent > c.plannedAmount && c.plannedAmount > 0;
    }) ?? [];

  const plannedVsActual =
    monthly.budget?.categories.map((c) => ({
      categoryKey: c.categoryKey,
      name: c.name,
      planned: c.plannedAmount,
      actual: monthly.byCategory[c.categoryKey]?.expense ?? 0,
    })) ?? [];

  const totalIncome = monthly.totalIncome;
  const savingsRate =
    totalIncome > 0
      ? Math.round(((totalIncome - monthly.totalExpense) / totalIncome) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">{t("reports.title")}</h1>
        <p className="text-sm text-[var(--muted)]">{t("reports.subtitle")}</p>
      </div>

      {/* Summary tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass rounded-2xl border border-emerald-500/20 p-4">
          <div className="flex items-center justify-between text-xs text-emerald-300">
            <span>{t("reports.incomeMonth")}</span>
            <TrendingUp className="h-4 w-4" />
          </div>
          <p className="mt-1 text-xl font-semibold text-[var(--foreground)]">
            {formatETB(totalIncome)}
          </p>
        </div>
        <div className="glass rounded-2xl border border-rose-500/20 p-4">
          <div className="flex items-center justify-between text-xs text-rose-300">
            <span>{t("reports.expensesMonth")}</span>
            <TrendingDown className="h-4 w-4" />
          </div>
          <p className="mt-1 text-xl font-semibold text-[var(--foreground)]">
            {formatETB(monthly.totalExpense)}
          </p>
        </div>
        <div className="glass rounded-2xl border border-[var(--glass-border)] p-4">
          <p className="text-xs text-[var(--muted)]">{t("common.remaining")}</p>
          <p
            className={`mt-1 text-xl font-semibold ${
              monthly.remaining < 0 ? "text-rose-400" : "text-[var(--foreground)]"
            }`}
          >
            {formatETB(monthly.remaining)}
          </p>
        </div>
        <div className="glass rounded-2xl border border-[var(--glass-border)] p-4">
          <p className="text-xs text-[var(--muted)]">{t("reports.savingsRate")}</p>
          <p
            className={`mt-1 text-xl font-semibold ${
              savingsRate < 0 ? "text-rose-400" : "text-emerald-400"
            }`}
          >
            {savingsRate}%
          </p>
        </div>
      </div>

      {/* Today */}
      <div className="glass rounded-2xl border border-[var(--glass-border)] p-5">
        <div className="flex items-end justify-between flex-wrap gap-2 mb-3">
          <div>
            <h2 className="font-semibold text-[var(--foreground)]">{t("reports.today")}</h2>
            <p className="text-xs text-[var(--muted-foreground)]">
              {daily.date.toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4">
            <p className="text-xs text-emerald-300">{t("reports.incomeToday")}</p>
            <p className="mt-1 text-xl font-semibold text-[var(--foreground)]">
              {formatETB(daily.totalIncome)}
            </p>
          </div>
          <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-4">
            <p className="text-xs text-rose-300">{t("reports.expensesToday")}</p>
            <p className="mt-1 text-xl font-semibold text-[var(--foreground)]">
              {formatETB(daily.totalExpense)}
            </p>
          </div>
        </div>
      </div>

      {/* Top expense categories — bar chart */}
      <div className="glass rounded-2xl border border-[var(--glass-border)] p-5">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
          <h2 className="font-semibold text-[var(--foreground)]">
            {t("reports.whereMoneyWent")} — {monthLabel(monthKey)}
          </h2>
          {biggest && (
            <span className="text-xs text-[var(--muted-foreground)]">
              {t("reports.biggest")}: {getCategoryEmoji(biggest.categoryKey)}{" "}
              {getCategoryName(biggest.categoryKey)} (
              {formatETB(biggest.expense)})
            </span>
          )}
        </div>
        <CategoryBarChart data={sorted} />
      </div>

      {/* Daily trend chart */}
      <div className="glass rounded-2xl border border-white/10 p-5">
        <h2 className="font-semibold text-slate-100 mb-1">
          {t("reports.dailyFlow")} — {monthLabel(monthKey)}
        </h2>
        <p className="text-xs text-slate-500 mb-4">{t("reports.dailyFlowSub")}</p>
        <DailyTrendChart data={trend} />
      </div>

      {/* Month over month — bento grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass rounded-2xl border border-[var(--glass-border)] p-5">
          <h2 className="font-semibold text-[var(--foreground)] mb-1">{t("reports.last6Months")}</h2>
          <p className="text-xs text-[var(--muted-foreground)] mb-4">{t("reports.last6MonthsSub")}</p>
          <MonthOverMonthChart data={mom} />
        </div>

        <div className="glass rounded-2xl border border-[var(--glass-border)] p-5">
          <h2 className="font-semibold text-[var(--foreground)] mb-1">{t("reports.netTrend")}</h2>
          <p className="text-xs text-[var(--muted-foreground)] mb-4">{t("reports.netTrendSub")}</p>
          <NetTrendLineChart data={mom} />
        </div>
      </div>

      {/* Planned vs Actual */}
      {plannedVsActual.length > 0 && (
        <div className="glass rounded-2xl border border-[var(--glass-border)] p-5">
          <h2 className="font-semibold text-[var(--foreground)] mb-1">{t("reports.plannedVsActual")}</h2>
          <p className="text-xs text-[var(--muted-foreground)] mb-4">{t("reports.plannedVsActualSub")}</p>
          <PlannedVsActualChart data={plannedVsActual} />
        </div>
      )}

      {/* Overspent alert */}
      {overspent.length > 0 && (
        <div className="glass rounded-2xl border border-rose-500/20 p-5">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl gradient-expense">
              <AlertTriangle className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-rose-300">{t("reports.overspentTitle")}</p>
              <ul className="mt-2 text-sm space-y-1">
                {overspent.map((c) => {
                  const spent =
                    monthly.byCategory[c.categoryKey]?.expense ?? 0;
                  const over = spent - c.plannedAmount;
                  return (
                    <li key={c.id} className="text-rose-400">
                      {getCategoryEmoji(c.categoryKey)} {c.name}:{" "}
                      <strong className="text-white">{formatETB(spent)}</strong> of{" "}
                      {formatETB(c.plannedAmount)}{" "}
                      <span className="text-rose-300">
                        (+{formatETB(over)})
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Detailed list */}
      <div className="glass rounded-2xl border border-[var(--glass-border)] p-5">
        <h2 className="font-semibold text-[var(--foreground)] mb-2">{t("reports.byCategory")}</h2>
        {sorted.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)]">{t("reports.noTransactionsMonth")}</p>
        ) : (
          <ul className="divide-y divide-[var(--glass-border)]">
            {sorted.map((s) => (
              <li
                key={s.key}
                className="py-2.5 flex items-center justify-between"
              >
                <span className="text-sm text-[var(--muted)]">
                  {getCategoryEmoji(s.key)} {getCategoryName(s.key)}
                </span>
                <span className="text-sm font-medium">
                  {s.expense > 0 && (
                    <span className="text-rose-400">
                      -{formatETB(s.expense)}
                    </span>
                  )}
                  {s.income > 0 && (
                    <span className="text-emerald-400 ml-2">
                      +{formatETB(s.income)}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
