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

  const gridColor = isDark ? "#3f3f46" : "#e5e7eb";

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 15, right: 20, left: -20, bottom: 0 }}>
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
            <stop offset="5%" stopColor="#FF4D15" stopOpacity={0.18} />
            <stop offset="95%" stopColor="#FF4D15" stopOpacity={0.08} />
          </linearGradient>
          <marker id="arrow-x-trend" markerWidth="10" markerHeight="10" refX="10" refY="5">
            <path d="M0,0 L10,5 L0,10 Z" fill={gridColor} />
          </marker>
          <marker id="arrow-y-trend" markerWidth="10" markerHeight="10" refX="5" refY="0">
            <path d="M0,10 L5,0 L10,10 Z" fill={gridColor} />
          </marker>
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
          axisLine={{ stroke: gridColor, strokeWidth: 1, markerEnd: "url(#arrow-x-trend)" }}
          dy={8}
          padding={{ right: 15 }}
        />

        <YAxis
          stroke={isDark ? "#71717a" : "#6b7280"}
          fontSize={12}
          tickLine={{ stroke: gridColor, strokeWidth: 1 }}
          tickSize={4}
          axisLine={{ stroke: gridColor, strokeWidth: 1, markerStart: "url(#arrow-y-trend)" }}
          allowDecimals={false}
          width={40}
          padding={{ top: 15 }}
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
          stroke="#FF4D15"
          strokeWidth={1.5}
          fill="url(#colorCompleted)"
          name="Completed"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
