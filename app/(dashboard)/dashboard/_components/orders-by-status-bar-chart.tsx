"use client";

import { useTheme } from "@/components/theme-provider";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { OrdersByStatusData } from "@/lib/types";

export function OrdersByStatusBarChart({ data }: { data: OrdersByStatusData }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="space-y-1">
      <ResponsiveContainer width="100%" height={data.length * 36 + 20}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 50, left: 0, bottom: 0 }}
        >
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="name"
            width={90}
            tick={{
              fontSize: 12,
              fill: isDark ? "#a1a1aa" : "#6b7280",
            }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.04)" }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const item = payload[0].payload;
              const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
              return (
                <div className="rounded-lg bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 px-3 py-2 shadow-lg">
                  <p className="text-xs font-medium text-gray-900 dark:text-white">{item.name}</p>
                  <p className="text-xs text-gray-500 dark:text-zinc-400">
                    {item.value} orders ({pct}%)
                  </p>
                </div>
              );
            }}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="pt-1 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between px-1">
        <span className="text-xs font-medium text-gray-500 dark:text-zinc-400">Total</span>
        <span className="text-xs font-bold text-gray-900 dark:text-white tabular-nums">{total}</span>
      </div>
    </div>
  );
}
