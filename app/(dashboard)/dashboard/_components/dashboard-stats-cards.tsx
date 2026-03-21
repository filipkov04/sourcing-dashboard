"use client";

import { useEffect, useState, useCallback, useId, useRef } from "react";
import { Package, Activity, CheckCircle, Target, Clock, Calendar, RefreshCw } from "lucide-react";
import { useAutoRefresh, formatTimeAgo } from "@/lib/use-auto-refresh";
import { AnimatedNumber } from "@/components/animated-number";
import { motion } from "framer-motion";

type DashboardStats = {
  totalOrders: number;
  activeOrders: number;
  completedOrders: number;
  onTimeRate: number;
  avgLeadTimeDays: number;
  trends: {
    orders: number;
    completion: number;
    onTimeRate: number;
    leadTime: number;
  };
  sparklines: {
    total: number[];
    active: number[];
    completed: number[];
  };
  period: {
    from: string;
    to: string;
  };
};

type Period = "7d" | "30d" | "90d" | "custom";

function Sparkline({ data, color = "#3b82f6" }: { data: number[]; color?: string }) {
  const id = useId();
  if (!data || data.length < 2) return null;

  const gradientId = `sparkline-grad-${id}`;
  const max = Math.max(...data, 1);
  const w = 64;
  const h = 28;
  const padding = 2;

  const coords = data.map((v, i) => ({
    x: padding + (i / (data.length - 1)) * (w - padding * 2),
    y: h - padding - (v / max) * (h - padding * 2),
  }));

  const linePoints = coords.map((c) => `${c.x},${c.y}`).join(" ");
  const fillPoints = [
    ...coords.map((c) => `${c.x},${c.y}`),
    `${coords[coords.length - 1].x},${h}`,
    `${coords[0].x},${h}`,
  ].join(" ");

  return (
    <svg width={w} height={h} className="flex-shrink-0">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.25} />
          <stop offset="100%" stopColor={color} stopOpacity={0.02} />
        </linearGradient>
      </defs>
      <polygon points={fillPoints} fill={`url(#${gradientId})`} />
      <polyline
        points={linePoints}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HUDCardBorder() {
  return (
    <div className="pointer-events-none absolute inset-0 rounded-xl">
      <div className="absolute left-0 top-0 h-px w-0 bg-gradient-to-r from-orange-500/25 to-orange-500/5 transition-all duration-500 ease-out group-hover:w-full" />
      <div className="absolute bottom-0 right-0 h-px w-0 bg-gradient-to-l from-orange-500/25 to-orange-500/5 transition-all duration-500 ease-out group-hover:w-full" />
      <div className="absolute left-0 top-0 h-0 w-px bg-gradient-to-b from-orange-500/25 to-orange-500/5 transition-all duration-500 ease-out group-hover:h-full" />
      <div className="absolute bottom-0 right-0 h-0 w-px bg-gradient-to-t from-orange-500/25 to-orange-500/5 transition-all duration-500 ease-out group-hover:h-full" />
    </div>
  );
}

export function DashboardStatsCards() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("30d");
  const [showCustom, setShowCustom] = useState(false);
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const hasLoadedOnce = useRef(false);

  const fetchStats = useCallback(async () => {
    // Only show skeleton on initial load, not on background refreshes
    if (!hasLoadedOnce.current) setIsLoading(true);
    try {
      let url = `/api/dashboard/stats?period=${period}`;
      if (period === "custom" && customFrom && customTo) {
        url += `&from=${customFrom}&to=${customTo}`;
      }
      const response = await fetch(url);
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error);
    } finally {
      hasLoadedOnce.current = true;
      setIsLoading(false);
    }
  }, [period, customFrom, customTo]);

  useEffect(() => {
    if (period !== "custom" || (customFrom && customTo)) {
      fetchStats();
    }
  }, [fetchStats, period, customFrom, customTo]);

  // Auto-refresh every 30s
  const { lastUpdated } = useAutoRefresh(fetchStats, { interval: 30_000 });
  const [timeAgoText, setTimeAgoText] = useState("");

  useEffect(() => {
    const tick = setInterval(() => setTimeAgoText(formatTimeAgo(lastUpdated)), 5_000);
    return () => clearInterval(tick);
  }, [lastUpdated]);

  function handlePeriodChange(p: Period) {
    hasLoadedOnce.current = false;
    if (p === "custom") {
      setShowCustom(true);
      setPeriod("custom");
    } else {
      setShowCustom(false);
      setPeriod(p);
    }
  }

  function handleCustomApply() {
    if (customFrom && customTo) {
      fetchStats();
    }
  }

  function sparklineTrend(data?: number[]): number | undefined {
    if (!data || data.length < 2) return undefined;
    const mid = Math.floor(data.length / 2);
    const firstHalf = data.slice(0, mid).reduce((a, b) => a + b, 0) / mid;
    const secondHalf = data.slice(mid).reduce((a, b) => a + b, 0) / (data.length - mid);
    if (firstHalf === 0) return secondHalf > 0 ? 100 : 0;
    return Math.round(((secondHalf - firstHalf) / firstHalf) * 100);
  }

  const onTimeColor = (stats?.onTimeRate ?? 0) >= 80
    ? "#10b981"
    : (stats?.onTimeRate ?? 0) >= 50
      ? "#f59e0b"
      : "#FF4D15";

  const statsCards = [
    {
      label: "Total Orders",
      tag: "ORD",
      value: stats?.totalOrders ?? 0,
      icon: Package,
      trend: stats?.trends.orders,
      sparkline: stats?.sparklines?.total,
      sparkColor: "#71717a",
    },
    {
      label: "In Progress",
      tag: "WIP",
      value: stats?.activeOrders ?? 0,
      icon: Activity,
      trend: sparklineTrend(stats?.sparklines?.active),
      sparkline: stats?.sparklines?.active,
      sparkColor: "#71717a",
      subtitle: "Currently in production",
      subtitleColor: "text-zinc-500 dark:text-zinc-500",
    },
    {
      label: "Completed",
      tag: "CMP",
      value: stats?.completedOrders ?? 0,
      icon: CheckCircle,
      trend: stats?.trends.completion,
      sparkline: stats?.sparklines?.completed,
      sparkColor: "#71717a",
    },
    {
      label: "On-Time Rate",
      tag: "OTR",
      value: stats?.onTimeRate ?? 0,
      suffix: "%",
      icon: Target,
      trend: stats?.trends.onTimeRate,
      invertTrend: false,
      sparkColor: onTimeColor,
      highlight: (stats?.onTimeRate ?? 100) < 50,
      subtitle: stats?.onTimeRate !== undefined
        ? `${stats.onTimeRate >= 80 ? "Strong" : stats.onTimeRate >= 50 ? "Needs improvement" : "Critical"} delivery performance`
        : undefined,
      subtitleColor: (stats?.onTimeRate ?? 100) >= 80
        ? "text-green-600 dark:text-green-400"
        : (stats?.onTimeRate ?? 100) >= 50
          ? "text-amber-600 dark:text-amber-400"
          : "text-[#FF4D15]",
    },
    {
      label: "Avg Lead Time",
      tag: "ALT",
      value: stats?.avgLeadTimeDays ?? 0,
      suffix: "d",
      icon: Clock,
      trend: stats?.trends.leadTime,
      invertTrend: true,
      sparkColor: "#71717a",
      subtitle: stats?.avgLeadTimeDays
        ? "Order to completion"
        : "No completed orders",
      subtitleColor: "text-zinc-500 dark:text-zinc-500",
    },
  ];

  const periodOptions: Period[] = ["7d", "30d", "90d"];

  return (
    <div className="col-span-full">
      {/* Period Selector */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <p className="hud-section-label font-mono text-xs uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-500">
            Overview
          </p>
          {timeAgoText && (
            <span className="flex items-center gap-1 text-[10px] text-gray-400 dark:text-zinc-600">
              <RefreshCw className="h-2.5 w-2.5" />
              {timeAgoText}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-0.5 rounded-lg bg-gray-100 dark:bg-zinc-800/80 p-0.5 ring-1 ring-transparent dark:ring-zinc-700/50">
            {periodOptions.map((p) => (
              <button
                key={p}
                onClick={() => handlePeriodChange(p)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  period === p
                    ? "bg-gradient-to-b from-[#FFB21A] via-[#FF4D15] to-[#FF4D15] text-white shadow-sm"
                    : "text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                {p.toUpperCase()}
              </button>
            ))}
            <button
              onClick={() => handlePeriodChange("custom")}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1 ${
                period === "custom"
                  ? "bg-gradient-to-b from-[#FFB21A] via-[#FF4D15] to-[#FF4D15] text-white shadow-sm"
                  : "text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <Calendar className="h-3 w-3" />
              Custom
            </button>
          </div>
        </div>
      </div>

      {/* Custom Date Range Picker */}
      {showCustom && (
        <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700">
          <label htmlFor="stats-date-from" className="text-xs text-gray-500 dark:text-zinc-400">From</label>
          <input
            id="stats-date-from"
            name="stats-date-from"
            type="date"
            value={customFrom}
            onChange={(e) => setCustomFrom(e.target.value)}
            className="px-2 py-1 text-sm rounded-md border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white"
          />
          <label htmlFor="stats-date-to" className="text-xs text-gray-500 dark:text-zinc-400">To</label>
          <input
            id="stats-date-to"
            name="stats-date-to"
            type="date"
            value={customTo}
            onChange={(e) => setCustomTo(e.target.value)}
            className="px-2 py-1 text-sm rounded-md border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white"
          />
          <button
            onClick={handleCustomApply}
            disabled={!customFrom || !customTo}
            className="px-3 py-1 text-xs font-medium rounded-md bg-gradient-to-b from-[#FFB21A] via-[#FF4D15] to-[#FF4D15] text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Apply
          </button>
        </div>
      )}

      {/* Stats Grid */}
      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-gray-100 bg-white dark:border-zinc-800 dark:bg-zinc-900 animate-pulse"
            >
              <div className="px-4 pt-3 pb-2">
                <div className="h-2.5 w-16 bg-gray-100 dark:bg-zinc-800 rounded" />
              </div>
              <div className="mx-3 h-px bg-gray-100 dark:bg-zinc-800" />
              <div className="px-4 pt-3 pb-4">
                <div className="h-8 w-14 bg-gray-100 dark:bg-zinc-800 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {statsCards.map((stat, index) => {
            // For inverted trends (like lead time), lower is better
            const trendIsPositive = stat.invertTrend
              ? (stat.trend ?? 0) < 0
              : (stat.trend ?? 0) > 0;
            const trendIsNegative = stat.invertTrend
              ? (stat.trend ?? 0) > 0
              : (stat.trend ?? 0) < 0;

            return (
              <motion.div
                key={index}
                className={`group relative overflow-hidden rounded-xl border transition-all ${
                  stat.highlight
                    ? "border-red-200/60 bg-white dark:border-red-900/30 dark:bg-[#0d0f13]"
                    : "border-gray-100 bg-white dark:border-zinc-800/60 dark:bg-[#0d0f13]"
                }`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.05 + index * 0.06,
                  duration: 0.4,
                  ease: [0.33, 1, 0.68, 1],
                }}
              >
                <HUDCardBorder />

                {/* Header Zone */}
                <div className="flex items-center justify-between px-4 pt-3 pb-2">
                  <div className="flex items-center gap-2">
                    <span className={`font-mono text-[9px] uppercase tracking-[0.12em] ${
                      stat.highlight ? "text-[#FF4D15]/70" : "text-zinc-500 dark:text-zinc-600"
                    }`}>
                      {stat.tag}
                    </span>
                    <p className={`text-[11px] font-semibold tracking-wide ${
                      stat.highlight ? "text-[#FF4D15]" : "text-gray-400 dark:text-zinc-400"
                    }`}>
                      {stat.label}
                    </p>
                  </div>
                  <stat.icon
                    className={`h-3.5 w-3.5 ${stat.highlight ? "text-[#FF4D15]/50" : "text-gray-300 dark:text-zinc-700"}`}
                    strokeWidth={1.5}
                  />
                </div>

                {/* Divider */}
                <div className={`mx-3 h-px ${
                  stat.highlight
                    ? "bg-red-200/40 dark:bg-red-900/20"
                    : "bg-gray-100 dark:bg-zinc-800/80"
                }`} />

                {/* Metric Zone */}
                <div className="px-4 pt-3 pb-4">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className={`text-[32px] font-bold leading-none tracking-tight tabular-nums ${
                        stat.highlight ? "text-[#FF4D15]" : "text-gray-900 dark:text-white"
                      }`}>
                        <AnimatedNumber value={stat.value} />
                        {stat.suffix && (
                          <span className="text-[20px] font-semibold text-gray-400 dark:text-zinc-500 ml-0.5">
                            {stat.suffix}
                          </span>
                        )}
                      </p>
                      {stat.trend !== undefined && stat.trend !== 0 && (
                        <div className="mt-2 flex items-center gap-1.5">
                          <span
                            className={`text-[10px] font-medium ${
                              trendIsPositive ? "text-green-600 dark:text-green-400" : trendIsNegative ? "text-red-600 dark:text-red-400" : ""
                            }`}
                          >
                            {(stat.trend ?? 0) > 0 ? "\u25B2" : "\u25BC"} {Math.abs(stat.trend ?? 0)}{stat.suffix === "%" ? "pp" : "%"}
                          </span>
                          <span className="text-[10px] text-gray-400 dark:text-zinc-600">
                            vs prior
                          </span>
                        </div>
                      )}
                    </div>
                    {stat.sparkline && (
                      <Sparkline data={stat.sparkline} color={stat.sparkColor} />
                    )}
                  </div>
                  {stat.subtitle && (
                    <p className={`mt-1.5 text-[10px] font-medium ${stat.subtitleColor}`}>
                      {stat.subtitle}
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
