"use client";

import { Lock, Users } from "lucide-react";
import { useChartData } from "@/lib/use-custom-charts";
import { CustomChartRenderer } from "./custom-chart-renderer";
import type { ChartTypeId } from "@/lib/chart-data-sources";

type Props = {
  chartType: ChartTypeId;
  dataSource: string;
  metric: string;
  title: string;
  config: Record<string, any>;
  visibility: "PERSONAL" | "SHARED";
  onTitleChange: (title: string) => void;
  onVisibilityChange: (visibility: "PERSONAL" | "SHARED") => void;
};

export function ChartBuilderStepSave({
  chartType,
  dataSource,
  metric,
  title,
  config,
  visibility,
  onTitleChange,
  onVisibilityChange,
}: Props) {
  const { transformedData, loading } = useChartData(dataSource, metric, config);

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-500 dark:text-zinc-400">Review and save</h3>

      {/* Title */}
      <div>
        <label className="text-xs font-medium text-gray-500 dark:text-zinc-400 block mb-1">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          className="w-full rounded-md border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#EB5D2E]/50"
        />
      </div>

      {/* Visibility */}
      <div>
        <label className="text-xs font-medium text-gray-500 dark:text-zinc-400 block mb-1.5">Visibility</label>
        <div className="flex gap-3">
          <button
            onClick={() => onVisibilityChange("PERSONAL")}
            className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm transition-all ${
              visibility === "PERSONAL"
                ? "border-[#EB5D2E] bg-[#EB5D2E]/5 dark:bg-[#EB5D2E]/10 text-[#EB5D2E]"
                : "border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400"
            }`}
          >
            <Lock className="h-4 w-4" />
            Personal
          </button>
          <button
            onClick={() => onVisibilityChange("SHARED")}
            className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm transition-all ${
              visibility === "SHARED"
                ? "border-[#EB5D2E] bg-[#EB5D2E]/5 dark:bg-[#EB5D2E]/10 text-[#EB5D2E]"
                : "border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400"
            }`}
          >
            <Users className="h-4 w-4" />
            Shared
          </button>
        </div>
        <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1.5">
          {visibility === "PERSONAL"
            ? "Only you can see this chart"
            : "Everyone in your organization can see this chart"}
        </p>
      </div>

      {/* Full preview */}
      <div className="rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4">
        <p className="text-sm font-medium text-gray-900 dark:text-white mb-3">{title || "Untitled Chart"}</p>
        {loading ? (
          <div className="flex items-center justify-center h-[250px]">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#EB5D2E]" />
          </div>
        ) : transformedData ? (
          <CustomChartRenderer
            chartType={chartType}
            data={transformedData.chartData}
            dataKeys={transformedData.dataKeys}
            nameKey={transformedData.nameKey}
            colors={transformedData.colors}
            config={config}
            height={250}
          />
        ) : (
          <div className="flex items-center justify-center h-[250px] text-sm text-gray-400 dark:text-zinc-500">
            No preview available
          </div>
        )}
      </div>
    </div>
  );
}
