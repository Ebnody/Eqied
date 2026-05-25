"use client";

import { useState, useTransition } from "react";
import { Globe, Check, ChevronDown } from "lucide-react";
import { useI18n } from "@/i18n/provider";
import { LOCALES, LOCALE_LABELS, type Locale } from "@/i18n/config";
import { useRouter } from "next/navigation";

export function LocaleSwitcher({
  variant = "default",
}: {
  variant?: "default" | "compact";
}) {
  const { locale, t } = useI18n();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const current = LOCALE_LABELS[locale];

  function selectLocale(next: Locale) {
    setOpen(false);
    if (next === locale) return;
    startTransition(async () => {
      try {
        await fetch("/api/user/locale", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ locale: next }),
        });
        router.refresh();
      } catch {
        /* noop — keep current */
      }
    });
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={pending}
        className={`inline-flex items-center gap-2 rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--glass-strong-bg)] transition-colors ${
          variant === "compact" ? "w-auto" : "w-full justify-between"
        } disabled:opacity-50`}
        aria-label={t("common.selectLanguage")}
      >
        <span className="inline-flex items-center gap-2">
          <Globe className="h-4 w-4 text-slate-500" />
          <span>{current.native}</span>
        </span>
        <ChevronDown className="h-4 w-4 text-slate-400" />
      </button>

      {open && (
        <>
          {/* click-away overlay */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute right-0 z-20 mt-1 w-48 overflow-hidden rounded-xl border border-[var(--card-border)] bg-[var(--background)] shadow-lg">
            <ul role="listbox" className="py-1">
              {LOCALES.map((code) => {
                const label = LOCALE_LABELS[code];
                const isCurrent = code === locale;
                return (
                  <li key={code}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={isCurrent}
                      onClick={() => selectLocale(code)}
                      className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-left hover:bg-white/5 transition-colors ${
                        isCurrent ? "bg-emerald-500/10 text-emerald-300" : "text-slate-200"
                      }`}
                    >
                      <span>
                        <span className="font-medium">{label.native}</span>
                        {label.native !== label.english && (
                          <span className="ml-2 text-xs text-slate-500">
                            {label.english}
                          </span>
                        )}
                      </span>
                      {isCurrent && (
                        <Check className="h-4 w-4 text-emerald-400" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
