"use client";

import { useTheme } from "@/components/theme-provider";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { OrderTrendData } from "./orders-trend-chart";

export function OrdersTrendBarChart({ data }: { data: OrderTrendData }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const gridColor = isDark ? "#3f3f46" : "#e5e7eb";

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 15, right: 20, left: -20, bottom: 0 }}>
        <defs>
          <marker id="arrow-x-tbar" markerWidth="10" markerHeight="10" refX="10" refY="5">
            <path d="M0,0 L10,5 L0,10 Z" fill={gridColor} />
          </marker>
          <marker id="arrow-y-tbar" markerWidth="10" markerHeight="10" refX="5" refY="0">
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
          axisLine={{ stroke: gridColor, strokeWidth: 1, markerEnd: "url(#arrow-x-tbar)" }}
          dy={8}
          padding={{ right: 15 }}
        />
        <YAxis
          stroke={isDark ? "#71717a" : "#6b7280"}
          fontSize={12}
          tickLine={{ stroke: gridColor, strokeWidth: 1 }}
          tickSize={4}
          axisLine={{ stroke: gridColor, strokeWidth: 1, markerStart: "url(#arrow-y-tbar)" }}
          allowDecimals={false}
          width={40}
          padding={{ top: 15 }}
        />
        <Tooltip
          cursor={{ fill: "rgba(255,255,255,0.04)" }}
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
          iconType="rect"
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
        <Bar dataKey="pending" stackId="1" fill="#94a3b8" name="Pending" radius={[0, 0, 0, 0]} />
        <Bar dataKey="inProgress" stackId="1" fill="#64748b" name="In Progress" radius={[0, 0, 0, 0]} />
        <Bar dataKey="completed" stackId="1" fill="#EB5D2E" name="Completed" radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
