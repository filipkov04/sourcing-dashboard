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
import type { ProductPortfolioData } from "@/lib/types";

export function ProductPortfolioBarChart({ data }: { data: ProductPortfolioData }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <ResponsiveContainer width="100%" height={Math.max(data.length * 44 + 20, 160)}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 60, left: 0, bottom: 4 }}
        barCategoryGap="28%"
      >
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="name"
          width={130}
          tick={{
            fontSize: 11,
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
            return (
              <div className="rounded-lg bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 px-3 py-2 shadow-lg">
                <p className="text-xs font-medium text-gray-900 dark:text-white">{item.name}</p>
                <p className="text-xs text-gray-500 dark:text-zinc-400">
                  {(Number(item.value) || 0).toLocaleString()} ({item.percentage}%)
                </p>
              </div>
            );
          }}
        />
        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={18}>
          {data.map((entry, index) => (
            <Cell key={index} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
