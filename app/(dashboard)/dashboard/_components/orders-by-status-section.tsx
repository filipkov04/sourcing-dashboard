"use client";

import { useEffect, useState, useRef } from "react";
import { PieChart as PieChartIcon, BarChart3 } from "lucide-react";
import { OrdersByStatusChart } from "./orders-by-status-chart";
import { OrdersByStatusBarChart } from "./orders-by-status-bar-chart";
import { ChartToggle, type ChartView } from "@/components/chart-toggle";
import { ChartExportButton } from "@/components/chart-export-button";
import { AnimatedChartContainer } from "@/components/animated-chart-container";
import type { OrdersByStatusData } from "@/lib/types";

const views: ChartView[] = [
  { id: "donut", icon: PieChartIcon, label: "Donut chart" },
  { id: "bar", icon: BarChart3, label: "Bar chart" },
];

export function OrdersByStatusSection() {
  const [statusData, setStatusData] = useState<OrdersByStatusData>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeView, setActiveView] = useState("donut");
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchStatusBreakdown() {
      try {
        const response = await fetch("/api/dashboard/status-breakdown");
        const data = await response.json();
        if (data.success) {
          const chartData = data.data.map((item: any) => ({
            name: item.status,
            value: item.count,
            color: item.color,
            percentage: item.percentage,
          }));
          setStatusData(chartData);
        }
      } catch (error) {
        console.error("Failed to fetch status breakdown:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchStatusBreakdown();
  }, []);

  return (
    <div className="bg-white rounded-lg border border-gray-100 p-5 shadow-sm dark:bg-zinc-900 dark:border-zinc-800 card-hover-glow">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Orders by Status</h3>
          <p className="mt-0.5 text-xs text-gray-400 dark:text-zinc-500">Current breakdown</p>
        </div>
        {statusData.length > 0 && (
          <div className="flex items-center gap-1">
            <ChartExportButton targetRef={chartRef} filename="orders-by-status" />
            <ChartToggle
              views={views}
              activeView={activeView}
              onViewChange={setActiveView}
              storageKey="orders-by-status"
            />
          </div>
        )}
      </div>
      {isLoading ? (
        <div className="h-[180px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#FF8C1A]" />
        </div>
      ) : statusData.length > 0 ? (
        <div ref={chartRef}>
          <AnimatedChartContainer viewKey={activeView}>
            {activeView === "donut" ? (
              <OrdersByStatusChart data={statusData} />
            ) : (
              <OrdersByStatusBarChart data={statusData} />
            )}
          </AnimatedChartContainer>
        </div>
      ) : (
        <div className="h-[180px] flex items-center justify-center text-xs text-gray-500 dark:text-zinc-400">
          No order status data available
        </div>
      )}
    </div>
  );
}
