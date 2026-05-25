import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CategorizeRow } from "./categorize-row";
import { TransactionList } from "@/components/dashboard/transaction-list";
import { Inbox } from "lucide-react";
import { getServerT } from "@/i18n/server";

export const dynamic = "force-dynamic";

export default async function TransactionsPage() {
  const user = await requireUser();
  const { t } = await getServerT({ userPreferredLocale: user.preferredLocale });

  const [uncategorized, recent] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId: user.id, status: "uncategorized" },
      orderBy: { createdAt: "desc" },
    }),
    prisma.transaction.findMany({
      where: {
        userId: user.id,
        status: { in: ["categorized", "ignored"] },
      },
      orderBy: { occurredAt: "desc" },
      take: 30,
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">
          {t("transactions.title")}
        </h1>
        <p className="text-sm text-[var(--muted)]">{t("transactions.subtitle")}</p>
      </div>

      <div className="glass rounded-2xl border border-[var(--glass-border)] shadow-sm">
        <div className="px-5 py-4 border-b border-[var(--glass-border)] flex items-center gap-2">
          <Inbox className="h-4 w-4 text-amber-400" />
          <h2 className="font-semibold text-[var(--foreground)]">
            {t("transactions.inbox")}
            {uncategorized.length > 0 && (
              <span className="ml-2 inline-flex items-center justify-center bg-amber-500/15 text-amber-300 text-xs font-medium px-2 py-0.5 rounded-full">
                {uncategorized.length}
              </span>
            )}
          </h2>
        </div>
        {uncategorized.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)] text-center py-10 px-5">
            {t("transactions.uncategorizedEmpty")}
          </p>
        ) : (
          <ul className="divide-y divide-[var(--glass-border)]">
            {uncategorized.map((txn) => (
              <CategorizeRow key={txn.id} txn={txn} />
            ))}
          </ul>
        )}
      </div>

      <div className="glass rounded-2xl border border-[var(--glass-border)] p-5">
        <h2 className="font-semibold text-[var(--foreground)] mb-2">
          {t("transactions.activity")}
        </h2>
        <TransactionList
          transactions={recent}
          emptyText={t("dashboard.noTransactions")}
        />
      </div>
    </div>
  );
}
