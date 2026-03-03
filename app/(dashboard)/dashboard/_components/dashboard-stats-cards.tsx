"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Package, Activity, CheckCircle, AlertTriangle, AlertCircle, Calendar, RefreshCw } from "lucide-react";
import { useAutoRefresh, formatTimeAgo } from "@/lib/use-auto-refresh";
import { AnimatedNumber } from "@/components/animated-number";

type DelayDetail = {
  count: number;
  avgDelayDays: number;
  maxDelayDays: number;
  avgOriginalDays: number;
};

type DashboardStats = {
  totalOrders: number;
  activeOrders: number;
  completedOrders: number;
  delayedOrders: number;
  disruptedOrders: number;
  delayDetail: DelayDetail;
  trends: {
    orders: number;
    completion: number;
  };
  sparklines: {
    total: number[];
    active: number[];
    completed: number[];
    delayed: number[];
    disrupted: number[];
  };
  period: {
    from: string;
    to: string;
  };
};

type Period = "7d" | "30d" | "90d" | "custom";

let sparklineIdCounter = 0;

function Sparkline({ data, color = "#3b82f6" }: { data: number[]; color?: string }) {
  if (!data || data.length < 2) return null;

  const gradientId = `sparkline-grad-${sparklineIdCounter++}`;
  const max = Math.max(...data, 1);
  const w = 64;
  const h = 28;
  const padding = 2;

  const coords = data.map((v, i) => ({
    x: padding + (i / (data.length - 1)) * (w - padding * 2),
    y: h - padding - (v / max) * (h - padding * 2),
  }));

  const linePoints = coords.map((c) => `${c.x},${c.y}`).join(" ");
  // Closed polygon for gradient fill
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

export function DashboardStatsCards() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("30d");
  const [showCustom, setShowCustom] = useState(false);
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
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

  const delaySubtitle = stats?.delayDetail.count && stats.delayDetail.count > 0
    ? `Avg ${stats.delayDetail.avgDelayDays}d late (vs ${Math.round(stats.delayDetail.avgOriginalDays)}d lead)`
    : "On track";

  const delaySubtitleColor = stats?.delayDetail.count && stats.delayDetail.count > 0
    ? "text-[#FF4D15]"
    : "text-green-600 dark:text-green-400";

  // Derive trend from sparkline data when no explicit trend is provided
  function sparklineTrend(data?: number[]): number | undefined {
    if (!data || data.length < 2) return undefined;
    const mid = Math.floor(data.length / 2);
    const firstHalf = data.slice(0, mid).reduce((a, b) => a + b, 0) / mid;
    const secondHalf = data.slice(mid).reduce((a, b) => a + b, 0) / (data.length - mid);
    if (firstHalf === 0) return secondHalf > 0 ? 100 : 0;
    return Math.round(((secondHalf - firstHalf) / firstHalf) * 100);
  }

  const statsCards = [
    {
      label: "Total Orders",
      value: stats?.totalOrders ?? 0,
      icon: Package,
      trend: stats?.trends.orders,
      sparkline: stats?.sparklines?.total,
      sparkColor: "#3b82f6",
    },
    {
      label: "Active Orders",
      value: stats?.activeOrders ?? 0,
      icon: Activity,
      trend: sparklineTrend(stats?.sparklines?.active),
      sparkline: stats?.sparklines?.active,
      sparkColor: "#8b5cf6",
    },
    {
      label: "Completed",
      value: stats?.completedOrders ?? 0,
      icon: CheckCircle,
      trend: stats?.trends.completion,
      sparkline: stats?.sparklines?.completed,
      sparkColor: "#10b981",
    },
    {
      label: "Delayed",
      value: stats?.delayDetail.count ?? 0,
      icon: AlertTriangle,
      subtitle: delaySubtitle,
      subtitleColor: delaySubtitleColor,
      trend: sparklineTrend(stats?.sparklines?.delayed),
      sparkline: stats?.sparklines?.delayed,
      sparkColor: "#f59e0b",
    },
    {
      label: "Disrupted",
      value: stats?.disruptedOrders ?? 0,
      icon: AlertCircle,
      highlight: (stats?.disruptedOrders ?? 0) > 0,
      trend: sparklineTrend(stats?.sparklines?.disrupted),
      sparkline: stats?.sparklines?.disrupted,
      sparkColor: "#FF4D15",
    },
  ];

  const periodOptions: Period[] = ["7d", "30d", "90d"];

  return (
    <div className="col-span-full">
      {/* Period Selector */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">Overview</p>
          {timeAgoText && (
            <span className="flex items-center gap-1 text-[10px] text-gray-400 dark:text-zinc-600">
              <RefreshCw className="h-2.5 w-2.5" />
              {timeAgoText}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-1 rounded-lg bg-gray-100 dark:bg-zinc-800 p-1">
            {periodOptions.map((p) => (
              <button
                key={p}
                onClick={() => handlePeriodChange(p)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
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
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1 ${
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
          <label className="text-xs text-gray-500 dark:text-zinc-400">From</label>
          <input
            type="date"
            value={customFrom}
            onChange={(e) => setCustomFrom(e.target.value)}
            className="px-2 py-1 text-sm rounded-md border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white"
          />
          <label className="text-xs text-gray-500 dark:text-zinc-400">To</label>
          <input
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
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-gray-100 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-[0_1px_4px_rgba(0,0,0,0.3)] animate-pulse"
            >
              <div className="px-5 pt-4 pb-3">
                <div className="h-3 w-20 bg-gray-100 dark:bg-zinc-800 rounded" />
              </div>
              <div className="mx-4 h-px bg-gray-100 dark:bg-zinc-800" />
              <div className="px-5 pt-4 pb-5">
                <div className="h-9 w-16 bg-gray-100 dark:bg-zinc-800 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {statsCards.map((stat, index) => (
            <div
              key={index}
              className={`group relative rounded-xl border transition-all card-hover-glow ${
                stat.highlight
                  ? "border-red-200/60 bg-white shadow-[0_1px_3px_rgba(255,77,21,0.06)] dark:border-red-900/30 dark:bg-zinc-900 dark:shadow-[0_1px_4px_rgba(255,77,21,0.1)]"
                  : "border-gray-100 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-[0_1px_4px_rgba(0,0,0,0.3)]"
              }`}
            >
              {/* Header Zone */}
              <div className="flex items-center justify-between px-5 pt-4 pb-3">
                <p className={`text-[11px] font-semibold tracking-[0.08em] uppercase ${
                  stat.highlight ? "text-[#FF4D15]" : "text-gray-400 dark:text-zinc-500"
                }`}>
                  {stat.label}
                </p>
                <stat.icon
                  className={`h-4 w-4 ${stat.highlight ? "text-[#FF4D15]/60" : "text-gray-300 dark:text-zinc-700"}`}
                  strokeWidth={1.5}
                />
              </div>

              {/* Architectural divider */}
              <div className={`mx-4 h-px ${
                stat.highlight
                  ? "bg-red-200/40 dark:bg-red-900/20"
                  : "bg-gray-100 dark:bg-zinc-800"
              }`} />

              {/* Metric Zone */}
              <div className="px-5 pt-4 pb-5">
                <div className="flex items-end justify-between">
                  <div>
                    <p className={`text-[36px] font-bold leading-none tracking-tight ${
                      stat.highlight ? "text-[#FF4D15]" : "text-gray-900 dark:text-white"
                    }`}>
                      <AnimatedNumber value={stat.value} />
                    </p>
                    <div className="mt-2.5 flex items-center gap-1.5">
                      {stat.trend !== undefined && stat.trend !== 0 && (
                        <span
                          className={`text-xs font-medium ${
                            stat.trend > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {stat.trend > 0 ? "\u25B2" : "\u25BC"} {Math.abs(stat.trend)}%
                        </span>
                      )}
                      {stat.trend !== undefined && stat.trend !== 0 && (
                        <span className="text-[11px] text-gray-400 dark:text-zinc-500">
                          from last period
                        </span>
                      )}
                    </div>
                  </div>
                  {stat.sparkline && (
                    <Sparkline data={stat.sparkline} color={stat.sparkColor} />
                  )}
                </div>
                {stat.subtitle && (
                  <p className={`mt-2 text-xs font-medium ${stat.subtitleColor}`}>
                    {stat.subtitle}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
