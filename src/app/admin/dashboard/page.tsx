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
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

function formatETB(santim: number): string {
  const etb = santim / 100;
  if (etb >= 1_000_000) return `ETB ${(etb / 1_000_000).toFixed(1)}M`;
  if (etb >= 1_000) return `ETB ${(etb / 1_000).toFixed(1)}K`;
  return `ETB ${etb.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

async function getDashboardData() {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [
    totalUsers,
    totalTransactions,
    volumeAgg,
    totalGroups,
    usersThisMonth,
    usersPrevMonth,
    txnsThisMonth,
    txnsPrevMonth,
    volumeThisMonthAgg,
    volumePrevMonthAgg,
    groupsThisMonth,
    groupsPrevMonth,
    newUsersToday,
    txnsToday,
    activeUsersToday,
    recentTxns,
    topGroupsRaw,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "USER" } }),
    prisma.transaction.count(),
    prisma.transaction.aggregate({ _sum: { amount: true } }),
    prisma.roommateGroup.count(),
    prisma.user.count({ where: { role: "USER", createdAt: { gte: startOfMonth } } }),
    prisma.user.count({
      where: {
        role: "USER",
        createdAt: { gte: startOfPrevMonth, lt: startOfMonth },
      },
    }),
    prisma.transaction.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.transaction.count({
      where: { createdAt: { gte: startOfPrevMonth, lt: startOfMonth } },
    }),
    prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { createdAt: { gte: startOfMonth } },
    }),
    prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { createdAt: { gte: startOfPrevMonth, lt: startOfMonth } },
    }),
    prisma.roommateGroup.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.roommateGroup.count({
      where: { createdAt: { gte: startOfPrevMonth, lt: startOfMonth } },
    }),
    prisma.user.count({
      where: { role: "USER", createdAt: { gte: startOfDay } },
    }),
    prisma.transaction.count({ where: { createdAt: { gte: startOfDay } } }),
    prisma.user.count({
      where: { role: "USER", updatedAt: { gte: startOfDay } },
    }),
    prisma.transaction.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { fullName: true, email: true, phone: true } },
      },
    }),
    prisma.roommateExpense.groupBy({
      by: ["groupId"],
      _sum: { amount: true },
      orderBy: { _sum: { amount: "desc" } },
      take: 3,
    }),
  ]);

  const topGroupIds = topGroupsRaw.map((g) => g.groupId);
  const topGroupsMeta = topGroupIds.length
    ? await prisma.roommateGroup.findMany({
        where: { id: { in: topGroupIds } },
        include: { _count: { select: { members: true } } },
      })
    : [];
  const topGroups = topGroupsRaw.map((g) => {
    const meta = topGroupsMeta.find((m) => m.id === g.groupId);
    return {
      id: g.groupId,
      name: meta?.name ?? "Group",
      members: meta?._count.members ?? 0,
      volume: g._sum.amount ?? 0,
    };
  });

  function pctChange(curr: number, prev: number): number {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return Math.round(((curr - prev) / prev) * 1000) / 10;
  }

  return {
    totalUsers,
    totalTransactions,
    totalVolume: volumeAgg._sum.amount ?? 0,
    totalGroups,
    usersChange: pctChange(usersThisMonth, usersPrevMonth),
    txnsChange: pctChange(txnsThisMonth, txnsPrevMonth),
    volumeChange: pctChange(
      volumeThisMonthAgg._sum.amount ?? 0,
      volumePrevMonthAgg._sum.amount ?? 0
    ),
    groupsChange: pctChange(groupsThisMonth, groupsPrevMonth),
    newUsersToday,
    txnsToday,
    activeUsersToday,
    recentTxns,
    topGroups,
  };
}

export default async function AdminDashboardPage() {
  const data = await getDashboardData();
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
          value={data.totalUsers.toLocaleString()}
          change={data.usersChange}
          changeLabel="vs last month"
          icon={Users}
          gradient="info"
          href="/admin/users"
        />
        <StatCard
          label="Total Transactions"
          value={data.totalTransactions.toLocaleString()}
          change={data.txnsChange}
          changeLabel="vs last month"
          icon={ArrowLeftRight}
          gradient="income"
          href="/admin/transactions"
        />
        <StatCard
          label="Total Volume"
          value={formatETB(data.totalVolume)}
          change={data.volumeChange}
          changeLabel="vs last month"
          icon={Wallet}
          gradient="warning"
          href="/admin/transactions"
        />
        <StatCard
          label="Active Groups"
          value={data.totalGroups.toLocaleString()}
          change={data.groupsChange}
          changeLabel="vs last month"
          icon={UsersRound}
          gradient="expense"
          href="/admin/groups"
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
              <Link
                href="/admin/transactions"
                className="text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                View All
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.recentTxns.length === 0 ? (
                <p className="text-sm text-[var(--muted)] text-center py-8">
                  No transactions yet.
                </p>
              ) : (
                data.recentTxns.map((txn) => {
                  const userName =
                    txn.user.fullName ||
                    txn.user.email ||
                    txn.user.phone ||
                    "Unknown";
                  const isIncome = txn.type === "income";
                  const sign = isIncome ? "+" : "-";
                  return (
                    <div
                      key={txn.id}
                      className="flex items-center justify-between py-2 border-b border-[var(--glass-border)] last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-[var(--glass-bg)] flex items-center justify-center text-sm font-bold text-[var(--muted-foreground)]">
                          {userName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[var(--foreground)]">
                            {userName}
                          </p>
                          <p className="text-xs text-[var(--muted)]">
                            {isIncome ? "Received income" : "Added expense"}
                            {txn.categoryKey ? ` · ${txn.categoryKey}` : ""}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-sm font-semibold ${
                            isIncome ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          {sign} {formatETB(txn.amount)}
                        </p>
                        <p className="text-xs text-[var(--muted)]">
                          {timeAgo(txn.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
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
                {
                  label: "New users today",
                  value: data.newUsersToday.toLocaleString(),
                  icon: Users,
                },
                {
                  label: "Transactions today",
                  value: data.txnsToday.toLocaleString(),
                  icon: CreditCard,
                },
                {
                  label: "Active today",
                  value: data.activeUsersToday.toLocaleString(),
                  icon: Activity,
                },
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
              {data.topGroups.length === 0 ? (
                <p className="text-sm text-[var(--muted)] text-center py-4">
                  No groups yet.
                </p>
              ) : (
                data.topGroups.map((g) => (
                  <div
                    key={g.id}
                    className="flex items-center justify-between rounded-xl bg-[var(--glass-bg)] px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-[var(--foreground)]">
                        {g.name}
                      </p>
                      <p className="text-xs text-[var(--muted)]">
                        {g.members} members
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-emerald-400">
                      {formatETB(g.volume)}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
