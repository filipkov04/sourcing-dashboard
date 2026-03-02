"use client";

import { getMetricsForChartType, type ChartTypeId, type DataSourceCategory } from "@/lib/chart-data-sources";

type Props = {
  chartType: ChartTypeId;
  selectedDataSource: string | null;
  selectedMetric: string | null;
  onSelect: (dataSource: string, metric: string) => void;
};

const CATEGORY_LABELS: Record<DataSourceCategory, string> = {
  orders: "Orders",
  factories: "Factories",
  products: "Products",
  forecasting: "Forecasting",
};

const CATEGORY_ORDER: DataSourceCategory[] = ["orders", "factories", "products", "forecasting"];

export function ChartBuilderStepMetric({ chartType, selectedDataSource, selectedMetric, onSelect }: Props) {
  const metrics = getMetricsForChartType(chartType);

  const grouped = CATEGORY_ORDER
    .map((cat) => ({
      category: cat,
      label: CATEGORY_LABELS[cat],
      metrics: metrics.filter((m) => m.category === cat),
    }))
    .filter((g) => g.metrics.length > 0);

  return (
    <div>
      <h3 className="text-sm font-medium text-gray-500 dark:text-zinc-400 mb-3">Select a metric</h3>
      <div className="space-y-4 max-h-[340px] overflow-y-auto pr-1">
        {grouped.map((group) => (
          <div key={group.category}>
            <p className="text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wide mb-2">{group.label}</p>
            <div className="space-y-2">
              {group.metrics.map((m) => {
                const isSelected = selectedDataSource === m.dataSourceId && selectedMetric === m.id;
                return (
                  <button
                    key={`${m.dataSourceId}-${m.id}`}
                    onClick={() => onSelect(m.dataSourceId, m.id)}
                    className={`w-full text-left rounded-lg border p-3 transition-all hover:border-[#EB5D2E]/50 ${
                      isSelected
                        ? "border-[#EB5D2E] bg-[#EB5D2E]/5 dark:bg-[#EB5D2E]/10"
                        : "border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50"
                    }`}
                  >
                    <p className={`text-sm font-medium ${isSelected ? "text-[#EB5D2E]" : "text-gray-900 dark:text-white"}`}>{m.name}</p>
                    <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">{m.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
