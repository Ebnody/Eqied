"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  X,
} from "lucide-react";
import { downloadCsv, toCsv } from "@/lib/csv";
import Link from "next/link";

export interface TxRow {
  id: string;
  user: string;
  type: string;
  category: string;
  amount: number; // santim
  method: string;
  source: string;
  date: string;
  occurredAt: string; // ISO
  status: string;
}

interface Props {
  transactions: TxRow[];
  userId?: string;
}

type TypeFilter = "all" | "income" | "expense";
type StatusFilter = "all" | "categorized" | "uncategorized" | "ignored" | "duplicate";
type DateFilter = "any" | "7d" | "30d" | "90d";

function formatETB(santim: number) {
  return `ETB ${(santim / 100).toLocaleString("en-US", {
    maximumFractionDigits: 0,
  })}`;
}

export function TransactionsTable({ transactions, userId }: Props) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("any");
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    }
    if (filterOpen) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [filterOpen]);

  const [now] = useState(() => Date.now());
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const cutoff =
      dateFilter === "7d"
        ? now - 7 * 86400_000
        : dateFilter === "30d"
        ? now - 30 * 86400_000
        : dateFilter === "90d"
        ? now - 90 * 86400_000
        : 0;

    return transactions.filter((t) => {
      if (typeFilter !== "all" && t.type !== typeFilter) return false;
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (cutoff && new Date(t.occurredAt).getTime() < cutoff) return false;
      if (q) {
        const hay = `${t.user} ${t.category} ${t.method} ${t.source} ${t.id}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [transactions, search, typeFilter, statusFilter, dateFilter]);

  const activeFilterCount =
    (typeFilter !== "all" ? 1 : 0) +
    (statusFilter !== "all" ? 1 : 0) +
    (dateFilter !== "any" ? 1 : 0);

  function exportCsv() {
    const rows = filtered.map((t) => [
      t.id,
      t.user,
      t.type,
      t.category,
      (t.amount / 100).toFixed(2),
      t.method,
      t.source,
      t.date,
      t.status,
    ]);
    const csv = toCsv(
      [
        "ID",
        "User",
        "Type",
        "Category",
        "Amount (ETB)",
        "Method",
        "Source",
        "Date",
        "Status",
      ],
      rows
    );
    downloadCsv(`transactions-${new Date().toISOString().slice(0, 10)}.csv`, csv);
  }

  function clearFilters() {
    setTypeFilter("all");
    setStatusFilter("all");
    setDateFilter("any");
    setSearch("");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Transactions</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            View and manage all platform transactions.{" "}
            <span className="text-emerald-400">
              ({filtered.length} of {transactions.length})
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div ref={filterRef} className="relative">
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-4 py-2 text-sm font-medium text-[var(--muted-foreground)] hover:bg-[var(--glass-strong-bg)] transition-colors"
            >
              <Filter className="h-4 w-4" />
              Filter
              {activeFilterCount > 0 && (
                <span className="ml-1 rounded-full bg-emerald-600 px-1.5 text-[11px] font-bold text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>
            {filterOpen && (
              <div className="absolute right-0 top-full mt-2 z-30 w-72 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-strong-bg)] backdrop-blur-xl shadow-2xl p-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-[var(--muted)] mb-2">
                    Type
                  </label>
                  <div className="grid grid-cols-3 gap-1">
                    {(["all", "income", "expense"] as TypeFilter[]).map((t) => (
                      <button
                        key={t}
                        onClick={() => setTypeFilter(t)}
                        className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          typeFilter === t
                            ? "bg-emerald-600 text-white"
                            : "bg-[var(--glass-bg)] text-[var(--muted)] hover:text-[var(--foreground)]"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-[var(--muted)] mb-2">
                    Status
                  </label>
                  <div className="grid grid-cols-2 gap-1">
                    {(
                      [
                        "all",
                        "categorized",
                        "uncategorized",
                        "ignored",
                        "duplicate",
                      ] as StatusFilter[]
                    ).map((s) => (
                      <button
                        key={s}
                        onClick={() => setStatusFilter(s)}
                        className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          statusFilter === s
                            ? "bg-emerald-600 text-white"
                            : "bg-[var(--glass-bg)] text-[var(--muted)] hover:text-[var(--foreground)]"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-[var(--muted)] mb-2">
                    Date
                  </label>
                  <div className="grid grid-cols-2 gap-1">
                    {(
                      [
                        ["any", "Any time"],
                        ["7d", "Last 7 days"],
                        ["30d", "Last 30 days"],
                        ["90d", "Last 90 days"],
                      ] as [DateFilter, string][]
                    ).map(([v, label]) => (
                      <button
                        key={v}
                        onClick={() => setDateFilter(v)}
                        className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          dateFilter === v
                            ? "bg-emerald-600 text-white"
                            : "bg-[var(--glass-bg)] text-[var(--muted)] hover:text-[var(--foreground)]"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="w-full text-center text-xs font-medium text-rose-400 hover:text-rose-300"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            )}
          </div>
          <button
            onClick={exportCsv}
            disabled={filtered.length === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {userId && (
        <div className="flex items-center gap-3 rounded-xl bg-sky-500/5 border border-sky-500/10 px-4 py-3">
          <span className="text-sm text-sky-400">
            Showing transactions for a specific user only.
          </span>
          <Link
            href="/admin/transactions"
            className="inline-flex items-center gap-1 text-sm font-medium text-sky-400 hover:text-sky-300 underline underline-offset-2"
          >
            Show all
          </Link>
        </div>
      )}

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted)]" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by user, category, method, or ID..."
          className="h-11 w-full rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] pl-10 pr-10 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--foreground)]"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <Card className="glass rounded-2xl border-[var(--glass-border)] overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--glass-border)] text-left">
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">ID</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">User</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Type</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Category</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Amount</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Method</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Date</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--glass-border)]">
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-sm text-[var(--muted)]">
                      {transactions.length === 0
                        ? "No transactions yet."
                        : "No transactions match these filters."}
                    </td>
                  </tr>
                )}
                {filtered.map((tx) => (
                  <tr key={tx.id} className="transition-colors hover:bg-[var(--glass-bg)]">
                    <td className="px-6 py-4 text-sm font-mono text-[var(--muted-foreground)]">
                      <Link
                        href={`/admin/transactions/${tx.id}`}
                        className="hover:text-emerald-400 transition-colors"
                      >
                        {tx.id.slice(0, 10)}…
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-[var(--glass-bg)] flex items-center justify-center text-xs font-bold text-[var(--muted-foreground)]">
                          {tx.user.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm text-[var(--foreground)]">{tx.user}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 text-sm font-medium ${
                          tx.type === "income" ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {tx.type === "income" ? (
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        ) : (
                          <ArrowDownRight className="h-3.5 w-3.5" />
                        )}
                        {tx.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--muted-foreground)]">
                      {tx.category}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-[var(--foreground)]">
                      {formatETB(tx.amount)}
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--muted)]">{tx.method}</td>
                    <td className="px-6 py-4 text-sm text-[var(--muted)]">{tx.date}</td>
                    <td className="px-6 py-4">
                      <Badge
                        variant="outline"
                        className={
                          tx.status === "categorized"
                            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                            : tx.status === "uncategorized"
                            ? "border-amber-500/20 bg-amber-500/10 text-amber-400"
                            : "border-rose-500/20 bg-rose-500/10 text-rose-400"
                        }
                      >
                        {tx.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
