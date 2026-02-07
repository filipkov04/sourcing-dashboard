"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, AlertTriangle } from "lucide-react";
import Link from "next/link";

interface FactoryStat {
  id: string;
  name: string;
  location: string;
  totalOrders: number;
  activeOrders: number;
  completedOrders: number;
  delayedOrders: number;
  disruptedOrders: number;
  averageProgress: number;
  onTimeRate: number;
  completionRate: number;
  issueRate: number;
}

interface FactoryStats {
  summary: {
    totalFactories: number;
    totalOrders: number;
    averageOrdersPerFactory: number;
  };
  factories: FactoryStat[];
  insights: {
    topPerformers: FactoryStat[];
    needsAttention: FactoryStat[];
    mostUtilized: FactoryStat[];
    leastUtilized: FactoryStat[];
  };
}

export function FactoryPerformanceSection() {
  const [stats, setStats] = useState<FactoryStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch("/api/dashboard/factory-stats");
        const result = await response.json();

        if (result.success) {
          setStats(result.data);
        }
      } catch (error) {
        console.error("Failed to fetch factory stats:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="bg-white dark:bg-zinc-900 border-gray-100 dark:border-zinc-800">
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-zinc-900 border-gray-100 dark:border-zinc-800">
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Insights Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Performers */}
        <Card className="bg-white dark:bg-zinc-900 border-gray-100 dark:border-zinc-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-800 dark:text-gray-100">
              <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
              Top Performers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.insights.topPerformers.length === 0 ? (
              <p className="text-sm text-gray-600 dark:text-zinc-400">
                No data available yet
              </p>
            ) : (
              <div className="space-y-3">
                {stats.insights.topPerformers.map((factory) => (
                  <Link
                    key={factory.id}
                    href={`/factories/${factory.id}`}
                    className="block p-3 rounded-lg border border-gray-100 dark:border-zinc-800 hover:bg-gray-50/50 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-800 dark:text-gray-100">
                          {factory.name}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-zinc-400">
                          {factory.location}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800"
                      >
                        {factory.onTimeRate}% on-time
                      </Badge>
                    </div>
                    <div className="mt-2 flex gap-3 text-xs text-gray-600 dark:text-zinc-400">
                      <span>{factory.totalOrders} orders</span>
                      <span>•</span>
                      <span>{factory.completedOrders} completed</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Needs Attention */}
        <Card className="bg-white dark:bg-zinc-900 border-gray-100 dark:border-zinc-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-800 dark:text-gray-100">
              <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              Needs Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.insights.needsAttention.length === 0 ? (
              <p className="text-sm text-gray-600 dark:text-zinc-400">
                All factories performing well!
              </p>
            ) : (
              <div className="space-y-3">
                {stats.insights.needsAttention.map((factory) => (
                  <Link
                    key={factory.id}
                    href={`/factories/${factory.id}`}
                    className="block p-3 rounded-lg border border-gray-100 dark:border-zinc-800 hover:bg-gray-50/50 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-800 dark:text-gray-100">
                          {factory.name}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-zinc-400">
                          {factory.location}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className="bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800"
                      >
                        {factory.issueRate}% issues
                      </Badge>
                    </div>
                    <div className="mt-2 flex gap-3 text-xs text-gray-600 dark:text-zinc-400">
                      <span>{factory.delayedOrders} delayed</span>
                      <span>•</span>
                      <span>{factory.disruptedOrders} disrupted</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
