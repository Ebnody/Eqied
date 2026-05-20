"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n/provider";
import { Users, Plus, ArrowRight, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

interface GroupItem {
  groupId: string;
  name: string;
  description: string | null;
  memberCount: number;
  expenseCount: number;
  role: string;
  joinedAt: string;
}

export default function GroupsPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", password: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/roommate/groups")
      .then((r) => r.json())
      .then((d) => {
        setGroups(d.groups ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function createGroup(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/roommate/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      const data = await res.json();
      router.push(`/groups/${data.groupId}`);
    } else {
      alert("Failed to create group");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">
            {t("roommate.page.groupsTitle")}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {t("roommate.page.groupsSubtitle")}
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4" />
          {t("roommate.page.newGroup")}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="p-5 space-y-4">
            <form onSubmit={createGroup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="groupName">{t("roommate.page.groupName")}</Label>
                <Input
                  id="groupName"
                  required
                  minLength={2}
                  maxLength={80}
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="groupDescription">{t("roommate.page.description")}</Label>
                <Input
                  id="groupDescription"
                  maxLength={500}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="groupPassword">{t("roommate.page.groupPassword")}</Label>
                <Input
                  id="groupPassword"
                  type="password"
                  required
                  minLength={6}
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                />
                <p className="text-xs text-slate-500">{t("roommate.page.groupPasswordHelp")}</p>
              </div>
              <div className="flex gap-3">
                <Button type="submit" disabled={saving}>
                  {saving ? t("common.saving") : t("roommate.page.createGroup")}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  {t("common.cancel")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {groups.length === 0 ? (
        <div className="rounded-xl border bg-white p-10 text-center text-slate-500">
          <Users className="mx-auto h-10 w-10 text-slate-300 mb-3" />
          <p>{t("roommate.page.noGroupsYet")}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((g) => (
            <Link
              key={g.groupId}
              href={`/groups/${g.groupId}`}
              className="group rounded-xl border bg-white p-5 shadow-sm hover:border-emerald-300 hover:shadow transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-800 truncate">
                    {g.name}
                  </h3>
                  {g.description && (
                    <p className="mt-1 text-sm text-slate-500 truncate">
                      {g.description}
                    </p>
                  )}
                </div>
                <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-emerald-500 shrink-0 ml-2" />
              </div>
              <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {g.memberCount} {t("roommate.page.members")}
                </span>
                <span>{g.expenseCount} {t("roommate.page.expenses")}</span>
                {g.role === "owner" && (
                  <span className="flex items-center gap-1 text-amber-600">
                    <Crown className="h-3.5 w-3.5" />
                    {t("roommate.page.owner")}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
