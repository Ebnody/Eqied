import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AddTransactionForm } from "@/components/dashboard/add-transaction-form";
import { TransactionList } from "@/components/dashboard/transaction-list";
import { getServerT } from "@/i18n/server";

export const dynamic = "force-dynamic";

export default async function ExpensesPage() {
  const user = await requireUser();
  const { t } = await getServerT({ userPreferredLocale: user.preferredLocale });
  const transactions = await prisma.transaction.findMany({
    where: { userId: user.id, type: "expense" },
    orderBy: { occurredAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t("nav.expenses")}</h1>
      </div>

      <AddTransactionForm type="expense" />

      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-slate-900 mb-2">
          {t("dashboard.recent")}
        </h2>
        <TransactionList
          transactions={transactions}
          emptyText={t("dashboard.noTransactions")}
        />
      </div>
    </div>
  );
}
