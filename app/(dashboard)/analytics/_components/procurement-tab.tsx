"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Package,
  AlertTriangle,
  ShieldAlert,
  CheckCircle,
  ShoppingCart,
  ArrowRight,
  Loader2,
  PackageX,
} from "lucide-react";
import { AnimatedNumber } from "@/components/animated-number";
import { ScrollReveal } from "@/components/scroll-reveal";
import { runwayStatusColor } from "@/lib/inventory-utils";

type RunwayItem = {
  productId: string;
  sku: string;
  productName: string;
  availableStock: number;
  safetyStock: number;
  dailyVelocity: number;
  daysOfStock: number;
  runwayStatus: "HEALTHY" | "WARNING" | "CRITICAL" | "OUT_OF_STOCK";
  reorderRecommended: boolean;
  suggestedOrderQty: number;
  totalLeadTimeDays: number;
  urgency: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  estimatedStockoutDate: string | null;
};

type RunwaySummary = {
  healthy: number;
  warning: number;
  critical: number;
  outOfStock: number;
  reordersNeeded: number;
};

type RunwayData = {
  items: RunwayItem[];
  summary: RunwaySummary;
};

function urgencyColor(urgency: string) {
  switch (urgency) {
    case "URGENT":
      return "bg-red-500/10 dark:bg-red-500/20 text-red-700 dark:text-red-400";
    case "HIGH":
      return "bg-orange-500/10 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400";
    case "MEDIUM":
      return "bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400";
    case "LOW":
      return "bg-green-500/10 dark:bg-green-500/20 text-green-700 dark:text-green-400";
    default:
      return "bg-zinc-500/10 dark:bg-zinc-500/20 text-zinc-600 dark:text-zinc-400";
  }
}

function runwayDaysColor(days: number) {
  if (days < 15) return "text-red-600 dark:text-red-400";
  if (days <= 30) return "text-amber-600 dark:text-amber-400";
  return "text-green-600 dark:text-green-400";
}

export function ProcurementTab() {
  const [data, setData] = useState<RunwayData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRunway() {
      try {
        const res = await fetch("/api/procurement/runway");
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        }
      } catch (error) {
        console.error("Failed to fetch procurement runway:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchRunway();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-[#EB5D2E]" />
        <p className="text-sm text-gray-500 dark:text-zinc-500">Calculating forecasts...</p>
      </div>
    );
  }

  if (!data || data.items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <PackageX className="h-10 w-10 text-zinc-300 dark:text-zinc-600" />
        <p className="text-sm text-gray-500 dark:text-zinc-400">
          No products yet. Add products to see procurement forecasts.
        </p>
        <Link
          href="/products"
          className="text-sm text-[#EB5D2E] hover:underline flex items-center gap-1"
        >
          Go to Products <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    );
  }

  const { summary, items } = data;
  const reorderItems = items
    .filter((i) => i.reorderRecommended)
    .sort((a, b) => {
      const urgencyOrder = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      return (urgencyOrder[a.urgency] ?? 4) - (urgencyOrder[b.urgency] ?? 4);
    });

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <ScrollReveal className="grid gap-4 grid-cols-2 lg:grid-cols-4" stagger>
        <StatCard
          icon={CheckCircle}
          label="Healthy"
          tag="HLT"
          value={summary.healthy}
          iconColor="text-green-500"
        />
        <StatCard
          icon={AlertTriangle}
          label="Warning"
          tag="WRN"
          value={summary.warning}
          iconColor="text-amber-500"
        />
        <StatCard
          icon={ShieldAlert}
          label="Critical"
          tag="CRT"
          value={summary.critical}
          iconColor="text-red-500"
        />
        <StatCard
          icon={ShoppingCart}
          label="Reorders Needed"
          tag="ORD"
          value={summary.reordersNeeded}
          iconColor="text-orange-500"
        />
      </ScrollReveal>

      {/* Reorder Priorities */}
      <ScrollReveal>
        <p className="hud-section-label font-mono text-xs uppercase tracking-[0.12em] text-zinc-500 mb-4">
          Reorder Priorities
        </p>
        {reorderItems.length > 0 ? (
          <div className="rounded-xl border border-gray-100 dark:border-zinc-800/60 bg-white dark:bg-[#0d0f13] card-hover-glow hud-corners overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-zinc-800/40">
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-zinc-500">
                      Urgency
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-zinc-500">
                      SKU
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-zinc-500">
                      Product
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-zinc-500">
                      Stock
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-zinc-500">
                      Runway
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-zinc-500">
                      Lead Time
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-zinc-500">
                      Suggested Qty
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-zinc-500">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {reorderItems.map((item) => (
                    <tr
                      key={item.productId}
                      className="border-b border-gray-100 dark:border-zinc-800/40 hover:bg-gray-50 dark:hover:bg-zinc-800/50"
                    >
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${urgencyColor(item.urgency)}`}
                        >
                          {item.urgency}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-700 dark:text-zinc-300">
                        {item.sku}
                      </td>
                      <td className="px-4 py-3 text-gray-900 dark:text-white">
                        {item.productName}
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-zinc-300">
                        {item.availableStock.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-medium ${runwayDaysColor(item.daysOfStock)}`}>
                          {item.daysOfStock}d
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-zinc-500">
                        {item.totalLeadTimeDays}d
                      </td>
                      <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">
                        {item.suggestedOrderQty.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/products/${item.productId}`}
                          className="text-[#EB5D2E] hover:text-[#d4501f] transition-colors"
                        >
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-gray-100 dark:border-zinc-800/60 bg-white dark:bg-[#0d0f13] card-hover-glow hud-corners p-8 flex flex-col items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <p className="text-sm text-gray-500 dark:text-zinc-400 text-center">
              All products are well-stocked — no reorders needed right now.
            </p>
          </div>
        )}
      </ScrollReveal>

      {/* Full Runway Overview */}
      <ScrollReveal>
        <p className="hud-section-label font-mono text-xs uppercase tracking-[0.12em] text-zinc-500 mb-4">
          All Products Runway
        </p>
        <div className="rounded-xl border border-gray-100 dark:border-zinc-800/60 bg-white dark:bg-[#0d0f13] card-hover-glow hud-corners overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-zinc-800/40">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-zinc-500">
                    SKU
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-zinc-500">
                    Product
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-zinc-500">
                    Available
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-zinc-500">
                    Velocity
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-zinc-500">
                    Runway
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-zinc-500">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const statusColors = runwayStatusColor(item.runwayStatus);
                  return (
                    <Link
                      key={item.productId}
                      href={`/products/${item.productId}`}
                      className="contents"
                    >
                      <tr className="border-b border-gray-100 dark:border-zinc-800/40 hover:bg-gray-50 dark:hover:bg-zinc-800/50 cursor-pointer">
                        <td className="px-4 py-3 font-mono text-xs text-gray-700 dark:text-zinc-300">
                          {item.sku}
                        </td>
                        <td className="px-4 py-3 text-gray-900 dark:text-white">
                          {item.productName}
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-zinc-300">
                          {item.availableStock.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-gray-500 dark:text-zinc-400">
                          {item.dailyVelocity.toFixed(1)}/day
                        </td>
                        <td className="px-4 py-3">
                          <span className={`font-medium ${runwayDaysColor(item.daysOfStock)}`}>
                            {item.daysOfStock}d
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${statusColors.bg} ${statusColors.text}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${statusColors.dot}`} />
                            {item.runwayStatus.replace(/_/g, " ")}
                          </span>
                        </td>
                      </tr>
                    </Link>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </ScrollReveal>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  tag,
  value,
  iconColor,
}: {
  icon: typeof CheckCircle;
  label: string;
  tag: string;
  value: number;
  iconColor: string;
}) {
  return (
    <div className="rounded-xl border border-gray-100 dark:border-zinc-800/60 bg-white dark:bg-[#0d0f13] p-4 card-hover-glow hud-corners">
      <div className="flex items-center gap-2 mb-2">
        <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-600">
          {tag}
        </span>
        <Icon className={`h-4 w-4 ${iconColor}`} />
        <span className="text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wide">
          {label}
        </span>
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">
        <AnimatedNumber value={value} />
      </p>
    </div>
  );
}
