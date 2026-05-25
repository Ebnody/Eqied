"use client";

import { useEffect, useState } from "react";
import Script from "next/script";

// This page is opened from the Telegram bot via web_app inline buttons.
// It reads Telegram.WebApp.initData, exchanges it for a session cookie,
// and then redirects to the requested page (?next=/dashboard etc).
export default function TgLoginPage() {
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    function getNext(): string {
      if (typeof window === "undefined") return "/dashboard";
      const params = new URLSearchParams(window.location.search);
      const next = params.get("next") || "/dashboard";
      // only allow same-origin paths
      if (!next.startsWith("/") || next.startsWith("//")) return "/dashboard";
      return next;
    }

    async function exchange() {
      try {
        type TgWebApp = {
          initData?: string;
          ready?: () => void;
          expand?: () => void;
        };
        const tg: TgWebApp | null =
          typeof window !== "undefined"
            ? ((window as unknown as { Telegram?: { WebApp?: TgWebApp } })
                .Telegram?.WebApp ?? null)
            : null;
        const initData: string | undefined = tg?.initData;
        if (!initData) {
          setErrorMsg(
            "This page must be opened from the Telegram bot. Please tap the button inside Telegram."
          );
          setStatus("error");
          return;
        }
        try {
          tg?.ready?.();
          tg?.expand?.();
        } catch {
          /* ignore */
        }

        const res = await fetch("/api/auth/tg-init", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ initData }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          const reason = data?.error ?? `HTTP ${res.status}`;
          setErrorMsg(`Could not sign you in (${reason}).`);
          setStatus("error");
          return;
        }

        // Replace so the back button doesn't return to this bridge page.
        window.location.replace(getNext());
      } catch (err) {
        setErrorMsg(
          err instanceof Error ? err.message : "Unexpected error during sign-in."
        );
        setStatus("error");
      }
    }

    // Give the Telegram SDK a tick to attach.
    const id = window.setTimeout(exchange, 50);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <>
      <Script
        src="https://telegram.org/js/telegram-web-app.js"
        strategy="beforeInteractive"
      />
      <main className="min-h-screen flex items-center justify-center bg-[var(--background)] p-6">
        <div className="w-full max-w-sm rounded-2xl bg-[var(--card)] p-6 shadow-sm border border-[var(--card-border)] text-center">
          {status === "loading" && (
            <>
              <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
              <p className="text-[var(--foreground)] font-medium">Signing you in...</p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Connecting your Telegram account.
              </p>
            </>
          )}
          {status === "error" && (
            <>
              <div className="mx-auto mb-3 h-10 w-10 flex items-center justify-center rounded-full bg-[var(--danger)]/10 text-[var(--danger)] text-xl">
                !
              </div>
              <p className="text-[var(--foreground)] font-semibold">Sign-in failed</p>
              <p className="mt-1 text-sm text-[var(--muted)]">{errorMsg}</p>
            </>
          )}
        </div>
      </main>
    </>
  );
}
