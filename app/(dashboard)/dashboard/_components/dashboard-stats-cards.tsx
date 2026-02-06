"use client";

import { useEffect, useState, useCallback } from "react";
import { Package, Activity, CheckCircle, AlertTriangle, AlertCircle, Calendar } from "lucide-react";

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
  period: {
    from: string;
    to: string;
  };
};

type Period = "7d" | "30d" | "90d" | "custom";

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
    ? "text-[#EB5D2E]"
    : "text-green-600 dark:text-green-400";

  const statsCards = [
    {
      label: "Total Orders",
      value: stats?.totalOrders ?? 0,
      icon: Package,
      trend: stats?.trends.orders,
    },
    {
      label: "Active Orders",
      value: stats?.activeOrders ?? 0,
      icon: Activity,
    },
    {
      label: "Completed",
      value: stats?.completedOrders ?? 0,
      icon: CheckCircle,
      trend: stats?.trends.completion,
    },
    {
      label: "Delayed",
      value: stats?.delayDetail.count ?? 0,
      icon: AlertTriangle,
      subtitle: delaySubtitle,
      subtitleColor: delaySubtitleColor,
    },
    {
      label: "Disrupted",
      value: stats?.disruptedOrders ?? 0,
      icon: AlertCircle,
      highlight: (stats?.disruptedOrders ?? 0) > 0,
    },
  ];

  const periodOptions: Period[] = ["7d", "30d", "90d"];

  return (
    <div className="col-span-full">
      {/* Period Selector */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">Overview</p>
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-1 rounded-lg bg-gray-100 dark:bg-zinc-800 p-1">
            {periodOptions.map((p) => (
              <button
                key={p}
                onClick={() => handlePeriodChange(p)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  period === p
                    ? "bg-[#EB5D2E] text-white shadow-sm"
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
                  ? "bg-[#EB5D2E] text-white shadow-sm"
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
            className="px-3 py-1 text-xs font-medium rounded-md bg-[#EB5D2E] text-white disabled:opacity-50 disabled:cursor-not-allowed"
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
              className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm dark:bg-zinc-900 dark:border-zinc-800 animate-pulse"
              style={{ minHeight: "120px" }}
            >
              <div className="h-3 w-20 bg-gray-100 dark:bg-zinc-800 rounded" />
              <div className="mt-3 h-8 w-16 bg-gray-100 dark:bg-zinc-800 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {statsCards.map((stat, index) => (
            <div
              key={index}
              className={`group relative rounded-2xl border p-6 shadow-sm transition-all ${
                stat.highlight
                  ? "bg-red-50/50 border-red-100 dark:bg-red-950/20 dark:border-red-900/30"
                  : "bg-white border-gray-100 hover:shadow-md dark:bg-zinc-900 dark:border-zinc-800 dark:hover:border-zinc-700"
              }`}
              style={{ minHeight: "120px" }}
            >
              <div className="flex items-start justify-between">
                <p className={`text-[13px] font-medium tracking-wide uppercase ${stat.highlight ? "text-[#EB5D2E] dark:text-[#EB5D2E]" : "text-gray-400 dark:text-zinc-500"}`}>
                  {stat.label}
                </p>
                <stat.icon
                  className={`h-5 w-5 ${stat.highlight ? "text-[#EB5D2E] dark:text-[#EB5D2E]" : "text-gray-300 dark:text-zinc-600"}`}
                  strokeWidth={2}
                />
              </div>
              <div className="mt-3 flex items-end gap-2">
                <p className={`text-3xl font-bold leading-none ${stat.highlight ? "text-[#EB5D2E] dark:text-[#EB5D2E]" : "text-gray-800 dark:text-white"}`}>
                  {stat.value}
                </p>
                {stat.trend !== undefined && stat.trend !== 0 && (
                  <span
                    className={`text-xs font-medium mb-1 ${
                      stat.trend > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {stat.trend > 0 ? "+" : ""}{stat.trend}%
                  </span>
                )}
              </div>
              {stat.subtitle && (
                <p className={`mt-2 text-xs font-medium ${stat.subtitleColor}`}>
                  {stat.subtitle}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
