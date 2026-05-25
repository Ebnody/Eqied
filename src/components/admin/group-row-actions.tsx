"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  MoreHorizontal,
  Archive,
  ArchiveRestore,
  Trash2,
  Loader2,
} from "lucide-react";

interface GroupRowActionsProps {
  groupId: string;
  groupName: string;
  isArchived: boolean;
  isSuperAdmin: boolean;
}

export function GroupRowActions({
  groupId,
  groupName,
  isArchived,
  isSuperAdmin,
}: GroupRowActionsProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<null | "delete">(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  async function handleArchiveToggle() {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/groups/${groupId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: isArchived ? "unarchive" : "archive",
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Failed");
      } else {
        router.refresh();
      }
    } finally {
      setBusy(false);
      setOpen(false);
    }
  }

  async function handleDelete() {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/groups/${groupId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Failed");
      } else {
        router.refresh();
      }
    } finally {
      setBusy(false);
      setConfirm(null);
      setOpen(false);
    }
  }

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        disabled={busy}
        className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors disabled:opacity-50"
        aria-label="Actions"
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <MoreHorizontal className="h-4 w-4" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-20 w-48 overflow-hidden rounded-xl border border-[var(--glass-border)] bg-[var(--glass-strong-bg)] backdrop-blur-xl shadow-2xl">
          <button
            onClick={handleArchiveToggle}
            disabled={busy}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[var(--foreground)] hover:bg-[var(--glass-bg)] transition-colors disabled:opacity-50"
          >
            {isArchived ? (
              <>
                <ArchiveRestore className="h-4 w-4 text-emerald-400" />
                Unarchive
              </>
            ) : (
              <>
                <Archive className="h-4 w-4 text-amber-400" />
                Archive
              </>
            )}
          </button>
          {isSuperAdmin && (
            <button
              onClick={() => setConfirm("delete")}
              disabled={busy}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-rose-400 hover:bg-rose-500/10 transition-colors disabled:opacity-50 border-t border-[var(--glass-border)]"
            >
              <Trash2 className="h-4 w-4" />
              Delete permanently
            </button>
          )}
        </div>
      )}

      {confirm === "delete" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setConfirm(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-strong-bg)] backdrop-blur-xl p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-[var(--foreground)]">
              Delete group permanently?
            </h3>
            <p className="mt-2 text-sm text-[var(--muted)]">
              This will permanently remove <strong>{groupName}</strong>,
              including all members, expenses, loans, and settlements. This
              cannot be undone.
            </p>
            <div className="mt-5 flex gap-3 justify-end">
              <button
                onClick={() => setConfirm(null)}
                disabled={busy}
                className="rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--glass-strong-bg)] transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-500 transition-colors disabled:opacity-50"
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                Delete group
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
