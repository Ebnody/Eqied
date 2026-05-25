"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  UsersRound,
  Filter,
  Download,
  X,
} from "lucide-react";
import { GroupRowActions } from "@/components/admin/group-row-actions";
import { downloadCsv, toCsv } from "@/lib/csv";

export interface GroupRow {
  id: string;
  name: string;
  owner: string;
  members: number;
  expenses: number;
  totalVolume: number; // santim
  created: string;
  createdAt: string; // ISO
  status: "active" | "archived";
}

interface Props {
  groups: GroupRow[];
  isSuperAdmin: boolean;
}

type StatusFilter = "all" | "active" | "archived";
type DateFilter = "any" | "7d" | "30d" | "90d";

function formatETB(santim: number) {
  return `ETB ${(santim / 100).toLocaleString("en-US", {
    maximumFractionDigits: 0,
  })}`;
}

export function GroupsTable({ groups, isSuperAdmin }: Props) {
  const [search, setSearch] = useState("");
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

    return groups.filter((g) => {
      if (statusFilter !== "all" && g.status !== statusFilter) return false;
      if (cutoff && new Date(g.createdAt).getTime() < cutoff) return false;
      if (q) {
        const hay = `${g.name} ${g.owner}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [groups, search, statusFilter, dateFilter]);

  const activeFilterCount =
    (statusFilter !== "all" ? 1 : 0) + (dateFilter !== "any" ? 1 : 0);

  function exportCsv() {
    const rows = filtered.map((g) => [
      g.id,
      g.name,
      g.owner,
      g.members,
      g.expenses,
      (g.totalVolume / 100).toFixed(2),
      g.created,
      g.status,
    ]);
    const csv = toCsv(
      ["ID", "Name", "Owner", "Members", "Expenses", "Volume (ETB)", "Created", "Status"],
      rows
    );
    downloadCsv(`groups-${new Date().toISOString().slice(0, 10)}.csv`, csv);
  }

  function clearFilters() {
    setStatusFilter("all");
    setDateFilter("any");
    setSearch("");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Groups</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Manage roommate groups and shared expenses.{" "}
            <span className="text-emerald-400">
              ({filtered.length} of {groups.length})
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
              <div className="absolute right-0 top-full mt-2 z-30 w-64 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-strong-bg)] backdrop-blur-xl shadow-2xl p-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-[var(--muted)] mb-2">
                    Status
                  </label>
                  <div className="grid grid-cols-3 gap-1">
                    {(["all", "active", "archived"] as StatusFilter[]).map((s) => (
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
                    Created
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

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted)]" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search groups by name or owner..."
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
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Group</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Owner</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Members</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Expenses</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Volume</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Created</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--glass-border)]">
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-sm text-[var(--muted)]">
                      {groups.length === 0 ? "No groups yet." : "No groups match these filters."}
                    </td>
                  </tr>
                )}
                {filtered.map((g) => (
                  <tr key={g.id} className="transition-colors hover:bg-[var(--glass-bg)]">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-[var(--glass-bg)] flex items-center justify-center">
                          <UsersRound className="h-4 w-4 text-[var(--muted)]" />
                        </div>
                        <span className="text-sm font-medium text-[var(--foreground)]">{g.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--muted-foreground)]">{g.owner}</td>
                    <td className="px-6 py-4 text-sm text-[var(--foreground)]">{g.members}</td>
                    <td className="px-6 py-4 text-sm text-[var(--foreground)]">{g.expenses}</td>
                    <td className="px-6 py-4 text-sm font-medium text-[var(--foreground)]">
                      {formatETB(g.totalVolume)}
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--muted)]">{g.created}</td>
                    <td className="px-6 py-4">
                      <Badge
                        variant="outline"
                        className={
                          g.status === "active"
                            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                            : "border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--muted)]"
                        }
                      >
                        {g.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <GroupRowActions
                        groupId={g.id}
                        groupName={g.name}
                        isArchived={g.status === "archived"}
                        isSuperAdmin={isSuperAdmin}
                      />
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
