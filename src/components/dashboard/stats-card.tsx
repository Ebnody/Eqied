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
  const toneClasses = {
    default: {
      border: "border-[var(--glass-border)]",
      iconBg: "bg-[var(--glass-bg)]",
      text: "text-[var(--muted)]",
      value: "text-[var(--foreground)]",
      hint: "text-[var(--muted-foreground)]",
    },
    income: {
      border: "border-emerald-500/20",
      iconBg: "bg-emerald-500/15",
      text: "text-emerald-300",
      value: "text-[var(--foreground)]",
      hint: "text-emerald-400/60",
    },
    expense: {
      border: "border-rose-500/20",
      iconBg: "bg-rose-500/15",
      text: "text-rose-300",
      value: "text-[var(--foreground)]",
      hint: "text-rose-400/60",
    },
    warning: {
      border: "border-amber-500/20",
      iconBg: "bg-amber-500/15",
      text: "text-amber-300",
      value: "text-[var(--foreground)]",
      hint: "text-amber-400/60",
    },
  }[tone];

  return (
    <div
      className={cn(
        "glass rounded-2xl p-5 transition-transform hover:scale-[1.02] duration-200",
        toneClasses.border
      )}
    >
      <div className="flex items-center justify-between text-sm">
        <span className={toneClasses.text}>{label}</span>
        {icon && (
          <div className={cn("p-1.5 rounded-lg", toneClasses.iconBg)}>
            {icon}
          </div>
        )}
      </div>
      <div className={cn("mt-2 text-2xl font-semibold", toneClasses.value)}>
        {value}
      </div>
      {hint && (
        <div className={cn("mt-1 text-xs", toneClasses.hint)}>{hint}</div>
      )}
    </div>
  );
}
