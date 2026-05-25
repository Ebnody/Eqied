"use client";

import { useState } from "react";
import { BudgetEditForm } from "./budget-form";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getCategoryEmoji } from "@/lib/categories";
import { formatETB } from "@/lib/utils";

interface BudgetCategory {
  id: string;
  categoryKey: string;
  name: string;
  plannedAmount: number;
  plannedPercent: number;
}

interface Props {
  month?: string;
  categories: BudgetCategory[];
  totalPlanned: number;
  summaryByCategory: Record<string, { expense: number }>;
}

export function BudgetPlanCard({
  month,
  categories,
  totalPlanned,
  summaryByCategory,
}: Props) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <BudgetEditForm
        month={month}
        initialCategories={categories}
        onClose={() => setEditing(false)}
      />
    );
  }

  return (
    <div className="glass rounded-2xl border border-white/10 shadow-sm">
      <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-slate-100">Budget Plan</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Total planned: {formatETB(totalPlanned)}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setEditing(true)}
        >
          Edit Plan
        </Button>
      </div>
      <ul className="divide-y divide-white/10">
        {categories.map((c) => {
          const spent = summaryByCategory[c.categoryKey]?.expense ?? 0;
          const pct =
            c.plannedAmount > 0
              ? Math.min(100, (spent / c.plannedAmount) * 100)
              : 0;
          const over = spent > c.plannedAmount && c.plannedAmount > 0;
          return (
            <li key={c.id} className="px-5 py-3">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span aria-hidden>{getCategoryEmoji(c.categoryKey)}</span>
                  <span className="font-medium text-slate-200 truncate">
                    {c.name}
                  </span>
                  <span className="text-xs text-slate-500">
                    ({c.plannedPercent}%)
                  </span>
                </div>
                <div className="text-sm whitespace-nowrap">
                  <span
                    className={
                      over ? "text-rose-400 font-medium" : "text-slate-300"
                    }
                  >
                    {formatETB(spent)}
                  </span>
                  <span className="text-slate-500">
                    {" / "}
                    {formatETB(c.plannedAmount)}
                  </span>
                </div>
              </div>
              <Progress
                value={pct}
                indicatorClassName={
                  over
                    ? "bg-rose-600"
                    : pct > 80
                      ? "bg-amber-500"
                      : "bg-emerald-600"
                }
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
