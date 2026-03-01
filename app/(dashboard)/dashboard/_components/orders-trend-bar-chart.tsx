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

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
          axisLine={false}
          dy={8}
        />
        <YAxis
          stroke={isDark ? "#71717a" : "#6b7280"}
          fontSize={12}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
          width={40}
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
