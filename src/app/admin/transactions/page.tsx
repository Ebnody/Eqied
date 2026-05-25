import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, ArrowUpRight, ArrowDownRight } from "lucide-react";

const TRANSACTIONS = [
  {
    id: "TX-4821",
    user: "Abebe Kebede",
    type: "expense",
    category: "Food & Dining",
    amount: 1250,
    method: "telebirr",
    date: "May 22, 2026",
    status: "completed",
  },
  {
    id: "TX-4820",
    user: "Meron Tadesse",
    type: "income",
    category: "Salary",
    amount: 15000,
    method: "Bank Transfer",
    date: "May 22, 2026",
    status: "completed",
  },
  {
    id: "TX-4819",
    user: "Dawit Hailu",
    type: "expense",
    category: "Transport",
    amount: 450,
    method: "telebirr",
    date: "May 21, 2026",
    status: "completed",
  },
  {
    id: "TX-4818",
    user: "Selam Bekele",
    type: "expense",
    category: "Shopping",
    amount: 3200,
    method: "Cash",
    date: "May 21, 2026",
    status: "pending",
  },
  {
    id: "TX-4817",
    user: "Yonas Alemu",
    type: "income",
    category: "Freelance",
    amount: 8500,
    method: "Bank Transfer",
    date: "May 20, 2026",
    status: "completed",
  },
  {
    id: "TX-4816",
    user: "Hiwot Girma",
    type: "expense",
    category: "Utilities",
    amount: 1800,
    method: "telebirr",
    date: "May 20, 2026",
    status: "failed",
  },
];

function formatETB(amount: number) {
  return `ETB ${amount.toLocaleString("en-ET")}`;
}

export default function AdminTransactionsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Transactions</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            View and manage all platform transactions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-2 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-4 py-2 text-sm font-medium text-[var(--muted-foreground)] hover:bg-[var(--glass-strong-bg)] transition-colors">
            <Filter className="h-4 w-4" />
            Filter
          </button>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted)]" />
        <input
          type="search"
          placeholder="Search transactions..."
          className="h-11 w-full rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] pl-10 pr-4 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
        />
      </div>

      <Card className="glass rounded-2xl border-[var(--glass-border)] overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--glass-border)] text-left">
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                    ID
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                    User
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                    Type
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                    Category
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                    Method
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                    Date
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--glass-border)]">
                {TRANSACTIONS.map((tx) => (
                  <tr
                    key={tx.id}
                    className="transition-colors hover:bg-[var(--glass-bg)]"
                  >
                    <td className="px-6 py-4 text-sm font-mono text-[var(--muted-foreground)]">
                      {tx.id}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-[var(--glass-bg)] flex items-center justify-center text-xs font-bold text-[var(--muted-foreground)]">
                          {tx.user.charAt(0)}
                        </div>
                        <span className="text-sm text-[var(--foreground)]">{tx.user}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 text-sm font-medium ${
                          tx.type === "income"
                            ? "text-emerald-400"
                            : "text-rose-400"
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
                    <td className="px-6 py-4 text-sm text-[var(--muted)]">
                      {tx.method}
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--muted)]">
                      {tx.date}
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant="outline"
                        className={
                          tx.status === "completed"
                            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                            : tx.status === "pending"
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
