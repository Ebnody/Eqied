"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EXPENSE_CATEGORIES } from "@/lib/categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { useI18n } from "@/i18n/provider";

interface CategoryInput {
  key: string;
  name: string;
  emoji: string;
  plannedAmountEtb: number;
}

interface Props {
  month?: string;
  initialCategories: Array<{
    categoryKey: string;
    name: string;
    plannedAmount: number;
    plannedPercent: number;
  }>;
  onClose: () => void;
}

export function BudgetEditForm({ month, initialCategories, onClose }: Props) {
  const router = useRouter();
  const { t } = useI18n();
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Build inputs from all expense categories, using initial values where available
  const initialMap = new Map(
    initialCategories.map((c) => [
      c.categoryKey,
      {
        name: c.name,
        plannedAmountEtb: c.plannedAmount / 100,
        plannedPercent: c.plannedPercent,
      },
    ])
  );

  const [items, setItems] = useState<CategoryInput[]>(
    EXPENSE_CATEGORIES.map((cat) => {
      const saved = initialMap.get(cat.key);
      return {
        key: cat.key,
        name: saved?.name ?? cat.name,
        emoji: cat.emoji,
        plannedAmountEtb: saved?.plannedAmountEtb ?? cat.defaultPercent ?? 0,
      };
    })
  );

  const totalEtb = items.reduce((sum, it) => sum + it.plannedAmountEtb, 0);

  function updateAmount(key: string, value: string) {
    const num = Number(value);
    setItems((prev) =>
      prev.map((it) =>
        it.key === key ? { ...it, plannedAmountEtb: isNaN(num) ? 0 : num } : it
      )
    );
  }

  async function onSubmit() {
    setMessage(null);
    if (totalEtb <= 0) {
      setMessage(t("common.invalidAmount"));
      return;
    }

    // Compute percentages from totals
    const categories = items.map((it) => ({
      categoryKey: it.key,
      name: it.name,
      plannedAmountEtb: it.plannedAmountEtb,
      plannedPercent:
        totalEtb > 0
          ? Number(((it.plannedAmountEtb / totalEtb) * 100).toFixed(2))
          : 0,
    }));

    setSubmitting(true);
    try {
      const res = await fetch("/api/budget", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month, categories }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || t("common.failedToSave"));
        return;
      }
      setMessage(t("budget.salarySaved"));
      router.refresh();
      onClose();
    } catch {
      setMessage(t("common.networkError"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="glass rounded-2xl border border-[var(--glass-border)] p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-[var(--foreground)]">Edit Budget Plan</h2>
        <span className="text-sm font-medium text-[var(--muted-foreground)]">
          Total: <span className="text-[var(--accent)]">{totalEtb.toLocaleString()} ETB</span>
        </span>
      </div>

      <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
        {items.map((it) => (
          <div key={it.key} className="flex items-center gap-3">
            <span className="text-lg" aria-hidden>
              {it.emoji}
            </span>
            <span className="flex-1 text-sm text-[var(--muted-foreground)] truncate">
              {it.name}
            </span>
            <div className="w-32">
              <Input
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                value={it.plannedAmountEtb || ""}
                onChange={(e) => updateAmount(it.key, e.target.value)}
                className="text-right h-9"
                placeholder="0"
              />
            </div>
            <span className="text-xs text-[var(--muted)] w-8 text-right">ETB</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3 pt-2 border-t border-[var(--glass-border)]">
        <div>
          {message && (
            <p className="text-xs text-[var(--danger)]">{message}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={onSubmit} disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> {t("common.saving")}
              </>
            ) : (
              "Save Plan"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
