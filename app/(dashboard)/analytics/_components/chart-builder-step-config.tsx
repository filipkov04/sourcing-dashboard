"use client";

import { useEffect } from "react";
import { getMetric, getDataSource, type ChartTypeId } from "@/lib/chart-data-sources";
import { useChartData } from "@/lib/use-custom-charts";
import { CustomChartRenderer } from "./custom-chart-renderer";

type ChartConfig = {
  title: string;
  showTrendLine: boolean;
  period?: string;
};

type Props = {
  chartType: ChartTypeId;
  dataSource: string;
  metric: string;
  config: ChartConfig;
  onConfigChange: (config: ChartConfig) => void;
};

const PERIOD_OPTIONS = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "all", label: "All time" },
];

export function ChartBuilderStepConfig({ chartType, dataSource, metric, config, onConfigChange }: Props) {
  const metricDef = getMetric(dataSource, metric);
  const dsDef = getDataSource(dataSource);
  const { transformedData, loading } = useChartData(dataSource, metric, config);

  const supportsTimeSeries = chartType === "LINE" || chartType === "AREA";
  const supportsTimeFilter = dsDef?.supportsTimeFilter === true;

  useEffect(() => {
    if (!config.title && metricDef) {
      onConfigChange({ ...config, title: metricDef.name });
    }
  }, [metricDef]);

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-500 dark:text-zinc-400">Configure your chart</h3>

      {/* Title */}
      <div>
        <label className="text-xs font-medium text-gray-500 dark:text-zinc-400 block mb-1">Title</label>
        <input
          type="text"
          value={config.title}
          onChange={(e) => onConfigChange({ ...config, title: e.target.value })}
          className="w-full rounded-md border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#EB5D2E]/50"
          placeholder="Chart title"
        />
      </div>

      {/* Time range */}
      {supportsTimeFilter && (
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-zinc-400 block mb-1.5">Time Range</label>
          <div className="flex gap-2 flex-wrap">
            {PERIOD_OPTIONS.map((opt) => {
              const isActive = (config.period || "all") === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => onConfigChange({ ...config, period: opt.value })}
                  className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-all ${
                    isActive
                      ? "border-[#EB5D2E] bg-[#EB5D2E]/10 text-[#EB5D2E]"
                      : "border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:border-gray-300 dark:hover:border-zinc-600"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Trend line toggle for time-series */}
      {supportsTimeSeries && (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={config.showTrendLine}
            onChange={(e) => onConfigChange({ ...config, showTrendLine: e.target.checked })}
            className="rounded border-gray-300 dark:border-zinc-600 text-[#EB5D2E] focus:ring-[#EB5D2E]"
          />
          <span className="text-sm text-gray-700 dark:text-zinc-300">Show trend line with forecast</span>
        </label>
      )}

      {/* Live preview */}
      <div>
        <label className="text-xs font-medium text-gray-500 dark:text-zinc-400 block mb-1.5">Preview</label>
        <div className="rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-3">
          {loading ? (
            <div className="flex items-center justify-center h-[200px]">
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
              height={200}
            />
          ) : (
            <div className="flex items-center justify-center h-[200px] text-sm text-gray-400 dark:text-zinc-500">
              No preview available
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
