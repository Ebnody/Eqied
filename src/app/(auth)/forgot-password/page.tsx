"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { useI18n } from "@/i18n/provider";

type Step = "request" | "reset";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { t } = useI18n();

  const [step, setStep] = useState<Step>("request");
  const [identifier, setIdentifier] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function requestCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "telegram_not_linked") {
          setError(
            "This account doesn't have a linked Telegram. Please sign up again or contact support."
          );
        } else if (data.error === "not_verified") {
          setError(
            "This account isn't verified yet. Please complete the OTP step from signup first."
          );
        } else {
          setError(data.error || "Could not send reset code");
        }
        return;
      }
      // Generic success (no userId) means the account didn't exist; pretend success anyway.
      if (!data.userId) {
        setInfo(
          "If an account exists for that phone or username, a reset code has been sent to its linked Telegram."
        );
        return;
      }
      setUserId(data.userId);
      setStep("reset");
      setInfo("We sent a 6-digit code to your Telegram. It expires in 10 minutes.");
    } catch {
      setError(t("common.networkError"));
    } finally {
      setSubmitting(false);
    }
  }

  async function resetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (!userId) {
      setError("Missing userId");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, code, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        const reason = data.error;
        const messages: Record<string, string> = {
          invalid_code: "Wrong code",
          expired: "Code expired. Request a new one.",
          too_many_attempts: "Too many attempts. Request a new code.",
          no_otp: "No active reset code. Request a new one.",
        };
        setError(messages[reason] || data.error || "Could not reset password");
        return;
      }
      router.push("/login?reset=1");
    } catch {
      setError(t("common.networkError"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reset password</CardTitle>
        <CardDescription>
          {step === "request"
            ? "Enter your phone or Telegram username. We'll send a 6-digit code to your linked Telegram."
            : "Enter the code from Telegram and choose a new password."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {step === "request" ? (
          <form onSubmit={requestCode} className="space-y-4">
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

            {error && (
              <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm px-3 py-2">
                {error}
              </div>
            )}
            {info && (
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm px-3 py-2">
                {info}
              </div>
            )}

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" /> Send reset code
                </>
              )}
            </Button>
          </form>
        ) : (
          <form onSubmit={resetPassword} className="space-y-4">
            {info && (
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm px-3 py-2 flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{info}</span>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="code">6-digit code</Label>
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
            <div className="space-y-2">
              <Label htmlFor="newPassword">New password</Label>
              <Input
                id="newPassword"
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
              />
              <p className="text-xs text-slate-500">Minimum 8 characters</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm new password</Label>
              <Input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>

            {error && (
              <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm px-3 py-2">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={submitting || code.length !== 6}
              className="w-full"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Resetting...
                </>
              ) : (
                "Reset password"
              )}
            </Button>
            <button
              type="button"
              onClick={() => {
                setStep("request");
                setCode("");
                setNewPassword("");
                setConfirmPassword("");
                setError(null);
                setInfo(null);
              }}
              className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors w-full"
            >
              Use a different account
            </button>
          </form>
        )}

        <p className="mt-4 text-sm text-slate-400 text-center">
          Remembered it?{" "}
          <Link href="/login" className="text-emerald-400 hover:text-emerald-300 transition-colors">
            Back to login
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
