"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import { fromSantim, formatETB } from "@/lib/utils";
import { getCategoryName, getCategoryEmoji } from "@/lib/categories";

const CATEGORY_COLORS = [
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
  "#84cc16",
  "#6366f1",
];

function fmtTooltip(v: unknown): string {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return "0 ETB";
  return formatETB(Math.round(n * 100), { withSymbol: true });
}

export function CategoryBarChart({
  data,
}: {
  data: { categoryKey: string; expense: number }[];
}) {
  const filtered = data.filter((d) => d.expense > 0);
  if (filtered.length === 0) {
    return (
      <p className="text-sm text-slate-400 text-center py-8">
        No expenses yet this month.
      </p>
    );
  }
  const sorted = [...filtered].sort((a, b) => b.expense - a.expense);
  const chartData = sorted.map((d) => ({
    name: `${getCategoryEmoji(d.categoryKey)} ${getCategoryName(d.categoryKey)}`,
    value: fromSantim(d.expense),
    key: d.categoryKey,
  }));

  return (
    <ResponsiveContainer width="100%" height={Math.max(220, chartData.length * 40)}>
      <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 30 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} />
        <YAxis
          dataKey="name"
          type="category"
          width={140}
          tick={{ fontSize: 12, fill: "#e2e8f0" }}
        />
        <Tooltip formatter={fmtTooltip} />
        <Bar dataKey="value" radius={[0, 6, 6, 0]}>
          {chartData.map((d, i) => (
            <Cell key={d.key} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function DailyTrendChart({
  data,
}: {
  data: { day: string; income: number; expense: number }[];
}) {
  const chartData = data.map((d) => ({
    day: d.day,
    income: fromSantim(d.income),
    expense: fromSantim(d.expense),
  }));

  const allZero = chartData.every((d) => d.income === 0 && d.expense === 0);
  if (allZero) {
    return (
      <p className="text-sm text-slate-400 text-center py-8">
        No transactions this month yet.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={chartData} margin={{ left: 0, right: 10, top: 10, bottom: 0 }}>
        <defs>
          <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity={0.5} />
            <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ef4444" stopOpacity={0.5} />
            <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94a3b8" }} />
        <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
        <Tooltip formatter={fmtTooltip} />
        <Legend />
        <Area
          type="monotone"
          dataKey="income"
          stroke="#10b981"
          fill="url(#incomeGrad)"
          strokeWidth={2}
        />
        <Area
          type="monotone"
          dataKey="expense"
          stroke="#ef4444"
          fill="url(#expenseGrad)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function MonthOverMonthChart({
  data,
}: {
  data: { label: string; income: number; expense: number }[];
}) {
  const chartData = data.map((d) => ({
    label: d.label,
    income: fromSantim(d.income),
    expense: fromSantim(d.expense),
    net: fromSantim(d.income - d.expense),
  }));

  const allZero = chartData.every((d) => d.income === 0 && d.expense === 0);
  if (allZero) {
    return (
      <p className="text-sm text-slate-400 text-center py-8">
        Need at least one month of data.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={chartData} margin={{ left: 0, right: 10, top: 10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#94a3b8" }} />
        <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
        <Tooltip formatter={fmtTooltip} />
        <Legend />
        <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} />
        <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function PlannedVsActualChart({
  data,
}: {
  data: { name: string; planned: number; actual: number; categoryKey: string }[];
}) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-slate-400 text-center py-8">
        Set your salary to generate a budget plan.
      </p>
    );
  }

  const chartData = data.map((d) => ({
    name: `${getCategoryEmoji(d.categoryKey)} ${d.name}`,
    planned: fromSantim(d.planned),
    actual: fromSantim(d.actual),
  }));

  return (
    <ResponsiveContainer width="100%" height={Math.max(220, chartData.length * 36)}>
      <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 30 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} />
        <YAxis
          dataKey="name"
          type="category"
          width={140}
          tick={{ fontSize: 12, fill: "#e2e8f0" }}
        />
        <Tooltip formatter={fmtTooltip} />
        <Legend />
        <Bar dataKey="planned" fill="#64748b" radius={[0, 4, 4, 0]} />
        <Bar dataKey="actual" fill="#10b981" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// re-used line variant for month-by-month income vs expense net trend
export function NetTrendLineChart({
  data,
}: {
  data: { label: string; income: number; expense: number }[];
}) {
  const chartData = data.map((d) => ({
    label: d.label,
    net: fromSantim(d.income - d.expense),
  }));
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={chartData} margin={{ left: 0, right: 10, top: 10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#94a3b8" }} />
        <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
        <Tooltip formatter={fmtTooltip} />
        <Line
          type="monotone"
          dataKey="net"
          stroke="#3b82f6"
          strokeWidth={2.5}
          dot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
