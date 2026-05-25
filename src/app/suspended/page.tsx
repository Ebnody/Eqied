"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Ban, MessageCircle, ArrowLeft } from "lucide-react";

export default function SuspendedPage() {
  const router = useRouter();

  useEffect(() => {
    // Clear any stale suspended cookie
    document.cookie = "suspended_account=; path=/; max-age=0";
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] p-4">
      <div className="w-full max-w-md rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-strong-bg)] backdrop-blur-xl p-8 shadow-2xl text-center">
        <div className="mx-auto h-16 w-16 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-6">
          <Ban className="h-8 w-8 text-rose-400" />
        </div>

        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">
          Account Suspended
        </h1>
        <p className="text-sm text-[var(--muted)] mb-6">
          Your EthioBudget account has been suspended by an administrator.
          You can no longer access the app or your data.
        </p>

        <div className="rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] p-4 mb-6 text-left">
          <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2 flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-sky-400" />
            What you can do
          </h3>
          <ul className="space-y-2 text-sm text-[var(--muted)]">
            <li className="flex gap-2">
              <span className="text-sky-400">1.</span>
              <span>
                Contact support through the{" "}
                <strong className="text-[var(--foreground)]">Telegram bot</strong>{" "}
                if you believe this is a mistake.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-sky-400">2.</span>
              <span>
                An admin will review your case and respond through the bot.
              </span>
            </li>
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          <a
            href={`https://t.me/${process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ?? ""}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-sky-500 transition-colors"
          >
            <MessageCircle className="h-4 w-4" />
            Contact Support via Telegram
          </a>
          <button
            onClick={() => router.push("/login")}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-4 py-2.5 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--glass-strong-bg)] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}
