import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function formatETB(santim: number) {
  return `ETB ${(santim / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

async function getTransactions() {
  const rows = await prisma.transaction.findMany({
    orderBy: { occurredAt: "desc" },
    take: 100,
    include: {
      user: { select: { fullName: true, email: true, phone: true } },
    },
  });
  return rows.map((t) => ({
    id: t.id,
    user: t.user.fullName || t.user.email || t.user.phone || "Unknown",
    type: t.type,
    category: t.categoryKey || "—",
    amount: t.amount,
    method: t.paymentMethod || t.source,
    date: t.occurredAt.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    }),
    status: t.status,
  }));
}

export default async function AdminTransactionsPage() {
  const TRANSACTIONS = await getTransactions();
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
                {TRANSACTIONS.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-sm text-[var(--muted)]">
                      No transactions yet.
                    </td>
                  </tr>
                )}
                {TRANSACTIONS.map((tx) => (
                  <tr
                    key={tx.id}
                    className="transition-colors hover:bg-[var(--glass-bg)]"
                  >
                    <td className="px-6 py-4 text-sm font-mono text-[var(--muted-foreground)]">
                      {tx.id.slice(0, 10)}
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
