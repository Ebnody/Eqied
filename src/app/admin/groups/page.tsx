import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, UsersRound, MoreHorizontal } from "lucide-react";

const GROUPS = [
  {
    id: "1",
    name: "Bole Apartment",
    members: 4,
    expenses: 32,
    totalVolume: 45000,
    created: "Jan 10, 2026",
    owner: "Abebe Kebede",
    status: "active",
  },
  {
    id: "2",
    name: "Office Lunch",
    members: 8,
    expenses: 124,
    totalVolume: 12800,
    created: "Feb 15, 2026",
    owner: "Meron Tadesse",
    status: "active",
  },
  {
    id: "3",
    name: "Trip Fund",
    members: 6,
    expenses: 18,
    totalVolume: 89000,
    created: "Mar 01, 2026",
    owner: "Dawit Hailu",
    status: "active",
  },
  {
    id: "4",
    name: "Project Alpha",
    members: 3,
    expenses: 45,
    totalVolume: 32000,
    created: "Apr 20, 2026",
    owner: "Selam Bekele",
    status: "archived",
  },
  {
    id: "5",
    name: "Gym Buddies",
    members: 5,
    expenses: 67,
    totalVolume: 15400,
    created: "May 05, 2026",
    owner: "Yonas Alemu",
    status: "active",
  },
];

function formatETB(amount: number) {
  return `ETB ${amount.toLocaleString("en-ET")}`;
}

export default function AdminGroupsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Groups</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Manage roommate groups and shared expenses.
          </p>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted)]" />
        <input
          type="search"
          placeholder="Search groups..."
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
                    Group
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                    Owner
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                    Members
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                    Expenses
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                    Volume
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                    Created
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                    Status
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--glass-border)]">
                {GROUPS.map((g) => (
                  <tr
                    key={g.id}
                    className="transition-colors hover:bg-[var(--glass-bg)]"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-[var(--glass-bg)] flex items-center justify-center">
                          <UsersRound className="h-4 w-4 text-[var(--muted)]" />
                        </div>
                        <span className="text-sm font-medium text-[var(--foreground)]">
                          {g.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--muted-foreground)]">
                      {g.owner}
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--foreground)]">
                      {g.members}
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--foreground)]">
                      {g.expenses}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-[var(--foreground)]">
                      {formatETB(g.totalVolume)}
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--muted)]">
                      {g.created}
                    </td>
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
