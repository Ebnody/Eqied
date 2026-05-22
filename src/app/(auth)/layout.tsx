import Link from "next/link";
import { Wallet } from "lucide-react";
import { LocaleSwitcher } from "@/components/locale-switcher";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 flex flex-col bg-background min-h-screen relative overflow-hidden">
      {/* Ambient gradient orbs */}
      <div className="fixed top-0 left-1/3 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[128px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/3 w-[400px] h-[400px] bg-violet-500/5 rounded-full blur-[128px] pointer-events-none" />

      <header className="border-b border-white/10 glass relative z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-semibold gradient-text"
          >
            <Wallet className="h-5 w-5 text-emerald-400" />
            EthioBudget
          </Link>
          <LocaleSwitcher variant="compact" />
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center py-12 px-4 relative z-10">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
