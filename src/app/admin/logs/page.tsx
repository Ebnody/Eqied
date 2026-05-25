"use client";

import { useEffect, useState } from "react";
import { Loader2, ScrollText } from "lucide-react";

type LogEntry = {
  id: string;
  adminId: string;
  action: string;
  resource: string | null;
  resourceId: string | null;
  details: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  admin: {
    id: string;
    fullName: string | null;
    email: string | null;
  };
};

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLogs() {
      try {
        const res = await fetch("/api/admin/logs");
        if (!res.ok) throw new Error("Failed to load logs");
        const data = await res.json();
        setLogs(data.logs);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    loadLogs();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">
          Admin Activity Logs
        </h1>
        <p className="text-sm text-[var(--muted)]">
          Monitor all administrator actions on the platform.
        </p>
      </div>

      <div className="glass rounded-2xl border border-[var(--glass-border)] overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--glass-border)] flex items-center gap-2">
          <ScrollText className="h-4 w-4 text-[var(--muted)]" />
          <h2 className="font-semibold text-[var(--foreground)]">
            Recent Activity
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--glass-border)] text-[var(--muted)]">
                <th className="text-left px-5 py-3 font-medium">Time</th>
                <th className="text-left px-5 py-3 font-medium">Admin</th>
                <th className="text-left px-5 py-3 font-medium">Action</th>
                <th className="text-left px-5 py-3 font-medium">Resource</th>
                <th className="text-left px-5 py-3 font-medium">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--glass-border)]">
              {logs.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-8 text-center text-[var(--muted)]"
                  >
                    No activity logs yet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[var(--glass-bg)]">
                    <td className="px-5 py-3 text-[var(--muted-foreground)] whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-[var(--foreground)]">
                      <div className="font-medium">
                        {log.admin.fullName || "Unnamed"}
                      </div>
                      <div className="text-xs text-[var(--muted)]">
                        {log.admin.email}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center rounded-md bg-[var(--glass-strong-bg)] px-2 py-1 text-xs font-medium text-[var(--foreground)] border border-[var(--glass-border)]">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-[var(--muted)]">
                      {log.resource ?? "—"}
                      {log.resourceId && (
                        <span className="text-xs ml-1 text-[var(--muted-foreground)]">
                          ({log.resourceId.slice(0, 8)}...)
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-[var(--muted-foreground)] whitespace-nowrap">
                      {log.ipAddress ?? "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
