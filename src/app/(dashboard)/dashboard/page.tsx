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
          <h1 className="text-2xl font-bold text-white">
            {user.fullName?.split(" ")[0]
              ? `👋 ${user.fullName.split(" ")[0]}`
              : t("dashboard.title")}
          </h1>
          <p className="text-sm text-slate-400">
            {t("dashboard.overview")} — {monthLabel(monthKey)}
          </p>
        </div>
      </div>

      {/* Alerts Row */}
      {(noSalary || summary.uncategorizedCount > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {noSalary && (
            <div className="glass rounded-2xl border border-emerald-500/20 p-5">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl gradient-income">
                  <AlertCircle className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-200">
                    {t("dashboard.setSalaryHint")}
                  </p>
                  <Button asChild className="mt-3 rounded-xl" size="sm">
                    <Link href="/budget">
                      {t("budget.setSalary")} <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {summary.uncategorizedCount > 0 && (
            <div className="glass rounded-2xl border border-amber-500/20 p-5 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl gradient-warning">
                  <Inbox className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="font-medium text-slate-200">
                    {summary.uncategorizedCount} — {t("dashboard.uncategorized")}
                  </p>
                </div>
              </div>
              <Button asChild size="sm" variant="outline" className="rounded-xl border-white/10 hover:bg-white/5">
                <Link href="/transactions">{t("common.next")}</Link>
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard
          label="Budget"
          value={formatETB(summary.totalSalary)}
          hint={summary.salary?.isReceived ? t("budget.received") : t("budget.notReceived")}
          icon={<Wallet className="h-4 w-4 text-slate-300" />}
        />
        <StatsCard
          label={t("common.income")}
          value={formatETB(summary.totalIncome)}
          tone="income"
          icon={<TrendingUp className="h-4 w-4 text-emerald-300" />}
        />
        <StatsCard
          label={t("common.expense")}
          value={formatETB(summary.totalExpense)}
          tone="expense"
          icon={<TrendingDown className="h-4 w-4 text-rose-300" />}
        />
        <StatsCard
          label={t("common.remaining")}
          value={formatETB(summary.remaining)}
          tone={summary.remaining < 0 ? "warning" : "default"}
          hint={summary.remaining < 0 ? t("budget.overspent") : t("common.thisMonth")}
        />
      </div>

      {/* Income by Source Row */}
      {INCOME_CATEGORIES.some(
        (c) => (summary.byCategory[c.key]?.income ?? 0) > 0
      ) && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-slate-400">Income by Source</h2>
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

      {/* Bento Grid: Chart + Transactions */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Chart — spans 3 cols on large screens */}
        <div className="lg:col-span-3 glass rounded-2xl border border-white/10 p-5">
          <h2 className="font-semibold text-slate-100 mb-4">
            {t("dashboard.spendingByCategory")}
          </h2>
          <SpendingChart data={categoryRows} />
        </div>

        {/* Recent Transactions — spans 2 cols on large screens */}
        <div className="lg:col-span-2 glass rounded-2xl border border-white/10 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-100">
              {t("dashboard.recent")}
            </h2>
            <Link
              href="/transactions"
              className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              {t("transactions.title")} →
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">
              {t("dashboard.noTransactions")}
            </p>
          ) : (
            <ul className="space-y-2">
              {recent.map((txn) => (
                <li
                  key={txn.id}
                  className="flex items-center justify-between gap-2 p-2 rounded-xl hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xl" aria-hidden>
                      {getCategoryEmoji(txn.categoryKey)}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-200 truncate">
                        {txn.categoryKey
                          ? getCategoryName(txn.categoryKey)
                          : txn.counterparty || t("dashboard.uncategorized")}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-slate-500">
                        <span>{new Date(txn.occurredAt).toLocaleDateString()}</span>
                        {txn.counterparty && (
                          <span className="text-slate-400">· {txn.counterparty}</span>
                        )}
                        {txn.provider && (
                          <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 border-white/10 bg-white/5 text-slate-400">
                            {txn.provider}
                          </Badge>
                        )}
                        {txn.reference && (
                          <span className="text-slate-500">Ref: {txn.reference}</span>
                        )}
                        {txn.source === "telegram" && (
                          <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4 bg-white/10 text-slate-400 border-0">
                            telegram
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <span
                    className={
                      txn.type === "income"
                        ? "text-sm font-medium text-emerald-400 whitespace-nowrap"
                        : "text-sm font-medium text-rose-400 whitespace-nowrap"
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
