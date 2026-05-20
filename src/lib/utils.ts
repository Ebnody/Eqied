import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Money helpers: amounts are stored in santim (1 ETB = 100 santim)
export function toSantim(etb: number): number {
  return Math.round(etb * 100);
}

export function fromSantim(santim: number): number {
  return santim / 100;
}

export function formatETB(santim: number, opts: { withSymbol?: boolean } = {}) {
  const { withSymbol = true } = opts;
  const etb = fromSantim(santim);
  const formatted = new Intl.NumberFormat("en-ET", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(etb);
  return withSymbol ? `ETB ${formatted}` : formatted;
}

export function currentMonthKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function monthLabel(monthKey: string): string {
  const [y, m] = monthKey.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  return d.toLocaleString("en-US", { month: "long", year: "numeric" });
}
