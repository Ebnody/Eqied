import { getCurrentUser } from "@/lib/auth";
import { Sidebar } from "@/components/dashboard/sidebar";

export default async function RoommateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <div className="flex-1 flex flex-col md:flex-row bg-background min-h-screen relative overflow-hidden">
      {/* Ambient gradient orbs */}
      <div className="fixed top-0 left-1/4 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[128px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[500px] h-[500px] bg-violet-500/5 rounded-full blur-[128px] pointer-events-none" />

      <Sidebar fullName={user?.fullName} />
      <main className="flex-1 min-w-0 relative z-10">
        <div className="max-w-6xl mx-auto px-4 py-6 md:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
