"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function GroupTabs({
  tabs,
}: {
  tabs: { href: string; label: string }[];
}) {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide border-b border-slate-200">
      {tabs.map((tab) => {
        const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "whitespace-nowrap rounded-t-lg px-3 py-2 text-sm font-medium transition-colors border-b-2",
              active
                ? "border-emerald-600 text-emerald-700"
                : "border-transparent text-slate-500 hover:text-emerald-600 hover:bg-slate-50"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
