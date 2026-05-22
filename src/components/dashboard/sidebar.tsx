"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Wallet,
  TrendingUp,
  TrendingDown,
  Inbox,
  PieChart,
  Settings,
  LogOut,
  Menu,
  X,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useI18n } from "@/i18n/provider";
import { LocaleSwitcher } from "@/components/locale-switcher";

export function Sidebar({ fullName }: { fullName?: string | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { t } = useI18n();

  const NAV = [
    { href: "/dashboard", label: t("nav.dashboard"), icon: LayoutDashboard },
    { href: "/budget", label: t("nav.budget"), icon: PieChart },
    { href: "/income", label: t("nav.income"), icon: TrendingUp },
    { href: "/expenses", label: t("nav.expenses"), icon: TrendingDown },
    { href: "/transactions", label: t("nav.transactions"), icon: Inbox },
    { href: "/reports", label: t("nav.reports"), icon: PieChart },
    { href: "/groups", label: t("roommate.nav"), icon: Users },
    { href: "/settings", label: t("nav.settings"), icon: Settings },
  ];

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between border-b border-white/10 glass px-4 py-3 sticky top-0 z-10">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold gradient-text">
          <Wallet className="h-5 w-5 text-emerald-400" />
          EthioBudget
        </Link>
        <button
          onClick={() => setOpen(!open)}
          className="p-2 rounded-xl hover:bg-white/10 transition-colors"
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5 text-slate-300" /> : <Menu className="h-5 w-5 text-slate-300" />}
        </button>
      </div>

      <aside
        className={cn(
          "md:w-64 md:border-r md:border-white/10 md:glass md:flex md:flex-col md:sticky md:top-0 md:h-screen",
          "fixed inset-x-0 top-[57px] bottom-0 glass z-20 border-t border-white/10",
          open ? "flex flex-col" : "hidden md:flex"
        )}
      >
        <div className="hidden md:flex items-center gap-2 px-6 py-5 border-b border-white/10 font-semibold gradient-text">
          <Wallet className="h-5 w-5 text-emerald-400" />
          EthioBudget
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-all",
                  active
                    ? "bg-emerald-500/15 text-emerald-300 font-medium border border-emerald-500/20"
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 px-3 py-3 space-y-2">
          {fullName && (
            <div className="px-3 py-1 text-xs text-slate-500 truncate">
              {fullName}
            </div>
          )}
          <div className="px-1">
            <LocaleSwitcher />
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-400 hover:bg-white/5 hover:text-slate-200 transition-all"
          >
            <LogOut className="h-4 w-4" />
            {t("nav.logout")}
          </button>
        </div>
      </aside>
    </>
  );
}
