"use client";

import { useEffect, useState } from "react";
import { BarChart3, Package, ArrowRight } from "lucide-react";
import Link from "next/link";

type OrderProgress = {
  id: string;
  orderNumber: string;
  productName: string;
  factoryName: string;
  status: string;
  overallProgress: number;
  expectedDate: string;
  daysRemaining: number;
};

const statusColors: Record<string, string> = {
  PENDING: "bg-zinc-500/5 text-zinc-500 dark:text-zinc-400 ring-1 ring-zinc-500/15",
  IN_PROGRESS: "bg-zinc-500/5 text-zinc-500 dark:text-zinc-400 ring-1 ring-zinc-500/15",
  BEHIND_SCHEDULE: "bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/20",
  DELAYED: "bg-orange-500/10 text-[#FF4D15] ring-1 ring-orange-500/20",
  DISRUPTED: "bg-red-500/10 text-red-600 dark:text-red-400 ring-1 ring-red-500/20",
  SHIPPED: "bg-zinc-500/5 text-zinc-500 dark:text-zinc-400 ring-1 ring-zinc-500/15",
};

function progressBarColor(progress: number, daysRemaining: number, status: string): string {
  if (daysRemaining < 0) return "bg-red-500";
  if (status === "BEHIND_SCHEDULE") return "bg-amber-500";
  if (daysRemaining <= 3 && progress < 80) return "bg-orange-500";
  return "bg-zinc-400 dark:bg-zinc-500";
}

export function OrderProgressSnapshot() {
  const [orders, setOrders] = useState<OrderProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const response = await fetch("/api/dashboard/order-progress");
        const data = await response.json();
        if (data.success) {
          setOrders(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch order progress:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchOrders();
  }, []);

  if (isLoading) {
    return (
      <div className="rounded-xl border border-gray-100 bg-white p-4 dark:border-zinc-800/60 dark:bg-[#0d0f13]">
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

  if (orders.length === 0) {
    return (
      <div className="rounded-xl border border-gray-100 bg-white p-4 dark:border-zinc-800/60 dark:bg-[#0d0f13] card-hover-glow hud-corners">
        <div className="flex items-center gap-2 mb-4">
          <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-600">TRK</span>
          <BarChart3 className="h-4 w-4 text-zinc-400 dark:text-zinc-600" strokeWidth={1.5} />
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Order Progress</h3>
        </div>
        <div className="text-center py-6">
          <Package className="mx-auto h-10 w-10 text-gray-300 dark:text-zinc-700 mb-2" />
          <p className="text-xs text-gray-500 dark:text-zinc-500">No active orders</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 dark:border-zinc-800/60 dark:bg-[#0d0f13] card-hover-glow hud-corners">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-600">TRK</span>
          <BarChart3 className="h-4 w-4 text-zinc-400 dark:text-zinc-600" strokeWidth={1.5} />
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Order Progress</h3>
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
        {orders.map((order) => {
          const barColor = progressBarColor(order.overallProgress, order.daysRemaining, order.status);
          return (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className="group flex items-center gap-3 -mx-2 px-2 py-2 rounded-lg hover:bg-gray-50/80 dark:hover:bg-zinc-800/50 transition-colors"
            >
              {/* Days badge */}
              <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                order.daysRemaining < 0 ? "bg-red-500/10" :
                order.daysRemaining <= 3 ? "bg-orange-500/10" :
                "bg-zinc-500/5 dark:bg-zinc-800"
              }`}>
                <span className={`text-[9px] font-semibold tabular-nums leading-none ${
                  order.daysRemaining < 0 ? "text-red-600 dark:text-red-400" :
                  order.daysRemaining <= 3 ? "text-[#FF4D15]" :
                  "text-zinc-500 dark:text-zinc-400"
                }`}>
                  {order.daysRemaining < 0
                    ? `${Math.abs(order.daysRemaining)}d`
                    : order.daysRemaining === 0
                      ? "Due"
                      : `${order.daysRemaining}d`}
                </span>
              </div>

              {/* Order info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-[#FF4D15] transition-colors truncate">
                    #{order.orderNumber}
                  </p>
                  <span className={`flex-shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                    statusColors[order.status] || statusColors.PENDING
                  }`}>
                    {order.status.replace(/_/g, " ")}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-zinc-500 truncate">
                  {order.productName} · {order.factoryName}
                </p>
              </div>

              {/* Progress bar */}
              <div className="flex-shrink-0 w-16">
                <div className="flex items-center justify-end gap-1.5 mb-0.5">
                  <span className="font-mono text-[10px] text-gray-400 dark:text-zinc-500 tabular-nums">
                    {order.overallProgress}%
                  </span>
                </div>
                <div className="h-1 w-full rounded-full bg-gray-100 dark:bg-zinc-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${barColor}`}
                    style={{ width: `${order.overallProgress}%` }}
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
