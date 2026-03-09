"use client";

import { useEffect, useState } from "react";
import { Truck, Clock, AlertTriangle, Package, CalendarClock } from "lucide-react";
import Link from "next/link";

type Delivery = {
  id: string;
  orderNumber: string;
  productName: string;
  productSKU: string | null;
  quantity: number;
  unit: string;
  status: string;
  overallProgress: number;
  expectedDate: string;
  factoryName: string;
  daysRemaining: number;
  urgency: "overdue" | "critical" | "soon" | "on-track";
};

const urgencyConfig = {
  overdue: {
    label: "Overdue",
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-500/10 ring-1 ring-red-500/20",
    barColor: "bg-red-500",
  },
  critical: {
    label: "Due soon",
    color: "text-[#FF4D15]",
    bg: "bg-orange-500/10 ring-1 ring-orange-500/20",
    barColor: "bg-orange-500",
  },
  soon: {
    label: "This week",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10 ring-1 ring-amber-500/20",
    barColor: "bg-amber-500",
  },
  "on-track": {
    label: "On track",
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-500/10 ring-1 ring-green-500/20",
    barColor: "bg-emerald-500",
  },
};

function formatCountdown(days: number): string {
  if (days < 0) return `${Math.abs(days)}d late`;
  if (days === 0) return "Today";
  if (days === 1) return "1d";
  return `${days}d`;
}

export function UpcomingDeliveries() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchDeliveries() {
      try {
        const response = await fetch("/api/dashboard/upcoming-deliveries");
        const data = await response.json();
        if (data.success) {
          setDeliveries(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch upcoming deliveries:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchDeliveries();
  }, []);

  if (isLoading) {
    return (
      <div className="rounded-xl border border-gray-100 bg-white p-6 dark:border-zinc-800/60 dark:bg-[#0d0f13]">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-4 w-4 bg-gray-200 dark:bg-zinc-700 rounded" />
          <div className="h-4 w-32 bg-gray-200 dark:bg-zinc-700 rounded" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-200 dark:bg-zinc-700 rounded-lg" />
              <div className="flex-1">
                <div className="h-3.5 bg-gray-200 dark:bg-zinc-700 rounded w-3/4 mb-1.5" />
                <div className="h-3 bg-gray-200 dark:bg-zinc-700 rounded w-1/2" />
              </div>
              <div className="h-5 w-12 bg-gray-200 dark:bg-zinc-700 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (deliveries.length === 0) {
    return (
      <div className="rounded-xl border border-gray-100 bg-white p-6 dark:border-zinc-800/60 dark:bg-[#0d0f13] card-hover-glow">
        <div className="flex items-center gap-2 mb-4">
          <Truck className="h-4 w-4 text-zinc-400 dark:text-zinc-600" strokeWidth={1.5} />
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Upcoming Deliveries</h2>
        </div>
        <div className="text-center py-6">
          <Package className="mx-auto h-10 w-10 text-gray-300 dark:text-zinc-700 mb-2" />
          <p className="text-xs text-gray-500 dark:text-zinc-500">No upcoming deliveries</p>
        </div>
      </div>
    );
  }

  const overdueCount = deliveries.filter((d) => d.urgency === "overdue").length;
  const criticalCount = deliveries.filter((d) => d.urgency === "critical").length;

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6 dark:border-zinc-800/60 dark:bg-[#0d0f13] card-hover-glow hud-corners">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-600">DLV</span>
          <Truck className="h-4 w-4 text-zinc-400 dark:text-zinc-600" strokeWidth={1.5} />
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Upcoming Deliveries</h2>
        </div>
        {(overdueCount > 0 || criticalCount > 0) && (
          <div className="flex items-center gap-1.5">
            {overdueCount > 0 && (
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-500/10 text-red-600 dark:text-red-400 ring-1 ring-red-500/20">
                <AlertTriangle className="h-2.5 w-2.5" />
                {overdueCount}
              </span>
            )}
            {criticalCount > 0 && (
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-orange-500/10 text-[#FF4D15] ring-1 ring-orange-500/20">
                <Clock className="h-2.5 w-2.5" />
                {criticalCount}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="space-y-1">
        {deliveries.slice(0, 6).map((delivery) => {
          const config = urgencyConfig[delivery.urgency];
          return (
            <Link
              key={delivery.id}
              href={`/orders/${delivery.id}`}
              className="group flex items-center gap-3 -mx-2 px-2 py-2 rounded-lg hover:bg-gray-50/80 dark:hover:bg-zinc-800/50 transition-colors"
            >
              {/* Countdown badge */}
              <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                delivery.urgency === "overdue" ? "bg-red-500/10" :
                delivery.urgency === "critical" ? "bg-orange-500/10" :
                delivery.urgency === "soon" ? "bg-amber-500/10" :
                "bg-zinc-500/5 dark:bg-zinc-800"
              }`}>
                <span className={`text-[9px] font-semibold tabular-nums leading-none ${config.color}`}>
                  {formatCountdown(delivery.daysRemaining)}
                </span>
              </div>

              {/* Order info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-[#FF4D15] transition-colors truncate">
                    #{delivery.orderNumber}
                  </p>
                  <span className={`flex-shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${config.bg} ${config.color}`}>
                    {config.label}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-zinc-500 truncate">
                  {delivery.productName} · {delivery.factoryName}
                </p>
              </div>

              {/* Progress bar */}
              <div className="flex-shrink-0 w-16">
                <div className="flex items-center justify-end gap-1.5 mb-0.5">
                  <span className="font-mono text-[10px] text-gray-400 dark:text-zinc-500 tabular-nums">
                    {delivery.overallProgress}%
                  </span>
                </div>
                <div className="h-1 w-full rounded-full bg-gray-100 dark:bg-zinc-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${config.barColor}`}
                    style={{ width: `${delivery.overallProgress}%` }}
                  />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
