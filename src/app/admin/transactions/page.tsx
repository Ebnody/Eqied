import { prisma } from "@/lib/prisma";
import { TransactionsTable, TxRow } from "./transactions-table";

export const dynamic = "force-dynamic";

async function getTransactions(userId?: string): Promise<TxRow[]> {
  const rows = await prisma.transaction.findMany({
    where: userId ? { userId } : undefined,
    orderBy: { occurredAt: "desc" },
    take: 500,
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
    source: t.source,
    date: t.occurredAt.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    }),
    occurredAt: t.occurredAt.toISOString(),
    status: t.status,
  }));
}

export default async function AdminTransactionsPage({ searchParams }: { searchParams: Promise<{ user?: string }> }) {
  const { user } = await searchParams;
  const transactions = await getTransactions(user);
  return <TransactionsTable transactions={transactions} userId={user} />;
}
