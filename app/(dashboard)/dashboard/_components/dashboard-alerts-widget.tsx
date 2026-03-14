"use client";

import { useRecentAlerts } from "@/lib/use-alerts";
import { AlertTriangle, AlertCircle, Info, AlertOctagon, ArrowRight, ShieldCheck, Bell } from "lucide-react";
import Link from "next/link";

const severityConfig: Record<string, { icon: typeof AlertTriangle; bg: string; border: string; text: string; iconColor: string }> = {
  CRITICAL: {
    icon: AlertOctagon,
    bg: "bg-red-500/5",
    border: "border-red-500/20",
    text: "text-red-700 dark:text-red-400",
    iconColor: "text-red-500 dark:text-red-400",
  },
  ERROR: {
    icon: AlertCircle,
    bg: "bg-orange-500/5",
    border: "border-orange-500/20",
    text: "text-orange-700 dark:text-orange-400",
    iconColor: "text-orange-500 dark:text-orange-400",
  },
  WARNING: {
    icon: AlertTriangle,
    bg: "bg-amber-500/5",
    border: "border-amber-500/20",
    text: "text-amber-700 dark:text-amber-400",
    iconColor: "text-amber-500 dark:text-amber-400",
  },
  INFO: {
    icon: Info,
    bg: "bg-blue-500/5",
    border: "border-blue-500/20",
    text: "text-blue-700 dark:text-blue-400",
    iconColor: "text-blue-500 dark:text-blue-400",
  },
};

export function DashboardAlertsWidget() {
  const { alerts, loading } = useRecentAlerts(5);

  const activeAlerts = alerts
    .filter((a) => !a.resolved)
    .slice(0, 4);

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 dark:border-zinc-800/60 dark:bg-[#0d0f13] card-hover-glow hud-corners">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-600">ALT</span>
          <Bell className="h-4 w-4 text-zinc-400 dark:text-zinc-600" strokeWidth={1.5} />
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Active Alerts</h3>
          {!loading && activeAlerts.length > 0 && (
            <span className="flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-[#FF4D15] text-[9px] font-bold text-white">
              {activeAlerts.length}
            </span>
          )}
        </div>
        <Link
          href="/alerts"
          className="text-xs text-[#FF4D15] hover:text-[#d4522a] font-medium flex items-center gap-1 transition-colors"
        >
          View all
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {loading ? (
        <div className="space-y-2.5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-7 h-7 bg-gray-200 dark:bg-zinc-700 rounded-full" />
              <div className="flex-1">
                <div className="h-3.5 bg-gray-200 dark:bg-zinc-700 rounded w-3/4 mb-1.5" />
                <div className="h-3 bg-gray-200 dark:bg-zinc-700 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : activeAlerts.length === 0 ? (
        <div className="text-center py-6">
          <ShieldCheck className="mx-auto h-10 w-10 text-green-500/30 mb-2" />
          <p className="text-xs text-gray-500 dark:text-zinc-500">All clear — no active alerts</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {activeAlerts.map((alert) => {
            const config = severityConfig[alert.severity] || severityConfig.INFO;
            const Icon = config.icon;
            return (
              <Link
                key={alert.id}
                href={alert.orderId ? `/orders/${alert.orderId}` : "/alerts"}
                className={`group flex items-start gap-3 rounded-lg border p-2.5 transition-colors hover:opacity-80 ${config.bg} ${config.border}`}
              >
                <Icon className={`h-3.5 w-3.5 flex-shrink-0 mt-0.5 ${config.iconColor}`} />
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-medium ${config.text}`}>{alert.title}</p>
                  <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5 line-clamp-1">
                    {alert.message}
                  </p>
                </div>
                <span className="font-mono text-[10px] text-gray-400 dark:text-zinc-600 flex-shrink-0 mt-0.5">
                  {formatTimeAgo(alert.createdAt)}
                </span>
              </Link>
            );
          })}
        </div>
      )}
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
