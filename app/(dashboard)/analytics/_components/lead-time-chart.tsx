"use client";

import { useState } from "react";
import { useTheme } from "@/components/theme-provider";
import { BarChart3, Table as TableIcon } from "lucide-react";
import { ChartToggle, type ChartView } from "@/components/chart-toggle";
import { AnimatedChartContainer } from "@/components/animated-chart-container";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

const views: ChartView[] = [
  { id: "chart", icon: BarChart3, label: "Chart" },
  { id: "table", icon: TableIcon, label: "Table" },
];

type FactoryLeadTime = {
  factoryId: string;
  factoryName: string;
  avgLeadTime: number;
  minLeadTime: number;
  maxLeadTime: number;
  avgExpectedTime: number;
  orderCount: number;
  variance: number;
};

interface LeadTimeChartProps {
  data: FactoryLeadTime[];
  overallAvg: number;
}

export function LeadTimeChart({ data, overallAvg }: LeadTimeChartProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [activeView, setActiveView] = useState("chart");

  if (data.length === 0) {
    return (
      <div className="h-[200px] flex items-center justify-center text-sm text-gray-500 dark:text-zinc-400">
        No completed orders with dates — lead time data not available yet
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Lead Time by Factory</h3>
          <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">
            Average days from order to completion (overall avg: {overallAvg}d)
          </p>
        </div>
        <ChartToggle views={views} activeView={activeView} onViewChange={setActiveView} storageKey="lead-time" />
      </div>
      <AnimatedChartContainer viewKey={activeView}>
        {activeView === "chart" ? (
          <ResponsiveContainer width="100%" height={data.length * 44 + 30}>
            <BarChart data={data} layout="vertical" margin={{ top: 5, right: 40, left: 0, bottom: 5 }}>
              <XAxis type="number" tick={{ fontSize: 11, fill: isDark ? "#71717a" : "#9ca3af" }} tickLine={false} axisLine={false} unit="d" />
              <YAxis type="category" dataKey="factoryName" width={120} tick={{ fontSize: 12, fill: isDark ? "#a1a1aa" : "#6b7280" }} tickLine={false} axisLine={false} />
              <Tooltip
                cursor={{ fill: "rgba(255,255,255,0.04)" }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const item = payload[0].payload as FactoryLeadTime;
                  return (
                    <div className="rounded-lg bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 px-3 py-2 shadow-lg text-xs">
                      <p className="font-medium text-gray-900 dark:text-white">{item.factoryName}</p>
                      <p className="text-gray-500 dark:text-zinc-400">Avg: {item.avgLeadTime}d (expected: {item.avgExpectedTime}d)</p>
                      <p className="text-gray-500 dark:text-zinc-400">Range: {item.minLeadTime}d – {item.maxLeadTime}d</p>
                      <p className="text-gray-500 dark:text-zinc-400">{item.orderCount} orders</p>
                    </div>
                  );
                }}
              />
              <ReferenceLine x={overallAvg} stroke={isDark ? "#71717a" : "#d1d5db"} strokeDasharray="4 4" />
              <Bar dataKey="avgLeadTime" fill="#EB5D2E" radius={[0, 4, 4, 0]} barSize={22} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-zinc-800">
                  <th className="text-left py-2 font-medium text-gray-500 dark:text-zinc-400">Factory</th>
                  <th className="text-right py-2 font-medium text-gray-500 dark:text-zinc-400">Avg</th>
                  <th className="text-right py-2 font-medium text-gray-500 dark:text-zinc-400">Expected</th>
                  <th className="text-right py-2 font-medium text-gray-500 dark:text-zinc-400">Min</th>
                  <th className="text-right py-2 font-medium text-gray-500 dark:text-zinc-400">Max</th>
                  <th className="text-right py-2 font-medium text-gray-500 dark:text-zinc-400">Variance</th>
                  <th className="text-right py-2 font-medium text-gray-500 dark:text-zinc-400">Orders</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row) => (
                  <tr key={row.factoryId} className="border-b border-gray-50 dark:border-zinc-800/50">
                    <td className="py-2 text-gray-900 dark:text-white">{row.factoryName}</td>
                    <td className="py-2 text-right tabular-nums text-gray-700 dark:text-zinc-300">{row.avgLeadTime}d</td>
                    <td className="py-2 text-right tabular-nums text-gray-500 dark:text-zinc-400">{row.avgExpectedTime}d</td>
                    <td className="py-2 text-right tabular-nums text-gray-500 dark:text-zinc-400">{row.minLeadTime}d</td>
                    <td className="py-2 text-right tabular-nums text-gray-500 dark:text-zinc-400">{row.maxLeadTime}d</td>
                    <td className={`py-2 text-right tabular-nums font-medium ${row.variance > 0 ? "text-red-500" : "text-green-500"}`}>
                      {row.variance > 0 ? "+" : ""}{row.variance}d
                    </td>
                    <td className="py-2 text-right tabular-nums text-gray-500 dark:text-zinc-400">{row.orderCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AnimatedChartContainer>
    </div>
  );
}
