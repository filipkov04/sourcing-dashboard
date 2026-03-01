"use client";

import { useTheme } from "@/components/theme-provider";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

interface FactoryStat {
  id: string;
  name: string;
  totalOrders: number;
  activeOrders: number;
  completedOrders: number;
  averageProgress: number;
  onTimeRate: number;
  completionRate: number;
}

const RADAR_COLORS = ["#EB5D2E", "#3b82f6", "#10b981", "#8b5cf6", "#f59e0b"];

export function FactoryRadarChart({ factories }: { factories: FactoryStat[] }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  // Take top 5 factories by total orders
  const topFactories = factories
    .filter((f) => f.totalOrders > 0)
    .sort((a, b) => b.totalOrders - a.totalOrders)
    .slice(0, 5);

  if (topFactories.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-sm text-gray-500 dark:text-zinc-400">
        No factory data available
      </div>
    );
  }

  // Build radar data with normalized values (0-100)
  const maxOrders = Math.max(...topFactories.map((f) => f.activeOrders), 1);

  const radarData = [
    {
      metric: "On-Time %",
      ...Object.fromEntries(topFactories.map((f) => [f.name, f.onTimeRate])),
    },
    {
      metric: "Completion %",
      ...Object.fromEntries(topFactories.map((f) => [f.name, f.completionRate])),
    },
    {
      metric: "Active Orders",
      ...Object.fromEntries(
        topFactories.map((f) => [f.name, Math.round((f.activeOrders / maxOrders) * 100)])
      ),
    },
    {
      metric: "Avg Progress",
      ...Object.fromEntries(topFactories.map((f) => [f.name, f.averageProgress])),
    },
  ];

  return (
    <ResponsiveContainer width="100%" height={320}>
      <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
        <PolarGrid
          stroke={isDark ? "#3f3f46" : "#e5e7eb"}
          strokeOpacity={0.6}
        />
        <PolarAngleAxis
          dataKey="metric"
          tick={{
            fontSize: 11,
            fill: isDark ? "#a1a1aa" : "#6b7280",
          }}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 100]}
          tick={{ fontSize: 10, fill: isDark ? "#71717a" : "#9ca3af" }}
          tickCount={5}
        />
        {topFactories.map((factory, i) => (
          <Radar
            key={factory.id}
            name={factory.name}
            dataKey={factory.name}
            stroke={RADAR_COLORS[i]}
            fill={RADAR_COLORS[i]}
            fillOpacity={0.1}
            strokeWidth={2}
          />
        ))}
        <Tooltip
          cursor={{ fill: "rgba(255,255,255,0.04)" }}
          contentStyle={{
            backgroundColor: isDark ? "#27272a" : "#ffffff",
            border: `1px solid ${isDark ? "#3f3f46" : "#f1f5f9"}`,
            borderRadius: "8px",
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
            padding: "8px 12px",
            fontSize: "12px",
          }}
        />
        <Legend
          verticalAlign="bottom"
          height={36}
          iconType="circle"
          formatter={(value) => (
            <span
              style={{
                color: isDark ? "#a1a1aa" : "#6b7280",
                fontSize: "11px",
                marginLeft: "4px",
              }}
            >
              {value}
            </span>
          )}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
