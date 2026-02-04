"use client";

import { useEffect, useState } from "react";
import { Package, TrendingUp, CheckCircle, AlertTriangle } from "lucide-react";

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
      icon: TrendingUp,
    },
    {
      label: "Completed",
      value: stats?.completedOrders ?? 0,
      icon: CheckCircle,
      trend: stats?.trends.completion,
    },
    {
      label: "Delayed",
      value: stats?.delayedOrders ?? 0,
      icon: AlertTriangle,
    },
  ];

  if (isLoading) {
    return (
      <>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-gray-200 p-4 dark:bg-zinc-800 dark:border-zinc-700 animate-pulse"
            style={{ minHeight: "110px" }}
          >
            <div className="h-3 w-20 bg-gray-200 dark:bg-zinc-700 rounded" />
            <div className="mt-3 h-8 w-16 bg-gray-200 dark:bg-zinc-700 rounded" />
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
          className="group relative bg-white rounded-xl border border-gray-200 p-4 transition-colors hover:bg-gray-50 dark:bg-zinc-800 dark:border-zinc-700 dark:hover:bg-zinc-750"
          style={{ minHeight: "110px" }}
        >
          <div className="flex items-start justify-between">
            <p className="text-xs font-medium text-gray-600 dark:text-zinc-400">{stat.label}</p>
            <stat.icon className="h-4 w-4 text-gray-400 dark:text-zinc-500" strokeWidth={2} />
          </div>
          <div className="mt-3 flex items-end gap-2">
            <p className="text-[28px] font-semibold text-gray-900 dark:text-white leading-none">
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
