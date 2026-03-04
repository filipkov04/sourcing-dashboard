"use client";

import type { ProductPortfolioData } from "@/lib/types";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export function ProductPortfolioChart({ data }: { data: ProductPortfolioData }) {
  const top = data[0];
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="flex items-center gap-4">
      {/* Donut chart with center label */}
      <div className="relative flex-shrink-0" style={{ width: 140, height: 140 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={42}
              outerRadius={65}
              dataKey="value"
              stroke="none"
              paddingAngle={0}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              wrapperStyle={{ zIndex: 10 }}
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
          </PieChart>
        </ResponsiveContainer>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-lg font-bold text-gray-800 dark:text-white leading-none">
            {top?.percentage ?? 0}%
          </span>
          <span className="text-[10px] text-gray-400 dark:text-zinc-500 mt-0.5 max-w-[60px] truncate text-center">
            {top?.name ?? ""}
          </span>
        </div>
      </div>

      {/* Legend on the right */}
      <div className="flex flex-col gap-1.5 min-w-0">
        {data.map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span
              className="h-2 w-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-gray-600 dark:text-zinc-400 truncate">
              {item.name}
            </span>
            <span className="text-gray-400 dark:text-zinc-500 flex-shrink-0 ml-auto pl-2">
              {item.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
