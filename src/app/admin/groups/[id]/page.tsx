import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  UsersRound,
  Calendar,
  Banknote,
  HandCoins,
  Receipt,
  UserPlus,
  CheckCircle,
  Ban,
  ArrowRightLeft,
} from "lucide-react";

export const dynamic = "force-dynamic";

function formatETB(santim: number) {
  return `ETB ${(santim / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

function relativeTime(date: Date) {
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

async function getGroup(id: string) {
  return prisma.roommateGroup.findUnique({
    where: { id },
    include: {
      createdBy: { select: { id: true, fullName: true, phone: true } },
      _count: { select: { members: true, expenses: true, loans: true, settlements: true } },
      members: {
        include: {
          user: { select: { id: true, fullName: true, phone: true, telegramUsername: true } },
        },
        orderBy: { joinedAt: "asc" },
      },
      expenses: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          paidBy: { include: { user: { select: { fullName: true } } } },
          splits: { include: { member: { include: { user: { select: { fullName: true } } } } } },
        },
      },
      loans: {
        where: { status: { in: ["unpaid", "partial"] } },
        include: {
          lender: { include: { user: { select: { fullName: true } } } },
          borrower: { include: { user: { select: { fullName: true } } } },
        },
      },
      settlements: {
        orderBy: { settledAt: "desc" },
        take: 10,
        include: {
          fromMember: { include: { user: { select: { fullName: true } } } },
          toMember: { include: { user: { select: { fullName: true } } } },
        },
      },
      activityLogs: {
        orderBy: { createdAt: "desc" },
        take: 50,
        include: {
          actor: { include: { user: { select: { fullName: true } } } },
        },
      },
    },
  });
}

export default async function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const group = await getGroup(id);
  if (!group) notFound();

  const totalExpenseVolume = group.expenses.reduce((s, e) => s + e.amount, 0);
  const activeLoans = group.loans;
  const isArchived = !!group.archivedAt;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Link
        href="/admin/groups"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Groups
      </Link>

      {/* Header */}
      <div className="glass rounded-2xl border border-[var(--glass-border)] p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-[var(--glass-bg)] flex items-center justify-center">
              <UsersRound className="h-6 w-6 text-[var(--muted)]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--foreground)]">{group.name}</h1>
              <p className="text-sm text-[var(--muted)]">
                Owner: {" "}
                <Link href={`/admin/users/${group.createdBy.id}`} className="text-emerald-400 hover:text-emerald-300">
                  {group.createdBy.fullName ?? "Unnamed"}
                </Link>
                {" · "}
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {group.createdAt.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })}
                </span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isArchived ? (
              <span className="inline-flex items-center gap-1 text-xs font-medium bg-[var(--glass-bg)] text-[var(--muted)] px-2.5 py-1 rounded-full border border-[var(--glass-border)]">
                <Ban className="h-3 w-3" /> Archived
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-medium bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/20">
                <CheckCircle className="h-3 w-3" /> Active
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Members" value={group._count.members.toString()} icon={<UsersRound className="h-4 w-4" />} />
        <StatCard label="Expenses" value={group._count.expenses.toString()} icon={<Receipt className="h-4 w-4" />} />
        <StatCard label="Volume" value={formatETB(totalExpenseVolume)} icon={<Banknote className="h-4 w-4" />} />
        <StatCard label="Active Loans" value={activeLoans.length.toString()} icon={<HandCoins className="h-4 w-4" />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Members */}
        <SectionCard title="Members">
          <div className="divide-y divide-[var(--glass-border)]">
            {group.members.map((m) => (
              <div key={m.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full gradient-accent flex items-center justify-center text-xs font-bold text-white">
                    {(m.user.fullName ?? "?").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--foreground)]">
                      {m.user.fullName ?? m.user.telegramUsername ?? "Unnamed"}
                    </p>
                    <p className="text-xs text-[var(--muted)]">{m.role} · {m.user.phone ?? "—"}</p>
                  </div>
                </div>
                <span className="text-xs text-[var(--muted)]">
                  {m.joinedAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Recent Expenses */}
        <SectionCard title="Recent Expenses">
          {group.expenses.length === 0 ? (
            <EmptyState>No expenses yet.</EmptyState>
          ) : (
            <div className="divide-y divide-[var(--glass-border)]">
              {group.expenses.map((e) => (
                <div key={e.id} className="py-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-[var(--foreground)]">{e.title}</p>
                    <p className="text-sm font-semibold text-[var(--foreground)]">{formatETB(e.amount)}</p>
                  </div>
                  <p className="text-xs text-[var(--muted)]">
                    Paid by {e.paidBy.user.fullName ?? "—"} · {e.splitType} split · {e.categoryKey}
                  </p>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Active Loans */}
        <SectionCard title="Active Loans">
          {activeLoans.length === 0 ? (
            <EmptyState>No active loans.</EmptyState>
          ) : (
            <div className="divide-y divide-[var(--glass-border)]">
              {activeLoans.map((loan) => (
                <div key={loan.id} className="py-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-[var(--foreground)]">
                      {loan.lender.user.fullName ?? "—"} → {loan.borrower.user.fullName ?? "—"}
                    </p>
                    <p className="text-sm font-semibold text-[var(--foreground)]">{formatETB(loan.amount - loan.paid)}</p>
                  </div>
                  {loan.reason && <p className="text-xs text-[var(--muted)]">{loan.reason}</p>}
                  <p className="text-xs text-[var(--muted)]">{loan.status} · remaining</p>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Settlements */}
        <SectionCard title="Recent Settlements">
          {group.settlements.length === 0 ? (
            <EmptyState>No settlements yet.</EmptyState>
          ) : (
            <div className="divide-y divide-[var(--glass-border)]">
              {group.settlements.map((s) => (
                <div key={s.id} className="py-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-[var(--foreground)]">
                      {s.fromMember.user.fullName ?? "—"} <ArrowRightLeft className="inline h-3 w-3 mx-1 text-[var(--muted)]" />{" "}
                      {s.toMember.user.fullName ?? "—"}
                    </p>
                    <p className="text-sm font-semibold text-[var(--foreground)]">{formatETB(s.amount)}</p>
                  </div>
                  <p className="text-xs text-[var(--muted)]">{s.settledAt.toLocaleDateString("en-US")}</p>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      {/* Activity Feed */}
      <div className="glass rounded-2xl border border-[var(--glass-border)] overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--glass-border)]">
          <h2 className="font-semibold text-[var(--foreground)] flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[var(--muted)]" />
            Activity Feed
          </h2>
        </div>
        <div className="px-5 py-4">
          {group.activityLogs.length === 0 ? (
            <EmptyState>No activity recorded yet.</EmptyState>
          ) : (
            <div className="space-y-4">
              {group.activityLogs.map((log) => (
                <ActivityItem key={log.id} log={log} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

type ActivityLog = {
  id: string;
  kind: string;
  payload: string | null;
  createdAt: Date;
  actor: { user: { fullName: string | null } } | null;
};

function ActivityItem({ log }: { log: ActivityLog }) {
  const actorName = log.actor?.user.fullName ?? "Someone";
  let icon: React.ReactNode;
  let text: string;

  switch (log.kind) {
    case "expense_added":
      icon = <Receipt className="h-4 w-4 text-emerald-400" />;
      text = `${actorName} added an expense`;
      break;
    case "expense_edited":
      icon = <Receipt className="h-4 w-4 text-amber-400" />;
      text = `${actorName} edited an expense`;
      break;
    case "loan_added":
      icon = <HandCoins className="h-4 w-4 text-sky-400" />;
      text = `${actorName} recorded a loan`;
      break;
    case "loan_paid":
      icon = <HandCoins className="h-4 w-4 text-emerald-400" />;
      text = `${actorName} made a loan payment`;
      break;
    case "settlement":
      icon = <ArrowRightLeft className="h-4 w-4 text-violet-400" />;
      text = `${actorName} recorded a settlement`;
      break;
    case "member_joined":
      icon = <UserPlus className="h-4 w-4 text-emerald-400" />;
      text = `${actorName} joined the group`;
      break;
    case "member_invited":
      icon = <UserPlus className="h-4 w-4 text-sky-400" />;
      text = `${actorName} sent an invite`;
      break;
    case "invite_accepted":
      icon = <CheckCircle className="h-4 w-4 text-emerald-400" />;
      text = `${actorName} accepted an invite`;
      break;
    case "invite_declined":
      icon = <Ban className="h-4 w-4 text-rose-400" />;
      text = `${actorName} declined an invite`;
      break;
    default:
      icon = <Calendar className="h-4 w-4 text-[var(--muted)]" />;
      text = `${actorName}: ${log.kind}`;
  }

  let payload: Record<string, unknown> | null = null;
  try {
    if (log.payload) payload = JSON.parse(log.payload);
  } catch {
    payload = null;
  }

  return (
    <div className="flex gap-3">
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div className="flex-1">
        <p className="text-sm text-[var(--foreground)]">{text}</p>
        {payload && (
          <p className="text-xs text-[var(--muted)] mt-0.5">
            {payload.title ? <span className="font-medium">{String(payload.title)}</span> : null}
            {payload.amount ? <span> · {formatETB(Number(payload.amount))}</span> : null}
            {payload.reason ? <span> · {String(payload.reason)}</span> : null}
          </p>
        )}
        <p className="text-xs text-[var(--muted)] mt-0.5">{relativeTime(log.createdAt)}</p>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="glass rounded-2xl border border-[var(--glass-border)] p-5">
      <div className="flex items-center gap-2 text-[var(--muted)] mb-2">{icon}<span className="text-xs font-semibold uppercase tracking-wider">{label}</span></div>
      <p className="text-2xl font-bold text-[var(--foreground)]">{value}</p>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass rounded-2xl border border-[var(--glass-border)] overflow-hidden">
      <div className="px-5 py-4 border-b border-[var(--glass-border)]">
        <h2 className="font-semibold text-[var(--foreground)]">{title}</h2>
      </div>
      <div className="px-5 py-2">{children}</div>
    </div>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return <p className="py-6 text-center text-sm text-[var(--muted)]">{children}</p>;
}
