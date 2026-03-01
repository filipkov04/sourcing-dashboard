"use client";

import Link from "next/link";
import { Package, TrendingUp, Bell, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function DashboardEmptyState() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-16">
        <div className="mb-6 rounded-full bg-[#FF4D15]/10 dark:bg-[#FF4D15]/10 p-6">
          <Package className="h-12 w-12 text-[#FF4D15]" />
        </div>

        <h2 className="mb-2 text-2xl font-semibold text-gray-900 dark:text-white">
          No orders yet
        </h2>

        <p className="mb-8 max-w-md text-center text-gray-500 dark:text-zinc-400">
          Get started by creating your first order. Track production progress,
          monitor deadlines, and manage your supply chain all in one place.
        </p>

        <div className="flex gap-4">
          <Link
            href="/orders/new"
            className="inline-flex items-center gap-2 rounded-lg bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200 px-4 py-2 text-sm font-semibold text-white"
          >
            <Package className="h-4 w-4" />
            Create First Order
          </Link>

          <Link
            href="/factories/new"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 px-4 py-2 text-sm font-semibold"
          >
            Add Factory
          </Link>
        </div>

        <div className="mt-12 grid w-full max-w-3xl gap-6 md:grid-cols-3">
          <div className="text-center">
            <TrendingUp className="mx-auto mb-3 h-8 w-8 text-[#FF4D15]" />
            <h3 className="mb-1 font-medium text-gray-800 dark:text-zinc-200">Track Progress</h3>
            <p className="text-sm text-gray-500 dark:text-zinc-400">Monitor order status in real-time</p>
          </div>
          <div className="text-center">
            <Bell className="mx-auto mb-3 h-8 w-8 text-[#FF4D15]" />
            <h3 className="mb-1 font-medium text-gray-800 dark:text-zinc-200">Get Alerts</h3>
            <p className="text-sm text-gray-500 dark:text-zinc-400">Notifications for delays and updates</p>
          </div>
          <div className="text-center">
            <FileText className="mx-auto mb-3 h-8 w-8 text-[#FF4D15]" />
            <h3 className="mb-1 font-medium text-gray-800 dark:text-zinc-200">Generate Reports</h3>
            <p className="text-sm text-gray-500 dark:text-zinc-400">Insights and analytics on demand</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
