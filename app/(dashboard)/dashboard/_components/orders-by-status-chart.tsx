"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { OrdersByStatusData } from "@/lib/types";

export function OrdersByStatusChart({ data }: { data: OrdersByStatusData }) {
  if (data.length === 0) {
    return (
      <div className="flex h-[220px] items-center justify-center text-sm text-gray-500">
        No data available for selected period
      </div>
    );
  }

  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="flex items-center gap-6">
      {/* Donut Chart */}
      <div className="w-[160px] h-[160px] flex-shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={72}
              paddingAngle={0}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const item = payload[0].payload;
                return (
                  <div className="rounded-lg bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 px-3 py-2 shadow-lg">
                    <p className="text-xs font-medium text-gray-900 dark:text-white">{item.name}</p>
                    <p className="text-xs text-gray-500 dark:text-zinc-400">
                      {item.value} orders ({item.percentage}%)
                    </p>
                  </div>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex-1 space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs text-gray-600 dark:text-zinc-400">{item.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-900 dark:text-white tabular-nums">
                {item.value}
              </span>
              <span className="text-[10px] text-gray-400 dark:text-zinc-500 tabular-nums w-8 text-right">
                {total > 0 ? Math.round((item.value / total) * 100) : 0}%
              </span>
            </div>
          </div>
        ))}
        <div className="pt-1 border-t border-gray-100 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-zinc-400">Total</span>
            <span className="text-xs font-bold text-gray-900 dark:text-white tabular-nums">{total}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
