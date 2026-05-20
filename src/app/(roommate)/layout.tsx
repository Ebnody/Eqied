import { getCurrentUser } from "@/lib/auth";
import { Sidebar } from "@/components/dashboard/sidebar";

export default async function RoommateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <div className="flex-1 flex flex-col md:flex-row bg-slate-50 min-h-screen">
      <Sidebar fullName={user?.fullName} />
      <main className="flex-1 min-w-0">
        <div className="max-w-6xl mx-auto px-4 py-6 md:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
