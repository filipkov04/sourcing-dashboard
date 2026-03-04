"use client";

import { useTheme } from "@/components/theme-provider";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { OrderTrendData } from "./orders-trend-chart";

export function OrdersTrendLineChart({ data }: { data: OrderTrendData }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const gridColor = isDark ? "#3f3f46" : "#e5e7eb";

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 15, right: 20, left: -20, bottom: 0 }}>
        <defs>
          <marker id="arrow-x-tline" markerWidth="10" markerHeight="10" refX="10" refY="5">
            <path d="M0,0 L10,5 L0,10 Z" fill={gridColor} />
          </marker>
          <marker id="arrow-y-tline" markerWidth="10" markerHeight="10" refX="5" refY="0">
            <path d="M0,10 L5,0 L10,10 Z" fill={gridColor} />
          </marker>
        </defs>
        <CartesianGrid
          strokeDasharray="0"
          stroke={isDark ? "#3f3f46" : "#e5e7eb"}
          opacity={0.5}
          vertical={false}
        />
        <XAxis
          dataKey="date"
          stroke={isDark ? "#71717a" : "#6b7280"}
          fontSize={12}
          tickLine={false}
          axisLine={{ stroke: gridColor, strokeWidth: 1, markerEnd: "url(#arrow-x-tline)" }}
          dy={8}
          padding={{ right: 15 }}
        />
        <YAxis
          stroke={isDark ? "#71717a" : "#6b7280"}
          fontSize={12}
          tickLine={{ stroke: gridColor, strokeWidth: 1 }}
          tickSize={4}
          axisLine={{ stroke: gridColor, strokeWidth: 1, markerStart: "url(#arrow-y-tline)" }}
          allowDecimals={false}
          width={40}
          padding={{ top: 15 }}
        />
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
            marginBottom: "4px",
          }}
          itemStyle={{
            color: isDark ? "#a1a1aa" : "#6b7280",
            fontSize: "12px",
            padding: "2px 0",
          }}
        />
        <Legend
          verticalAlign="bottom"
          height={36}
          iconType="circle"
          formatter={(value) => (
            <span
              style={{
                color: isDark ? "#a1a1aa" : "#6b7280",
                fontSize: "12px",
                marginLeft: "4px",
              }}
            >
              {value}
            </span>
          )}
        />
        <Line
          type="monotone"
          dataKey="pending"
          stroke="#94a3b8"
          strokeWidth={2}
          dot={{ r: 3, fill: "#94a3b8" }}
          activeDot={{ r: 5 }}
          name="Pending"
        />
        <Line
          type="monotone"
          dataKey="inProgress"
          stroke="#64748b"
          strokeWidth={2}
          dot={{ r: 3, fill: "#64748b" }}
          activeDot={{ r: 5 }}
          name="In Progress"
        />
        <Line
          type="monotone"
          dataKey="completed"
          stroke="#EB5D2E"
          strokeWidth={2}
          dot={{ r: 3, fill: "#EB5D2E" }}
          activeDot={{ r: 5 }}
          name="Completed"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
