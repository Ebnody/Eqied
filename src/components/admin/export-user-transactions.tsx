"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { downloadCsv, toCsv } from "@/lib/csv";

interface Props {
  userId: string;
  userName: string;
}

export function ExportUserTransactions({ userId, userName }: Props) {
  const [busy, setBusy] = useState(false);

  async function handleExport() {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/transactions`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      if (!data.ok || !data.transactions) throw new Error("Invalid response");

      const rows = data.transactions.map((t: Record<string, unknown>) => [
        t.id,
        t.type,
        ((t.amount as number) / 100).toFixed(2),
        t.category,
        t.source,
        t.method,
        t.status,
        t.counterparty,
        t.reference,
        t.occurredAt,
        t.notes,
      ]);

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
          "Notes",
        ],
        rows
      );

      const safeName = (userName || "user").replace(/[^a-z0-9]/gi, "_").toLowerCase();
      downloadCsv(`transactions_${safeName}_${new Date().toISOString().slice(0, 10)}.csv`, csv);
    } catch (e) {
      alert("Failed to export transactions.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={busy}
      className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors disabled:opacity-50"
    >
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
      Export CSV
    </button>
  );
}
