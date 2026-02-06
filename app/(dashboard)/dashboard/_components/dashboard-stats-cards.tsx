"use client";

import { useEffect, useState } from "react";
import { Package, TrendingUp, CheckCircle, AlertTriangle, AlertCircle, Activity } from "lucide-react";

type DashboardStats = {
  totalOrders: number;
  activeOrders: number;
  completedOrders: number;
  delayedOrders: number;
  disruptedOrders: number;
  averageProgress: number;
  trends: {
    orders: number;
    completion: number;
  };
};

export function DashboardStatsCards() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch("/api/dashboard/stats");
        const data = await response.json();
        if (data.success) {
          setStats(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchStats();
  }, []);

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
      label: "Avg Progress",
      value: `${stats?.averageProgress ?? 0}%`,
      icon: TrendingUp,
      isPercentage: true,
    },
    {
      label: "Delayed",
      value: stats?.delayedOrders ?? 0,
      icon: AlertTriangle,
    },
    {
      label: "Disrupted",
      value: stats?.disruptedOrders ?? 0,
      icon: AlertCircle,
      highlight: (stats?.disruptedOrders ?? 0) > 0,
    },
  ];

  if (isLoading) {
    return (
      <>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm dark:bg-zinc-900 dark:border-zinc-800 animate-pulse"
            style={{ minHeight: "120px" }}
          >
            <div className="h-3 w-20 bg-gray-100 dark:bg-zinc-800 rounded" />
            <div className="mt-3 h-8 w-16 bg-gray-100 dark:bg-zinc-800 rounded" />
          </div>
        ))}
      </>
    );
  }

  return (
    <>
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
        </div>
      ))}
    </>
  );
}
