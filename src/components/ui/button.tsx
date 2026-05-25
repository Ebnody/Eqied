import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "gradient-accent text-white hover:opacity-90 shadow-lg shadow-emerald-500/20",
        secondary:
          "bg-[var(--input-bg)] text-[var(--foreground)] hover:bg-[var(--glass-strong-bg)] border border-[var(--input-border)]",
        outline:
          "border border-[var(--input-border)] bg-[var(--input-bg)] hover:bg-[var(--glass-strong-bg)] text-[var(--foreground)]",
        ghost:
          "hover:bg-white/5 text-[var(--muted)] hover:text-[var(--foreground)]",
        destructive:
          "gradient-expense text-white hover:opacity-90 shadow-lg shadow-rose-500/20",
        link: "text-[var(--accent)] underline-offset-4 hover:underline hover:opacity-80",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-6 text-base rounded-2xl",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
