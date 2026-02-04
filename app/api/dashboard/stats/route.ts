import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import * as api from "@/lib/api";

/**
 * GET /api/dashboard/stats
 * Returns aggregated statistics for dashboard stats cards
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return api.unauthorized();
    }

    const organizationId = session.user.organizationId;

    // Get all orders for the organization
    const orders = await prisma.order.findMany({
      where: { organizationId },
      include: {
        stages: true,
      },
    });

    // Calculate statistics
    const totalOrders = orders.length;

    // Active orders: PENDING, IN_PROGRESS, DELAYED, DISRUPTED
    const activeStatuses = ["PENDING", "IN_PROGRESS", "DELAYED", "DISRUPTED"];
    const activeOrders = orders.filter((order) =>
      activeStatuses.includes(order.status)
    ).length;

    // Completed orders
    const completedOrders = orders.filter((order) =>
      order.status === "COMPLETED"
    ).length;

    // Delayed orders (DELAYED status)
    const delayedOrders = orders.filter((order) =>
      order.status === "DELAYED"
    ).length;

    // Disrupted orders (DISRUPTED status)
    const disruptedOrders = orders.filter((order) =>
      order.status === "DISRUPTED"
    ).length;

    // Average progress across all orders
    const totalProgress = orders.reduce((sum, order) => sum + order.overallProgress, 0);
    const averageProgress = totalOrders > 0
      ? Math.round(totalProgress / totalOrders)
      : 0;

    // Calculate trend (compare with previous period)
    // For simplicity, we'll calculate based on orders created in last 30 days vs previous 30 days
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);
    const sixtyDaysAgo = new Date(now);
    sixtyDaysAgo.setDate(now.getDate() - 60);

    const recentOrders = orders.filter((order) =>
      new Date(order.orderDate) >= thirtyDaysAgo
    ).length;
    const previousPeriodOrders = orders.filter((order) =>
      new Date(order.orderDate) >= sixtyDaysAgo &&
      new Date(order.orderDate) < thirtyDaysAgo
    ).length;

    const ordersTrend = previousPeriodOrders > 0
      ? Math.round(((recentOrders - previousPeriodOrders) / previousPeriodOrders) * 100)
      : recentOrders > 0 ? 100 : 0;

    // Calculate completion rate trend
    const recentCompletedOrders = orders.filter((order) =>
      order.status === "COMPLETED" &&
      order.actualDate &&
      new Date(order.actualDate) >= thirtyDaysAgo
    ).length;
    const previousCompletedOrders = orders.filter((order) =>
      order.status === "COMPLETED" &&
      order.actualDate &&
      new Date(order.actualDate) >= sixtyDaysAgo &&
      new Date(order.actualDate) < thirtyDaysAgo
    ).length;

    const completionTrend = previousCompletedOrders > 0
      ? Math.round(((recentCompletedOrders - previousCompletedOrders) / previousCompletedOrders) * 100)
      : recentCompletedOrders > 0 ? 100 : 0;

    const stats = {
      totalOrders,
      activeOrders,
      completedOrders,
      delayedOrders,
      disruptedOrders,
      averageProgress,
      trends: {
        orders: ordersTrend,
        completion: completionTrend,
      },
    };

    return api.success(stats);
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return api.error("Failed to fetch dashboard statistics");
  }
}
