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

    // Get orders filtered by period
    const orders = await prisma.order.findMany({
      where: {
        organizationId,
        orderDate: { gte: from!, lte: to },
      },
    });

    // Calculate statistics
    const totalOrders = orders.length;

    const activeStatuses = ["PENDING", "IN_PROGRESS", "DELAYED", "DISRUPTED"];
    const activeOrders = orders.filter((order) =>
      activeStatuses.includes(order.status)
    ).length;

    const completedOrders = orders.filter((order) =>
      order.status === "COMPLETED"
    ).length;

    const delayedOrdersList = orders.filter((order) =>
      order.status === "DELAYED"
    );

    const disruptedOrders = orders.filter((order) =>
      order.status === "DISRUPTED"
    ).length;

    // Calculate delay details
    const delayDetail = {
      count: delayedOrdersList.length,
      avgDelayDays: 0,
      maxDelayDays: 0,
      avgOriginalDays: 0,
    };

    if (delayedOrdersList.length > 0) {
      const delays = delayedOrdersList.map((o) => {
        const delayMs = now.getTime() - new Date(o.expectedDate).getTime();
        const delayDays = Math.max(0, delayMs / (1000 * 60 * 60 * 24));
        const originalMs = new Date(o.expectedDate).getTime() - new Date(o.orderDate).getTime();
        const originalDays = originalMs / (1000 * 60 * 60 * 24);
        return { delayDays, originalDays };
      });
      delayDetail.avgDelayDays = +(delays.reduce((s, d) => s + d.delayDays, 0) / delays.length).toFixed(1);
      delayDetail.maxDelayDays = +(Math.max(...delays.map((d) => d.delayDays))).toFixed(1);
      delayDetail.avgOriginalDays = +(delays.reduce((s, d) => s + d.originalDays, 0) / delays.length).toFixed(1);
    }

    // Trends: compare selected period vs previous equivalent period
    const previousFrom = new Date(from!.getTime() - periodDays * 24 * 60 * 60 * 1000);

    const recentOrders = orders.length;

    // Get previous period orders for trend comparison
    const previousPeriodOrders = await prisma.order.count({
      where: {
        organizationId,
        orderDate: { gte: previousFrom, lt: from! },
      },
    });

    const ordersTrend = previousPeriodOrders > 0
      ? Math.round(((recentOrders - previousPeriodOrders) / previousPeriodOrders) * 100)
      : recentOrders > 0 ? 100 : 0;

    // Completion rate trend
    const recentCompletedOrders = orders.filter((order) =>
      order.status === "COMPLETED" &&
      order.actualDate &&
      new Date(order.actualDate) >= from!
    ).length;

    const previousCompletedOrders = await prisma.order.count({
      where: {
        organizationId,
        status: "COMPLETED",
        actualDate: { gte: previousFrom, lt: from! },
      },
    });

    const completionTrend = previousCompletedOrders > 0
      ? Math.round(((recentCompletedOrders - previousCompletedOrders) / previousCompletedOrders) * 100)
      : recentCompletedOrders > 0 ? 100 : 0;

    const stats = {
      totalOrders,
      activeOrders,
      completedOrders,
      delayedOrders: delayedOrdersList.length,
      disruptedOrders,
      delayDetail,
      trends: {
        orders: ordersTrend,
        completion: completionTrend,
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
