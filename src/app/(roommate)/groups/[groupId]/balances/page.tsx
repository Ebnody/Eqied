"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useI18n } from "@/i18n/provider";
import { formatETB } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface BalanceItem {
  memberId: string;
  net: number;
  paid: number;
  share: number;
  loansLent: number;
  loansBorrowed: number;
  member: { userName: string | null; telegramUsername: string | null } | null;
}

interface TransferItem {
  fromMemberId: string;
  toMemberId: string;
  amount: number;
  from: { name: string | null } | null;
  to: { name: string | null } | null;
}

export default function GroupBalancesPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const { t } = useI18n();
  const [balances, setBalances] = useState<BalanceItem[]>([]);
  const [transfers, setTransfers] = useState<TransferItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [fromMemberId, setFromMemberId] = useState("");
  const [toMemberId, setToMemberId] = useState("");
  const [settleAmount, setSettleAmount] = useState("");
  const [members, setMembers] = useState<Array<{ id: string; user: { fullName: string | null } }>>([]);

  async function load() {
    const res = await fetch(`/api/roommate/groups/${groupId}/balances`).then((r) => r.json());
    setBalances(res.balances ?? []);
    setTransfers(res.transfers ?? []);
    const gRes = await fetch(`/api/roommate/groups/${groupId}`).then((r) => r.json());
    setMembers(gRes.members ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [groupId]);
  useEffect(() => { const es = new EventSource(`/api/roommate/groups/${groupId}/events`); es.addEventListener("balances_changed", () => load()); return () => es.close(); }, [groupId]);

  async function recordSettlement(e: React.FormEvent) { e.preventDefault(); const amount = Math.round(parseFloat(settleAmount) * 100); const res = await fetch(`/api/roommate/groups/${groupId}/settlements`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fromMemberId, toMemberId, amount }) }); if (res.ok) { setSettleAmount(""); load(); } else alert("Failed"); }

  if (loading) return <div className="flex items-center justify-center h-40"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" /></div>;

  const allSettled = balances.every((b) => b.net === 0);

  return (
    <div className="space-y-8">
      {/* Balances */}
      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-3">{t("roommate.page.balances")}</h2>
        {balances.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-slate-500 text-sm">{t("roommate.page.noExpenses")}</CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {balances.map((b) => {
              const name = b.member?.userName ?? b.member?.telegramUsername ?? "Member";
              const positive = b.net > 0;
              return (
                <Card key={b.memberId} className={positive ? "border-emerald-200" : b.net < 0 ? "border-red-200" : "border-slate-200"}>
                  <CardContent className="p-4">
                    <p className="text-sm font-medium text-slate-800">{name}</p>
                    <p className={`text-xl font-bold mt-1 ${positive ? "text-emerald-700" : b.net < 0 ? "text-red-700" : "text-slate-600"}`}>
                      {positive ? "+" : ""}{formatETB(b.net)}
                    </p>
                    <div className="mt-2 text-xs text-slate-500 space-y-0.5">
                      <p>{t("roommate.page.paidBy")}: {formatETB(b.paid)}</p>
                      <p>{t("roommate.page.participants")}: {formatETB(b.share)}</p>
                      {b.loansLent > 0 && <p>{t("roommate.page.lender")}: +{formatETB(b.loansLent)}</p>}
                      {b.loansBorrowed > 0 && <p>{t("roommate.page.borrower")}: -{formatETB(b.loansBorrowed)}</p>}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Suggestions */}
      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-3">{t("roommate.page.settlementSuggestions")}</h2>
        {allSettled ? (
          <Card className="bg-emerald-50 border-emerald-200">
            <CardContent className="p-8 text-center text-emerald-700 font-medium">{t("roommate.page.settled")}</CardContent>
          </Card>
        ) : transfers.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-slate-500 text-sm">{t("roommate.page.noSettlements")}</CardContent>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            {transfers.map((tr, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3 border-b last:border-b-0">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-slate-800">{tr.from?.name ?? "?"}</span>
                  <span className="text-slate-400">{t("roommate.page.pays")}</span>
                  <span className="font-medium text-slate-800">{tr.to?.name ?? "?"}</span>
                </div>
                <span className="text-sm font-bold text-emerald-700">{formatETB(tr.amount)}</span>
              </div>
            ))}
          </Card>
        )}
      </div>

      {/* Record settlement */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-800">{t("roommate.page.markSettled")}</h3>
          <form onSubmit={recordSettlement} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fromMember">{t("roommate.page.from")}</Label>
                <select id="fromMember" value={fromMemberId} onChange={(e) => setFromMemberId(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1">
                  <option value="">—</option>
                  {members.map((m) => <option key={m.id} value={m.id}>{m.user.fullName ?? m.id}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="toMember">{t("roommate.page.to")}</Label>
                <select id="toMember" value={toMemberId} onChange={(e) => setToMemberId(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1">
                  <option value="">—</option>
                  {members.map((m) => <option key={m.id} value={m.id}>{m.user.fullName ?? m.id}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="settleAmount">{t("roommate.page.amountEtb")}</Label>
                <Input id="settleAmount" required type="number" step="0.01" min="0.01" value={settleAmount} onChange={(e) => setSettleAmount(e.target.value)} />
              </div>
            </div>
            <Button type="submit">{t("roommate.page.save")}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
