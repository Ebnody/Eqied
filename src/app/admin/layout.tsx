import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getCurrentAdmin } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminHeader } from "@/components/admin/header";
import { AdminSidebarProvider } from "@/components/admin/sidebar-context";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const pathname =
    headersList.get("x-invoke-path") ||
    headersList.get("x-matched-path") ||
    "";
  const isLoginPage = pathname === "/admin/login" || pathname === "/admin/login/";
  const isChangePasswordPage = pathname.includes("/admin/change-password");

  // Allow login and change-password pages to render without auth check
  if (isLoginPage) {
    return <>{children}</>;
  }

  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  if (!admin.isVerified) redirect("/admin/login");

  if (admin.mustChangePassword && !isChangePasswordPage) {
    redirect("/admin/change-password");
  }

  return (
    <AdminSidebarProvider>
      <div className="flex min-h-screen bg-background">
        {/* Ambient gradient orbs */}
        <div className="fixed top-0 left-1/4 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[128px] pointer-events-none" />
        <div className="fixed bottom-0 right-1/4 w-[500px] h-[500px] bg-violet-500/5 rounded-full blur-[128px] pointer-events-none" />

        <AdminSidebar admin={admin} />

        <div className="flex-1 flex flex-col min-w-0 relative z-10">
          <AdminHeader />
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl">{children}</div>
          </main>
        </div>
      </div>
    </AdminSidebarProvider>
  );
}
