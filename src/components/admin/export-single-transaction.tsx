"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { downloadCsv, toCsv } from "@/lib/csv";

interface Props {
  transaction: {
    id: string;
    type: string;
    amount: number;
    categoryKey: string | null;
    source: string;
    paymentMethod: string | null;
    status: string;
    counterparty: string | null;
    reference: string | null;
    occurredAt: string;
    notes: string | null;
    userName: string | null;
    userPhone: string | null;
  };
}

export function ExportSingleTransaction({ transaction }: Props) {
  const [busy, setBusy] = useState(false);

  function handleExport() {
    setBusy(true);
    try {
      const t = transaction;
      const rows = [
        [
          t.id,
          t.type,
          (t.amount / 100).toFixed(2),
          t.categoryKey ?? "Uncategorized",
          t.source,
          t.paymentMethod ?? "—",
          t.status,
          t.counterparty ?? "—",
          t.reference ?? "—",
          t.occurredAt,
          t.userName ?? "—",
          t.userPhone ?? "—",
          t.notes ?? "",
        ],
      ];

      const csv = toCsv(
        [
          "ID",
          "Type",
          "Amount (ETB)",
          "Category",
          "Source",
          "Payment Method",
          "Status",
          "Counterparty",
          "Reference",
          "Occurred At",
          "User Name",
          "User Phone",
          "Notes",
        ],
        rows
      );

      downloadCsv(`transaction_${t.id.slice(0, 8)}_${new Date().toISOString().slice(0, 10)}.csv`, csv);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={busy}
      className="inline-flex items-center gap-2 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--glass-strong-bg)] transition-colors disabled:opacity-50"
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
      Export CSV
    </button>
  );
}
