"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, AlertTriangle, LayoutGrid, Radar as RadarIcon, Factory } from "lucide-react";
import Link from "next/link";
import { ChartToggle, type ChartView } from "@/components/chart-toggle";
import { AnimatedChartContainer } from "@/components/animated-chart-container";
import { FactoryRadarChart } from "./factory-radar-chart";
import { AnimatedNumber } from "@/components/animated-number";

interface FactoryStat {
  id: string;
  name: string;
  location: string;
  totalOrders: number;
  activeOrders: number;
  completedOrders: number;
  delayedOrders: number;
  disruptedOrders: number;
  averageProgress: number;
  onTimeRate: number;
  completionRate: number;
  issueRate: number;
}

interface FactoryStats {
  summary: {
    totalFactories: number;
    totalOrders: number;
    averageOrdersPerFactory: number;
  };
  factories: FactoryStat[];
  insights: {
    topPerformers: FactoryStat[];
    needsAttention: FactoryStat[];
    mostUtilized: FactoryStat[];
    leastUtilized: FactoryStat[];
  };
}

const views: ChartView[] = [
  { id: "cards", icon: LayoutGrid, label: "Card view" },
  { id: "radar", icon: RadarIcon, label: "Radar chart" },
];

export function FactoryPerformanceSection() {
  const [stats, setStats] = useState<FactoryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState("cards");

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch("/api/dashboard/factory-stats");
        const result = await response.json();

        if (result.success) {
          setStats(result.data);
        }
      } catch (error) {
        console.error("Failed to fetch factory stats:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-100 bg-white p-4 dark:border-zinc-800/60 dark:bg-[#0d0f13]">
        <Skeleton className="h-6 w-48 mb-4" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-white dark:border-zinc-800/60 dark:bg-[#0d0f13] card-hover-glow hud-corners overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-5 pb-3">
        <div className="flex items-center gap-2">
          <Factory className="h-4 w-4 text-zinc-400 dark:text-zinc-600" strokeWidth={1.5} />
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
            Factory Performance
          </h3>
        </div>
        <ChartToggle
          views={views}
          activeView={activeView}
          onViewChange={setActiveView}
          storageKey="factory-performance"
        />
      </div>

      {/* Summary strip */}
      <div className="mx-6 mb-4 flex items-center gap-4 rounded-lg bg-gray-50 dark:bg-zinc-800/50 px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-500">FAC</span>
          <span className="text-sm font-bold text-gray-900 dark:text-white tabular-nums">
            <AnimatedNumber value={stats.summary.totalFactories} />
          </span>
        </div>
        <div className="h-3 w-px bg-gray-200 dark:bg-zinc-700" />
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-500">ORD</span>
          <span className="text-sm font-bold text-gray-900 dark:text-white tabular-nums">
            <AnimatedNumber value={stats.summary.totalOrders} />
          </span>
        </div>
        <div className="h-3 w-px bg-gray-200 dark:bg-zinc-700" />
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-500">AVG</span>
          <span className="text-sm font-bold text-gray-900 dark:text-white tabular-nums">
            <AnimatedNumber value={stats.summary.averageOrdersPerFactory} />
          </span>
          <span className="text-[10px] text-zinc-500">/factory</span>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 pb-5">
        <AnimatedChartContainer viewKey={activeView}>
          {activeView === "radar" ? (
            <FactoryRadarChart factories={stats.factories} />
          ) : (
            <div className="space-y-5">
              {/* Top Performers */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                  <span className="text-xs font-semibold uppercase tracking-wide text-green-600 dark:text-green-400">
                    Top Performers
                  </span>
                </div>
                {stats.insights.topPerformers.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-zinc-500">No data yet</p>
                ) : (
                  <div className="space-y-2">
                    {stats.insights.topPerformers.slice(0, 3).map((factory) => (
                      <Link
                        key={factory.id}
                        href={`/factories/${factory.id}`}
                        className="group flex items-center justify-between p-2.5 rounded-lg border border-gray-100 dark:border-zinc-800 hover:border-green-200/60 dark:hover:border-green-900/40 transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-100 group-hover:text-[#FF4D15] transition-colors truncate">
                            {factory.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-zinc-500">
                            {factory.location} · {factory.totalOrders} orders
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className="flex-shrink-0 ml-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800 text-[10px]"
                        >
                          {factory.onTimeRate}%
                        </Badge>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="h-px bg-gray-100 dark:bg-zinc-800" />

              {/* Needs Attention */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-3.5 w-3.5 text-orange-500" />
                  <span className="text-xs font-semibold uppercase tracking-wide text-orange-600 dark:text-orange-400">
                    Needs Attention
                  </span>
                </div>
                {stats.insights.needsAttention.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-zinc-500">All factories performing well</p>
                ) : (
                  <div className="space-y-2">
                    {stats.insights.needsAttention.slice(0, 3).map((factory) => (
                      <Link
                        key={factory.id}
                        href={`/factories/${factory.id}`}
                        className="group flex items-center justify-between p-2.5 rounded-lg border border-gray-100 dark:border-zinc-800 hover:border-orange-200/60 dark:hover:border-orange-900/40 transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-100 group-hover:text-[#FF4D15] transition-colors truncate">
                            {factory.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-zinc-500">
                            {factory.delayedOrders} delayed · {factory.disruptedOrders} disrupted
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className="flex-shrink-0 ml-2 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800 text-[10px]"
                        >
                          {factory.issueRate}%
                        </Badge>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </AnimatedChartContainer>
      </div>
    </div>
  );
}
