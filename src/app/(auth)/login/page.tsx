"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
import { Loader2 } from "lucide-react";
import { useI18n } from "@/i18n/provider";

function hasSuspendedCookie() {
  if (typeof document === "undefined") return false;
  return document.cookie.split("; ").some((c) => c.startsWith("suspended_account="));
}

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/dashboard";
  const { t } = useI18n();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if user arrived here because their session was suspended
  useEffect(() => {
    if (hasSuspendedCookie()) {
      router.push("/suspended");
    }
  }, [router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === "account_suspended") {
          router.push("/suspended");
          return;
        }
        if (data.code === "not_verified" && data.userId) {
          const params = new URLSearchParams({ userId: data.userId });
          if (data.botUsername) params.set("bot", data.botUsername);
          router.push(`/verify?${params.toString()}`);
          return;
        }
        setError(data.error || t("auth.loginFailed"));
        return;
      }
      // Store token in localStorage for Telegram WebView compatibility
      if (data.token && typeof window !== "undefined") {
        localStorage.setItem("ethiobudget_token", data.token);
      }
      router.push(next);
      router.refresh();
    } catch {
      setError(t("common.networkError"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("auth.welcomeBack")}</CardTitle>
        <CardDescription>{t("auth.loginSubtitle")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="identifier">{t("auth.phoneOrTelegram")}</Label>
            <Input
              id="identifier"
              required
              placeholder="0911234567 / @username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t("auth.password")}</Label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm px-3 py-2">
              {error}
            </div>
          )}

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> {t("auth.loggingIn")}
              </>
            ) : (
              t("auth.login")
            )}
          </Button>

          <p className="text-center">
            <Link
              href="/forgot-password"
              className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              {t("auth.forgotPassword")}
            </Link>
          </p>
        </form>

        <p className="mt-4 text-sm text-slate-400 text-center">
          {t("auth.noAccount")}{" "}
          <Link href="/signup" className="text-emerald-400 hover:text-emerald-300 transition-colors">
            {t("auth.signup")}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
