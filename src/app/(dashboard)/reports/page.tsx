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

  const totalIncome = monthly.totalSalary + monthly.totalIncome;
  const savingsRate =
    totalIncome > 0
      ? Math.round(((totalIncome - monthly.totalExpense) / totalIncome) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t("reports.title")}</h1>
        <p className="text-sm text-slate-500">{t("reports.subtitle")}</p>
      </div>

      {/* Summary tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border bg-emerald-50 border-emerald-200 p-4">
          <div className="flex items-center justify-between text-xs text-emerald-700">
            <span>{t("reports.incomeMonth")}</span>
            <TrendingUp className="h-4 w-4" />
          </div>
          <p className="mt-1 text-xl font-semibold text-emerald-900">
            {formatETB(totalIncome)}
          </p>
        </div>
        <div className="rounded-xl border bg-rose-50 border-rose-200 p-4">
          <div className="flex items-center justify-between text-xs text-rose-700">
            <span>{t("reports.expensesMonth")}</span>
            <TrendingDown className="h-4 w-4" />
          </div>
          <p className="mt-1 text-xl font-semibold text-rose-900">
            {formatETB(monthly.totalExpense)}
          </p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-xs text-slate-600">{t("common.remaining")}</p>
          <p
            className={`mt-1 text-xl font-semibold ${
              monthly.remaining < 0 ? "text-rose-700" : "text-slate-900"
            }`}
          >
            {formatETB(monthly.remaining)}
          </p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-xs text-slate-600">{t("reports.savingsRate")}</p>
          <p
            className={`mt-1 text-xl font-semibold ${
              savingsRate < 0 ? "text-rose-700" : "text-emerald-700"
            }`}
          >
            {savingsRate}%
          </p>
        </div>
      </div>

      {/* Today */}
      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="flex items-end justify-between flex-wrap gap-2 mb-3">
          <div>
            <h2 className="font-semibold text-slate-900">{t("reports.today")}</h2>
            <p className="text-xs text-slate-500">
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
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4">
            <p className="text-xs text-emerald-700">{t("reports.incomeToday")}</p>
            <p className="mt-1 text-xl font-semibold text-emerald-900">
              {formatETB(daily.totalIncome)}
            </p>
          </div>
          <div className="rounded-lg bg-rose-50 border border-rose-200 p-4">
            <p className="text-xs text-rose-700">{t("reports.expensesToday")}</p>
            <p className="mt-1 text-xl font-semibold text-rose-900">
              {formatETB(daily.totalExpense)}
            </p>
          </div>
        </div>
      </div>

      {/* Top expense categories — bar chart */}
      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
          <h2 className="font-semibold text-slate-900">
            {t("reports.whereMoneyWent")} — {monthLabel(monthKey)}
          </h2>
          {biggest && (
            <span className="text-xs text-slate-500">
              {t("reports.biggest")}: {getCategoryEmoji(biggest.categoryKey)}{" "}
              {getCategoryName(biggest.categoryKey)} (
              {formatETB(biggest.expense)})
            </span>
          )}
        </div>
        <CategoryBarChart data={sorted} />
      </div>

      {/* Daily trend chart */}
      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-slate-900 mb-1">
          {t("reports.dailyFlow")} — {monthLabel(monthKey)}
        </h2>
        <p className="text-xs text-slate-500 mb-4">{t("reports.dailyFlowSub")}</p>
        <DailyTrendChart data={trend} />
      </div>

      {/* Month over month */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-900 mb-1">{t("reports.last6Months")}</h2>
          <p className="text-xs text-slate-500 mb-4">{t("reports.last6MonthsSub")}</p>
          <MonthOverMonthChart data={mom} />
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-900 mb-1">{t("reports.netTrend")}</h2>
          <p className="text-xs text-slate-500 mb-4">{t("reports.netTrendSub")}</p>
          <NetTrendLineChart data={mom} />
        </div>
      </div>

      {/* Planned vs Actual */}
      {plannedVsActual.length > 0 && (
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-900 mb-1">{t("reports.plannedVsActual")}</h2>
          <p className="text-xs text-slate-500 mb-4">{t("reports.plannedVsActualSub")}</p>
          <PlannedVsActualChart data={plannedVsActual} />
        </div>
      )}

      {/* Overspent alert */}
      {overspent.length > 0 && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-rose-700 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-rose-900">{t("reports.overspentTitle")}</p>
              <ul className="mt-2 text-sm space-y-1">
                {overspent.map((c) => {
                  const spent =
                    monthly.byCategory[c.categoryKey]?.expense ?? 0;
                  const over = spent - c.plannedAmount;
                  return (
                    <li key={c.id} className="text-rose-800">
                      {getCategoryEmoji(c.categoryKey)} {c.name}:{" "}
                      <strong>{formatETB(spent)}</strong> of{" "}
                      {formatETB(c.plannedAmount)}{" "}
                      <span className="text-rose-600">
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
      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-slate-900 mb-2">{t("reports.byCategory")}</h2>
        {sorted.length === 0 ? (
          <p className="text-sm text-slate-500">{t("reports.noTransactionsMonth")}</p>
        ) : (
          <ul className="divide-y">
            {sorted.map((s) => (
              <li
                key={s.key}
                className="py-2 flex items-center justify-between"
              >
                <span className="text-sm">
                  {getCategoryEmoji(s.key)} {getCategoryName(s.key)}
                </span>
                <span className="text-sm font-medium">
                  {s.expense > 0 && (
                    <span className="text-rose-700">
                      -{formatETB(s.expense)}
                    </span>
                  )}
                  {s.income > 0 && (
                    <span className="text-emerald-700 ml-2">
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
