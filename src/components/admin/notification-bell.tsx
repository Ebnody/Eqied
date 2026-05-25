"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Bell,
  MessageSquare,
  UserPlus,
  UsersRound,
  Inbox,
  Loader2,
} from "lucide-react";

interface NotificationItem {
  id: string;
  kind: "ticket" | "user_signup" | "group_created";
  title: string;
  body: string;
  link: string;
  createdAt: string;
  unread: boolean;
}

const KIND_ICON: Record<NotificationItem["kind"], React.ComponentType<{ className?: string }>> = {
  ticket: MessageSquare,
  user_signup: UserPlus,
  group_created: UsersRound,
};

const KIND_COLOR: Record<NotificationItem["kind"], string> = {
  ticket: "text-emerald-400 bg-emerald-500/10",
  user_signup: "text-blue-400 bg-blue-500/10",
  group_created: "text-violet-400 bg-violet-500/10",
};

function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/notifications", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setItems(data.items ?? []);
        setUnreadCount(data.unreadCount ?? 0);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, [load]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => {
          setOpen(!open);
          if (!open) load();
        }}
        className="relative h-9 w-9 flex items-center justify-center rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-40 w-[340px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-strong-bg)] backdrop-blur-xl shadow-2xl">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--glass-border)]">
            <h3 className="text-sm font-semibold text-[var(--foreground)]">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <span className="text-xs text-emerald-400 font-medium">
                {unreadCount} unread
              </span>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
            {loading && items.length === 0 ? (
              <div className="flex items-center justify-center h-24">
                <Loader2 className="h-5 w-5 animate-spin text-emerald-400" />
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <Inbox className="h-8 w-8 text-[var(--muted)] mb-2" />
                <p className="text-sm text-[var(--foreground)] font-medium">
                  All caught up
                </p>
                <p className="text-xs text-[var(--muted)] mt-0.5">
                  No new notifications.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-[var(--glass-border)]">
                {items.map((item) => {
                  const Icon = KIND_ICON[item.kind];
                  return (
                    <li key={item.id}>
                      <Link
                        href={item.link}
                        onClick={() => setOpen(false)}
                        className="block px-4 py-3 hover:bg-[var(--glass-bg)] transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
                              KIND_COLOR[item.kind]
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start gap-2">
                              <p className="text-sm font-medium text-[var(--foreground)] truncate flex-1">
                                {item.title}
                              </p>
                              {item.unread && (
                                <span className="h-2 w-2 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-[var(--muted)] truncate mt-0.5">
                              {item.body}
                            </p>
                            <p className="text-[11px] text-[var(--muted)] mt-1">
                              {timeAgo(item.createdAt)}
                            </p>
                          </div>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <Link
            href="/admin/messages"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-center text-xs font-semibold text-emerald-400 hover:text-emerald-300 hover:bg-[var(--glass-bg)] transition-colors border-t border-[var(--glass-border)]"
          >
            View all messages
          </Link>
        </div>
      )}
    </div>
  );
}
