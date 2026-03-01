"use client";

import { useTheme } from "@/components/theme-provider";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { AnimatedNumber } from "@/components/animated-number";

type StageStat = {
  stageName: string;
  avgDuration: number;
  minDuration: number;
  maxDuration: number;
  sampleCount: number;
};

type FactoryBreakdown = {
  factoryId: string;
  factoryName: string;
  stages: Array<{ stageName: string; avgDuration: number; sampleCount: number }>;
  totalAvgDuration: number;
};

interface StageDurationChartProps {
  overall: StageStat[];
  bottleneck: string | null;
  byFactory: FactoryBreakdown[];
}

// Distinct colors for stages
const STAGE_COLORS = ["#EB5D2E", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

export function StageDurationChart({ overall, bottleneck, byFactory }: StageDurationChartProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  if (overall.length === 0) {
    return (
      <div className="h-[200px] flex items-center justify-center text-sm text-gray-500 dark:text-zinc-400">
        No completed stages with timing data available
      </div>
    );
  }

  // Build stacked bar data per factory
  const allStageNames = [...new Set(overall.map((s) => s.stageName))];
  const factoryData = byFactory.map((f) => {
    const row: Record<string, string | number> = { factory: f.factoryName };
    for (const stage of allStageNames) {
      const match = f.stages.find((s) => s.stageName === stage);
      row[stage] = match ? match.avgDuration : 0;
    }
    row.total = f.totalAvgDuration;
    return row;
  });

  return (
    <div className="space-y-6">
      {/* Overall stage averages */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Stage Duration Analysis</h3>
            <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">Average days per production stage</p>
          </div>
          {bottleneck && (
            <Badge variant="outline" className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 text-xs">
              Bottleneck: {bottleneck}
            </Badge>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {overall.map((stage, i) => (
            <div
              key={stage.stageName}
              className="rounded-lg border border-gray-100 dark:border-zinc-800 p-3 card-hover-glow"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: STAGE_COLORS[i % STAGE_COLORS.length] }} />
                <span className="text-xs font-medium text-gray-700 dark:text-zinc-300 truncate">{stage.stageName}</span>
              </div>
              <p className="text-xl font-bold text-gray-900 dark:text-white tabular-nums"><AnimatedNumber value={stage.avgDuration} />d</p>
              <p className="text-[10px] text-gray-400 dark:text-zinc-500">{stage.minDuration}d – {stage.maxDuration}d ({stage.sampleCount} samples)</p>
            </div>
          ))}
        </div>
      </div>

      {/* Stacked bar by factory */}
      {factoryData.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-3">By Factory (stacked)</h4>
          <ResponsiveContainer width="100%" height={factoryData.length * 50 + 60}>
            <BarChart data={factoryData} layout="vertical" margin={{ top: 5, right: 40, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="0" stroke={isDark ? "#3f3f46" : "#e5e7eb"} opacity={0.3} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: isDark ? "#71717a" : "#9ca3af" }} tickLine={false} axisLine={false} unit="d" />
              <YAxis type="category" dataKey="factory" width={120} tick={{ fontSize: 12, fill: isDark ? "#a1a1aa" : "#6b7280" }} tickLine={false} axisLine={false} />
              <Tooltip
                cursor={{ fill: "rgba(255,255,255,0.04)" }}
                contentStyle={{
                  backgroundColor: isDark ? "#27272a" : "#ffffff",
                  border: `1px solid ${isDark ? "#3f3f46" : "#f1f5f9"}`,
                  borderRadius: "8px",
                  fontSize: "12px",
                  padding: "8px 12px",
                }}
              />
              <Legend verticalAlign="bottom" height={36} iconType="rect" formatter={(v) => <span style={{ color: isDark ? "#a1a1aa" : "#6b7280", fontSize: "11px", marginLeft: "4px" }}>{v}</span>} />
              {allStageNames.map((name, i) => (
                <Bar
                  key={name}
                  dataKey={name}
                  stackId="1"
                  fill={STAGE_COLORS[i % STAGE_COLORS.length]}
                  radius={i === allStageNames.length - 1 ? [0, 4, 4, 0] : undefined}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
