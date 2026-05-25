"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useI18n } from "@/i18n/provider";

interface Props {
  month?: string;
  initialAmountEtb?: number;
  initialIsReceived?: boolean;
}

export function SalaryForm({
  month,
  initialAmountEtb,
  initialIsReceived = false,
}: Props) {
  const router = useRouter();
  const { t } = useI18n();
  const [amount, setAmount] = useState(
    initialAmountEtb ? String(initialAmountEtb) : ""
  );
  const [isReceived, setIsReceived] = useState(initialIsReceived);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    const value = Number(amount);
    if (!value || value <= 0) {
      setMessage(t("common.invalidAmount"));
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/salary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month,
          amountEtb: value,
          isReceived,
          generateBudget: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || t("common.failedToSave"));
        return;
      }
      setMessage(t("budget.salarySaved"));
      router.refresh();
    } catch {
      setMessage(t("common.networkError"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="glass rounded-2xl border border-[var(--glass-border)] p-5 space-y-4"
    >
      <div>
        <h2 className="font-semibold text-[var(--foreground)]">Monthly Budget</h2>
        <p className="text-xs text-[var(--muted)] mt-0.5">Set your planned monthly budget amount</p>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="amount">{t("common.amount")} (ETB)</Label>
          <Input
            id="amount"
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            placeholder={t("budget.salaryPlaceholder")}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>
        <div className="flex items-end">
          <label className="inline-flex items-center gap-2 text-sm text-[var(--muted)]">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--accent)] focus:ring-[var(--input-focus-ring)]"
              checked={isReceived}
              onChange={(e) => setIsReceived(e.target.checked)}
            />
            {t("budget.alreadyReceived")}
          </label>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> {t("common.saving")}
            </>
          ) : (
            "Save Budget"
          )}
        </Button>
        {message && (
          <p className="text-xs text-[var(--muted)]">{message}</p>
        )}
      </div>
    </form>
  );
}
