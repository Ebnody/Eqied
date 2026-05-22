import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-emerald-500/15 text-emerald-300",
        secondary: "border-transparent bg-white/10 text-slate-300",
        warning: "border-transparent bg-amber-500/15 text-amber-300",
        destructive: "border-transparent bg-rose-500/15 text-rose-300",
        outline: "text-slate-300 border-white/10 bg-white/5",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
