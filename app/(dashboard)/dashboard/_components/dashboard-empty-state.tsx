"use client";

import Link from "next/link";
import { Package, TrendingUp, Bell, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function DashboardEmptyState() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-16">
        <div className="mb-6 rounded-full bg-blue-50 p-6 dark:bg-blue-950">
          <Package className="h-12 w-12 text-blue-600" />
        </div>

        <h2 className="mb-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          No orders yet
        </h2>

        <p className="mb-8 max-w-md text-center text-zinc-600 dark:text-zinc-400">
          Get started by creating your first order. Track production progress,
          monitor deadlines, and manage your supply chain all in one place.
        </p>

        <div className="flex gap-4">
          <Link
            href="/orders/new"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Package className="h-4 w-4" />
            Create First Order
          </Link>

          <Link
            href="/factories/new"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Add Factory
          </Link>
        </div>

        <div className="mt-12 grid w-full max-w-3xl gap-6 md:grid-cols-3">
          <div className="text-center">
            <TrendingUp className="mx-auto mb-3 h-8 w-8 text-blue-600" />
            <h3 className="mb-1 font-medium">Track Progress</h3>
            <p className="text-sm text-zinc-500">Monitor order status in real-time</p>
          </div>
          <div className="text-center">
            <Bell className="mx-auto mb-3 h-8 w-8 text-blue-600" />
            <h3 className="mb-1 font-medium">Get Alerts</h3>
            <p className="text-sm text-zinc-500">Notifications for delays and updates</p>
          </div>
          <div className="text-center">
            <FileText className="mx-auto mb-3 h-8 w-8 text-blue-600" />
            <h3 className="mb-1 font-medium">Generate Reports</h3>
            <p className="text-sm text-zinc-500">Insights and analytics on demand</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
