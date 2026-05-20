"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useI18n } from "@/i18n/provider";
import { Users, Lock, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function GroupLoginPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const { t } = useI18n();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch(`/api/roommate/groups/${groupId}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        telegramUsername: username.replace(/^@/, ""),
        password,
      }),
    });

    setLoading(false);
    if (res.ok) {
      window.location.href = `/groups/${groupId}`;
      return;
    }

    const data = await res.json().catch(() => ({}));
    setError(data.error || t("roommate.page.invalidCredentials"));
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
            <Users className="h-6 w-6 text-emerald-600" />
          </div>
          <CardTitle className="text-lg">{t("roommate.page.groupLogin")}</CardTitle>
          <CardDescription>{t("roommate.page.loginHint")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="telegramUsername">{t("roommate.page.telegramUsername")}</Label>
              <Input
                id="telegramUsername"
                required
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="@username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="groupPassword" className="flex items-center gap-2">
                <Lock className="h-3.5 w-3.5" />
                {t("roommate.page.groupPassword")}
              </Label>
              <Input
                id="groupPassword"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <div className="rounded-md bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
                {error}
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> {t("common.loading")}
                </>
              ) : (
                t("auth.login")
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-emerald-600"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {t("auth.haveAccount")}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
