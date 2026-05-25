"use client";

import { useEffect, useState } from "react";
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
import { CheckCircle2, Loader2, MessageCircle, Send } from "lucide-react";
import { useI18n } from "@/i18n/provider";

export default function VerifyPage() {
  const router = useRouter();
  const { t } = useI18n();
  const params = useSearchParams();
  const userId = params.get("userId") ?? "";
  const token = params.get("token") ?? "";
  const botUsername = params.get("bot") ?? "";

  const [linked, setLinked] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Poll link status every 2 seconds until linked
  useEffect(() => {
    if (linked || (!token && !userId)) return;
    const params = new URLSearchParams();
    if (token) params.set("token", token);
    if (userId) params.set("userId", userId);
    const url = `/api/telegram/link-status?${params.toString()}`;

    const check = async () => {
      try {
        const res = await fetch(url);
        const data = await res.json();
        if (data.linked) setLinked(true);
      } catch {
        /* ignore */
      }
    };
    // Run once immediately so an already-linked user doesn't wait 2s
    check();
    const interval = setInterval(check, 2000);
    return () => clearInterval(interval);
  }, [linked, token, userId]);

  const deepLink = botUsername
    ? `https://t.me/${botUsername}?start=${token}`
    : null;

  async function sendOtp() {
    setError(null);
    setSending(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t("auth.verificationFailed"));
        return;
      }
      setOtpSent(true);
    } catch {
      setError(t("common.networkError"));
    } finally {
      setSending(false);
    }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        const reason = data.error;
        const messages: Record<string, string> = {
          invalid_code: t("auth.wrongCode"),
          expired: t("auth.codeExpired"),
          too_many_attempts: t("auth.tooManyAttempts"),
          no_otp: t("auth.noOtp"),
        };
        setError(messages[reason] || t("auth.verificationFailed"));
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError(t("common.networkError"));
    } finally {
      setSubmitting(false);
    }
  }

  if (!userId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("auth.verifyMissing")}</CardTitle>
          <CardDescription>{t("auth.verifyMissingHint")}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("auth.verifyTitle")}</CardTitle>
        <CardDescription>{t("auth.verifyTwoSteps")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Step 1 */}
        <div
          className={`rounded-xl border p-4 ${
            linked ? "border-emerald-500/20 bg-emerald-500/10" : "border-[var(--glass-border)] bg-[var(--glass-bg)]"
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`h-6 w-6 flex items-center justify-center rounded-full text-xs font-semibold ${
                linked
                  ? "gradient-income text-white"
                  : "bg-[var(--glass-strong-bg)] text-[var(--muted)]"
              }`}
            >
              {linked ? <CheckCircle2 className="h-4 w-4" /> : "1"}
            </span>
            <span className="font-medium">{t("auth.stepLink")}</span>
          </div>

          {!linked && (
            <>
              <p className="text-sm text-[var(--muted)] mb-3">{t("auth.linkBotHint")}</p>
              {deepLink ? (
                <Button asChild className="w-full">
                  <a href={deepLink} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="h-4 w-4" />
                    {t("auth.openBot")}
                  </a>
                </Button>
              ) : botUsername ? (
                <Button asChild className="w-full" variant="outline">
                  <a
                    href={`https://t.me/${botUsername}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="h-4 w-4" />
                    {t("auth.openBot")} @{botUsername}
                  </a>
                </Button>
              ) : null}
              <div className="mt-3 flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                <Loader2 className="h-3 w-3 animate-spin" />
                {t("auth.waitingLink")}
              </div>
            </>
          )}

          {linked && (
            <p className="text-sm text-emerald-300">{t("auth.linkedSuccess")}</p>
          )}
        </div>

        {/* Step 2 */}
        <div
          className={`rounded-xl border p-4 ${
            !linked
              ? "opacity-50 border-[var(--glass-border)] bg-[var(--glass-bg)]"
              : "border-[var(--glass-border)] bg-[var(--glass-bg)]"
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="h-6 w-6 flex items-center justify-center rounded-full text-xs font-semibold bg-[var(--glass-strong-bg)] text-[var(--muted)]">
              2
            </span>
            <span className="font-medium">{t("auth.stepOtp")}</span>
          </div>

          {!otpSent ? (
            <Button
              onClick={sendOtp}
              disabled={!linked || sending}
              variant="outline"
              className="w-full"
            >
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> {t("auth.sending")}
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" /> {t("auth.sendOtp")}
                </>
              )}
            </Button>
          ) : (
            <form onSubmit={verify} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="code">{t("auth.sixDigit")}</Label>
                <Input
                  id="code"
                  inputMode="numeric"
                  pattern="\d{6}"
                  maxLength={6}
                  required
                  placeholder="123456"
                  value={code}
                  onChange={(e) =>
                    setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                />
              </div>
              <Button
                type="submit"
                disabled={submitting || code.length !== 6}
                className="w-full"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> {t("auth.verifying")}
                  </>
                ) : (
                  t("auth.verifyContinue")
                )}
              </Button>
              <button
                type="button"
                onClick={sendOtp}
                disabled={sending}
                className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors w-full"
              >
                {t("auth.resend")}
              </button>
            </form>
          )}
        </div>

        {error && (
          <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm px-3 py-2">
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
