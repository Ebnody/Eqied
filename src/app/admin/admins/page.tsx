"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Plus, Users, Crown, Shield, Trash2 } from "lucide-react";

type AdminUser = {
  id: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  role: string;
  isVerified: boolean;
  mustChangePassword: boolean;
  createdAt: string;
};

export default function AdminManagementPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    role: "ADMIN" as "ADMIN" | "SUPER_ADMIN",
  });
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const hasLoaded = useRef(false);

  async function loadAdmins() {
    try {
      const res = await fetch("/api/admin/admins");
      if (!res.ok) throw new Error("Failed to load admins");
      const data = await res.json();
      setAdmins(data.admins);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!hasLoaded.current) {
      hasLoaded.current = true;
      loadAdmins();
      // Load current user so we can hide delete on self
      fetch("/api/auth/me")
        .then((r) => r.ok ? r.json() : null)
        .then((data) => {
          if (data?.userId) setCurrentUserId(data.userId);
        })
        .catch(() => {});
    }
  }, []);

  async function deleteAdmin(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/admins?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || "Failed to delete");
        return;
      }
      setConfirmDelete(null);
      loadAdmins();
    } finally {
      setDeletingId(null);
    }
  }

  async function createAdmin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create admin");
        return;
      }
      setShowForm(false);
      setForm({ fullName: "", email: "", phone: "", role: "ADMIN" });
      loadAdmins();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            Admin Management
          </h1>
          <p className="text-sm text-[var(--muted)]">
            Create and manage administrator accounts.
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4" />
          New Admin
        </Button>
      </div>

      {showForm && (
        <Card className="border-[var(--glass-border)]">
          <CardHeader>
            <CardTitle className="text-base">Create Admin Account</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={createAdmin} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    required
                    value={form.fullName}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, fullName: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, email: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone (optional)</Label>
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, phone: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <select
                    id="role"
                    value={form.role}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        role: e.target.value as "ADMIN" | "SUPER_ADMIN",
                      }))
                    }
                    className="h-10 w-full rounded-md border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--foreground)]"
                  >
                    <option value="ADMIN">Admin</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                  </select>
                </div>
              </div>
              {error && (
                <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm px-3 py-2">
                  {error}
                </div>
              )}
              <div className="flex gap-3">
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Create Admin"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="glass rounded-2xl border border-[var(--glass-border)] overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--glass-border)] flex items-center gap-2">
          <Users className="h-4 w-4 text-[var(--muted)]" />
          <h2 className="font-semibold text-[var(--foreground)]">
            Administrators ({admins.length})
          </h2>
        </div>
        <div className="divide-y divide-[var(--glass-border)]">
          {admins.map((a) => (
            <div
              key={a.id}
              className="px-5 py-4 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-9 w-9 rounded-full bg-[var(--glass-bg)] flex items-center justify-center text-sm font-bold text-[var(--foreground)] shrink-0">
                  {a.fullName?.charAt(0) || "A"}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--foreground)] truncate">
                    {a.fullName || "Unnamed"}
                  </p>
                  <p className="text-xs text-[var(--muted)] truncate">
                    {a.email}
                    {a.phone && ` · ${a.phone}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {a.mustChangePassword && (
                  <span className="text-[10px] font-medium bg-amber-500/15 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/20">
                    Must change password
                  </span>
                )}
                {a.role === "SUPER_ADMIN" ? (
                  <span className="flex items-center gap-1 text-[10px] font-medium bg-violet-500/15 text-violet-300 px-2 py-0.5 rounded-full border border-violet-500/20">
                    <Crown className="h-3 w-3" />
                    Super Admin
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] font-medium bg-emerald-500/15 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    <Shield className="h-3 w-3" />
                    Admin
                  </span>
                )}
                {a.id !== currentUserId && (
                  <button
                    onClick={() => setConfirmDelete(a.id)}
                    disabled={deletingId === a.id}
                    className="text-rose-400 hover:text-rose-300 disabled:opacity-50"
                    aria-label="Delete admin"
                    title="Delete admin"
                  >
                    {deletingId === a.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setConfirmDelete(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-strong-bg)] backdrop-blur-xl p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-[var(--foreground)]">
              Remove admin account?
            </h3>
            <p className="mt-2 text-sm text-[var(--muted)]">
              This will permanently delete this administrator account. This cannot be undone.
            </p>
            <div className="mt-5 flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDelete(null)}
                disabled={!!deletingId}
                className="rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--glass-strong-bg)] transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteAdmin(confirmDelete)}
                disabled={!!deletingId}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-500 transition-colors disabled:opacity-50"
              >
                {deletingId === confirmDelete && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Delete admin
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
