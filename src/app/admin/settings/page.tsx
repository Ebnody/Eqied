import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Shield, Bell, Globe, Palette } from "lucide-react";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Settings</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Configure admin dashboard preferences.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* General Settings */}
        <Card className="glass rounded-2xl border-[var(--glass-border)]">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold text-[var(--foreground)] flex items-center gap-2">
              <Globe className="h-4 w-4 text-emerald-400" />
              General
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label className="text-sm text-[var(--muted-foreground)]">Platform Name</Label>
              <input
                defaultValue="Eqied Admin"
                className="h-10 w-full rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-[var(--muted-foreground)]">Support Email</Label>
              <input
                defaultValue="admin@eqied.com"
                className="h-10 w-full rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-[var(--muted-foreground)]">Default Currency</Label>
              <select className="h-10 w-full rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-emerald-500/30">
                <option>ETB — Ethiopian Birr</option>
                <option>USD — US Dollar</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card className="glass rounded-2xl border-[var(--glass-border)]">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold text-[var(--foreground)] flex items-center gap-2">
              <Palette className="h-4 w-4 text-violet-400" />
              Appearance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--foreground)]">Compact Mode</p>
                <p className="text-xs text-[var(--muted)]">Reduce padding and spacing</p>
              </div>
              <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-[var(--glass-bg)] transition-colors">
                <span className="translate-x-1 inline-block h-4 w-4 rounded-full bg-[var(--muted)] transition-transform" />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--foreground)]">Show Avatars</p>
                <p className="text-xs text-[var(--muted)]">Display user avatars in tables</p>
              </div>
              <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-emerald-500 transition-colors">
                <span className="translate-x-6 inline-block h-4 w-4 rounded-full bg-white transition-transform" />
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="glass rounded-2xl border-[var(--glass-border)]">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold text-[var(--foreground)] flex items-center gap-2">
              <Bell className="h-4 w-4 text-amber-400" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              "New user registrations",
              "Large transactions (> ETB 10K)",
              "Failed payments",
              "Group disputes",
            ].map((label) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-sm text-[var(--muted-foreground)]">{label}</span>
                <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-emerald-500 transition-colors">
                  <span className="translate-x-6 inline-block h-4 w-4 rounded-full bg-white transition-transform" />
                </button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Security */}
        <Card className="glass rounded-2xl border-[var(--glass-border)]">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold text-[var(--foreground)] flex items-center gap-2">
              <Shield className="h-4 w-4 text-rose-400" />
              Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label className="text-sm text-[var(--muted-foreground)]">Session Timeout (minutes)</Label>
              <input
                type="number"
                defaultValue={30}
                className="h-10 w-full rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--foreground)]">2FA Required</p>
                <p className="text-xs text-[var(--muted)]">Require 2FA for all admins</p>
              </div>
              <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-[var(--glass-bg)] transition-colors">
                <span className="translate-x-1 inline-block h-4 w-4 rounded-full bg-[var(--muted)] transition-transform" />
              </button>
            </div>
            <Button className="w-full bg-rose-600 hover:bg-rose-700 text-white">
              Change Admin Password
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
