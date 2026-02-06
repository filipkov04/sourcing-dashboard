"use client";

import type { OrdersByStatusData } from "@/lib/types";

export function OrdersByStatusChart({ data }: { data: OrdersByStatusData }) {
  if (data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-sm text-gray-500">
        No data available for selected period
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {data.map((item, index) => (
        <div key={index} className="group">
          {/* Status label */}
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500 dark:text-zinc-400">{item.name}</span>
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{item.value}</span>
          </div>

          {/* Horizontal bar with pill shape */}
          <div className="relative h-8 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-zinc-800">
            <div
              className="absolute left-0 top-0 h-full rounded-full transition-all duration-300 ease-in-out group-hover:opacity-90"
              style={{
                width: `${Math.max((item.value / Math.max(...data.map(d => d.value))) * 100, 5)}%`,
                backgroundColor: item.color,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
