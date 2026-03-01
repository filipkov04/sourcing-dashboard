"use client";

import { useEffect, useState, useRef } from "react";
import { AreaChart as AreaChartIcon, BarChart3, LineChart as LineChartIcon } from "lucide-react";
import { OrdersTrendChart, type OrderTrendData } from "./orders-trend-chart";
import { OrdersTrendBarChart } from "./orders-trend-bar-chart";
import { OrdersTrendLineChart } from "./orders-trend-line-chart";
import { ChartToggle, type ChartView } from "@/components/chart-toggle";
import { ChartExportButton } from "@/components/chart-export-button";
import { AnimatedChartContainer } from "@/components/animated-chart-container";

const views: ChartView[] = [
  { id: "area", icon: AreaChartIcon, label: "Stacked area" },
  { id: "bar", icon: BarChart3, label: "Stacked bar" },
  { id: "line", icon: LineChartIcon, label: "Line chart" },
];

export function OrdersTrendSection() {
  const [trendData, setTrendData] = useState<OrderTrendData>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeView, setActiveView] = useState("area");
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchTrends() {
      try {
        const response = await fetch("/api/dashboard/trends");
        const data = await response.json();
        if (data.success) {
          const chartData = data.data.map((item: any) => ({
            date: item.week,
            pending: item.Pending,
            inProgress: item["In Progress"],
            completed: item.Completed,
            delayed: item.Delayed,
            disrupted: item.Disrupted,
          }));
          setTrendData(chartData);
        }
      } catch (error) {
        console.error("Failed to fetch trends:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchTrends();
  }, []);

  return (
    <div className="bg-white rounded-lg border border-gray-100 p-8 shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100">Orders over time</h3>
          <p className="mt-1 text-sm text-gray-400 dark:text-zinc-500">Last 12 weeks</p>
        </div>
        {trendData.length > 0 && (
          <div className="flex items-center gap-1">
            <ChartExportButton targetRef={chartRef} filename="orders-trend" />
            <ChartToggle
              views={views}
              activeView={activeView}
              onViewChange={setActiveView}
              storageKey="orders-trend"
            />
          </div>
        )}
      </div>
      {isLoading ? (
        <div className="h-[300px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF8C1A]" />
        </div>
      ) : trendData.length > 0 ? (
        <div ref={chartRef}>
        <AnimatedChartContainer viewKey={activeView}>
          {activeView === "area" ? (
            <OrdersTrendChart data={trendData} />
          ) : activeView === "bar" ? (
            <OrdersTrendBarChart data={trendData} />
          ) : (
            <OrdersTrendLineChart data={trendData} />
          )}
        </AnimatedChartContainer>
        </div>
      ) : (
        <div className="h-[300px] flex items-center justify-center text-gray-500 dark:text-zinc-400">
          No order data available
        </div>
      )}
    </div>
  );
}
