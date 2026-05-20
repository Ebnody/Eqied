"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useI18n } from "@/i18n/provider";
import { formatETB } from "@/lib/utils";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ExpenseItem {
  id: string;
  title: string;
  amount: number;
  categoryKey: string;
  occurredAt: string;
  paidBy: { user: { fullName: string | null; telegramUsername: string | null } };
}

interface BalanceItem {
  memberId: string;
  net: number;
  member: { userName: string | null; telegramUsername: string | null } | null;
}

export default function GroupDashboardPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const { t } = useI18n();
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [balances, setBalances] = useState<BalanceItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch(`/api/roommate/groups/${groupId}/expenses?limit=5`).then((r) => r.json()),
      fetch(`/api/roommate/groups/${groupId}/balances`).then((r) => r.json()),
    ]).then(([eData, bData]) => {
      if (cancelled) return;
      const exps = eData.expenses ?? [];
      setExpenses(exps);
      setTotal(exps.reduce((a: number, x: ExpenseItem) => a + x.amount, 0));
      setBalances(bData.balances ?? []);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [groupId]);

  useEffect(() => {
    const es = new EventSource(`/api/roommate/groups/${groupId}/events`);
    es.onmessage = (ev) => {
      if (ev.data.startsWith("{\"kind\":\"balances_changed\"")) {
        fetch(`/api/roommate/groups/${groupId}/balances`)
          .then((r) => r.json())
          .then((d) => setBalances(d.balances ?? []));
      }
    };
    return () => es.close();
  }, [groupId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    );
  }

  const categoryEmoji: Record<string, string> = {
    rent: "🏠", electricity: "💡", internet: "🌐",
    food: "🍲", cleaning: "🧹", house: "🛒", other: "📦",
  };

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-slate-500 uppercase tracking-wide">
              {t("roommate.page.totalSpending")}
            </p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{formatETB(total)}</p>
          </CardContent>
        </Card>
        <Card className="sm:col-span-2">
          <CardContent className="p-5">
            <p className="text-xs text-slate-500 uppercase tracking-wide">
              {t("roommate.page.balances")}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {balances.map((b) => {
                const name = b.member?.userName ?? b.member?.telegramUsername ?? "Member";
                const positive = b.net > 0;
                return (
                  <Badge
                    key={b.memberId}
                    variant={positive ? "default" : b.net < 0 ? "destructive" : "secondary"}
                  >
                    {name}: {positive ? "+" : ""}{formatETB(b.net)}
                  </Badge>
                );
              })}
              {balances.length === 0 && (
                <span className="text-sm text-slate-400">{t("roommate.page.settled")}</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent expenses */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-slate-800">
            {t("roommate.page.recentActivity")}
          </h2>
          <Button asChild variant="ghost" size="sm">
            <Link href={`/groups/${groupId}/expenses`}>
              {t("roommate.page.expenses")} →
            </Link>
          </Button>
        </div>

        {expenses.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-slate-500 text-sm">
              {t("roommate.page.noExpenses")}
            </CardContent>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            {expenses.map((e) => (
              <div
                key={e.id}
                className="flex items-center justify-between px-4 py-3 border-b last:border-b-0 hover:bg-slate-50"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-lg shrink-0">{categoryEmoji[e.categoryKey] ?? "📦"}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{e.title}</p>
                    <p className="text-xs text-slate-500">
                      {e.paidBy.user.fullName ?? e.paidBy.user.telegramUsername} ·{" "}
                      {new Date(e.occurredAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-slate-700 shrink-0 ml-3">
                  {formatETB(e.amount)}
                </span>
              </div>
            ))}
          </Card>
        )}
      </div>
    </div>
  );
}
