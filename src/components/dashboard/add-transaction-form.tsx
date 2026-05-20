"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  PAYMENT_METHODS,
} from "@/lib/categories";
import { Loader2 } from "lucide-react";
import { useI18n } from "@/i18n/provider";

interface Props {
  type: "income" | "expense";
}

export function AddTransactionForm({ type }: Props) {
  const router = useRouter();
  const { t } = useI18n();
  const cats = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const [amount, setAmount] = useState("");
  const [categoryKey, setCategoryKey] = useState(cats[0]?.key ?? "");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [counterparty, setCounterparty] = useState("");
  const [notes, setNotes] = useState("");
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
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          amountEtb: value,
          categoryKey,
          paymentMethod,
          counterparty: counterparty || undefined,
          notes: notes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || t("common.failedToSave"));
        return;
      }
      setAmount("");
      setCounterparty("");
      setNotes("");
      setMessage(t("common.savedBang"));
      router.refresh();
    } catch {
      setMessage(t("common.networkError"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {type === "income" ? t("transactions.addIncome") : t("transactions.addExpense")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">{t("common.amount")} (ETB)</Label>
              <Input
                id="amount"
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat">{t("common.category")}</Label>
              <select
                id="cat"
                value={categoryKey}
                onChange={(e) => setCategoryKey(e.target.value)}
                className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {cats.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.emoji} {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pm">{t("common.paymentMethod")}</Label>
              <select
                id="pm"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {PAYMENT_METHODS.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cp">
                {type === "income" ? t("common.from") : t("common.to")} (
                {t("common.optional")})
              </Label>
              <Input
                id="cp"
                value={counterparty}
                onChange={(e) => setCounterparty(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">
              {t("common.notes")} ({t("common.optional")})
            </Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-between gap-3">
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> {t("common.saving")}
                </>
              ) : (
                t("common.save")
              )}
            </Button>
            {message && (
              <p className="text-xs text-slate-600">{message}</p>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
