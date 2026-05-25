"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useI18n } from "@/i18n/provider";
import { Crown, Shield, Copy, Check, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Member { id: string; role: string; nickname: string | null; joinedAt: string; user: { id: string; fullName: string | null; telegramUsername: string | null; hasTelegram: boolean }; }

export default function GroupMembersClient({
  initialMembers,
  initialMyRole,
}: {
  initialMembers: Member[];
  initialMyRole: string;
}) {
  const { groupId } = useParams<{ groupId: string }>();
  const { t } = useI18n();
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [myRole, setMyRole] = useState(initialMyRole);
  const [inviteUsername, setInviteUsername] = useState("");
  const [inviteResult, setInviteResult] = useState<{ inviteUrl?: string | null; dmSent?: boolean } | null>(null);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/roommate/groups/${groupId}`).then((r) => r.json());
    setMembers(res.members ?? []);
    setMyRole(res.me?.role ?? "member");
  }, [groupId]);

  useEffect(() => {
    const es = new EventSource(`/api/roommate/groups/${groupId}/events`);
    es.addEventListener("member_changed", refresh);
    return () => es.close();
  }, [groupId, refresh]);

  async function sendInvite(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(`/api/roommate/groups/${groupId}/invites`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telegramUsername: inviteUsername }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (res.ok) {
      setInviteResult({ inviteUrl: data.inviteUrl, dmSent: data.dmSent });
      setInviteUsername("");
    } else {
      alert(data.error || "Failed");
    }
  }

  async function deleteGroup() {
    if (!confirm(t("roommate.page.confirmDeleteGroup"))) return;
    setDeleting(true);
    const res = await fetch(`/api/roommate/groups/${groupId}`, { method: "DELETE" });
    setDeleting(false);
    if (res.ok) {
      router.push("/groups");
    } else {
      alert("Failed");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-100">{t("roommate.page.members")}</h2>
        {myRole === "admin" && (
          <Button variant="destructive" size="sm" onClick={deleteGroup} disabled={deleting}>
            <Trash2 className="h-4 w-4 mr-1" />
            {t("roommate.page.deleteGroup")}
          </Button>
        )}
      </div>

      <Card className="border-white/10">
        <CardContent className="p-5 space-y-4">
          <form onSubmit={sendInvite} className="flex gap-3">
            <Input placeholder={t("roommate.page.invitePlaceholder")} value={inviteUsername} onChange={(e) => setInviteUsername(e.target.value)} />
            <Button type="submit" disabled={saving}>{saving ? t("common.sending") : t("common.invite")}</Button>
          </form>
          {inviteResult?.inviteUrl && (
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <span className="truncate">{inviteResult.inviteUrl}</span>
              <button onClick={() => { navigator.clipboard.writeText(inviteResult.inviteUrl!); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>
                {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-white/10">
        {members.map((m) => (
          <div key={m.id} className="flex items-center justify-between px-4 py-3 border-b border-white/10 last:border-b-0">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full gradient-accent flex items-center justify-center text-sm font-bold text-white">
                {(m.user.fullName ?? m.user.telegramUsername ?? "?").charAt(0)}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-200">{m.user.fullName ?? m.user.telegramUsername ?? "Member"}</p>
                <p className="text-xs text-slate-500">{m.nickname && <span className="mr-2">{m.nickname}</span>}{new Date(m.joinedAt).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {m.role === "admin" && <Badge variant="outline" className="border-amber-500/20 bg-amber-500/10 text-amber-400"><Crown className="h-3 w-3 mr-1" />{t("roommate.page.admin")}</Badge>}
              {m.user.hasTelegram && <Shield className="h-4 w-4 text-emerald-400" />}
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}
