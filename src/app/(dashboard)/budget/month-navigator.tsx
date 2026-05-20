"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { monthLabel, currentMonthKey } from "@/lib/utils";

interface Props {
  currentMonth: string;
  savedMonths: string[];
}

function shiftMonth(monthKey: string, delta: number): string {
  const [y, m] = monthKey.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${yy}-${mm}`;
}

export function MonthNavigator({ currentMonth, savedMonths }: Props) {
  const router = useRouter();
  const search = useSearchParams();
  const today = currentMonthKey();
  const isToday = currentMonth === today;

  function go(month: string) {
    const params = new URLSearchParams(search.toString());
    if (month === today) {
      params.delete("month");
    } else {
      params.set("month", month);
    }
    const qs = params.toString();
    router.push(qs ? `/budget?${qs}` : "/budget");
  }

  const prev = shiftMonth(currentMonth, -1);
  const next = shiftMonth(currentMonth, 1);
  const isFuture = next > today;

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm space-y-3">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => go(prev)}
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex-1 text-center">
          <div className="flex items-center justify-center gap-2">
            <Calendar className="h-4 w-4 text-slate-500" />
            <span className="font-semibold text-slate-900">
              {monthLabel(currentMonth)}
            </span>
          </div>
          {!isToday && (
            <button
              type="button"
              onClick={() => go(today)}
              className="text-xs text-emerald-700 hover:underline mt-0.5"
            >
              Jump to current month
            </button>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => go(next)}
          disabled={isFuture}
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {savedMonths.length > 0 && (
        <div className="border-t pt-3">
          <p className="text-xs text-slate-500 mb-2">History</p>
          <div className="flex flex-wrap gap-1.5">
            {savedMonths.map((m) => {
              const active = m === currentMonth;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => go(m)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition ${
                    active
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {monthLabel(m)}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
