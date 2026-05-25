import { requireUser } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, MessageCircle, Globe, Lock, AlertTriangle } from "lucide-react";
import { getServerT } from "@/i18n/server";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ChangePasswordForm } from "./change-password-form";
import { ResetDataForm } from "./reset-data-form";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireUser();
  const { t } = await getServerT({ userPreferredLocale: user.preferredLocale });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">{t("settings.title")}</h1>
      </div>

      <div className="glass rounded-2xl border border-[var(--glass-border)] p-5">
        <h2 className="font-semibold text-[var(--foreground)] mb-4">{t("settings.profile")}</h2>
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-[var(--muted)]">{t("auth.fullName")}</dt>
            <dd className="font-medium text-[var(--foreground)]">{user.fullName ?? "—"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-[var(--muted)]">{t("auth.phone")}</dt>
            <dd className="font-medium text-[var(--foreground)]">{user.phone ?? "—"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-[var(--muted)]">{t("auth.telegramUsername")}</dt>
            <dd className="font-medium text-[var(--foreground)]">
              {user.telegramUsername ? `@${user.telegramUsername}` : "—"}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-[var(--muted)]">{t("auth.verify")}</dt>
            <dd>
              {user.isVerified ? (
                <Badge variant="default">
                  <CheckCircle2 className="h-3 w-3" />
                  {t("common.success")}
                </Badge>
              ) : (
                <Badge variant="warning">{t("settings.notLinked")}</Badge>
              )}
            </dd>
          </div>
        </dl>
      </div>

      <div className="glass rounded-2xl border border-[var(--glass-border)] p-5">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="h-4 w-4 text-[var(--muted)]" />
          <h2 className="font-semibold text-[var(--foreground)]">Security</h2>
        </div>
        <ChangePasswordForm />
      </div>

      <div className="glass rounded-2xl border border-[var(--glass-border)] p-5">
        <div className="flex items-center gap-2 mb-2">
          <Globe className="h-4 w-4 text-[var(--muted)]" />
          <h2 className="font-semibold text-[var(--foreground)]">{t("settings.languageSection")}</h2>
        </div>
        <p className="text-xs text-[var(--muted)] mb-4">{t("settings.languageHint")}</p>
        <div className="max-w-xs">
          <LocaleSwitcher />
        </div>
      </div>

      <div className="glass rounded-2xl border border-[var(--glass-border)] p-5">
        <h2 className="font-semibold text-[var(--foreground)] mb-4">{t("settings.telegramLink")}</h2>
        {user.telegramLink ? (
          <div className="flex items-start gap-3">
            <MessageCircle className="h-5 w-5 text-emerald-400 mt-0.5" />
            <div>
              <p className="font-medium text-[var(--foreground)]">
                {t("settings.linked")}
                {user.telegramLink.username ? ` — @${user.telegramLink.username}` : ""}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-[var(--muted)]">{t("settings.notLinked")}</p>
        )}
      </div>

      <div className="glass rounded-2xl border border-[var(--glass-border)] p-5">
        <h2 className="font-semibold text-[var(--foreground)] mb-2">{t("settings.currency")}</h2>
        <p className="text-sm text-[var(--muted)]">
          <strong className="text-[var(--foreground)]">ETB</strong>
        </p>
      </div>

      <div className="glass rounded-2xl border border-rose-500/20 p-5">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="h-4 w-4 text-rose-400" />
          <h2 className="font-semibold text-rose-300">Danger zone</h2>
        </div>
        <p className="text-xs text-[var(--muted)] mb-4">
          Erase your transactions, budgets, salaries, forwarded SMS, and
          notifications. Your account stays — only the financial data is wiped.
        </p>
        <ResetDataForm />
      </div>
    </div>
  );
}
