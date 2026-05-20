"use client";

import { formatETB } from "@/lib/utils";
import { getCategoryEmoji, getCategoryName } from "@/lib/categories";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/i18n/provider";

interface Txn {
  id: string;
  type: string;
  amount: number;
  categoryKey: string | null;
  status: string;
  source: string;
  counterparty: string | null;
  provider: string | null;
  reference: string | null;
  occurredAt: Date | string;
}

export function TransactionList({
  transactions,
  emptyText,
}: {
  transactions: Txn[];
  emptyText?: string;
}) {
  const { t, locale } = useI18n();
  const fallbackEmpty = emptyText ?? t("dashboard.noTransactions");
  // Map locales to BCP-47 codes that Intl supports; Ethiopian languages
  // fall back to Ethiopian English locale for date formatting.
  const dateLocale =
    locale === "om" ? "om-ET" : locale === "ti" ? "ti-ET" : locale === "am" ? "am-ET" : "en-ET";

  if (transactions.length === 0) {
    return (
      <p className="text-sm text-slate-500 text-center py-8">{fallbackEmpty}</p>
    );
  }
  return (
    <ul className="divide-y">
      {transactions.map((txn) => (
        <li
          key={txn.id}
          className="py-3 flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-2xl" aria-hidden>
              {getCategoryEmoji(txn.categoryKey)}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">
                {txn.categoryKey
                  ? getCategoryName(txn.categoryKey)
                  : txn.counterparty || t("dashboard.uncategorized")}
              </p>
              <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-slate-500">
                <span>
                  {new Date(txn.occurredAt).toLocaleDateString(dateLocale, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                {txn.counterparty && (
                  <span className="text-slate-600">
                    · {txn.counterparty}
                  </span>
                )}
                {txn.provider && (
                  <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
                    {txn.provider}
                  </Badge>
                )}
                {txn.reference && (
                  <span className="text-slate-400">Ref: {txn.reference}</span>
                )}
                {txn.source === "telegram" && (
                  <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">telegram</Badge>
                )}
                {txn.status === "uncategorized" && (
                  <Badge variant="warning" className="text-[10px] px-1 py-0 h-4">{t("dashboard.uncategorized")}</Badge>
                )}
              </div>
            </div>
          </div>
          <span
            className={
              txn.type === "income"
                ? "text-sm font-semibold text-emerald-700 whitespace-nowrap"
                : "text-sm font-semibold text-rose-700 whitespace-nowrap"
            }
          >
            {txn.type === "income" ? "+" : "-"}
            {formatETB(txn.amount)}
          </span>
        </li>
      ))}
    </ul>
  );
}
