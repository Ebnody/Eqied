import { StatCard } from "@/components/admin/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  ArrowLeftRight,
  Wallet,
  TrendingUp,
  Activity,
  CreditCard,
  UsersRound,
} from "lucide-react";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Dashboard Overview</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Welcome back — here&apos;s what&apos;s happening with your platform.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Users"
          value="1,248"
          change={12.5}
          changeLabel="vs last month"
          icon={Users}
          gradient="info"
        />
        <StatCard
          label="Total Transactions"
          value="8,420"
          change={8.2}
          changeLabel="vs last month"
          icon={ArrowLeftRight}
          gradient="income"
        />
        <StatCard
          label="Total Volume"
          value="ETB 2.4M"
          change={-3.1}
          changeLabel="vs last month"
          icon={Wallet}
          gradient="warning"
        />
        <StatCard
          label="Active Groups"
          value="86"
          change={24}
          changeLabel="vs last month"
          icon={UsersRound}
          gradient="expense"
        />
      </div>

      {/* Two column layout */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Recent activity */}
        <Card className="lg:col-span-8 glass rounded-2xl border-[var(--glass-border)]">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-[var(--foreground)]">
                Recent Transactions
              </CardTitle>
              <button className="text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors">
                View All
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  user: "Abebe Kebede",
                  action: "Added expense",
                  amount: "- ETB 1,250",
                  time: "2 min ago",
                  type: "expense" as const,
                },
                {
                  user: "Meron Tadesse",
                  action: "Received income",
                  amount: "+ ETB 5,000",
                  time: "15 min ago",
                  type: "income" as const,
                },
                {
                  user: "Dawit Hailu",
                  action: "Joined group",
                  amount: "—",
                  time: "1 hour ago",
                  type: "neutral" as const,
                },
                {
                  user: "Selam Bekele",
                  action: "Added expense",
                  amount: "- ETB 890",
                  time: "2 hours ago",
                  type: "expense" as const,
                },
                {
                  user: "Yonas Alemu",
                  action: "Received income",
                  amount: "+ ETB 12,000",
                  time: "3 hours ago",
                  type: "income" as const,
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-2 border-b border-[var(--glass-border)] last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-[var(--glass-bg)] flex items-center justify-center text-sm font-bold text-[var(--muted-foreground)]">
                      {item.user.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--foreground)]">
                        {item.user}
                      </p>
                      <p className="text-xs text-[var(--muted)]">{item.action}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-sm font-semibold ${
                        item.type === "income"
                          ? "text-emerald-400"
                          : item.type === "expense"
                          ? "text-rose-400"
                          : "text-[var(--muted)]"
                      }`}
                    >
                      {item.amount}
                    </p>
                    <p className="text-xs text-[var(--muted)]">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Side cards */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="glass rounded-2xl border-[var(--glass-border)]">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold text-[var(--foreground)] flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: "New users today", value: "24", icon: Users },
                { label: "Transactions today", value: "142", icon: CreditCard },
                { label: "Active now", value: "38", icon: Activity },
              ].map((s) => (
                <div
                  key={s.label}
                  className="flex items-center justify-between rounded-xl bg-[var(--glass-bg)] px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <s.icon className="h-4 w-4 text-[var(--muted)]" />
                    <span className="text-sm text-[var(--muted-foreground)]">{s.label}</span>
                  </div>
                  <span className="text-sm font-bold text-[var(--foreground)]">{s.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="glass rounded-2xl border-[var(--glass-border)]">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold text-[var(--foreground)]">
                Top Groups
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { name: "Bole Apartment", members: 4, volume: "ETB 45K" },
                { name: "Office Lunch", members: 8, volume: "ETB 12K" },
                { name: "Trip Fund", members: 6, volume: "ETB 89K" },
              ].map((g, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-xl bg-[var(--glass-bg)] px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-[var(--foreground)]">{g.name}</p>
                    <p className="text-xs text-[var(--muted)]">{g.members} members</p>
                  </div>
                  <span className="text-sm font-semibold text-emerald-400">
                    {g.volume}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
