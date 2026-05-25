"use client";

import { useCallback, useEffect, useState } from "react";
import {
  MessageCircle,
  X,
  Send,
  ChevronLeft,
  Loader2,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";

type Category = "bug" | "payment" | "feature" | "account" | "other";

interface IssueListItem {
  id: string;
  subject: string;
  category: string;
  status: string;
  lastReplyAt: string;
  lastReplyBy: string;
  unreadByUser: boolean;
  createdAt: string;
}

interface IssueMessage {
  id: string;
  senderType: "user" | "admin";
  senderId: string;
  body: string;
  createdAt: string;
}

interface IssueDetail {
  id: string;
  subject: string;
  category: string;
  status: string;
  createdAt: string;
  messages: IssueMessage[];
}

const CATEGORIES: { value: Category; label: string }[] = [
  { value: "bug", label: "Bug" },
  { value: "payment", label: "Payment Issue" },
  { value: "feature", label: "Feature Request" },
  { value: "account", label: "Account" },
  { value: "other", label: "Other" },
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
  closed: CheckCircle2,
};

type View = "list" | "new" | "thread";

export function SupportBubble() {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("list");
  const [issues, setIssues] = useState<IssueListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIssue, setActiveIssue] = useState<IssueDetail | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // form state for creating a new issue
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<Category>("other");
  const [bodyText, setBodyText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // reply state for an open thread
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/issues");
      if (res.ok) {
        const data = await res.json();
        const list: IssueListItem[] = data.issues ?? [];
        setIssues(list);
        setUnreadCount(list.filter((i) => i.unreadByUser).length);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll for unread tickets every 60s while panel is closed; refresh list immediately when opened
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadList();
    const interval = setInterval(loadList, 60_000);
    return () => clearInterval(interval);
  }, [loadList]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (open && view === "list") void loadList();
  }, [open, view, loadList]);

  async function openIssue(id: string) {
    setLoading(true);
    setActiveIssue(null);
    setView("thread");
    try {
      const res = await fetch(`/api/issues/${id}`);
      if (res.ok) {
        const data = await res.json();
        setActiveIssue(data.issue);
        // Refresh list so unread count updates
        loadList();
      }
    } finally {
      setLoading(false);
    }
  }

  async function submitNew(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !bodyText.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, category, body: bodyText }),
      });
      if (res.ok) {
        setSubject("");
        setCategory("other");
        setBodyText("");
        await loadList();
        setView("list");
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Failed to send. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function submitReply(e: React.FormEvent) {
    e.preventDefault();
    if (!activeIssue || !replyText.trim()) return;
    setSendingReply(true);
    try {
      const res = await fetch(`/api/issues/${activeIssue.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: replyText }),
      });
      if (res.ok) {
        const data = await res.json();
        setActiveIssue({
          ...activeIssue,
          messages: [...activeIssue.messages, data.message],
        });
        setReplyText("");
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Failed to send reply.");
      }
    } finally {
      setSendingReply(false);
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-2xl shadow-emerald-900/40 transition-all hover:scale-110 hover:shadow-emerald-500/30"
        aria-label="Help & Support"
      >
        {open ? (
          <X className="h-6 w-6" />
        ) : (
          <>
            <MessageCircle className="h-6 w-6" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1 text-[11px] font-bold text-white ring-2 ring-background">
                {unreadCount}
              </span>
            )}
          </>
        )}
      </button>

      {/* Slide-in panel */}
      {open && (
        <div className="fixed bottom-24 right-5 z-40 w-[calc(100vw-2.5rem)] max-w-sm overflow-hidden rounded-2xl border border-white/10 bg-slate-900/95 backdrop-blur-xl shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-emerald-600/20 to-emerald-700/10 px-4 py-3">
            <div className="flex items-center gap-2">
              {view !== "list" && (
                <button
                  onClick={() => setView("list")}
                  className="text-slate-300 hover:text-white"
                  aria-label="Back"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              )}
              <h3 className="text-sm font-semibold text-white">
                {view === "list"
                  ? "Help & Support"
                  : view === "new"
                  ? "New Issue"
                  : activeIssue?.subject ?? "Loading..."}
              </h3>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-slate-400 hover:text-white"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex h-[60vh] max-h-[500px] flex-col">
            {view === "list" && (
              <>
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {loading && issues.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
                    </div>
                  ) : issues.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center px-4">
                      <MessageCircle className="h-10 w-10 text-slate-600 mb-3" />
                      <p className="text-sm text-slate-300 font-medium">
                        No tickets yet
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Tap below to report an issue or ask a question.
                      </p>
                    </div>
                  ) : (
                    issues.map((issue) => {
                      const StatusIcon = STATUS_ICONS[issue.status] ?? AlertCircle;
                      return (
                        <button
                          key={issue.id}
                          onClick={() => openIssue(issue.id)}
                          className="w-full text-left rounded-xl border border-white/5 bg-white/5 p-3 hover:bg-white/10 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium text-white truncate flex-1">
                              {issue.subject}
                            </p>
                            {issue.unreadByUser && (
                              <span className="h-2 w-2 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                            )}
                          </div>
                          <div className="mt-2 flex items-center gap-2">
                            <span
                              className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded border ${
                                STATUS_STYLES[issue.status] ?? STATUS_STYLES.open
                              }`}
                            >
                              <StatusIcon className="h-2.5 w-2.5" />
                              {issue.status.replace("_", " ")}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              {new Date(issue.lastReplyAt).toLocaleDateString()}
                            </span>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
                <button
                  onClick={() => setView("new")}
                  className="m-3 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Report an Issue
                </button>
              </>
            )}

            {view === "new" && (
              <form
                onSubmit={submitNew}
                className="flex flex-col flex-1 overflow-hidden"
              >
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      maxLength={150}
                      required
                      placeholder="Brief summary"
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as Category)}
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value} className="bg-slate-900">
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">
                      Describe the issue
                    </label>
                    <textarea
                      value={bodyText}
                      onChange={(e) => setBodyText(e.target.value)}
                      maxLength={5000}
                      required
                      rows={6}
                      placeholder="What happened? Steps to reproduce, what you expected, etc."
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 resize-none"
                    />
                  </div>
                </div>
                <div className="border-t border-white/10 p-3">
                  <button
                    type="submit"
                    disabled={submitting || !subject.trim() || !bodyText.trim()}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    Submit
                  </button>
                </div>
              </form>
            )}

            {view === "thread" && (
              <>
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {loading || !activeIssue ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
                    </div>
                  ) : (
                    <>
                      {activeIssue.messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${
                            msg.senderType === "user"
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                              msg.senderType === "user"
                                ? "bg-emerald-600 text-white"
                                : "bg-white/10 text-slate-100"
                            }`}
                          >
                            {msg.senderType === "admin" && (
                              <p className="text-[10px] font-semibold text-emerald-300 mb-0.5">
                                Support Team
                              </p>
                            )}
                            <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                            <p className="text-[10px] mt-1 opacity-70">
                              {new Date(msg.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
                {activeIssue && activeIssue.status !== "closed" && (
                  <form
                    onSubmit={submitReply}
                    className="border-t border-white/10 p-3 flex gap-2"
                  >
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      maxLength={5000}
                      placeholder="Type your reply..."
                      className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    />
                    <button
                      type="submit"
                      disabled={sendingReply || !replyText.trim()}
                      className="rounded-lg bg-emerald-600 px-3 py-2 text-white hover:bg-emerald-500 transition-colors disabled:opacity-50"
                      aria-label="Send"
                    >
                      {sendingReply ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </button>
                  </form>
                )}
                {activeIssue && activeIssue.status === "closed" && (
                  <div className="border-t border-white/10 p-3 text-center text-xs text-slate-500">
                    This ticket is closed. Open a new one if you need more help.
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
