"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useI18n } from "@/i18n/provider";
import { Users, Crown, Shield, Copy, Check, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Member { id: string; role: string; nickname: string | null; joinedAt: string; user: { id: string; fullName: string | null; telegramUsername: string | null; hasTelegram: boolean }; }

export default function GroupMembersPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const { t } = useI18n();
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [myRole, setMyRole] = useState("member");
  const [loading, setLoading] = useState(true);
  const [inviteUsername, setInviteUsername] = useState("");
  const [inviteResult, setInviteResult] = useState<{ inviteUrl?: string | null; dmSent?: boolean } | null>(null);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    const res = await fetch(`/api/roommate/groups/${groupId}`).then((r) => r.json());
    setMembers(res.members ?? []);
    setMyRole(res.me?.role ?? "member");
    setLoading(false);
  }

  useEffect(() => { load(); }, [groupId]);

  async function sendInvite(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(`/api/roommate/groups/${groupId}/invites`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telegramUsername: inviteUsername.replace(/^@/, "") }),
    });
    setSaving(false);
    if (res.ok) {
      const data = await res.json();
      setInviteResult(data);
      setInviteUsername("");
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Failed");
    }
  }

  function copyLink(url: string) {
    navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }

  async function deleteGroup() {
    if (!confirm("Are you sure you want to permanently delete this group and all its data?")) return;
    setDeleting(true);
    const res = await fetch(`/api/roommate/groups/${groupId}`, { method: "DELETE" });
    setDeleting(false);
    if (res.ok) {
      router.push("/groups");
    } else {
      alert("Failed to delete group");
    }
  }

  const canInvite = myRole === "owner" || myRole === "admin";

  if (loading) return <div className="flex items-center justify-center h-40"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">{t("roommate.page.members")}</h2>
        <Badge variant="secondary">{members.length} {members.length === 1 ? t("roommate.page.member") : t("roommate.page.members_other")}</Badge>
      </div>

      {canInvite && (
        <Card>
          <CardContent className="p-5 space-y-4">
            <form onSubmit={sendInvite} className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-800">{t("roommate.page.inviteMember")}</h3>
              <div className="flex gap-3">
                <Input required value={inviteUsername} onChange={(e) => setInviteUsername(e.target.value)} placeholder="@username" className="flex-1" />
                <Button type="submit" disabled={saving}>{saving ? t("common.saving") : t("roommate.page.sendInvite")}</Button>
              </div>
              {inviteResult?.inviteUrl && (
                <div className="rounded-lg bg-slate-50 p-3 space-y-2">
                  <p className="text-xs text-slate-500">{t("roommate.page.inviteShareHint")}</p>
                  <div className="flex items-center gap-2">
                    <Input readOnly value={inviteResult.inviteUrl} className="flex-1 text-xs" />
                    <Button type="button" variant="outline" size="sm" onClick={() => copyLink(inviteResult.inviteUrl!)}>
                      {copied ? <><Check className="h-3 w-3" />{t("roommate.page.copied")}</> : <><Copy className="h-3 w-3" />{t("roommate.page.copyLink")}</>}
                    </Button>
                  </div>
                  {inviteResult.dmSent && <p className="text-xs text-emerald-600">{t("roommate.page.inviteSentInChat")}</p>}
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="overflow-hidden">
        {members.map((m) => (
          <div key={m.id} className="flex items-center gap-3 px-4 py-3 border-b last:border-b-0 hover:bg-slate-50">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-sm font-bold shrink-0">
              {(m.user.fullName ?? m.user.telegramUsername ?? "?").charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">{m.user.fullName ?? m.user.telegramUsername ?? "Member"}</p>
              <p className="text-xs text-slate-500">{t("roommate.page.joinedOn", { date: new Date(m.joinedAt).toLocaleDateString() })}</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {m.role === "owner" && <Crown className="h-4 w-4 text-amber-500" />}
              {m.role === "admin" && <Shield className="h-4 w-4 text-emerald-500" />}
              <Badge variant="secondary" className="capitalize">{m.role}</Badge>
            </div>
          </div>
        ))}
      </Card>

      {myRole === "owner" && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-red-800">{t("common.delete")} {t("roommate.page.groupName")}</h3>
            <p className="text-xs text-red-600 mt-1">This will permanently delete the group and all expenses, loans, and settlements.</p>
            <Button
              onClick={deleteGroup}
              disabled={deleting}
              variant="destructive"
              size="sm"
              className="mt-3 inline-flex items-center gap-1.5"
            >
              <Trash2 className="h-4 w-4" />
              {deleting ? t("common.deleting") : t("common.delete")}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
