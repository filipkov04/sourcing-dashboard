"use client";

import { useState } from "react";
import { MoreHorizontal, Pencil, Trash2, Lock, Users } from "lucide-react";
import { useChartData, type CustomChart } from "@/lib/use-custom-charts";
import { CustomChartRenderer } from "./custom-chart-renderer";

type Props = {
  chart: CustomChart;
  onEdit: (chart: CustomChart) => void;
  onDelete: (id: string) => void;
  isOwner: boolean;
};

export function CustomChartCard({ chart, onEdit, onDelete, isOwner }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { transformedData, loading } = useChartData(chart.dataSource, chart.metric, chart.config);

  return (
    <div className="rounded-lg border bg-white dark:bg-zinc-900 border-gray-100 dark:border-zinc-800 card-hover-glow overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">{chart.title}</h3>
          {chart.visibility === "PERSONAL" ? (
            <span className="flex items-center gap-1 text-[10px] font-medium text-gray-400 dark:text-zinc-500 bg-gray-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
              <Lock className="h-2.5 w-2.5" /> Personal
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] font-medium text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 px-1.5 py-0.5 rounded">
              <Users className="h-2.5 w-2.5" /> Shared
            </span>
          )}
        </div>
        {isOwner && (
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <MoreHorizontal className="h-4 w-4 text-gray-400 dark:text-zinc-500" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-1 z-20 w-36 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-lg py-1">
                  <button
                    onClick={() => { setMenuOpen(false); onEdit(chart); }}
                    className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-700"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => { setMenuOpen(false); onDelete(chart.id); }}
                    className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="px-4 pb-4">
        {loading ? (
          <div className="flex items-center justify-center h-[250px]">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#EB5D2E]" />
          </div>
        ) : transformedData ? (
          <CustomChartRenderer
            chartType={chart.chartType}
            data={transformedData.chartData}
            dataKeys={transformedData.dataKeys}
            nameKey={transformedData.nameKey}
            colors={transformedData.colors}
            config={chart.config}
            height={250}
          />
        ) : (
          <div className="flex items-center justify-center h-[250px] text-sm text-gray-400 dark:text-zinc-500">
            Unable to load chart data
          </div>
        )}
      </div>
    </div>
  );
}
