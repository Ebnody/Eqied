import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  AlertCircle,
  Inbox,
  ArrowRight,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import {
  getMonthlySummary,
  getRecentTransactions,
} from "@/lib/queries";
import { formatETB, monthLabel, currentMonthKey } from "@/lib/utils";
import { getCategoryEmoji, getCategoryName, INCOME_CATEGORIES } from "@/lib/categories";
import { StatsCard } from "@/components/dashboard/stats-card";
import { SpendingChart } from "@/components/dashboard/spending-chart";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getServerT } from "@/i18n/server";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  const { t } = await getServerT({ userPreferredLocale: user.preferredLocale });
  const monthKey = currentMonthKey();
  const [summary, recent] = await Promise.all([
    getMonthlySummary(user.id, monthKey),
    getRecentTransactions(user.id, 8),
  ]);

  const noSalary = !summary.salary;

  const categoryRows = Object.entries(summary.byCategory).map(
    ([key, v]) => ({
      categoryKey: key,
      ...v,
    })
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {user.fullName?.split(" ")[0]
              ? `👋 ${user.fullName.split(" ")[0]}`
              : t("dashboard.title")}
          </h1>
          <p className="text-sm text-slate-500">
            {t("dashboard.overview")} — {monthLabel(monthKey)}
          </p>
        </div>
      </div>

      {noSalary && (
        <div className="rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50 p-5">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-emerald-700 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-emerald-900">
                {t("dashboard.setSalaryHint")}
              </p>
              <Button asChild className="mt-3" size="sm">
                <Link href="/budget">
                  {t("budget.setSalary")} <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}

      {summary.uncategorizedCount > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Inbox className="h-5 w-5 text-amber-700" />
            <div>
              <p className="font-medium text-amber-900">
                {summary.uncategorizedCount} — {t("dashboard.uncategorized")}
              </p>
            </div>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link href="/transactions">{t("common.next")}</Link>
          </Button>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard
          label="Budget"
          value={formatETB(summary.totalSalary)}
          hint={summary.salary?.isReceived ? t("budget.received") : t("budget.notReceived")}
          icon={<Wallet className="h-4 w-4" />}
        />
        <StatsCard
          label={t("common.income")}
          value={formatETB(summary.totalIncome)}
          tone="income"
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <StatsCard
          label={t("common.expense")}
          value={formatETB(summary.totalExpense)}
          tone="expense"
          icon={<TrendingDown className="h-4 w-4" />}
        />
        <StatsCard
          label={t("common.remaining")}
          value={formatETB(summary.remaining)}
          tone={summary.remaining < 0 ? "warning" : "default"}
          hint={summary.remaining < 0 ? t("budget.overspent") : t("common.thisMonth")}
        />
      </div>

      {INCOME_CATEGORIES.some(
        (c) => (summary.byCategory[c.key]?.income ?? 0) > 0
      ) && (
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-slate-600">Income by Source</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {INCOME_CATEGORIES.map((cat) => {
              const amount = summary.byCategory[cat.key]?.income ?? 0;
              if (amount <= 0) return null;
              return (
                <StatsCard
                  key={cat.key}
                  label={cat.name}
                  value={formatETB(amount)}
                  tone="income"
                  icon={<span className="text-lg">{cat.emoji}</span>}
                />
              );
            })}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-900 mb-4">
            {t("dashboard.spendingByCategory")}
          </h2>
          <SpendingChart data={categoryRows} />
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">
              {t("dashboard.recent")}
            </h2>
            <Link
              href="/transactions"
              className="text-xs text-emerald-700 hover:underline"
            >
              {t("transactions.title")}
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">
              {t("dashboard.noTransactions")}
            </p>
          ) : (
            <ul className="divide-y">
              {recent.map((txn) => (
                <li
                  key={txn.id}
                  className="py-2.5 flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xl" aria-hidden>
                      {getCategoryEmoji(txn.categoryKey)}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {txn.categoryKey
                          ? getCategoryName(txn.categoryKey)
                          : txn.counterparty || t("dashboard.uncategorized")}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {new Date(txn.occurredAt).toLocaleDateString()}{" "}
                        {txn.source === "telegram" && (
                          <Badge variant="secondary" className="ml-1">
                            telegram
                          </Badge>
                        )}
                      </p>
                    </div>
                  </div>
                  <span
                    className={
                      txn.type === "income"
                        ? "text-sm font-medium text-emerald-700 whitespace-nowrap"
                        : "text-sm font-medium text-rose-700 whitespace-nowrap"
                    }
                  >
                    {txn.type === "income" ? "+" : "-"}
                    {formatETB(txn.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
