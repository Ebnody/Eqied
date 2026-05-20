"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useI18n } from "@/i18n/provider";
import { formatETB } from "@/lib/utils";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Member { id: string; user: { fullName: string | null; telegramUsername: string | null }; }
interface Loan { id: string; amount: number; paid: number; status: string; reason: string | null; occurredAt: string; lender: { user: { fullName: string | null } }; borrower: { user: { fullName: string | null } }; borrowerMemberId: string; lenderMemberId: string; }

export default function GroupLoansPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const { t } = useI18n();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [payingLoanId, setPayingLoanId] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ lenderMemberId: "", borrowerMemberId: "", amountEtb: "", reason: "" });

  async function load() {
    const [lRes, gRes] = await Promise.all([
      fetch(`/api/roommate/groups/${groupId}/loans`).then((r) => r.json()),
      fetch(`/api/roommate/groups/${groupId}`).then((r) => r.json()),
    ]);
    setLoans(lRes.loans ?? []);
    setMembers(gRes.members ?? []);
    if (gRes.members?.length) {
      setForm((f) => ({ ...f, lenderMemberId: gRes.members[0].id, borrowerMemberId: gRes.members[1]?.id ?? gRes.members[0].id }));
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, [groupId]);
  useEffect(() => { const es = new EventSource(`/api/roommate/groups/${groupId}/events`); es.addEventListener("loan_updated", () => load()); return () => es.close(); }, [groupId]);

  async function submit(e: React.FormEvent) { e.preventDefault(); setSaving(true); const amount = Math.round(parseFloat(form.amountEtb) * 100); const res = await fetch(`/api/roommate/groups/${groupId}/loans`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, amount }) }); setSaving(false); if (res.ok) { setShowForm(false); setForm((f) => ({ ...f, amountEtb: "", reason: "" })); load(); } else alert("Failed"); }
  async function recordPayment(loanId: string) { const amount = Math.round(parseFloat(payAmount) * 100); if (!amount || amount <= 0) return; const res = await fetch(`/api/roommate/groups/${groupId}/loans/${loanId}/payment`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount }) }); if (res.ok) { setPayingLoanId(null); setPayAmount(""); load(); } else alert("Failed"); }

  if (loading) return <div className="flex items-center justify-center h-40"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">{t("roommate.page.loans")}</h2>
        <Button onClick={() => setShowForm(!showForm)} size="sm">
          <Plus className="h-4 w-4" />
          {t("roommate.page.addLoan")}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="p-5 space-y-4">
            <form onSubmit={submit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lender">{t("roommate.page.lender")}</Label>
                  <select id="lender" value={form.lenderMemberId} onChange={(e) => setForm((f) => ({ ...f, lenderMemberId: e.target.value }))}
                    className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1">
                    {members.map((m) => <option key={m.id} value={m.id}>{m.user.fullName ?? m.user.telegramUsername}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="borrower">{t("roommate.page.borrower")}</Label>
                  <select id="borrower" value={form.borrowerMemberId} onChange={(e) => setForm((f) => ({ ...f, borrowerMemberId: e.target.value }))}
                    className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1">
                    {members.map((m) => <option key={m.id} value={m.id}>{m.user.fullName ?? m.user.telegramUsername}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">{t("roommate.page.amountEtb")}</Label>
                  <Input id="amount" required type="number" step="0.01" min="0.01" value={form.amountEtb} onChange={(e) => setForm((f) => ({ ...f, amountEtb: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reason">{t("roommate.page.reason")}</Label>
                <Input id="reason" value={form.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} />
              </div>
              <div className="flex gap-3">
                <Button type="submit" disabled={saving}>{saving ? t("common.saving") : t("common.save")}</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>{t("common.cancel")}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loans.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-slate-500 text-sm">{t("roommate.page.noLoans")}</CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          {loans.map((l) => {
            const remaining = l.amount - l.paid;
            return (
              <div key={l.id} className="px-4 py-3 border-b last:border-b-0 hover:bg-slate-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{l.lender.user.fullName} → {l.borrower.user.fullName}</p>
                    <p className="text-xs text-slate-500">{l.reason || "—"} · {new Date(l.occurredAt).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-700">{formatETB(l.amount)}</p>
                    <Badge variant={l.status === "paid" ? "default" : l.status === "partial" ? "warning" : "destructive"}>{t(`roommate.page.${l.status}`)}</Badge>
                  </div>
                </div>
                {remaining > 0 && (
                  <div className="mt-2 flex items-center gap-3">
                    <span className="text-xs text-slate-500">{t("roommate.page.remaining")}: {formatETB(remaining)}</span>
                    {payingLoanId === l.id ? (
                      <div className="flex items-center gap-2">
                        <Input type="number" step="0.01" min="0.01" max={remaining / 100} value={payAmount} onChange={(e) => setPayAmount(e.target.value)} className="w-24" placeholder="ETB" />
                        <Button size="sm" onClick={() => recordPayment(l.id)}>{t("roommate.page.save")}</Button>
                        <Button size="sm" variant="outline" onClick={() => { setPayingLoanId(null); setPayAmount(""); }}>{t("roommate.page.cancel")}</Button>
                      </div>
                    ) : (
                      <Button size="sm" variant="ghost" onClick={() => setPayingLoanId(l.id)}>{t("roommate.page.recordPayment")}</Button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}
