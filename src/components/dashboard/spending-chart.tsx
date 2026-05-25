"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { fromSantim, formatETB } from "@/lib/utils";
import { getCategoryName } from "@/lib/categories";

const COLORS = [
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#06b6d4",
  "#a855f7",
];

interface Props {
  data: { categoryKey: string; expense: number }[];
}

export function SpendingChart({ data }: Props) {
  const filtered = data.filter((d) => d.expense > 0);
  if (filtered.length === 0) {
    return (
      <div className="text-sm text-slate-400 text-center py-8">
        No expenses yet this month.
      </div>
    );
  }

  const chartData = filtered.map((d) => ({
    name: getCategoryName(d.categoryKey),
    value: fromSantim(d.expense),
  }));

  return (
    <ResponsiveContainer width="100%" height={420}>
      <PieChart>
        <Pie
          data={chartData}
          cx="45%"
          cy="50%"
          outerRadius={115}
          innerRadius={60}
          dataKey="value"
          paddingAngle={2}
        >
          {chartData.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(v) => {
            const n = typeof v === "number" ? v : Number(v);
            return formatETB(Math.round((Number.isFinite(n) ? n : 0) * 100), {
              withSymbol: true,
            });
          }}
        />
        <Legend
          layout="vertical"
          verticalAlign="middle"
          align="right"
          iconType="square"
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
