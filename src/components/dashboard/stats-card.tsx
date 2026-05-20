import { cn } from "@/lib/utils";

interface StatsCardProps {
  label: string;
  value: string;
  hint?: string;
  icon?: React.ReactNode;
  tone?: "default" | "income" | "expense" | "warning";
}

export function StatsCard({
  label,
  value,
  hint,
  icon,
  tone = "default",
}: StatsCardProps) {
  const toneClass = {
    default: "bg-white",
    income: "bg-emerald-50 border-emerald-200",
    expense: "bg-rose-50 border-rose-200",
    warning: "bg-amber-50 border-amber-200",
  }[tone];

  return (
    <div className={cn("rounded-xl border p-5 shadow-sm", toneClass)}>
      <div className="flex items-center justify-between text-slate-600 text-sm">
        <span>{label}</span>
        {icon}
      </div>
      <div className="mt-2 text-2xl font-semibold text-slate-900">{value}</div>
      {hint && <div className="mt-1 text-xs text-slate-500">{hint}</div>}
    </div>
  );
}
