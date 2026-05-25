"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useI18n } from "@/i18n/provider";
import { formatETB } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

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

interface Member {
  id: string;
  user: { fullName: string | null };
}

export default function GroupBalancesClient({
  initialBalances,
  initialTransfers,
  initialMembers,
}: {
  initialBalances: BalanceItem[];
  initialTransfers: TransferItem[];
  initialMembers: Member[];
}) {
  const { groupId } = useParams<{ groupId: string }>();
  const { t } = useI18n();
  const [balances, setBalances] = useState<BalanceItem[]>(initialBalances);
  const [transfers, setTransfers] = useState<TransferItem[]>(initialTransfers);
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [fromMemberId, setFromMemberId] = useState("");
  const [toMemberId, setToMemberId] = useState("");
  const [settleAmount, setSettleAmount] = useState("");

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/roommate/groups/${groupId}/balances`).then((r) => r.json());
    setBalances(res.balances ?? []);
    setTransfers(res.transfers ?? []);
    const gRes = await fetch(`/api/roommate/groups/${groupId}`).then((r) => r.json());
    setMembers(gRes.members ?? []);
  }, [groupId]);

  useEffect(() => {
    const es = new EventSource(`/api/roommate/groups/${groupId}/events`);
    es.addEventListener("balances_changed", refresh);
    return () => es.close();
  }, [groupId, refresh]);

  async function recordSettlement(e: React.FormEvent) {
    e.preventDefault();
    const amount = Math.round(parseFloat(settleAmount) * 100);
    const res = await fetch(`/api/roommate/groups/${groupId}/settlements`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fromMemberId, toMemberId, amount }),
    });
    if (res.ok) {
      setSettleAmount("");
      refresh();
    } else {
      alert("Failed");
    }
  }

  const allSettled = balances.every((b) => b.net === 0);

  return (
    <div className="space-y-8">
      {/* Balances */}
      <div>
        <h2 className="text-lg font-semibold text-slate-100 mb-3">{t("roommate.page.balances")}</h2>
        {balances.length === 0 ? (
          <Card className="border-white/10">
            <CardContent className="p-8 text-center text-slate-400 text-sm">{t("roommate.page.noExpenses")}</CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {balances.map((b) => {
              const name = b.member?.userName ?? b.member?.telegramUsername ?? "Member";
              const positive = b.net > 0;
              return (
                <Card key={b.memberId} className={positive ? "border-emerald-500/20" : b.net < 0 ? "border-rose-500/20" : "border-white/10"}>
                  <CardContent className="p-4">
                    <p className="text-sm font-medium text-slate-200">{name}</p>
                    <p className={`text-xl font-bold mt-1 ${positive ? "text-emerald-400" : b.net < 0 ? "text-rose-400" : "text-slate-400"}`}>
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
        <h2 className="text-lg font-semibold text-slate-100 mb-3">{t("roommate.page.settlementSuggestions")}</h2>
        {allSettled ? (
          <Card className="border-emerald-500/20">
            <CardContent className="p-8 text-center text-emerald-300 font-medium">{t("roommate.page.settled")}</CardContent>
          </Card>
        ) : transfers.length === 0 ? (
          <Card className="border-white/10">
            <CardContent className="p-8 text-center text-slate-400 text-sm">{t("roommate.page.noSettlements")}</CardContent>
          </Card>
        ) : (
          <Card className="overflow-hidden border-white/10">
            {transfers.map((tr, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3 border-b border-white/10 last:border-b-0">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-slate-200">{tr.from?.name ?? "?"}</span>
                  <span className="text-slate-500">{t("roommate.page.pays")}</span>
                  <span className="font-medium text-slate-200">{tr.to?.name ?? "?"}</span>
                </div>
                <span className="text-sm font-bold text-emerald-400">{formatETB(tr.amount)}</span>
              </div>
            ))}
          </Card>
        )}
      </div>

      {/* Record settlement */}
      <Card className="border-white/10">
        <CardContent className="p-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-100">{t("roommate.page.markSettled")}</h3>
          <form onSubmit={recordSettlement} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fromMember">{t("roommate.page.from")}</Label>
                <select id="fromMember" value={fromMemberId} onChange={(e) => setFromMemberId(e.target.value)}
                  className="flex h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500/30">
                  <option value="">—</option>
                  {members.map((m) => <option key={m.id} value={m.id}>{m.user.fullName ?? m.id}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="toMember">{t("roommate.page.to")}</Label>
                <select id="toMember" value={toMemberId} onChange={(e) => setToMemberId(e.target.value)}
                  className="flex h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500/30">
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
