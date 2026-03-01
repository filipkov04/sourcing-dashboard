"use client";

import { useRecentAlerts, type Alert } from "@/lib/use-alerts";
import { AlertTriangle, AlertCircle, Info, AlertOctagon, ArrowRight } from "lucide-react";
import Link from "next/link";

const severityConfig: Record<string, { icon: typeof AlertTriangle; bg: string; border: string; text: string; iconColor: string }> = {
  CRITICAL: {
    icon: AlertOctagon,
    bg: "bg-red-50 dark:bg-red-950/30",
    border: "border-red-200 dark:border-red-900/50",
    text: "text-red-700 dark:text-red-400",
    iconColor: "text-red-500 dark:text-red-400",
  },
  ERROR: {
    icon: AlertCircle,
    bg: "bg-orange-50 dark:bg-orange-950/30",
    border: "border-orange-200 dark:border-orange-900/50",
    text: "text-orange-700 dark:text-orange-400",
    iconColor: "text-orange-500 dark:text-orange-400",
  },
  WARNING: {
    icon: AlertTriangle,
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-200 dark:border-amber-900/50",
    text: "text-amber-700 dark:text-amber-400",
    iconColor: "text-amber-500 dark:text-amber-400",
  },
  INFO: {
    icon: Info,
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-200 dark:border-blue-900/50",
    text: "text-blue-700 dark:text-blue-400",
    iconColor: "text-blue-500 dark:text-blue-400",
  },
};

export function DashboardAlertsWidget() {
  const { alerts, loading } = useRecentAlerts(5);

  // Only show critical/error/warning alerts that are unresolved
  const activeAlerts = alerts
    .filter((a) => !a.resolved && ["CRITICAL", "ERROR", "WARNING"].includes(a.severity))
    .slice(0, 3);

  if (loading || activeAlerts.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Active Alerts</h3>
        <Link
          href="/alerts"
          className="flex items-center gap-1 text-xs text-[#EB5D2E] hover:text-[#d14e22] transition-colors"
        >
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="space-y-2">
        {activeAlerts.map((alert) => {
          const config = severityConfig[alert.severity] || severityConfig.INFO;
          const Icon = config.icon;
          return (
            <Link
              key={alert.id}
              href={alert.orderId ? `/orders/${alert.orderId}` : "/alerts"}
              className={`flex items-start gap-3 rounded-lg border p-3 transition-colors hover:opacity-80 ${config.bg} ${config.border}`}
            >
              <Icon className={`h-4 w-4 flex-shrink-0 mt-0.5 ${config.iconColor}`} />
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-medium ${config.text}`}>{alert.title}</p>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5 line-clamp-1">
                  {alert.message}
                </p>
              </div>
              <span className="text-[10px] text-gray-400 dark:text-zinc-500 flex-shrink-0 mt-0.5">
                {formatTimeAgo(alert.createdAt)}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}
