import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Phone, Send, Calendar, Ban, Shield, CheckCircle, Clock } from "lucide-react";
import { ExportUserTransactions } from "@/components/admin/export-user-transactions";

export const dynamic = "force-dynamic";

function formatETB(santim: number) {
  return `ETB ${(santim / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

async function getUser(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      telegramLink: true,
      _count: {
        select: { transactions: true, roommateGroupsOwned: true, issueReports: true },
      },
      transactions: {
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          type: true,
          amount: true,
          categoryKey: true,
          source: true,
          status: true,
          createdAt: true,
        },
      },
      roommateGroupsOwned: {
        select: { id: true, name: true, createdAt: true, _count: { select: { members: true } } },
      },
      roommateMemberships: {
        include: {
          group: { select: { id: true, name: true, createdAt: true, _count: { select: { members: true } } } },
        },
      },
      issueReports: {
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, subject: true, status: true, createdAt: true },
      },
    },
  });
  return user;
}

async function getTransactionVolume(userId: string) {
  const agg = await prisma.transaction.groupBy({
    by: ["type"],
    where: { userId },
    _sum: { amount: true },
  });
  const income = agg.find((a) => a.type === "INCOME")?._sum.amount ?? 0;
  const expense = agg.find((a) => a.type === "EXPENSE")?._sum.amount ?? 0;
  return { income, expense, total: income + expense };
}

async function getAuditLogs(userId: string) {
  return prisma.adminLog.findMany({
    where: { resourceId: userId },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { admin: { select: { fullName: true } } },
  });
}

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  const { id } = await params;
  const user = await getUser(id);
  if (!user || user.role !== "USER") notFound();

  const volume = await getTransactionVolume(id);
  const logs = await getAuditLogs(id);

  const status = user.disabledAt
    ? "suspended"
    : user.isVerified
    ? "active"
    : "pending";

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Users
        </Link>
      </div>

      {/* Profile Card */}
      <div className="glass rounded-2xl border border-[var(--glass-border)] p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="h-16 w-16 rounded-full gradient-accent flex items-center justify-center text-2xl font-bold text-white">
            {(user.fullName ?? "?").charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-[var(--foreground)]">
              {user.fullName ?? "Unnamed User"}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--muted)]">
              {user.telegramLink && (
                <span className="inline-flex items-center gap-1.5 text-sky-400">
                  <Send className="h-3.5 w-3.5" />
                  @{user.telegramLink.username ?? user.telegramUsername}
                </span>
              )}
              {user.phone && (
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" />
                  {user.phone}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Joined {user.createdAt.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {status === "active" && (
              <span className="inline-flex items-center gap-1 text-xs font-medium bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/20">
                <CheckCircle className="h-3 w-3" /> Active
              </span>
            )}
            {status === "suspended" && (
              <span className="inline-flex items-center gap-1 text-xs font-medium bg-rose-500/10 text-rose-400 px-2.5 py-1 rounded-full border border-rose-500/20">
                <Ban className="h-3 w-3" /> Suspended
              </span>
            )}
            {status === "pending" && (
              <span className="inline-flex items-center gap-1 text-xs font-medium bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded-full border border-amber-500/20">
                <Clock className="h-3 w-3" /> Pending
              </span>
            )}
          </div>
        </div>

        {user.disabledAt && user.disabledReason && (
          <div className="mt-4 rounded-xl bg-rose-500/5 border border-rose-500/10 p-3 text-sm text-rose-300">
            <strong>Suspension reason:</strong> {user.disabledReason}
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Transactions" value={user._count.transactions.toString()} />
        <StatCard label="Income Volume" value={formatETB(volume.income)} />
        <StatCard label="Expense Volume" value={formatETB(volume.expense)} />
        <StatCard label="Total Volume" value={formatETB(volume.total)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Transactions */}
        <SectionCard
          title="Recent Transactions"
          href={`/admin/transactions?user=${id}`}
          action={<ExportUserTransactions userId={id} userName={user.fullName ?? "User"} />}
        >
          {user.transactions.length === 0 ? (
            <EmptyState>No transactions yet.</EmptyState>
          ) : (
            <div className="divide-y divide-[var(--glass-border)]">
              {user.transactions.map((t) => (
                <div key={t.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[var(--foreground)]">
                      {t.categoryKey ?? "Uncategorized"} — {formatETB(t.amount)}
                    </p>
                    <p className="text-xs text-[var(--muted)]">{t.source} · {t.status}</p>
                  </div>
                  <span className={`text-xs font-medium ${t.type === "INCOME" ? "text-emerald-400" : "text-rose-400"}`}>
                    {t.type}
                  </span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Groups */}
        <SectionCard title="Groups">
          {user.roommateGroupsOwned.length === 0 && user.roommateMemberships.length === 0 ? (
            <EmptyState>No groups.</EmptyState>
          ) : (
            <div className="divide-y divide-[var(--glass-border)]">
              {user.roommateGroupsOwned.map((g) => (
                <div key={g.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[var(--foreground)]">{g.name}</p>
                    <p className="text-xs text-[var(--muted)]">{g._count.members} members · Owner</p>
                  </div>
                  <Link
                    href={`/admin/groups/${g.id}`}
                    className="text-xs text-emerald-400 hover:text-emerald-300"
                  >
                    View
                  </Link>
                </div>
              ))}
              {user.roommateMemberships.map((m) => (
                <div key={m.group.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[var(--foreground)]">{m.group.name}</p>
                    <p className="text-xs text-[var(--muted)]">{m.group._count.members} members · Member</p>
                  </div>
                  <Link
                    href={`/admin/groups/${m.group.id}`}
                    className="text-xs text-emerald-400 hover:text-emerald-300"
                  >
                    View
                  </Link>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Support Tickets */}
        <SectionCard title="Support Tickets" href="/admin/messages">
          {user.issueReports.length === 0 ? (
            <EmptyState>No tickets filed.</EmptyState>
          ) : (
            <div className="divide-y divide-[var(--glass-border)]">
              {user.issueReports.map((ticket) => (
                <div key={ticket.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[var(--foreground)]">{ticket.subject}</p>
                    <p className="text-xs text-[var(--muted)]">
                      {ticket.createdAt.toLocaleDateString("en-US", { month: "short", day: "2-digit" })} · {ticket.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Audit Trail */}
        <SectionCard title="Admin Audit Trail">
          {logs.length === 0 ? (
            <EmptyState>No admin actions recorded.</EmptyState>
          ) : (
            <div className="divide-y divide-[var(--glass-border)]">
              {logs.map((log) => (
                <div key={log.id} className="py-3">
                  <p className="text-sm text-[var(--foreground)]">
                    <span className="font-medium">{log.action}</span>
                    {log.admin?.fullName && ` by ${log.admin.fullName}`}
                  </p>
                  <p className="text-xs text-[var(--muted)]">
                    {log.createdAt.toLocaleDateString("en-US", { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                    {log.ipAddress && ` · ${log.ipAddress}`}
                  </p>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass rounded-2xl border border-[var(--glass-border)] p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-2xl font-bold text-[var(--foreground)]">{value}</p>
    </div>
  );
}

function SectionCard({ title, children, href, action }: { title: string; children: React.ReactNode; href?: string; action?: React.ReactNode }) {
  return (
    <div className="glass rounded-2xl border border-[var(--glass-border)] overflow-hidden">
      <div className="px-5 py-4 border-b border-[var(--glass-border)] flex items-center justify-between">
        <h2 className="font-semibold text-[var(--foreground)]">{title}</h2>
        <div className="flex items-center gap-3">
          {action}
          {href && (
            <Link href={href} className="text-xs text-emerald-400 hover:text-emerald-300">
              View all
            </Link>
          )}
        </div>
      </div>
      <div className="px-5 py-2">{children}</div>
    </div>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return <p className="py-6 text-center text-sm text-[var(--muted)]">{children}</p>;
}
