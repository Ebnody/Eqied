"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Loader2, CheckCircle2 } from "lucide-react";

interface DeletedCounts {
  transactions: number;
  forwardedSms: number;
  budgets: number;
  salaries: number;
  notifications: number;
  otpCodes: number;
}

export function ResetDataForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleted, setDeleted] = useState<DeletedCounts | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (confirm !== "RESET") {
      setError('You must type "RESET" exactly to confirm.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/user/reset-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to reset");
        return;
      }
      setDeleted(data.deleted);
      setConfirm("");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  if (deleted) {
    const total =
      deleted.transactions +
      deleted.forwardedSms +
      deleted.budgets +
      deleted.salaries +
      deleted.notifications +
      deleted.otpCodes;
    return (
      <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm p-4 space-y-2">
        <div className="flex items-center gap-2 font-medium">
          <CheckCircle2 className="h-4 w-4" />
          Reset complete — {total} record{total === 1 ? "" : "s"} removed.
        </div>
        <ul className="text-xs list-disc list-inside space-y-0.5 text-slate-400">
          <li>Transactions: {deleted.transactions}</li>
          <li>Forwarded SMS: {deleted.forwardedSms}</li>
          <li>Budgets: {deleted.budgets}</li>
          <li>Monthly salaries: {deleted.salaries}</li>
          <li>Notifications: {deleted.notifications}</li>
          <li>Pending OTPs: {deleted.otpCodes}</li>
        </ul>
        <button
          type="button"
          onClick={() => {
            setDeleted(null);
            setOpen(false);
          }}
          className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          Done
        </button>
      </div>
    );
  }

  if (!open) {
    return (
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="text-rose-300 border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-200"
      >
        <AlertTriangle className="h-4 w-4" />
        Reset all my data
      </Button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm p-3 space-y-2">
        <div className="flex items-center gap-2 font-semibold">
          <AlertTriangle className="h-4 w-4" />
          This cannot be undone
        </div>
        <p className="text-xs text-slate-400">
          The following will be permanently deleted from your account:
        </p>
        <ul className="text-xs list-disc list-inside space-y-0.5 text-slate-400">
          <li>All transactions</li>
          <li>All forwarded SMS records</li>
          <li>All monthly budgets and category plans</li>
          <li>All monthly salaries</li>
          <li>All notifications</li>
          <li>Any pending OTP codes</li>
        </ul>
        <p className="text-xs text-slate-400">
          Your account, password, language, and Telegram link will stay intact.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm">
          Type <span className="font-mono font-semibold">RESET</span> to confirm
        </Label>
        <Input
          id="confirm"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="RESET"
          autoComplete="off"
        />
      </div>

      {error && (
        <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm px-3 py-2">
          {error}
        </div>
      )}

      <div className="flex gap-2">
        <Button
          type="submit"
          disabled={submitting || confirm !== "RESET"}
          className="bg-rose-600 hover:bg-rose-700 text-white"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Resetting...
            </>
          ) : (
            "Reset everything"
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setOpen(false);
            setConfirm("");
            setError(null);
          }}
          disabled={submitting}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
