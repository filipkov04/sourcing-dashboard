"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/theme-provider";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { AnimatedNumber } from "@/components/animated-number";
import { ChevronDown, ChevronUp } from "lucide-react";

type HistoricalDelayData = {
  summary: {
    totalCompletedOrders: number;
    lateOrders: number;
    lateRate: number;
    avgDaysLate: number;
    avgResolutionDays: number;
  };
  byFactory: Array<{
    factoryId: string;
    factoryName: string;
    completedOrders: number;
    lateOrders: number;
    lateRate: number;
    avgDaysLate: number;
  }>;
  byStage: Array<{
    stageName: string;
    delayIncidents: number;
    avgResolutionDays: number;
    reasons: Array<{ content: string; orderId: string; orderNumber: string; factoryName: string }>;
    orders: Array<{ orderId: string; orderNumber: string; productName: string; factoryName: string; delayType: string; incidentCount: number }>;
  }>;
  recentLateOrders: Array<{
    orderId: string;
    orderNumber: string;
    productName: string;
    factoryName: string;
    expectedDate: string;
    actualDate: string;
    daysLate: number;
    delayedStages: Array<{ stageName: string; reason: string | null; delayDays: number }>;
  }>;
};

interface HistoricalDelayChartProps {
  data: HistoricalDelayData;
}

export function HistoricalDelayChart({ data }: HistoricalDelayChartProps) {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const { summary, byFactory, byStage, recentLateOrders } = data;

  if (summary.totalCompletedOrders === 0) {
    return (
      <div className="h-[200px] flex items-center justify-center text-sm text-gray-500 dark:text-zinc-400">
        No completed orders available for historical delay analysis
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* A. Summary mini-cards */}
      <div>
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Historical Delays</h3>
          <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">Analysis of completed orders that were delivered late</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Late Deliveries */}
          <div
            className={`rounded-lg border p-3 card-hover-glow ${
              summary.lateRate > 15
                ? "bg-red-50/60 border-red-200 dark:bg-red-950/20 dark:border-red-800/60"
                : "border-gray-100 dark:border-zinc-800"
            }`}
          >
            <span className="text-xs font-medium text-gray-500 dark:text-zinc-400">Late Deliveries</span>
            <p className="text-xl font-bold text-gray-900 dark:text-white tabular-nums mt-1">
              <AnimatedNumber value={summary.lateOrders} />
              <span className="text-sm font-normal text-gray-400 dark:text-zinc-500 ml-1">
                ({summary.lateRate}%)
              </span>
            </p>
          </div>
          {/* Avg Days Late */}
          <div className="rounded-lg border border-gray-100 dark:border-zinc-800 bg-amber-50/40 dark:bg-amber-950/10 p-3 card-hover-glow">
            <span className="text-xs font-medium text-gray-500 dark:text-zinc-400">Avg Days Late</span>
            <p className="text-xl font-bold text-gray-900 dark:text-white tabular-nums mt-1">
              <AnimatedNumber value={summary.avgDaysLate} />
              <span className="text-sm font-normal text-gray-400 dark:text-zinc-500 ml-1">days</span>
            </p>
          </div>
          {/* Completed Orders */}
          <div className="rounded-lg border border-gray-100 dark:border-zinc-800 p-3 card-hover-glow">
            <span className="text-xs font-medium text-gray-500 dark:text-zinc-400">Completed Orders</span>
            <p className="text-xl font-bold text-gray-900 dark:text-white tabular-nums mt-1">
              <AnimatedNumber value={summary.totalCompletedOrders} />
              <span className="text-sm font-normal text-gray-400 dark:text-zinc-500 ml-1">total</span>
            </p>
          </div>
        </div>
      </div>

      {/* B. Late Rate by Factory (horizontal bar chart) */}
      {byFactory.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-3">Late Rate by Factory</h4>
          <ResponsiveContainer width="100%" height={byFactory.length * 44 + 40}>
            <BarChart
              data={byFactory.map((f) => ({
                factory: f.factoryName,
                lateRate: f.lateRate,
                late: f.lateOrders,
                total: f.completedOrders,
              }))}
              layout="vertical"
              margin={{ top: 5, right: 40, left: 0, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="0"
                stroke={isDark ? "#3f3f46" : "#e5e7eb"}
                opacity={0.3}
                horizontal={false}
              />
              <XAxis
                type="number"
                tick={{ fontSize: 11, fill: isDark ? "#71717a" : "#9ca3af" }}
                tickLine={{ stroke: isDark ? "#3f3f46" : "#e5e7eb", strokeWidth: 1 }}
                tickSize={4}
                axisLine={{ stroke: isDark ? "#3f3f46" : "#e5e7eb", strokeWidth: 1 }}
                unit="%"
                domain={[0, "auto"]}
              />
              <YAxis
                type="category"
                dataKey="factory"
                width={120}
                tick={{ fontSize: 12, fill: isDark ? "#a1a1aa" : "#6b7280" }}
                tickLine={false}
                axisLine={{ stroke: isDark ? "#3f3f46" : "#e5e7eb", strokeWidth: 1 }}
              />
              <Tooltip
                cursor={{ fill: "rgba(255,255,255,0.04)" }}
                contentStyle={{
                  backgroundColor: isDark ? "#27272a" : "#ffffff",
                  border: `1px solid ${isDark ? "#3f3f46" : "#f1f5f9"}`,
                  borderRadius: "8px",
                  fontSize: "12px",
                  padding: "8px 12px",
                }}
                formatter={(_: any, __: any, props: any) => {
                  const { late, total, lateRate } = props.payload;
                  return [`${late} of ${total} completed orders late (${lateRate}%)`, "Late Rate"];
                }}
              />
              <defs>
                <linearGradient id="historicalDelayBarGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#ef4444" />
                </linearGradient>
              </defs>
              <Bar dataKey="lateRate" fill="url(#historicalDelayBarGradient)" radius={[0, 4, 4, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* C. Problem Stages (Historical) */}
      {byStage.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-3">Problem Stages (Historical)</h4>
          <div className="space-y-3">
            {byStage.map((stage) => (
              <div
                key={stage.stageName}
                className="rounded-lg border border-gray-100 dark:border-zinc-800 p-3"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{stage.stageName}</span>
                    <span className="text-[10px] text-gray-400 dark:text-zinc-500">
                      {stage.orders.length} order{stage.orders.length !== 1 ? "s" : ""} affected
                    </span>
                  </div>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                    {stage.delayIncidents} incident{stage.delayIncidents !== 1 ? "s" : ""}
                  </span>
                </div>
                {/* Affected orders with factory */}
                {stage.orders.length > 0 && (
                  <div className="space-y-1 mt-2">
                    {stage.orders.map((order, i) => (
                      <button
                        key={`${order.orderId}-${i}`}
                        onClick={() => router.push(`/orders/${order.orderId}`)}
                        className="w-full flex items-center gap-2 text-xs text-gray-600 dark:text-zinc-400 py-1 px-1.5 -mx-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800/60 transition-colors cursor-pointer text-left"
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${
                            order.delayType === "BLOCKED" ? "bg-red-500" : "bg-amber-500"
                          }`}
                        />
                        <span className="font-medium text-gray-700 dark:text-zinc-300 hover:underline">{order.orderNumber}</span>
                        <span className="text-gray-400 dark:text-zinc-600">&middot;</span>
                        <span className="truncate">{order.productName}</span>
                        <span className="text-gray-400 dark:text-zinc-600">&middot;</span>
                        <span className="text-gray-400 dark:text-zinc-500 flex-shrink-0">{order.factoryName}</span>
                        <span className={`text-[10px] px-1 py-0.5 rounded flex-shrink-0 ${
                          order.delayType === "BLOCKED"
                            ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                            : "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                        }`}>
                          {order.delayType === "BLOCKED" ? "blocked" : "delayed"}
                        </span>
                        {order.incidentCount > 1 && (
                          <span className="text-[10px] px-1 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 flex-shrink-0" title={`This order was delayed ${order.incidentCount} times at this stage`}>
                            x{order.incidentCount}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
                {/* Reasons with order/factory context */}
                {stage.reasons.length > 0 && (
                  <div className="space-y-1 mt-2 pt-2 border-t border-gray-100 dark:border-zinc-800">
                    <span className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-zinc-500 font-medium">Reasons</span>
                    {stage.reasons.map((reason, i) => (
                      <button
                        key={i}
                        onClick={() => router.push(`/orders/${reason.orderId}`)}
                        className="w-full flex items-start gap-2 text-xs text-gray-600 dark:text-zinc-400 py-1 px-1.5 -mx-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800/60 transition-colors cursor-pointer text-left"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-gray-400 dark:bg-zinc-500 flex-shrink-0 mt-1.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-700 dark:text-zinc-300">{reason.content}</p>
                          <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-0.5">
                            {reason.orderNumber} &middot; {reason.factoryName}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* D. Recent Late Orders (collapsible list) */}
      {recentLateOrders.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-3">Recent Late Orders</h4>
          <div className="space-y-2">
            {recentLateOrders.map((order) => (
              <div
                key={order.orderId}
                className="rounded-lg border border-gray-100 dark:border-zinc-800 overflow-hidden"
              >
                <button
                  onClick={() =>
                    setExpandedOrder(expandedOrder === order.orderId ? null : order.orderId)
                  }
                  className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-sm font-medium text-gray-900 dark:text-white flex-shrink-0">
                      {order.orderNumber}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-zinc-400 truncate">
                      {order.productName}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-zinc-500 flex-shrink-0">
                      {order.factoryName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                      +{order.daysLate}d late
                    </span>
                    {expandedOrder === order.orderId ? (
                      <ChevronUp className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                </button>
                {expandedOrder === order.orderId && (
                  <div className="px-3 pb-3 border-t border-gray-100 dark:border-zinc-800 pt-2 space-y-1.5">
                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-zinc-400">
                      <span>
                        Expected:{" "}
                        {new Date(order.expectedDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                      <span>
                        Actual:{" "}
                        {new Date(order.actualDate!).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    {order.delayedStages.length > 0 ? (
                      order.delayedStages.map((s, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-2 text-xs text-gray-600 dark:text-zinc-400 py-0.5"
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                          <div>
                            <span className="font-medium text-gray-700 dark:text-zinc-300">
                              {s.stageName}
                            </span>
                            {s.delayDays > 0 && (
                              <span className="text-gray-400 dark:text-zinc-500 ml-1">
                                ({s.delayDays}d)
                              </span>
                            )}
                            {s.reason && (
                              <p className="text-gray-500 dark:text-zinc-400 mt-0.5">{s.reason}</p>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-gray-400 dark:text-zinc-500 italic">
                        No specific stage delays recorded
                      </p>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); router.push(`/orders/${order.orderId}`); }}
                      className="text-xs font-medium text-[#EB5D2E] hover:text-[#d4511f] mt-1"
                    >
                      View Order &rarr;
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
