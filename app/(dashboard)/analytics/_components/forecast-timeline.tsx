"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, AlertCircle, CheckCircle, Clock } from "lucide-react";

type Forecast = {
  orderId: string;
  orderNumber: string | null;
  productName: string;
  status: string;
  factoryName: string;
  progress: number;
  expectedDate: string;
  predictedDate: string;
  predictedDaysLate: number;
  daysUntilExpected: number;
  deltaDays?: number;
  risk: "on-track" | "at-risk" | "critical";
  method: string;
};

type ForecastSummary = {
  total: number;
  onTrack: number;
  atRisk: number;
  critical: number;
};

interface ForecastTimelineProps {
  forecasts: Forecast[];
  summary: ForecastSummary;
}

const riskConfig = {
  "on-track": {
    icon: CheckCircle,
    badge: "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800",
    label: "On Track",
  },
  "at-risk": {
    icon: AlertTriangle,
    badge: "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    label: "At Risk",
  },
  critical: {
    icon: AlertCircle,
    badge: "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800",
    label: "Critical",
  },
};

export function ForecastTimeline({ forecasts, summary }: ForecastTimelineProps) {
  if (forecasts.length === 0) {
    return (
      <div className="h-[200px] flex items-center justify-center text-sm text-gray-500 dark:text-zinc-400">
        No active orders to forecast
      </div>
    );
  }

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Production Forecast</h3>
        <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">
          Based on actual stage completion vs planned dates
        </p>
      </div>

      {/* Summary badges */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          <span className="text-gray-600 dark:text-zinc-400">{summary.onTrack} on track</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <span className="h-2 w-2 rounded-full bg-amber-500" />
          <span className="text-gray-600 dark:text-zinc-400">{summary.atRisk} at risk</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <span className="h-2 w-2 rounded-full bg-red-500" />
          <span className="text-gray-600 dark:text-zinc-400">{summary.critical} critical</span>
        </div>
      </div>

      {/* Forecast list */}
      <div className="space-y-2">
        {forecasts.map((forecast) => {
          const config = riskConfig[forecast.risk];
          const Icon = config.icon;

          return (
            <Link
              key={forecast.orderId}
              href={`/orders/${forecast.orderId}`}
              className="flex items-center gap-3 rounded-lg border border-gray-100 dark:border-zinc-800 p-3 hover:bg-gray-50/50 dark:hover:bg-zinc-800/50 transition-colors"
            >
              <Icon className={`h-4 w-4 flex-shrink-0 ${
                forecast.risk === "critical" ? "text-red-500" : forecast.risk === "at-risk" ? "text-amber-500" : "text-green-500"
              }`} />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[#EB5D2E]">{forecast.orderNumber || "No PO#"}</span>
                  <span className="text-sm text-gray-700 dark:text-zinc-300 truncate">{forecast.productName}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500 dark:text-zinc-400">
                  <span>{forecast.factoryName}</span>
                  <span>•</span>
                  <span>{forecast.progress}% complete</span>
                  {forecast.deltaDays != null && forecast.deltaDays !== 0 && (
                    <>
                      <span>•</span>
                      <span className={forecast.deltaDays > 0 ? "text-red-500 dark:text-red-400" : "text-green-500 dark:text-green-400"}>
                        {forecast.deltaDays > 0 ? `+${forecast.deltaDays}d behind` : `${Math.abs(forecast.deltaDays)}d ahead`}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="text-right">
                  <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-zinc-400">
                    <Clock className="h-3 w-3" />
                    Expected: {formatDate(forecast.expectedDate)}
                  </div>
                  <div className="text-xs text-gray-400 dark:text-zinc-500">
                    Predicted: {formatDate(forecast.predictedDate)}
                  </div>
                </div>
                <Badge variant="outline" className={`${config.badge} text-xs`}>
                  {forecast.risk === "on-track"
                    ? forecast.deltaDays != null && forecast.deltaDays < 0
                      ? `${Math.abs(forecast.deltaDays)}d early`
                      : config.label
                    : `+${forecast.predictedDaysLate}d late`}
                </Badge>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
