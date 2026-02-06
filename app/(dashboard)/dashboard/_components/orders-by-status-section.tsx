"use client";

import { useEffect, useState } from "react";
import { OrdersByStatusChart } from "./orders-by-status-chart";
import type { OrdersByStatusData } from "@/lib/types";

export function OrdersByStatusSection() {
  const [statusData, setStatusData] = useState<OrdersByStatusData>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStatusBreakdown() {
      try {
        const response = await fetch("/api/dashboard/status-breakdown");
        const data = await response.json();
        if (data.success) {
          // Transform API data to match chart format
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
    <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
      <div className="mb-6">
        <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100">Orders by Status</h3>
        <p className="mt-1 text-sm text-gray-400 dark:text-zinc-500">Current breakdown</p>
      </div>
      {isLoading ? (
        <div className="h-[240px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#EB5D2E]" />
        </div>
      ) : statusData.length > 0 ? (
        <OrdersByStatusChart data={statusData} />
      ) : (
        <div className="h-[240px] flex items-center justify-center text-gray-500 dark:text-zinc-400">
          No order status data available
        </div>
      )}
    </div>
  );
}
