import Link from "next/link";
import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient?: "income" | "expense" | "warning" | "info";
  href?: string;
}

const GRADIENTS = {
  income: "gradient-income",
  expense: "gradient-expense",
  warning: "gradient-warning",
  info: "bg-gradient-to-br from-blue-500 to-indigo-600",
};

export function StatCard({
  label,
  value,
  change,
  changeLabel,
  icon: Icon,
  gradient = "info",
  href,
}: StatCardProps) {
  const isPositive = change && change >= 0;

  const content = (
    <div className="flex items-start justify-between">
        <div className="space-y-4">
          <p className="text-sm font-medium text-[var(--muted)]">{label}</p>
          <p className="text-2xl font-bold text-[var(--foreground)]">{value}</p>
          {typeof change === "number" && (
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium",
                  isPositive
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-rose-500/10 text-rose-400"
                )}
              >
                {isPositive ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <ArrowDownRight className="h-3 w-3" />
                )}
                {Math.abs(change)}%
              </span>
              {changeLabel && (
                <span className="text-xs text-[var(--muted)]">{changeLabel}</span>
              )}
            </div>
          )}
        </div>
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-xl shadow-lg",
            GRADIENTS[gradient]
          )}
        >
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
  );

  const className =
    "glass rounded-2xl p-6 transition-all hover:bg-[var(--glass-strong-bg)]" +
    (href ? " block hover:scale-[1.02] cursor-pointer" : "");

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}
