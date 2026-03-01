"use client";

import { useTheme } from "@/components/theme-provider";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export type OrderTrendData = {
  date: string;
  pending: number;
  inProgress: number;
  completed: number;
  delayed?: number;
  disrupted?: number;
}[];

export function OrdersTrendChart({ data }: { data: OrderTrendData }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          {/* Light blue gradient for Pending */}
          <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#94a3b8" stopOpacity={0.05} />
          </linearGradient>
          {/* Medium blue gradient for In Progress */}
          <linearGradient id="colorInProgress" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#64748b" stopOpacity={0.18} />
            <stop offset="95%" stopColor="#64748b" stopOpacity={0.08} />
          </linearGradient>
          {/* Purple gradient for Completed */}
          <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#F97316" stopOpacity={0.18} />
            <stop offset="95%" stopColor="#F97316" stopOpacity={0.08} />
          </linearGradient>
        </defs>

        {/* Light horizontal grid lines only */}
        <CartesianGrid
          strokeDasharray="0"
          stroke={isDark ? "#3f3f46" : "#e5e7eb"}
          opacity={0.5}
          vertical={false}
        />

        {/* X-axis with discrete daily ticks */}
        <XAxis
          dataKey="date"
          stroke={isDark ? "#71717a" : "#6b7280"}
          fontSize={12}
          tickLine={false}
          axisLine={false}
          dy={8}
        />

        {/* Y-axis with no axis line */}
        <YAxis
          stroke={isDark ? "#71717a" : "#6b7280"}
          fontSize={12}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
          width={40}
        />

        {/* Clean tooltip */}
        <Tooltip
          cursor={{ stroke: "rgba(255,255,255,0.1)", strokeWidth: 1 }}
          contentStyle={{
            backgroundColor: isDark ? "#27272a" : "#ffffff",
            border: `1px solid ${isDark ? "#3f3f46" : "#f1f5f9"}`,
            borderRadius: "8px",
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
            padding: "8px 12px",
          }}
          labelStyle={{
            color: isDark ? "#fafafa" : "#111827",
            fontWeight: 600,
            fontSize: "12px",
            marginBottom: "4px"
          }}
          itemStyle={{
            color: isDark ? "#a1a1aa" : "#6b7280",
            fontSize: "12px",
            padding: "2px 0"
          }}
        />

        {/* Horizontal legend below chart */}
        <Legend
          verticalAlign="bottom"
          height={36}
          iconType="circle"
          formatter={(value) => (
            <span style={{
              color: isDark ? "#a1a1aa" : "#6b7280",
              fontSize: "12px",
              marginLeft: "4px"
            }}>
              {value}
            </span>
          )}
        />

        {/* Stacked areas from bottom to top: Pending, In Progress, Completed */}
        <Area
          type="monotone"
          dataKey="pending"
          stackId="1"
          stroke="#94a3b8"
          strokeWidth={1.5}
          fill="url(#colorPending)"
          name="Pending"
        />
        <Area
          type="monotone"
          dataKey="inProgress"
          stackId="1"
          stroke="#64748b"
          strokeWidth={1.5}
          fill="url(#colorInProgress)"
          name="In Progress"
        />
        <Area
          type="monotone"
          dataKey="completed"
          stackId="1"
          stroke="#F97316"
          strokeWidth={1.5}
          fill="url(#colorCompleted)"
          name="Completed"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
