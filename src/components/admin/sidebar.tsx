"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  ArrowLeftRight,
  Settings,
  X,
  UsersRound,
  Wallet,
  Shield,
  ScrollText,
  LogOut,
} from "lucide-react";
import { useAdminSidebar } from "./sidebar-context";

function getNavSections(role: string) {
  const sections = [
    {
      label: "MAIN MENU",
      items: [
        { title: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
        { title: "Users", href: "/admin/users", icon: Users },
        { title: "Transactions", href: "/admin/transactions", icon: ArrowLeftRight },
        { title: "Groups", href: "/admin/groups", icon: UsersRound },
      ],
    },
  ];

  if (role === "SUPER_ADMIN") {
    sections.push({
      label: "MANAGEMENT",
      items: [
        { title: "Admins", href: "/admin/admins", icon: Shield },
        { title: "Activity Logs", href: "/admin/logs", icon: ScrollText },
      ],
    });
  }

  sections.push({
    label: "SETTINGS",
    items: [
      { title: "Settings", href: "/admin/settings", icon: Settings },
      { title: "Back to App", href: "/dashboard", icon: Wallet },
    ],
  });

  return sections;
}

function NavItem({
  href,
  icon: Icon,
  title,
  isActive,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  isActive: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
        isActive
          ? "bg-[var(--glass-strong-bg)] text-[var(--foreground)]"
          : "text-[var(--muted)] hover:bg-[var(--glass-bg)] hover:text-[var(--foreground)]"
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span>{title}</span>
    </Link>
  );
}

interface AdminSidebarProps {
  admin?: {
    fullName: string | null;
    email: string | null;
    role: string;
  } | null;
}

export function AdminSidebar({ admin }: AdminSidebarProps) {
  const pathname = usePathname();
  const { isOpen, isMobileOpen, setIsMobileOpen } = useAdminSidebar();
  const navSections = getNavSections(admin?.role ?? "ADMIN");

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed md:sticky top-0 z-50 h-screen flex-col border-r border-[var(--glass-border)] bg-background/90 backdrop-blur-xl transition-all duration-300",
          isMobileOpen ? "left-0 w-[280px]" : "-left-[280px] w-0 md:left-0",
          isOpen ? "md:w-[280px] md:flex" : "md:w-0 md:hidden md:overflow-hidden"
        )}
      >
        <div className="flex h-full flex-col px-5 py-8">
          {/* Logo */}
          <div className="flex items-center gap-3 px-2 mb-10">
            <div className="h-10 w-10 rounded-xl gradient-accent flex items-center justify-center shadow-lg">
              <Wallet className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-[var(--foreground)] leading-tight">Admin</span>
              <span className="text-[10px] font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                Dashboard
              </span>
            </div>
            <button
              onClick={() => setIsMobileOpen(false)}
              className="ml-auto md:hidden text-[var(--muted)] hover:text-[var(--foreground)]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto custom-scrollbar space-y-8">
            {navSections.map((section) => (
              <div key={section.label}>
                <h3 className="px-4 mb-3 text-[11px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                  {section.label}
                </h3>
                <ul className="space-y-1">
                  {section.items.map((item) => (
                    <li key={item.href}>
                      <NavItem
                        href={item.href}
                        icon={item.icon}
                        title={item.title}
                        isActive={pathname === item.href || pathname.startsWith(item.href + "/")}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>

          {/* Bottom */}
          <div className="mt-auto pt-6 border-t border-[var(--glass-border)] space-y-3">
            <div className="flex items-center gap-3 px-2">
              <div className="h-9 w-9 rounded-full gradient-accent flex items-center justify-center text-white text-sm font-bold">
                {admin?.fullName?.charAt(0) || "A"}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium text-[var(--foreground)] truncate">
                  {admin?.fullName || "Admin User"}
                </span>
                <span className="text-xs text-[var(--muted)] truncate">
                  {admin?.email || "admin@eqied.com"}
                </span>
              </div>
            </div>
            <button
              onClick={async () => {
                await fetch("/api/auth/logout", { method: "POST" });
                window.location.href = "/admin/login";
              }}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-[var(--muted)] hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
