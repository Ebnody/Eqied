import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, CreditCard, User, Hash, FileText, Banknote } from "lucide-react";
import { ExportSingleTransaction } from "@/components/admin/export-single-transaction";

export const dynamic = "force-dynamic";

function formatETB(santim: number) {
  return `ETB ${(santim / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export default async function TransactionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const tx = await prisma.transaction.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, fullName: true, phone: true, telegramUsername: true } },
      forwardedSms: true,
    },
  });
  if (!tx) notFound();

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/transactions"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Transactions
        </Link>
        <ExportSingleTransaction
          transaction={{
            id: tx.id,
            type: tx.type,
            amount: tx.amount,
            categoryKey: tx.categoryKey,
            source: tx.source,
            paymentMethod: tx.paymentMethod,
            status: tx.status,
            counterparty: tx.counterparty,
            reference: tx.reference,
            occurredAt: tx.occurredAt.toISOString(),
            notes: tx.notes,
            userName: tx.user?.fullName ?? null,
            userPhone: tx.user?.phone ?? null,
          }}
        />
      </div>

      <div className="glass rounded-2xl border border-[var(--glass-border)] p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-[var(--foreground)]">Transaction Details</h1>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
            tx.type === "INCOME"
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              : "bg-rose-500/10 text-rose-400 border-rose-500/20"
          }`}>
            {tx.type}
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <DetailRow icon={<Banknote className="h-4 w-4" />} label="Amount" value={formatETB(tx.amount)} />
          <DetailRow icon={<Hash className="h-4 w-4" />} label="ID" value={tx.id} />
          <DetailRow icon={<CreditCard className="h-4 w-4" />} label="Source" value={tx.source} />
          <DetailRow icon={<CreditCard className="h-4 w-4" />} label="Payment Method" value={tx.paymentMethod ?? "—"} />
          <DetailRow icon={<CreditCard className="h-4 w-4" />} label="Provider" value={tx.provider ?? "—"} />
          <DetailRow icon={<Calendar className="h-4 w-4" />} label="Occurred" value={tx.occurredAt.toLocaleString("en-US")} />
          <DetailRow icon={<Calendar className="h-4 w-4" />} label="Recorded" value={tx.createdAt.toLocaleString("en-US")} />
          <DetailRow icon={<FileText className="h-4 w-4" />} label="Status" value={tx.status} />
          <DetailRow icon={<FileText className="h-4 w-4" />} label="Category" value={tx.categoryKey ?? "Uncategorized"} />
          {tx.reference && (
            <DetailRow icon={<Hash className="h-4 w-4" />} label="Reference" value={tx.reference} />
          )}
          {tx.counterparty && (
            <DetailRow icon={<User className="h-4 w-4" />} label="Counterparty" value={tx.counterparty} />
          )}
        </div>

        {tx.notes && (
          <div className="mt-4 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] p-3">
            <p className="text-xs font-medium text-[var(--muted)] uppercase">Notes</p>
            <p className="mt-1 text-sm text-[var(--foreground)]">{tx.notes}</p>
          </div>
        )}
      </div>

      {/* User Card */}
      {tx.user && (
        <div className="glass rounded-2xl border border-[var(--glass-border)] p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--muted)] mb-4">Created By</h2>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full gradient-accent flex items-center justify-center text-sm font-bold text-white">
              {(tx.user.fullName ?? "?").charAt(0).toUpperCase()}
            </div>
            <div>
              <Link href={`/admin/users/${tx.user.id}`} className="text-sm font-medium text-[var(--foreground)] hover:text-emerald-400 transition-colors">
                {tx.user.fullName ?? "Unnamed"}
              </Link>
              <p className="text-xs text-[var(--muted)]">{tx.user.phone ?? tx.user.telegramUsername ?? "—"}</p>
            </div>
          </div>
        </div>
      )}

      {/* SMS Data */}
      {tx.forwardedSms && (
        <div className="glass rounded-2xl border border-[var(--glass-border)] p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--muted)] mb-4">Parsed SMS</h2>
          <div className="rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] p-4 font-mono text-xs text-[var(--foreground)] whitespace-pre-wrap">
            {tx.forwardedSms.rawText}
          </div>
          <div className="mt-3 grid gap-2 text-sm">
            <p className="text-[var(--muted)]">Provider: <span className="text-[var(--foreground)]">{tx.forwardedSms.provider ?? "—"}</span></p>
            <p className="text-[var(--muted)]">Parsed OK: <span className="text-[var(--foreground)]">{tx.forwardedSms.parsedOk ? "Yes" : "No"}</span></p>
            {tx.forwardedSms.parserName && (
              <p className="text-[var(--muted)]">Parser: <span className="text-[var(--foreground)]">{tx.forwardedSms.parserName}</span></p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-[var(--muted)] mt-0.5">{icon}</span>
      <div>
        <p className="text-xs text-[var(--muted)]">{label}</p>
        <p className="text-sm font-medium text-[var(--foreground)] break-all">{value}</p>
      </div>
    </div>
  );
}
