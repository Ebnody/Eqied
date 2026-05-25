"use client";

import { useEffect, useMemo, useState } from "react";
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
} from "@/lib/categories";
import { fromSantim } from "@/lib/utils";
import { Loader2, CheckCircle2, AlertCircle, Wand2 } from "lucide-react";
import { useI18n } from "@/i18n/provider";

function getUrlToken(): string | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  return params.get("t");
}

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (typeof window !== "undefined") {
    // Check URL token first (from bot-generated link), then localStorage
    const urlToken = getUrlToken();
    const storedToken = localStorage.getItem("ethiobudget_token");
    const token = urlToken || storedToken;
    if (token) {
      headers["x-ethiobudget-token"] = token;
      // Persist URL token to localStorage for future requests
      if (urlToken && urlToken !== storedToken) {
        localStorage.setItem("ethiobudget_token", urlToken);
      }
    }
  }
  return headers;
}

type ParseResult = {
  ok: boolean;
  provider: string;
  type: "income" | "expense" | null;
  amountSantim: number | null;
  counterparty: string | null;
  reference: string | null;
};

type WebApp = {
  initData: string;
  ready: () => void;
  expand: () => void;
  close: () => void;
  themeParams?: Record<string, string>;
  HapticFeedback?: {
    notificationOccurred: (type: "success" | "error" | "warning") => void;
    impactOccurred: (style: "light" | "medium" | "heavy") => void;
  };
  MainButton?: {
    text: string;
    show: () => void;
    hide: () => void;
    enable: () => void;
    disable: () => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
    setText: (t: string) => void;
  };
};

declare global {
  interface Window {
    Telegram?: { WebApp?: WebApp };
  }
}

function fmtETB(santim: number) {
  return new Intl.NumberFormat("en-ET", {
    style: "currency",
    currency: "ETB",
    minimumFractionDigits: 2,
  })
    .format(fromSantim(santim))
    .replace("ETB", "ETB");
}

export function MiniAppClient() {
  const { t } = useI18n();
  const [initData, setInitData] = useState<string | null>(null);
  const [tgState, setTgState] = useState<
    "loading" | "outside" | "no-init-data" | "ready"
  >("loading");
  const [text, setText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [result, setResult] = useState<ParseResult | null>(null);
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [categoryKey, setCategoryKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const cats = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const [debug, setDebug] = useState<string>("init");

  // Telegram passes initData via the URL hash (e.g. #tgWebAppData=...).
  // We read it directly so we don't depend on telegram-web-app.js loading.
  // The script is still loaded for nicety features (haptics, MainButton) but
  // the core auth flow works without it.
  useEffect(() => {
    function readInitDataFromHash(): string | null {
      try {
        const hash = window.location.hash.startsWith("#")
          ? window.location.hash.slice(1)
          : window.location.hash;
        if (!hash) return null;
        const params = new URLSearchParams(hash);
        const data = params.get("tgWebAppData");
        return data && data.length > 0 ? data : null;
      } catch {
        return null;
      }
    }

    function readInitDataFromObject(): string | null {
      const tg = window.Telegram?.WebApp;
      if (tg?.initData && tg.initData.length > 0) return tg.initData;
      return null;
    }

    // Inject Telegram's script for nicety features (haptics, MainButton).
    // We don't BLOCK on it.
    if (!document.querySelector('script[src*="telegram-web-app.js"]')) {
      const s = document.createElement("script");
      s.src = "https://telegram.org/js/telegram-web-app.js";
      s.async = true;
      s.onerror = () => setDebug((d) => `${d} | script-err`);
      s.onload = () => {
        const tg = window.Telegram?.WebApp;
        try {
          tg?.ready();
          tg?.expand();
        } catch {
          /* ignore */
        }
        setDebug((d) => `${d} | script-ok`);
      };
      document.head.appendChild(s);
    }

    // FAST PATH: if we have a token from the bot (?t=...), show form immediately
    // Token-based auth is our primary flow now.
    const urlToken = getUrlToken();
    if (urlToken) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTgState("ready");
      setDebug("token-auth");
      return;
    }

    // Try hash first — this is set by Telegram when opening the Mini App.
    const fromHash = readInitDataFromHash();
    if (fromHash) {
      setInitData(fromHash);
      setTgState("ready");
      setDebug("hash");
      return;
    }
    const fromObject = readInitDataFromObject();
    if (fromObject) {
      setInitData(fromObject);
      setTgState("ready");
      setDebug("object");
      return;
    }

    // Brief poll for late-arriving WebApp object (some clients).
    let cancelled = false;
    let elapsed = 0;
    const interval = 200;
    const maxWait = 1500; // reduced since token is primary auth
    const tick = () => {
      if (cancelled) return;
      const data = readInitDataFromHash() ?? readInitDataFromObject();
      if (data) {
        setInitData(data);
        setTgState("ready");
        return;
      }
      setDebug(
        `wait ${elapsed}ms · hash=${window.location.hash.length} · tg=${!!window.Telegram?.WebApp}`
      );
      if (elapsed >= maxWait) {
        // Telegram WebApp exists but no initData → still show the form.
        // We fall back to cookie-based session auth on the server.
        if (window.Telegram?.WebApp) {
          setTgState("ready");
          setDebug("webapp-no-init");
        } else {
          setTgState("outside");
        }
        return;
      }
      elapsed += interval;
      setTimeout(tick, interval);
    };
    setTimeout(tick, 100);
    return () => {
      cancelled = true;
    };
  }, []);

  async function onParse() {
    setParsing(true);
    setMessage(null);
    try {
      const res = await fetch("/api/miniapp/parse", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ initData, text }),
      });
      const data = (await res.json()) as ParseResult & { error?: string };
      if (!res.ok) {
        setMessage({ kind: "err", text: data.error || t("common.failedToSave") });
        return;
      }
      setResult(data);
      if (data.type) {
        setType(data.type);
        setCategoryKey(data.type === "income" ? (INCOME_CATEGORIES[0]?.key ?? "") : (EXPENSE_CATEGORIES[0]?.key ?? ""));
      }
      if (data.amountSantim) setAmount(String(fromSantim(data.amountSantim)));
    } catch {
      setMessage({ kind: "err", text: t("common.networkError") });
    } finally {
      setParsing(false);
    }
  }

  async function onSave() {
    if (!categoryKey) {
      setMessage({ kind: "err", text: t("miniapp.pickCategory") });
      return;
    }
    const amountEtb = Number(amount);
    if (!amountEtb || amountEtb <= 0) {
      setMessage({ kind: "err", text: t("miniapp.invalidAmount") });
      return;
    }
    setSaving(true);
    setMessage(null);
    const payload = {
      initData: initData || undefined,
      text: text || undefined,
      type,
      amountEtb,
      categoryKey,
      counterparty: result?.counterparty ?? undefined,
    };
    console.log("[miniapp-save] payload:", payload);
    try {
      const res = await fetch("/api/miniapp/save", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "duplicate") {
          setMessage({ kind: "err", text: t("miniapp.duplicate") });
        } else if (data.error === "not_linked") {
          setMessage({ kind: "err", text: t("miniapp.notLinked") });
        } else if (data.error === "not_verified") {
          setMessage({ kind: "err", text: t("miniapp.notVerified") });
        } else if (data.error === "validation" && data.issues?.length) {
          setMessage({ kind: "err", text: `Validation: ${data.issues.join(", ")}` });
        } else {
          setMessage({ kind: "err", text: data.error || t("common.failedToSave") });
        }
        window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred("error");
        return;
      }
      setMessage({ kind: "ok", text: t("miniapp.saved") });
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred("success");
      // Reset for another entry
      setText("");
      setAmount("");
      setResult(null);
    } catch {
      setMessage({ kind: "err", text: t("common.networkError") });
    } finally {
      setSaving(false);
    }
  }

  const canSave = useMemo(
    () => !!amount && !!categoryKey && !saving,
    [amount, categoryKey, saving]
  );

  if (tgState === "loading") {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 bg-[var(--background)]">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 text-[var(--muted)] text-sm mb-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("miniapp.loading")}
          </div>
          <p className="text-xs text-[var(--muted-foreground)]">debug: {debug}</p>
          <button
            onClick={() => setTgState("no-init-data")}
            className="mt-4 text-xs text-[var(--accent)] underline"
          >
            {t("miniapp.stuck")}
          </button>
        </div>
      </main>
    );
  }

  if (tgState === "outside") {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 bg-[var(--background)]">
        <div className="max-w-sm rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-6 shadow-sm text-center">
          <AlertCircle className="h-8 w-8 mx-auto text-[var(--warning)] mb-3" />
          <h1 className="text-lg font-semibold mb-1 text-[var(--foreground)]">{t("miniapp.openInTelegram")}</h1>
          <p className="text-sm text-[var(--muted)]">{t("miniapp.openInTelegramHint")}</p>
        </div>
      </main>
    );
  }

  if (tgState === "no-init-data") {
    const tg = typeof window !== "undefined" ? window.Telegram?.WebApp : undefined;
    const tgInfo = tg
      ? {
          hasWebApp: true,
          hasInitData: !!tg.initData && tg.initData.length > 0,
          initDataLen: tg.initData?.length ?? 0,
          version: (tg as unknown as { version?: string }).version ?? "?",
          platform: (tg as unknown as { platform?: string }).platform ?? "?",
        }
      : { hasWebApp: false };
    const hashLen =
      typeof window !== "undefined" ? window.location.hash.length : 0;
    let hashKeys: string[] = [];
    let hashSample = "";
    if (typeof window !== "undefined" && window.location.hash) {
      const raw = window.location.hash.startsWith("#")
        ? window.location.hash.slice(1)
        : window.location.hash;
      hashSample = raw.slice(0, 200);
      try {
        hashKeys = [...new URLSearchParams(raw).keys()];
      } catch {
        /* ignore */
      }
    }
    return (
      <main className="min-h-screen flex items-center justify-center p-6 bg-[var(--background)]">
        <div className="max-w-sm rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-6 shadow-sm text-center">
          <AlertCircle className="h-8 w-8 mx-auto text-[var(--warning)] mb-3" />
          <h1 className="text-lg font-semibold mb-1 text-[var(--foreground)]">{t("miniapp.updateTelegram")}</h1>
          <p className="text-sm text-[var(--muted)]">{t("miniapp.updateTelegramHint")}</p>
          <pre className="mt-4 text-[10px] text-left bg-[var(--glass-bg)] rounded p-2 overflow-auto whitespace-pre-wrap text-[var(--foreground)]">
{JSON.stringify({ debug, hashLen, hashKeys, hashSample, ...tgInfo }, null, 2)}
          </pre>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 text-xs text-[var(--accent)] underline"
          >
            Reload
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--background)] p-4 pb-10">
      <div className="max-w-md mx-auto space-y-4">
        <header>
          <h1 className="text-xl font-bold text-[var(--foreground)]">{t("miniapp.title")}</h1>
          <p className="text-xs text-[var(--muted)]">{t("miniapp.subtitle")}</p>
        </header>

        <section className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-4 shadow-sm space-y-3">
          <label className="text-sm font-medium text-[var(--muted-foreground)]">
            {t("miniapp.pasteLabel")}
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            placeholder={t("miniapp.smsPlaceholder")}
            className="w-full rounded-md border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--input-text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] resize-none placeholder:text-[var(--input-placeholder)]"
          />
          <button
            onClick={onParse}
            disabled={!text.trim() || parsing}
            className="w-full inline-flex items-center justify-center gap-2 rounded-md gradient-accent text-white text-sm font-medium px-3 py-2 disabled:opacity-50 hover:opacity-90 transition-all"
          >
            {parsing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> {t("miniapp.parsing")}
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4" /> {t("miniapp.detect")}
              </>
            )}
          </button>
          {result && (
            <div
              className={`rounded-md border px-3 py-2 text-xs ${
                result.ok
                  ? "bg-[var(--accent)]/10 border-[var(--accent)]/20 text-[var(--accent)]"
                  : "bg-[var(--warning)]/10 border-[var(--warning)]/20 text-[var(--warning)]"
              }`}
            >
              {result.ok ? (
                <>
                  ✓ <strong>{result.type}</strong> ·{" "}
                  {result.amountSantim
                    ? fmtETB(result.amountSantim)
                    : "no amount"}{" "}
                  · provider: {result.provider}
                  {result.reference && (
                    <span className="block opacity-80">
                      Ref: {result.reference}
                    </span>
                  )}
                </>
              ) : (
                <>{t("miniapp.cantDetect")}</>
              )}
            </div>
          )}
        </section>

        <section className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-4 shadow-sm space-y-4">
          <div>
            <label className="text-sm font-medium text-[var(--muted-foreground)] mb-1.5 block">
              {t("miniapp.type")}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => { setType("expense"); setCategoryKey(EXPENSE_CATEGORIES[0]?.key ?? ""); }}
                className={`rounded-md py-2 text-sm font-medium transition-colors ${
                  type === "expense"
                    ? "gradient-expense text-white"
                    : "bg-[var(--glass-bg)] text-[var(--muted-foreground)] hover:bg-[var(--glass-strong-bg)]"
                }`}
              >
                {t("miniapp.expense")}
              </button>
              <button
                type="button"
                onClick={() => { setType("income"); setCategoryKey(INCOME_CATEGORIES[0]?.key ?? ""); }}
                className={`rounded-md py-2 text-sm font-medium transition-colors ${
                  type === "income"
                    ? "gradient-income text-white"
                    : "bg-[var(--glass-bg)] text-[var(--muted-foreground)] hover:bg-[var(--glass-strong-bg)]"
                }`}
              >
                {t("miniapp.income")}
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="amount"
              className="text-sm font-medium text-[var(--muted-foreground)] mb-1.5 block"
            >
              {t("miniapp.amountLabel")}
            </label>
            <input
              id="amount"
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-md border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2 text-base text-[var(--input-text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] placeholder:text-[var(--input-placeholder)]"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-[var(--muted-foreground)] mb-1.5 block">
              {t("miniapp.categoryLabel")}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {cats.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setCategoryKey(c.key)}
                  className={`text-xs px-2.5 py-1.5 rounded-full transition-colors ${
                    categoryKey === c.key
                      ? "gradient-accent text-white"
                      : "bg-[var(--glass-bg)] text-[var(--muted-foreground)] hover:bg-[var(--glass-strong-bg)]"
                  }`}
                >
                  {c.emoji} {c.name}
                </button>
              ))}
            </div>
          </div>

          {message && (
            <div
              className={`rounded-md border px-3 py-2 text-sm ${
                message.kind === "ok"
                  ? "bg-[var(--accent)]/10 border-[var(--accent)]/20 text-[var(--accent)]"
                  : "bg-[var(--danger)]/10 border-[var(--danger)]/20 text-[var(--danger)]"
              }`}
            >
              {message.kind === "ok" ? (
                <CheckCircle2 className="inline h-4 w-4 mr-1" />
              ) : (
                <AlertCircle className="inline h-4 w-4 mr-1" />
              )}
              {message.text}
            </div>
          )}

          <button
            onClick={onSave}
            disabled={!canSave}
            className="w-full inline-flex items-center justify-center gap-2 rounded-md gradient-accent text-white text-sm font-medium px-3 py-3 disabled:opacity-50 hover:opacity-90 transition-all"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> {t("miniapp.saving")}
              </>
            ) : (
              <>{t("miniapp.saveBtn")}</>
            )}
          </button>
        </section>
      </div>
    </main>
  );
}
