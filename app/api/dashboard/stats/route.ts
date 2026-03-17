import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import * as api from "@/lib/api";

/**
 * GET /api/dashboard/stats?period=7d|30d|90d|custom&from=ISO&to=ISO
 * Returns aggregated statistics for dashboard stats cards
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return api.unauthorized();
    }

    const organizationId = session.user.organizationId;
    const projectId = session.user.projectId;

    // Parse period from query params
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "30d";
    const customFrom = searchParams.get("from");
    const customTo = searchParams.get("to");

    // Calculate date range
    const now = new Date();
    const to = period === "custom" && customTo ? new Date(customTo) : now;
    let from: Date;
    let periodDays: number;

    switch (period) {
      case "7d":
        periodDays = 7;
        break;
      case "90d":
        periodDays = 90;
        break;
      case "all":
        periodDays = 365 * 5; // 5 years back for "all time"
        break;
      case "custom":
        from = customFrom ? new Date(customFrom) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        periodDays = Math.ceil((to.getTime() - from!.getTime()) / (24 * 60 * 60 * 1000));
        break;
      default:
        periodDays = 30;
        break;
    }
    if (period !== "custom") {
      from = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);
    }

    // Run all DB queries in parallel
    const previousFrom = new Date(from!.getTime() - periodDays * 24 * 60 * 60 * 1000);

    const [orders, previousPeriodOrders, previousCompletedOrders, previousCompletedWithDates] = await Promise.all([
      prisma.order.findMany({
        where: {
          organizationId, ...(projectId ? { projectId } : {}),
          orderDate: { gte: from!, lte: to },
        },
      }),
      prisma.order.count({
        where: {
          organizationId, ...(projectId ? { projectId } : {}),
          orderDate: { gte: previousFrom, lt: from! },
        },
      }),
      prisma.order.count({
        where: {
          organizationId, ...(projectId ? { projectId } : {}),
          status: "COMPLETED",
          actualDate: { gte: previousFrom, lt: from! },
        },
      }),
      prisma.order.findMany({
        where: {
          organizationId, ...(projectId ? { projectId } : {}),
          status: "COMPLETED",
          actualDate: { gte: previousFrom, lt: from!, not: null },
        },
        select: { actualDate: true, expectedDate: true, orderDate: true },
      }),
    ]);

    // Calculate statistics
    const totalOrders = orders.length;

    // In Progress = only orders currently in production
    const activeOrders = orders.filter((order) =>
      order.status === "IN_PROGRESS"
    ).length;

    const completedOrders = orders.filter((order) =>
      order.status === "COMPLETED"
    ).length;

    // On-time rate: completed orders where actualDate <= expectedDate
    const completedWithDates = orders.filter(
      (o) => o.status === "COMPLETED" && o.actualDate && o.expectedDate
    );
    const onTimeCount = completedWithDates.filter(
      (o) => new Date(o.actualDate!).getTime() <= new Date(o.expectedDate).getTime()
    ).length;
    const onTimeRate = completedWithDates.length > 0
      ? Math.round((onTimeCount / completedWithDates.length) * 100)
      : 0;

    // Previous period on-time rate for trend
    const prevOnTimeCount = previousCompletedWithDates.filter(
      (o) => o.actualDate && o.expectedDate && new Date(o.actualDate).getTime() <= new Date(o.expectedDate).getTime()
    ).length;
    const prevOnTimeRate = previousCompletedWithDates.length > 0
      ? Math.round((prevOnTimeCount / previousCompletedWithDates.length) * 100)
      : 0;

    // Avg lead time: days from orderDate to actualDate for completed orders
    const completedWithLeadTime = orders.filter(
      (o) => o.status === "COMPLETED" && o.actualDate && o.orderDate
    );
    const avgLeadTimeDays = completedWithLeadTime.length > 0
      ? +(completedWithLeadTime.reduce((sum, o) => {
          const days = (new Date(o.actualDate!).getTime() - new Date(o.orderDate).getTime()) / (1000 * 60 * 60 * 24);
          return sum + days;
        }, 0) / completedWithLeadTime.length).toFixed(1)
      : 0;

    // Previous period avg lead time for trend
    const prevLeadTimeOrders = previousCompletedWithDates.filter((o) => o.actualDate && o.orderDate);
    const prevAvgLeadTime = prevLeadTimeOrders.length > 0
      ? +(prevLeadTimeOrders.reduce((sum, o) => {
          const days = (new Date(o.actualDate!).getTime() - new Date(o.orderDate!).getTime()) / (1000 * 60 * 60 * 24);
          return sum + days;
        }, 0) / prevLeadTimeOrders.length).toFixed(1)
      : 0;

    // Trends
    const recentOrders = orders.length;

    const ordersTrend = previousPeriodOrders > 0
      ? Math.round(((recentOrders - previousPeriodOrders) / previousPeriodOrders) * 100)
      : recentOrders > 0 ? 100 : 0;

    const recentCompletedOrders = orders.filter((order) =>
      order.status === "COMPLETED" &&
      order.actualDate &&
      new Date(order.actualDate) >= from!
    ).length;

    const completionTrend = previousCompletedOrders > 0
      ? Math.round(((recentCompletedOrders - previousCompletedOrders) / previousCompletedOrders) * 100)
      : recentCompletedOrders > 0 ? 100 : 0;

    const onTimeRateTrend = prevOnTimeRate > 0
      ? onTimeRate - prevOnTimeRate
      : onTimeRate > 0 ? onTimeRate : 0;

    const leadTimeTrend = prevAvgLeadTime > 0
      ? Math.round(((avgLeadTimeDays - prevAvgLeadTime) / prevAvgLeadTime) * 100)
      : 0;

    // Generate sparkline data: split the period into 7 buckets
    const bucketCount = 7;
    const bucketMs = (to.getTime() - from!.getTime()) / bucketCount;

    const totalSparkline: number[] = Array(bucketCount).fill(0);
    const activeSparkline: number[] = Array(bucketCount).fill(0);
    const completedSparkline: number[] = Array(bucketCount).fill(0);

    for (const order of orders) {
      const orderTime = new Date(order.orderDate).getTime();
      const bucket = Math.min(
        Math.floor((orderTime - from!.getTime()) / bucketMs),
        bucketCount - 1
      );
      if (bucket >= 0) {
        totalSparkline[bucket]++;
        if (order.status === "IN_PROGRESS") activeSparkline[bucket]++;
        if (order.status === "COMPLETED") completedSparkline[bucket]++;
      }
    }

    const stats = {
      totalOrders,
      activeOrders,
      completedOrders,
      onTimeRate,
      avgLeadTimeDays,
      trends: {
        orders: ordersTrend,
        completion: completionTrend,
        onTimeRate: onTimeRateTrend,
        leadTime: leadTimeTrend,
      },
      sparklines: {
        total: totalSparkline,
        active: activeSparkline,
        completed: completedSparkline,
      },
      period: {
        from: from!.toISOString(),
        to: to.toISOString(),
      },
    };

    return api.success(stats);
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return api.error("Failed to fetch dashboard statistics");
  }
}
