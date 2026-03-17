"use client";

import { useEffect, useState } from "react";
import { Package, CheckCircle, Clock, ArrowRight, Activity } from "lucide-react";
import Link from "next/link";

type ActivityItem = {
  id: string;
  type: "created" | "completed";
  orderNumber: string;
  productName: string;
  factoryName: string;
  status: string;
  timeAgo: string;
  createdAt: string;
};

const statusColors: Record<string, string> = {
  PENDING: "bg-zinc-500/5 text-zinc-500 dark:text-zinc-400 ring-1 ring-zinc-500/15",
  IN_PROGRESS: "bg-zinc-500/5 text-zinc-500 dark:text-zinc-400 ring-1 ring-zinc-500/15",
  BEHIND_SCHEDULE: "bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/20",
  DELAYED: "bg-orange-500/10 text-[#FF4D15] ring-1 ring-orange-500/20",
  DISRUPTED: "bg-red-500/10 text-red-600 dark:text-red-400 ring-1 ring-red-500/20",
  COMPLETED: "bg-zinc-500/5 text-zinc-500 dark:text-zinc-400 ring-1 ring-zinc-500/15",
  SHIPPED: "bg-zinc-500/5 text-zinc-500 dark:text-zinc-400 ring-1 ring-zinc-500/15",
  DELIVERED: "bg-zinc-500/5 text-zinc-500 dark:text-zinc-400 ring-1 ring-zinc-500/15",
  CANCELLED: "bg-zinc-500/5 text-zinc-500 dark:text-zinc-400 ring-1 ring-zinc-500/15",
};

export function RecentActivityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchActivities() {
      try {
        const response = await fetch("/api/dashboard/recent-activity");
        const data = await response.json();
        if (data.success) {
          setActivities(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch recent activity:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchActivities();
  }, []);

  if (isLoading) {
    return (
      <div className="rounded-xl border border-gray-100 bg-white p-4 dark:border-zinc-800/60 dark:bg-[#0d0f13]">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-4 w-4 bg-gray-200 dark:bg-zinc-700 rounded" />
          <div className="h-4 w-24 bg-gray-200 dark:bg-zinc-700 rounded" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-7 h-7 bg-gray-200 dark:bg-zinc-700 rounded-full" />
              <div className="flex-1">
                <div className="h-3.5 bg-gray-200 dark:bg-zinc-700 rounded w-3/4 mb-1.5" />
                <div className="h-3 bg-gray-200 dark:bg-zinc-700 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="rounded-xl border border-gray-100 bg-white p-4 dark:border-zinc-800/60 dark:bg-[#0d0f13]">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-4 w-4 text-zinc-400 dark:text-zinc-600" strokeWidth={1.5} />
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Recent Activity</h2>
        </div>
        <div className="text-center py-8">
          <Clock className="mx-auto h-10 w-10 text-gray-300 dark:text-zinc-700 mb-2" />
          <p className="text-xs text-gray-500 dark:text-zinc-500">No recent activity</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 dark:border-zinc-800/60 dark:bg-[#0d0f13] card-hover-glow hud-corners">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-600">LOG</span>
          <Activity className="h-4 w-4 text-zinc-400 dark:text-zinc-600" strokeWidth={1.5} />
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Recent Activity</h2>
        </div>
        <Link
          href="/orders"
          className="text-xs text-[#FF4D15] hover:text-[#d4522a] font-medium flex items-center gap-1 transition-colors"
        >
          View all
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="space-y-1">
        {activities.slice(0, 5).map((activity) => (
          <Link
            key={activity.id}
            href={`/orders/${activity.id}`}
            className="group flex items-center gap-3 -mx-2 px-2 py-2 rounded-lg hover:bg-gray-50/80 dark:hover:bg-zinc-800/50 transition-colors"
          >
            <div
              className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center bg-zinc-500/5 dark:bg-zinc-800"
            >
              {activity.type === "completed" ? (
                <CheckCircle className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500" />
              ) : (
                <Package className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-[#FF4D15] transition-colors truncate">
                  #{activity.orderNumber}
                </p>
                <span
                  className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                    statusColors[activity.status] || statusColors.PENDING
                  }`}
                >
                  {activity.status.replace(/_/g, " ")}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-zinc-500 truncate">
                {activity.productName} · {activity.factoryName}
              </p>
            </div>

            <span className="flex-shrink-0 font-mono text-[10px] text-gray-400 dark:text-zinc-600">
              {activity.timeAgo}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
