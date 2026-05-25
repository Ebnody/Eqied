import Link from "next/link";
import {
  Wallet,
  MessageCircle,
  PieChart,
  Receipt,
  Shield,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getServerT } from "@/i18n/server";
import { LocaleSwitcher } from "@/components/locale-switcher";

export default async function Home() {
  const { t } = await getServerT();

  return (
    <div className="flex-1 flex flex-col bg-background min-h-screen relative overflow-hidden">
      {/* Ambient gradient orbs */}
      <div className="fixed top-0 left-1/3 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[128px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/3 w-[400px] h-[400px] bg-violet-500/5 rounded-full blur-[128px] pointer-events-none" />

      <header className="border-b border-[var(--glass-border)] glass sticky top-0 z-10 relative">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold gradient-text">
            <Wallet className="h-5 w-5 text-emerald-400" />
            EthioBudget
          </div>
          <nav className="flex items-center gap-2">
            <LocaleSwitcher variant="compact" />
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">{t("auth.login")}</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/signup">
                {t("auth.signup")} <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </nav>
        </div>
      </header>

      <section className="flex-1 max-w-6xl mx-auto px-4 py-16 md:py-24 grid md:grid-cols-2 gap-12 items-center">
        <div className="relative z-10">
          <span className="inline-block bg-emerald-500/15 text-emerald-300 text-xs font-medium px-3 py-1 rounded-full mb-4 border border-emerald-500/20">
            {t("landing.tag")}
          </span>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight text-[var(--foreground)]">
            {t("landing.hero")}
          </h1>
          <p className="mt-4 text-lg text-[var(--muted)] max-w-md">
            {t("landing.heroSub")}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/signup">
                {t("landing.cta")} <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/login">{t("landing.haveAccount")}</Link>
            </Button>
          </div>
        </div>

        <div className="glass rounded-2xl border border-[var(--glass-border)] p-6 relative z-10">
          <div className="space-y-4">
            <div className="bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl p-4">
              <p className="text-xs text-[var(--muted)]">→ Telegram</p>
              <p className="mt-1 text-sm text-[var(--foreground)]">
                You have transferred ETB 1,200.00 to Abebe Kebede.
                Transaction No: TLB12345.
              </p>
            </div>
            <div className="gradient-accent text-white rounded-xl p-4">
              <p className="text-xs opacity-80">🤖</p>
              <p className="mt-1 text-sm">
                📤 ETB 1,200.00
                <br />
                {t("bot.pickCategory")}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <span className="bg-white/20 text-xs px-2 py-1 rounded">
                  🛒
                </span>
                <span className="bg-white/20 text-xs px-2 py-1 rounded">
                  🚌
                </span>
                <span className="bg-white/20 text-xs px-2 py-1 rounded">
                  💊
                </span>
                <span className="bg-white text-emerald-700 text-xs px-2 py-1 rounded font-semibold">
                  👨‍👩‍👧
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--glass-border)] glass relative z-10">
        <div className="max-w-6xl mx-auto px-4 py-16 grid md:grid-cols-3 gap-8">
          <Feature
            icon={<MessageCircle className="h-5 w-5" />}
            title={t("landing.feature1Title")}
            text={t("landing.feature1Text")}
          />
          <Feature
            icon={<PieChart className="h-5 w-5" />}
            title={t("landing.feature2Title")}
            text={t("landing.feature2Text")}
          />
          <Feature
            icon={<Receipt className="h-5 w-5" />}
            title={t("landing.feature3Title")}
            text={t("landing.feature3Text")}
          />
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-16 relative z-10">
        <h2 className="text-2xl font-bold text-[var(--foreground)] text-center">
          {t("landing.howItWorks")}
        </h2>
        <div className="mt-10 grid md:grid-cols-4 gap-6">
          <Step n={1} title={t("landing.step1Title")} text={t("landing.step1Text")} />
          <Step n={2} title={t("landing.step2Title")} text={t("landing.step2Text")} />
          <Step n={3} title={t("landing.step3Title")} text={t("landing.step3Text")} />
          <Step n={4} title={t("landing.step4Title")} text={t("landing.step4Text")} />
        </div>
      </section>

      <footer className="border-t border-[var(--glass-border)] glass relative z-10">
        <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between text-sm text-[var(--muted-foreground)]">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            {t("landing.private")}
          </div>
          <div>© {new Date().getFullYear()} EthioBudget Tracker</div>
        </div>
      </footer>
    </div>
  );
}

function Feature({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div>
      <div className="h-10 w-10 rounded-xl bg-emerald-500/15 text-emerald-300 flex items-center justify-center border border-emerald-500/20">
        {icon}
      </div>
      <h3 className="mt-3 font-semibold text-[var(--foreground)]">{title}</h3>
      <p className="mt-1 text-sm text-[var(--muted)]">{text}</p>
    </div>
  );
}

function Step({ n, title, text }: { n: number; title: string; text: string }) {
  return (
    <div className="glass rounded-2xl border border-[var(--glass-border)] p-5">
      <div className="h-8 w-8 rounded-full gradient-accent text-white flex items-center justify-center font-semibold text-sm">
        {n}
      </div>
      <h3 className="mt-3 font-semibold text-[var(--foreground)]">{title}</h3>
      <p className="mt-1 text-sm text-[var(--muted)]">{text}</p>
    </div>
  );
}
