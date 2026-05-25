"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Loader2,
  Send,
  CheckCircle2,
  Clock,
  AlertCircle,
  Archive,
  Search,
  Inbox,
  User as UserIcon,
} from "lucide-react";

interface IssueUser {
  id: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  telegramUsername: string | null;
}

interface IssueListItem {
  id: string;
  subject: string;
  category: string;
  status: string;
  priority: string;
  lastReplyAt: string;
  lastReplyBy: string;
  unreadByAdmin: boolean;
  createdAt: string;
  user: IssueUser;
}

interface IssueMessage {
  id: string;
  senderType: "user" | "admin";
  senderId: string;
  body: string;
  createdAt: string;
}

interface IssueDetail extends IssueListItem {
  messages: IssueMessage[];
}

const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

const STATUS_STYLES: Record<string, string> = {
  open: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  in_progress: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  resolved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  closed: "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

const STATUS_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  open: AlertCircle,
  in_progress: Clock,
  resolved: CheckCircle2,
  closed: Archive,
};

function userLabel(u: IssueUser): string {
  return (
    u.fullName ||
    u.email ||
    u.phone ||
    (u.telegramUsername ? `@${u.telegramUsername}` : null) ||
    "Unknown user"
  );
}

export function AdminMessagesClient() {
  const searchParams = useSearchParams();
  const initialId = searchParams.get("id");

  const [issues, setIssues] = useState<IssueListItem[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");

  const [activeId, setActiveId] = useState<string | null>(initialId);
  const [activeIssue, setActiveIssue] = useState<IssueDetail | null>(null);
  const [loadingThread, setLoadingThread] = useState(false);

  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const loadList = useCallback(async () => {
    setLoadingList(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      if (search.trim()) params.set("search", search.trim());
      const res = await fetch(`/api/admin/issues?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setIssues(data.issues ?? []);
      }
    } finally {
      setLoadingList(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadList();
  }, [loadList]);

  const loadThread = useCallback(async (id: string) => {
    setLoadingThread(true);
    setActiveIssue(null);
    try {
      const res = await fetch(`/api/admin/issues/${id}`);
      if (res.ok) {
        const data = await res.json();
        setActiveIssue(data.issue);
        // Update list row to mark as read
        setIssues((prev) =>
          prev.map((i) => (i.id === id ? { ...i, unreadByAdmin: false } : i))
        );
      }
    } finally {
      setLoadingThread(false);
    }
  }, []);

  useEffect(() => {
    if (activeId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void loadThread(activeId);
    }
  }, [activeId, loadThread]);

  async function submitReply(e: React.FormEvent) {
    e.preventDefault();
    if (!activeIssue || !replyText.trim()) return;
    setSendingReply(true);
    try {
      const res = await fetch(`/api/admin/issues/${activeIssue.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: replyText }),
      });
      if (res.ok) {
        const data = await res.json();
        setActiveIssue({
          ...activeIssue,
          messages: [...activeIssue.messages, data.message],
          status: data.status,
          lastReplyAt: new Date().toISOString(),
          lastReplyBy: "admin",
        });
        setReplyText("");
        // Update list row status as well
        setIssues((prev) =>
          prev.map((i) =>
            i.id === activeIssue.id
              ? {
                  ...i,
                  status: data.status,
                  lastReplyAt: new Date().toISOString(),
                  lastReplyBy: "admin",
                }
              : i
          )
        );
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Failed to send reply");
      }
    } finally {
      setSendingReply(false);
    }
  }

  async function changeStatus(newStatus: string) {
    if (!activeIssue) return;
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/admin/issues/${activeIssue.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setActiveIssue({ ...activeIssue, status: newStatus });
        setIssues((prev) =>
          prev.map((i) =>
            i.id === activeIssue.id ? { ...i, status: newStatus } : i
          )
        );
      }
    } finally {
      setUpdatingStatus(false);
    }
  }

  return (
    <div className="space-y-6 h-[calc(100vh-8rem)]">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">
          Support Messages
        </h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          User-reported issues and conversations.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full overflow-hidden">
        {/* Left: ticket list */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col rounded-2xl border border-[var(--glass-border)] glass overflow-hidden">
          {/* Filters */}
          <div className="p-3 space-y-2 border-b border-[var(--glass-border)]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted)]" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search subject..."
                className="h-10 w-full rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] pl-10 pr-4 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>
            <div className="flex flex-wrap gap-1">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setStatusFilter(f.value)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    statusFilter === f.value
                      ? "bg-emerald-600 text-white"
                      : "bg-[var(--glass-bg)] text-[var(--muted)] hover:text-[var(--foreground)]"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {loadingList ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
              </div>
            ) : issues.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                <Inbox className="h-10 w-10 text-[var(--muted)] mb-3" />
                <p className="text-sm text-[var(--foreground)] font-medium">
                  No tickets
                </p>
                <p className="text-xs text-[var(--muted)] mt-1">
                  No tickets match these filters.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-[var(--glass-border)]">
                {issues.map((issue) => {
                  const StatusIcon = STATUS_ICONS[issue.status] ?? AlertCircle;
                  const isActive = issue.id === activeId;
                  return (
                    <li key={issue.id}>
                      <button
                        onClick={() => setActiveId(issue.id)}
                        className={`w-full text-left p-3 transition-colors ${
                          isActive
                            ? "bg-emerald-500/10"
                            : "hover:bg-[var(--glass-bg)]"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium text-[var(--foreground)] truncate flex-1">
                            {issue.subject}
                          </p>
                          {issue.unreadByAdmin && (
                            <span className="h-2 w-2 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-[var(--muted)] truncate mt-0.5">
                          {userLabel(issue.user)}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded border ${
                              STATUS_STYLES[issue.status] ?? STATUS_STYLES.open
                            }`}
                          >
                            <StatusIcon className="h-2.5 w-2.5" />
                            {issue.status.replace("_", " ")}
                          </span>
                          <span className="text-[11px] text-[var(--muted)]">
                            {issue.category}
                          </span>
                          <span className="text-[11px] text-[var(--muted)] ml-auto">
                            {new Date(issue.lastReplyAt).toLocaleDateString()}
                          </span>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Right: thread */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col rounded-2xl border border-[var(--glass-border)] glass overflow-hidden">
          {!activeId ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <Inbox className="h-12 w-12 text-[var(--muted)] mb-3" />
              <p className="text-sm text-[var(--foreground)] font-medium">
                Select a ticket
              </p>
              <p className="text-xs text-[var(--muted)] mt-1">
                Pick a ticket from the list to view the conversation.
              </p>
            </div>
          ) : loadingThread || !activeIssue ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
            </div>
          ) : (
            <>
              {/* Thread header */}
              <div className="border-b border-[var(--glass-border)] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-base font-semibold text-[var(--foreground)] truncate">
                      {activeIssue.subject}
                    </h2>
                    <div className="mt-1 flex items-center gap-2 text-xs text-[var(--muted)]">
                      <UserIcon className="h-3.5 w-3.5" />
                      <span>{userLabel(activeIssue.user)}</span>
                      <span>•</span>
                      <span>{activeIssue.category}</span>
                      <span>•</span>
                      <span>
                        opened {new Date(activeIssue.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 shrink-0">
                    {(
                      ["open", "in_progress", "resolved", "closed"] as const
                    ).map((s) => (
                      <button
                        key={s}
                        onClick={() => changeStatus(s)}
                        disabled={updatingStatus || activeIssue.status === s}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors disabled:cursor-not-allowed ${
                          activeIssue.status === s
                            ? STATUS_STYLES[s]
                            : "border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--muted)] hover:text-[var(--foreground)] disabled:opacity-50"
                        }`}
                      >
                        {s.replace("_", " ")}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
                {activeIssue.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.senderType === "admin"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                        msg.senderType === "admin"
                          ? "bg-emerald-600 text-white"
                          : "bg-[var(--glass-bg)] text-[var(--foreground)] border border-[var(--glass-border)]"
                      }`}
                    >
                      <p className="text-[10px] font-semibold mb-0.5 opacity-80">
                        {msg.senderType === "admin"
                          ? "Support Team"
                          : userLabel(activeIssue.user)}
                      </p>
                      <p className="whitespace-pre-wrap break-words">
                        {msg.body}
                      </p>
                      <p className="text-[10px] mt-1 opacity-70">
                        {new Date(msg.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Reply form */}
              {activeIssue.status !== "closed" ? (
                <form
                  onSubmit={submitReply}
                  className="border-t border-[var(--glass-border)] p-3 flex gap-2"
                >
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    maxLength={5000}
                    placeholder="Type your reply..."
                    className="flex-1 rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                  <button
                    type="submit"
                    disabled={sendingReply || !replyText.trim()}
                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 transition-colors disabled:opacity-50"
                  >
                    {sendingReply ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Send
                  </button>
                </form>
              ) : (
                <div className="border-t border-[var(--glass-border)] p-3 text-center text-xs text-[var(--muted)]">
                  This ticket is closed. Reopen it to reply.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
