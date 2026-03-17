"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, ShieldAlert, Eye, CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";

type ActionItem = {
  id: string;
  orderNumber: string;
  productName: string;
  factoryName: string;
  status: string;
  severity: "critical" | "warning" | "attention";
  reason: string;
  expectedDate: string;
  overallProgress: number;
  daysRemaining: number;
};

const severityConfig = {
  critical: {
    icon: ShieldAlert,
    bg: "bg-red-500/10 dark:bg-red-500/10",
    text: "text-red-600 dark:text-red-400",
    ring: "ring-1 ring-red-500/20",
    dot: "bg-red-500",
  },
  warning: {
    icon: AlertTriangle,
    bg: "bg-amber-500/10 dark:bg-amber-500/10",
    text: "text-amber-600 dark:text-amber-400",
    ring: "ring-1 ring-amber-500/20",
    dot: "bg-amber-500",
  },
  attention: {
    icon: Eye,
    bg: "bg-zinc-500/5 dark:bg-zinc-500/5",
    text: "text-zinc-500 dark:text-zinc-400",
    ring: "ring-1 ring-zinc-500/15",
    dot: "bg-zinc-400",
  },
};

export function ActionRequired() {
  const [items, setItems] = useState<ActionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchItems() {
      try {
        const response = await fetch("/api/dashboard/action-required");
        const data = await response.json();
        if (data.success) {
          setItems(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch action required:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchItems();
  }, []);

  if (isLoading) {
    return (
      <div className="rounded-xl border border-gray-100 bg-white p-4 dark:border-zinc-800/60 dark:bg-[#0d0f13]">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-4 w-4 bg-gray-200 dark:bg-zinc-700 rounded" />
          <div className="h-4 w-32 bg-gray-200 dark:bg-zinc-700 rounded" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse flex items-center gap-3">
              <div className="w-2 h-2 bg-gray-200 dark:bg-zinc-700 rounded-full" />
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

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-gray-100 bg-white p-4 dark:border-zinc-800/60 dark:bg-[#0d0f13] card-hover-glow hud-corners">
        <div className="flex items-center gap-2 mb-4">
          <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-600">ACT</span>
          <ShieldAlert className="h-4 w-4 text-zinc-400 dark:text-zinc-600" strokeWidth={1.5} />
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Action Required</h3>
        </div>
        <div className="text-center py-6">
          <CheckCircle2 className="mx-auto h-10 w-10 text-green-500/40 mb-2" />
          <p className="text-xs text-gray-500 dark:text-zinc-500">All clear — no orders need attention</p>
        </div>
      </div>
    );
  }

  const criticalCount = items.filter(i => i.severity === "critical").length;
  const warningCount = items.filter(i => i.severity === "warning").length;

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 dark:border-zinc-800/60 dark:bg-[#0d0f13] card-hover-glow hud-corners">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-600">ACT</span>
          <ShieldAlert className="h-4 w-4 text-zinc-400 dark:text-zinc-600" strokeWidth={1.5} />
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Action Required</h3>
          <span className="ml-1 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-600 dark:text-red-400 ring-1 ring-red-500/20">
            {items.length}
          </span>
        </div>
        <Link
          href="/orders"
          className="text-xs text-[#FF4D15] hover:text-[#d4522a] font-medium flex items-center gap-1 transition-colors"
        >
          View all
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {(criticalCount > 0 || warningCount > 0) && (
        <div className="flex items-center gap-3 mb-3 text-[10px]">
          {criticalCount > 0 && (
            <span className="text-red-600 dark:text-red-400 font-medium">{criticalCount} critical</span>
          )}
          {warningCount > 0 && (
            <span className="text-amber-600 dark:text-amber-400 font-medium">{warningCount} warning</span>
          )}
        </div>
      )}

      <div className="space-y-1">
        {items.map((item) => {
          const config = severityConfig[item.severity];
          return (
            <Link
              key={item.id}
              href={`/orders/${item.id}`}
              className="group flex items-center gap-3 -mx-2 px-2 py-2 rounded-lg hover:bg-gray-50/80 dark:hover:bg-zinc-800/50 transition-colors"
            >
              <div className={`flex-shrink-0 w-2 h-2 rounded-full ${config.dot}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-[#FF4D15] transition-colors truncate">
                    #{item.orderNumber}
                  </p>
                  <span className={`flex-shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${config.bg} ${config.text} ${config.ring}`}>
                    {item.status === "AT_RISK" ? "At Risk" : item.status.replace(/_/g, " ")}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-zinc-500 truncate">
                  {item.reason} · {item.factoryName}
                </p>
              </div>
              <div className="flex-shrink-0 text-right">
                <span className={`font-mono text-[10px] tabular-nums ${
                  item.daysRemaining < 0 ? "text-red-600 dark:text-red-400" :
                  item.daysRemaining <= 3 ? "text-[#FF4D15]" :
                  "text-zinc-500 dark:text-zinc-400"
                }`}>
                  {item.daysRemaining < 0
                    ? `${Math.abs(item.daysRemaining)}d over`
                    : `${item.daysRemaining}d left`}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
