"use client";

import { useState } from "react";
import { ArrowUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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

type FactoryBreakdown = {
  factoryId: string;
  factoryName: string;
  totalAvgDuration: number;
  stages: Array<{ stageName: string; avgDuration: number }>;
};

interface FactoryComparisonTableProps {
  leadTimeData: FactoryLeadTime[];
  stageData: FactoryBreakdown[];
}

type SortKey = "name" | "leadTime" | "variance" | "orders" | "stageDuration";

export function FactoryComparisonTable({ leadTimeData, stageData }: FactoryComparisonTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("leadTime");
  const [sortAsc, setSortAsc] = useState(true);

  if (leadTimeData.length === 0) {
    return (
      <div className="h-[200px] flex items-center justify-center text-sm text-gray-500 dark:text-zinc-400">
        No factory comparison data available
      </div>
    );
  }

  // Merge lead time + stage duration data
  const stageDurationMap = new Map(stageData.map((s) => [s.factoryId, s.totalAvgDuration]));

  const merged = leadTimeData.map((lt) => ({
    ...lt,
    totalStageDuration: stageDurationMap.get(lt.factoryId) || 0,
  }));

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const sorted = [...merged].sort((a, b) => {
    let diff = 0;
    switch (sortKey) {
      case "name": diff = a.factoryName.localeCompare(b.factoryName); break;
      case "leadTime": diff = a.avgLeadTime - b.avgLeadTime; break;
      case "variance": diff = a.variance - b.variance; break;
      case "orders": diff = a.orderCount - b.orderCount; break;
      case "stageDuration": diff = a.totalStageDuration - b.totalStageDuration; break;
    }
    return sortAsc ? diff : -diff;
  });

  const SortHeader = ({ label, sk }: { label: string; sk: SortKey }) => (
    <th className="text-left py-2.5 px-3 font-medium text-gray-500 dark:text-zinc-400 cursor-pointer hover:text-gray-700 dark:hover:text-zinc-200 select-none" onClick={() => toggleSort(sk)}>
      <span className="inline-flex items-center gap-1">
        {label}
        <ArrowUpDown className={`h-3 w-3 ${sortKey === sk ? "text-[#EB5D2E]" : ""}`} />
      </span>
    </th>
  );

  return (
    <div>
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Factory Comparison</h3>
        <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">Side-by-side performance metrics</p>
      </div>
      <div className="overflow-x-auto rounded-lg border border-gray-100 dark:border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-zinc-800/50">
            <tr>
              <SortHeader label="Factory" sk="name" />
              <SortHeader label="Avg Lead Time" sk="leadTime" />
              <th className="text-left py-2.5 px-3 font-medium text-gray-500 dark:text-zinc-400">Range</th>
              <SortHeader label="Variance" sk="variance" />
              <SortHeader label="Stage Duration" sk="stageDuration" />
              <SortHeader label="Orders" sk="orders" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => (
              <tr key={row.factoryId} className="border-t border-gray-50 dark:border-zinc-800/50 hover:bg-gray-50/50 dark:hover:bg-zinc-800/30">
                <td className="py-2.5 px-3 font-medium text-gray-900 dark:text-white">{row.factoryName}</td>
                <td className="py-2.5 px-3 tabular-nums text-gray-700 dark:text-zinc-300">{row.avgLeadTime}d</td>
                <td className="py-2.5 px-3 tabular-nums text-gray-500 dark:text-zinc-400 text-xs">{row.minLeadTime}d – {row.maxLeadTime}d</td>
                <td className="py-2.5 px-3">
                  <Badge
                    variant="outline"
                    className={
                      row.variance > 3
                        ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800"
                        : row.variance > 0
                        ? "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800"
                        : "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800"
                    }
                  >
                    {row.variance > 0 ? "+" : ""}{row.variance}d
                  </Badge>
                </td>
                <td className="py-2.5 px-3 tabular-nums text-gray-700 dark:text-zinc-300">{row.totalStageDuration}d</td>
                <td className="py-2.5 px-3 tabular-nums text-gray-500 dark:text-zinc-400">{row.orderCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
