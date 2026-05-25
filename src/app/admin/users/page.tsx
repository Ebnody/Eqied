import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, MoreHorizontal, Mail, Phone } from "lucide-react";

const USERS = [
  {
    id: "1",
    name: "Abebe Kebede",
    email: "abebe@example.com",
    phone: "+251911234567",
    status: "active",
    joined: "Jan 15, 2026",
    transactions: 142,
  },
  {
    id: "2",
    name: "Meron Tadesse",
    email: "meron@example.com",
    phone: "+251922345678",
    status: "active",
    joined: "Feb 03, 2026",
    transactions: 89,
  },
  {
    id: "3",
    name: "Dawit Hailu",
    email: "dawit@example.com",
    phone: "+251933456789",
    status: "inactive",
    joined: "Mar 12, 2026",
    transactions: 34,
  },
  {
    id: "4",
    name: "Selam Bekele",
    email: "selam@example.com",
    phone: "+251944567890",
    status: "active",
    joined: "Apr 01, 2026",
    transactions: 215,
  },
  {
    id: "5",
    name: "Yonas Alemu",
    email: "yonas@example.com",
    phone: "+251955678901",
    status: "pending",
    joined: "May 10, 2026",
    transactions: 12,
  },
  {
    id: "6",
    name: "Hiwot Girma",
    email: "hiwot@example.com",
    phone: "+251966789012",
    status: "active",
    joined: "May 18, 2026",
    transactions: 56,
  },
];

export default function AdminUsersPage() {
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
                            : user.status === "inactive"
                            ? "border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--muted)]"
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
                      <button className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
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
