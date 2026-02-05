"use client";

import { useEffect, useState } from "react";
import { Package, CheckCircle, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";

type Activity = {
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
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  IN_PROGRESS: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  DELAYED: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  DISRUPTED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  COMPLETED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  SHIPPED: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  DELIVERED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  CANCELLED: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
};

export function RecentActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([]);
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
      <div className="bg-white rounded-xl border border-gray-200 p-6 dark:bg-zinc-800 dark:border-zinc-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h2>
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-start gap-3 animate-pulse">
              <div className="w-8 h-8 bg-gray-200 dark:bg-zinc-700 rounded-full" />
              <div className="flex-1">
                <div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded w-3/4 mb-2" />
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
      <div className="bg-white rounded-xl border border-gray-200 p-6 dark:bg-zinc-800 dark:border-zinc-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h2>
        <div className="text-center py-8">
          <Clock className="mx-auto h-12 w-12 text-gray-400 dark:text-zinc-500 mb-3" />
          <p className="text-sm text-gray-600 dark:text-zinc-400">No recent activity</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 dark:bg-zinc-800 dark:border-zinc-700">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h2>
        <Link
          href="/orders"
          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium flex items-center gap-1"
        >
          View all
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="space-y-4">
        {activities.slice(0, 5).map((activity) => (
          <Link
            key={activity.id}
            href={`/orders/${activity.id}`}
            className="flex items-start gap-3 group hover:bg-gray-50 dark:hover:bg-zinc-750 -mx-3 px-3 py-2 rounded-lg transition-colors"
          >
            <div
              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                activity.type === "completed"
                  ? "bg-green-100 dark:bg-green-900/30"
                  : "bg-blue-100 dark:bg-blue-900/30"
              }`}
            >
              {activity.type === "completed" ? (
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              ) : (
                <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {activity.type === "completed" ? "Completed" : "New order"} #{activity.orderNumber}
              </p>
              <p className="text-sm text-gray-600 dark:text-zinc-400 truncate">
                {activity.productName} • {activity.factoryName}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    statusColors[activity.status]
                  }`}
                >
                  {activity.status.replace(/_/g, " ")}
                </span>
                <span className="text-xs text-gray-500 dark:text-zinc-500">{activity.timeAgo}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
