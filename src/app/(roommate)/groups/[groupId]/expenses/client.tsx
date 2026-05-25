"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useI18n } from "@/i18n/provider";
import { formatETB } from "@/lib/utils";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

interface Member {
  id: string;
  user: { fullName: string | null; telegramUsername: string | null };
}

interface Expense {
  id: string;
  title: string;
  amount: number;
  categoryKey: string;
  splitType: string;
  occurredAt: string;
  notes: string | null;
  paidBy: { user: { fullName: string | null; telegramUsername: string | null } };
  splits: Array<{ memberId: string; share: number; member?: { user: { fullName: string | null } } }>;
}

const EMOJI: Record<string, string> = {
  rent: "🏠", electricity: "💡", internet: "🌐",
  food: "🍲", cleaning: "🧹", house: "🛒", other: "📦",
};

type SplitType = "equal" | "percent" | "exact";

export default function GroupExpensesClient({
  initialExpenses,
  initialMembers,
}: {
  initialExpenses: Expense[];
  initialMembers: Member[];
}) {
  const { groupId } = useParams<{ groupId: string }>();
  const { t } = useI18n();
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: "",
    amountEtb: "",
    categoryKey: "rent",
    splitType: "equal" as SplitType,
    paidByMemberId: initialMembers[0]?.id ?? "",
    notes: "",
    participantIds: initialMembers.map((m) => m.id),
    parts: {} as Record<string, string>,
  });

  const refresh = useCallback(async () => {
    const [eRes, gRes] = await Promise.all([
      fetch(`/api/roommate/groups/${groupId}/expenses`).then((r) => r.json()),
      fetch(`/api/roommate/groups/${groupId}`).then((r) => r.json()),
    ]);
    setExpenses(eRes.expenses ?? []);
    setMembers(gRes.members ?? []);
  }, [groupId]);

  useEffect(() => {
    const es = new EventSource(`/api/roommate/groups/${groupId}/events`);
    es.addEventListener("expense_added", refresh);
    return () => es.close();
  }, [groupId, refresh]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const amount = Math.round(parseFloat(form.amountEtb) * 100);
    const participants = form.participantIds.map((id) => ({
      memberId: id,
      part: form.splitType === "equal" ? undefined : parseFloat(form.parts[id] || "0"),
    }));
    const res = await fetch(`/api/roommate/groups/${groupId}/expenses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        amount,
        categoryKey: form.categoryKey,
        splitType: form.splitType,
        paidByMemberId: form.paidByMemberId,
        participants,
        notes: form.notes || undefined,
      }),
    });
    setSaving(false);
    if (res.ok) {
      setShowForm(false);
      setForm((f) => ({ ...f, title: "", amountEtb: "", notes: "" }));
      refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Failed to add expense");
    }
  }

  function toggleParticipant(id: string) {
    setForm((f) => {
      const ids = f.participantIds.includes(id)
        ? f.participantIds.filter((x) => x !== id)
        : [...f.participantIds, id];
      return { ...f, participantIds: ids };
    });
  }

  function setPart(id: string, val: string) {
    setForm((f) => ({ ...f, parts: { ...f.parts, [id]: val } }));
  }

  const cats = ["rent", "electricity", "internet", "food", "cleaning", "house", "other"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-100">{t("roommate.page.expenses")}</h2>
        <Button onClick={() => setShowForm(!showForm)} size="sm">
          <Plus className="h-4 w-4" />
          {t("roommate.page.addExpense")}
        </Button>
      </div>

      {showForm && (
        <Card className="border-white/10">
          <CardContent className="p-5 space-y-4">
            <form onSubmit={submit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expenseTitle">{t("roommate.page.title")}</Label>
                  <Input id="expenseTitle" required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expenseAmount">{t("roommate.page.amountEtb")}</Label>
                  <Input id="expenseAmount" required type="number" step="0.01" min="0.01" value={form.amountEtb}
                    onChange={(e) => setForm((f) => ({ ...f, amountEtb: e.target.value }))} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">{t("roommate.page.category")}</Label>
                  <select id="category" value={form.categoryKey} onChange={(e) => setForm((f) => ({ ...f, categoryKey: e.target.value }))}
                    className="flex h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500/30">
                    {cats.map((c) => (
                      <option key={c} value={c}>{EMOJI[c]} {t(`roommate.cat.${c}`)}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paidBy">{t("roommate.page.paidBy")}</Label>
                  <select id="paidBy" value={form.paidByMemberId} onChange={(e) => setForm((f) => ({ ...f, paidByMemberId: e.target.value }))}
                    className="flex h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500/30">
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>{m.user.fullName ?? m.user.telegramUsername}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="splitType">{t("roommate.page.splitType")}</Label>
                  <select id="splitType" value={form.splitType} onChange={(e) => setForm((f) => ({ ...f, splitType: e.target.value as SplitType }))}
                    className="flex h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500/30">
                    <option value="equal">{t("roommate.page.splitEqual")}</option>
                    <option value="percent">{t("roommate.page.splitPercent")}</option>
                    <option value="exact">{t("roommate.page.splitExact")}</option>
                  </select>
                </div>
              </div>

              <div>
                <Label className="mb-2 block">{t("roommate.page.participants")}</Label>
                <div className="flex flex-wrap gap-2">
                  {members.map((m) => {
                    const active = form.participantIds.includes(m.id);
                    return (
                      <Button key={m.id} type="button" variant={active ? "default" : "outline"} size="sm" onClick={() => toggleParticipant(m.id)} className="rounded-full">
                        {m.user.fullName ?? m.user.telegramUsername}
                      </Button>
                    );
                  })}
                </div>
                {form.splitType !== "equal" && (
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {form.participantIds.map((id) => {
                      const m = members.find((x) => x.id === id);
                      return (
                        <div key={id}>
                          <Label className="text-xs text-slate-400">{m?.user.fullName ?? m?.user.telegramUsername}</Label>
                          <Input type="number" step={form.splitType === "percent" ? "1" : "0.01"} min="0"
                            value={form.parts[id] || ""} onChange={(e) => setPart(id, e.target.value)}
                            placeholder={form.splitType === "percent" ? "%" : "ETB"} />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">{t("roommate.page.notes")}</Label>
                <Input id="notes" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
              </div>

              <div className="flex gap-3">
                <Button type="submit" disabled={saving}>
                  {saving ? t("common.saving") : t("common.save")}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  {t("common.cancel")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {expenses.length === 0 ? (
        <Card className="border-white/10">
          <CardContent className="p-8 text-center text-slate-400 text-sm">{t("roommate.page.noExpenses")}</CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden border-white/10">
          {expenses.map((e) => (
            <div key={e.id} className="px-4 py-3 border-b border-white/10 last:border-b-0 hover:bg-white/5 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-lg shrink-0">{EMOJI[e.categoryKey] ?? "📦"}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">{e.title}</p>
                    <p className="text-xs text-slate-500">
                      {e.paidBy.user.fullName ?? e.paidBy.user.telegramUsername} · {new Date(e.occurredAt).toLocaleDateString()} · {t(`roommate.cat.${e.categoryKey}`)}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-slate-300 shrink-0 ml-3">{formatETB(e.amount)}</span>
              </div>
              {e.splits && e.splits.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                  {e.splits.map((s) => {
                    const name = s.member?.user?.fullName ?? s.memberId;
                    return <span key={s.memberId}>{name}: {formatETB(s.share)}</span>;
                  })}
                </div>
              )}
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
