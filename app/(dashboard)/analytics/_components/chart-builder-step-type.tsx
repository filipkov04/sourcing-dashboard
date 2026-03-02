"use client";

import { BarChart3, LineChart, PieChart, AreaChart, Radar, Layers } from "lucide-react";
import type { ChartTypeId } from "@/lib/chart-data-sources";

const CHART_TYPES: { id: ChartTypeId; label: string; description: string; icon: typeof BarChart3 }[] = [
  { id: "BAR", label: "Bar Chart", description: "Compare values across categories", icon: BarChart3 },
  { id: "LINE", label: "Line Chart", description: "Track trends over time", icon: LineChart },
  { id: "PIE", label: "Pie Chart", description: "Show proportions of a whole", icon: PieChart },
  { id: "AREA", label: "Area Chart", description: "Visualize cumulative trends", icon: AreaChart },
  { id: "RADAR", label: "Radar Chart", description: "Compare multiple dimensions at once", icon: Radar },
  { id: "STACKED_BAR", label: "Stacked Bar", description: "Compare composition across categories", icon: Layers },
];

type Props = {
  selected: ChartTypeId | null;
  onSelect: (type: ChartTypeId) => void;
};

export function ChartBuilderStepType({ selected, onSelect }: Props) {
  return (
    <div>
      <h3 className="text-sm font-medium text-gray-500 dark:text-zinc-400 mb-3">Choose a chart type</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {CHART_TYPES.map((ct) => {
          const Icon = ct.icon;
          const isSelected = selected === ct.id;
          return (
            <button
              key={ct.id}
              onClick={() => onSelect(ct.id)}
              className={`flex flex-col items-center gap-2 rounded-lg border p-4 text-center transition-all hover:border-[#EB5D2E]/50 ${
                isSelected
                  ? "border-[#EB5D2E] bg-[#EB5D2E]/5 dark:bg-[#EB5D2E]/10"
                  : "border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50"
              }`}
            >
              <Icon className={`h-6 w-6 ${isSelected ? "text-[#EB5D2E]" : "text-gray-400 dark:text-zinc-500"}`} />
              <div>
                <p className={`text-sm font-medium ${isSelected ? "text-[#EB5D2E]" : "text-gray-900 dark:text-white"}`}>{ct.label}</p>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">{ct.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
