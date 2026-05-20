import Link from "next/link";
import { Wallet } from "lucide-react";
import { LocaleSwitcher } from "@/components/locale-switcher";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 flex flex-col">
      <header className="border-b bg-white">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-semibold text-emerald-700"
          >
            <Wallet className="h-5 w-5" />
            EthioBudget
          </Link>
          <LocaleSwitcher variant="compact" />
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
