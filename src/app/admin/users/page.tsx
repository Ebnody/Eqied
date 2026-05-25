import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Mail, Phone } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { UserRowActions } from "@/components/admin/user-row-actions";

export const dynamic = "force-dynamic";

async function getUsers() {
  const rows = await prisma.user.findMany({
    where: { role: "USER" },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      isVerified: true,
      disabledAt: true,
      createdAt: true,
      _count: { select: { transactions: true } },
    },
  });
  return rows.map((u) => ({
    id: u.id,
    name: u.fullName || u.email || u.phone || "Unnamed",
    email: u.email || "—",
    phone: u.phone || "—",
    status: u.disabledAt
      ? "suspended"
      : u.isVerified
      ? "active"
      : "pending",
    joined: u.createdAt.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    }),
    transactions: u._count.transactions,
  }));
}

export default async function AdminUsersPage() {
  const admin = await requireAdmin();
  const USERS = await getUsers();
  const isSuperAdmin = admin.role === "SUPER_ADMIN";
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Users</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Manage and view all registered users.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-2 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-4 py-2 text-sm font-medium text-[var(--muted-foreground)] hover:bg-[var(--glass-strong-bg)] transition-colors">
            <Filter className="h-4 w-4" />
            Filter
          </button>
          <button className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 transition-colors">
            Export
          </button>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted)]" />
        <input
          type="search"
          placeholder="Search users by name, email, or phone..."
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
                    User
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                    Status
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                    Joined
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                    Transactions
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--glass-border)]">
                {USERS.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-[var(--muted)]">
                      No users yet.
                    </td>
                  </tr>
                )}
                {USERS.map((user) => (
                  <tr
                    key={user.id}
                    className="transition-colors hover:bg-[var(--glass-bg)]"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full gradient-accent flex items-center justify-center text-sm font-bold text-white">
                          {user.name.charAt(0)}
                        </div>
                        <span className="text-sm font-medium text-[var(--foreground)]">
                          {user.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="inline-flex items-center gap-1.5 text-xs text-[var(--muted)]">
                          <Mail className="h-3 w-3" />
                          {user.email}
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
                          <Phone className="h-3 w-3" />
                          {user.phone}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant="outline"
                        className={
                          user.status === "active"
                            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                            : user.status === "suspended"
                            ? "border-rose-500/20 bg-rose-500/10 text-rose-400"
                            : "border-amber-500/20 bg-amber-500/10 text-amber-400"
                        }
                      >
                        {user.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--muted)]">
                      {user.joined}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-[var(--foreground)]">
                      {user.transactions}
                    </td>
                    <td className="px-6 py-4">
                      <UserRowActions
                        userId={user.id}
                        userName={user.name}
                        isSuspended={user.status === "suspended"}
                        isCurrentUser={user.id === admin.id}
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
