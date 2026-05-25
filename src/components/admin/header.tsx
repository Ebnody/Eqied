"use client";

import { Search, Menu } from "lucide-react";
import { useAdminSidebar } from "./sidebar-context";
import { useState } from "react";
import { NotificationBell } from "./notification-bell";

export function AdminHeader() {
  const { toggleSidebar, toggleMobileSidebar } = useAdminSidebar();
  const [search, setSearch] = useState("");

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-[var(--glass-border)] bg-background/80 backdrop-blur-xl px-4 py-4 md:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="hidden md:flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-4 w-4" />
        </button>
        <button
          onClick={toggleMobileSidebar}
          className="flex md:hidden h-9 w-9 items-center justify-center rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          aria-label="Toggle mobile sidebar"
        >
          <Menu className="h-4 w-4" />
        </button>
        <h1 className="text-lg font-semibold text-[var(--foreground)] hidden sm:block">
          Dashboard
        </h1>
      </div>

      <div className="flex items-center gap-3 flex-1 justify-end">
        {/* Search */}
        <div className="relative w-full max-w-xs hidden sm:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="h-10 w-full rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] pl-10 pr-4 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          />
        </div>

        {/* Notifications */}
        <NotificationBell />
      </div>
    </header>
  );
}
