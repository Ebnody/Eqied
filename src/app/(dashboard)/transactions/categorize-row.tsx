"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatETB } from "@/lib/utils";
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
} from "@/lib/categories";
import { Loader2, X } from "lucide-react";
import { useI18n } from "@/i18n/provider";

interface Txn {
  id: string;
  type: string;
  amount: number;
  counterparty: string | null;
  reference: string | null;
  provider: string | null;
  source: string;
  createdAt: Date | string;
}

export function CategorizeRow({ txn }: { txn: Txn }) {
  const router = useRouter();
  const { t } = useI18n();
  const cats = txn.type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const [busy, setBusy] = useState<string | null>(null);

  async function categorize(categoryKey: string) {
    setBusy(categoryKey);
    try {
      const res = await fetch(`/api/transactions/${txn.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryKey }),
      });
      if (res.ok) router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function ignore() {
    setBusy("ignore");
    try {
      const res = await fetch(`/api/transactions/${txn.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ignored" }),
      });
      if (res.ok) router.refresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <li className="px-5 py-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={
                txn.type === "income"
                  ? "text-emerald-700 font-semibold"
                  : "text-rose-700 font-semibold"
              }
            >
              {txn.type === "income" ? "+" : "-"}
              {formatETB(txn.amount)}
            </span>
            {txn.provider && (
              <span className="text-xs bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                {txn.provider}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {txn.counterparty && <>· {txn.counterparty} </>}
            {txn.reference && <>Ref: {txn.reference}</>}
          </p>
        </div>
        <button
          onClick={ignore}
          disabled={!!busy}
          className="text-slate-400 hover:text-rose-700 inline-flex items-center gap-1 text-xs"
          title={t("transactions.ignore")}
        >
          {busy === "ignore" ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <X className="h-3 w-3" />
          )}
          {t("transactions.ignore")}
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {cats.map((c) => (
          <button
            key={c.key}
            onClick={() => categorize(c.key)}
            disabled={!!busy}
            className="text-xs bg-slate-100 hover:bg-emerald-100 hover:text-emerald-800 text-slate-700 px-2.5 py-1 rounded-full transition-colors disabled:opacity-50 inline-flex items-center gap-1"
          >
            {busy === c.key && <Loader2 className="h-3 w-3 animate-spin" />}
            <span>{c.emoji}</span> {c.name}
          </button>
        ))}
      </div>
    </li>
  );
}
