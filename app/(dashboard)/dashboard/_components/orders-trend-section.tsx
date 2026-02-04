"use client";

import { useEffect, useState } from "react";
import { OrdersTrendChart, type OrderTrendData } from "./orders-trend-chart";

export function OrdersTrendSection() {
  const [trendData, setTrendData] = useState<OrderTrendData>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchTrends() {
      try {
        const response = await fetch("/api/dashboard/trends");
        const data = await response.json();
        if (data.success) {
          // Transform API data to match chart format
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
    <div className="bg-white rounded-xl border border-gray-200 p-6 dark:bg-zinc-800 dark:border-zinc-700">
      <div className="mb-6">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">Orders over time</h3>
        <p className="mt-1 text-sm text-gray-600 dark:text-zinc-400">Last 12 weeks</p>
      </div>
      {isLoading ? (
        <div className="h-[300px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : trendData.length > 0 ? (
        <OrdersTrendChart data={trendData} />
      ) : (
        <div className="h-[300px] flex items-center justify-center text-gray-500 dark:text-zinc-400">
          No order data available
        </div>
      )}
    </div>
  );
}
