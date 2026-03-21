"use client";

import { useRouter } from "next/navigation";
import { useTheme } from "@/components/theme-provider";
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { AnimatedNumber } from "@/components/animated-number";

type DelayAnalysisData = {
  summary: { totalOrders: number; delayedOrders: number; delayRate: number; avgDaysLate: number };
  byFactory: Array<{
    factoryId: string;
    factoryName: string;
    totalOrders: number;
    delayedCount: number;
    delayRate: number;
    avgDaysLate: number;
  }>;
  byStage: Array<{
    stageName: string;
    delayedCount: number;
    blockedCount: number;
    totalIncidents: number;
    orders: Array<{ orderId: string; orderNumber: string | null; productName: string; factoryName: string; status: string }>;
  }>;
  trend: Array<{ month: string; totalOrders: number; delayedOrders: number; delayRate: number }>;
};

interface DelayAnalysisChartProps {
  data: DelayAnalysisData;
}

export function DelayAnalysisChart({ data }: DelayAnalysisChartProps) {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const { summary, byFactory, byStage, trend } = data;

  if (summary.totalOrders === 0) {
    return (
      <div className="h-[200px] flex items-center justify-center text-sm text-gray-500 dark:text-zinc-400">
        No order data available for delay analysis
      </div>
    );
  }

  const topStage = byStage.length > 0 ? byStage[0] : null;
  const avgTrendRate = trend.length > 0
    ? Math.round(trend.reduce((s, t) => s + t.delayRate, 0) / trend.length * 10) / 10
    : 0;

  return (
    <div className="space-y-6">
      {/* A. Summary mini-cards */}
      <div>
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Delay Analysis</h3>
          <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">Where and how often orders get delayed</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Delayed Orders */}
          <div
            className={`rounded-lg border p-3 card-hover-glow ${
              summary.delayRate > 20
                ? "bg-red-50/60 border-red-200 dark:bg-red-950/20 dark:border-red-800/60"
                : "border-gray-100 dark:border-zinc-800"
            }`}
          >
            <span className="text-xs font-medium text-gray-500 dark:text-zinc-400">Delayed Orders</span>
            <p className="text-xl font-bold text-gray-900 dark:text-white tabular-nums mt-1">
              <AnimatedNumber value={summary.delayedOrders} />
              <span className="text-sm font-normal text-gray-400 dark:text-zinc-500 ml-1">
                ({summary.delayRate}%)
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
          {/* Most Problematic Stage */}
          <div className="rounded-lg border border-gray-100 dark:border-zinc-800 p-3 card-hover-glow">
            <span className="text-xs font-medium text-gray-500 dark:text-zinc-400">Most Problematic Stage</span>
            {topStage ? (
              <p className="text-lg font-bold text-gray-900 dark:text-white mt-1 truncate">
                {topStage.stageName}
                <span className="text-sm font-normal text-gray-400 dark:text-zinc-500 ml-1">
                  ({topStage.totalIncidents} incidents)
                </span>
              </p>
            ) : (
              <p className="text-lg font-bold text-green-600 dark:text-green-400 mt-1">None</p>
            )}
          </div>
        </div>
      </div>

      {/* B. Delay by Factory (horizontal bar chart) */}
      {byFactory.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-3">Delay Rate by Factory</h4>
          <ResponsiveContainer width="100%" height={byFactory.length * 44 + 40}>
            <BarChart
              data={byFactory.map((f) => ({
                factory: f.factoryName,
                delayRate: f.delayRate,
                delayed: f.delayedCount,
                total: f.totalOrders,
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
                  const { delayed, total, delayRate } = props.payload;
                  return [`${delayed} of ${total} orders delayed (${delayRate}%)`, "Delay Rate"];
                }}
              />
              <defs>
                <linearGradient id="delayBarGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#ef4444" />
                </linearGradient>
              </defs>
              <Bar dataKey="delayRate" fill="url(#delayBarGradient)" radius={[0, 4, 4, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* C. Problem Stages — with affected orders */}
      {byStage.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-3">Problem Stages</h4>
          <div className="space-y-3">
            {byStage.map((stage) => (
              <div
                key={stage.stageName}
                className="rounded-lg border border-gray-100 dark:border-zinc-800 p-3"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{stage.stageName}</span>
                  <div className="flex items-center gap-2">
                    {stage.delayedCount > 0 && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                        {stage.delayedCount} delayed
                      </span>
                    )}
                    {stage.blockedCount > 0 && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                        {stage.blockedCount} blocked
                      </span>
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  {stage.orders.map((order, i) => (
                    <button
                      key={`${order.orderId}-${i}`}
                      onClick={() => router.push(`/orders/${order.orderId}`)}
                      className="w-full flex items-center gap-2 text-xs text-gray-600 dark:text-zinc-400 py-1 px-1.5 -mx-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800/60 transition-colors cursor-pointer text-left"
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${
                          order.status === "BLOCKED" ? "bg-red-500" : "bg-amber-500"
                        }`}
                      />
                      <span className="font-medium text-gray-700 dark:text-zinc-300 hover:underline">{order.orderNumber || "No PO#"}</span>
                      <span className="text-gray-400 dark:text-zinc-600">&middot;</span>
                      <span className="truncate">{order.productName}</span>
                      <span className="text-gray-400 dark:text-zinc-600">&middot;</span>
                      <span className="text-gray-400 dark:text-zinc-500 flex-shrink-0">{order.factoryName}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* D. Delay Trend (area chart) */}
      {trend.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-3">Delay Trend (Last 6 Months)</h4>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={trend} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="delayTrendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#f97316" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="0"
                stroke={isDark ? "#3f3f46" : "#e5e7eb"}
                opacity={0.3}
                vertical={false}
              />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: isDark ? "#71717a" : "#9ca3af" }}
                tickLine={false}
                axisLine={{ stroke: isDark ? "#3f3f46" : "#e5e7eb", strokeWidth: 1 }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: isDark ? "#71717a" : "#9ca3af" }}
                tickLine={false}
                axisLine={{ stroke: isDark ? "#3f3f46" : "#e5e7eb", strokeWidth: 1 }}
                unit="%"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? "#27272a" : "#ffffff",
                  border: `1px solid ${isDark ? "#3f3f46" : "#f1f5f9"}`,
                  borderRadius: "8px",
                  fontSize: "12px",
                  padding: "8px 12px",
                }}
                formatter={(value: any) => [`${value}%`, "Delay Rate"]}
              />
              <ReferenceLine
                y={avgTrendRate}
                stroke={isDark ? "#71717a" : "#9ca3af"}
                strokeDasharray="4 4"
                label={{
                  value: `Avg ${avgTrendRate}%`,
                  position: "right",
                  fontSize: 10,
                  fill: isDark ? "#71717a" : "#9ca3af",
                }}
              />
              <Area
                type="monotone"
                dataKey="delayRate"
                stroke="#ef4444"
                strokeWidth={2}
                fill="url(#delayTrendGradient)"
                dot={{ r: 3, fill: "#ef4444", stroke: isDark ? "#18181b" : "#ffffff", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
