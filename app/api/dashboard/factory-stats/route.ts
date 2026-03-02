import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import * as api from "@/lib/api";

/**
 * GET /api/dashboard/factory-stats
 * Returns factory-specific statistics for dashboard
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return api.unauthorized();
    }

    const organizationId = session.user.organizationId;

    // Parse period filter
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "all";
    const orderWhere: any = {};

    if (period !== "all") {
      const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;
      orderWhere.orderDate = { gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) };
    }

    // Get all factories with their orders
    const factories = await prisma.factory.findMany({
      where: { organizationId },
      include: {
        orders: {
          where: orderWhere,
          select: {
            id: true,
            status: true,
            overallProgress: true,
            expectedDate: true,
            actualDate: true,
            orderDate: true,
          },
        },
      },
    });

    // Calculate statistics for each factory
    const factoryStats = factories.map((factory) => {
      const orders = factory.orders;
      const totalOrders = orders.length;

      // Active orders
      const activeStatuses = ["PENDING", "IN_PROGRESS", "DELAYED", "DISRUPTED"];
      const activeOrders = orders.filter((order) =>
        activeStatuses.includes(order.status)
      ).length;

      // Completed orders
      const completedOrders = orders.filter(
        (order) => order.status === "COMPLETED"
      ).length;

      // Delayed orders
      const delayedOrders = orders.filter(
        (order) => order.status === "DELAYED"
      ).length;

      // Disrupted orders
      const disruptedOrders = orders.filter(
        (order) => order.status === "DISRUPTED"
      ).length;

      // Average progress
      const totalProgress = orders.reduce(
        (sum, order) => sum + order.overallProgress,
        0
      );
      const averageProgress =
        totalOrders > 0 ? Math.round(totalProgress / totalOrders) : 0;

      // On-time delivery rate (completed orders that finished before or on expected date)
      const completedWithDates = orders.filter(
        (order) => order.status === "COMPLETED" && order.actualDate && order.expectedDate
      );
      const onTimeOrders = completedWithDates.filter(
        (order) =>
          order.actualDate &&
          order.expectedDate &&
          new Date(order.actualDate) <= new Date(order.expectedDate)
      ).length;
      const onTimeRate =
        completedWithDates.length > 0
          ? Math.round((onTimeOrders / completedWithDates.length) * 100)
          : 0;

      // Completion rate (completed vs total)
      const completionRate =
        totalOrders > 0
          ? Math.round((completedOrders / totalOrders) * 100)
          : 0;

      // Issue rate (delayed + disrupted vs total)
      const issueOrders = delayedOrders + disruptedOrders;
      const issueRate =
        totalOrders > 0 ? Math.round((issueOrders / totalOrders) * 100) : 0;

      return {
        id: factory.id,
        name: factory.name,
        location: factory.location,
        totalOrders,
        activeOrders,
        completedOrders,
        delayedOrders,
        disruptedOrders,
        averageProgress,
        onTimeRate,
        completionRate,
        issueRate,
      };
    });

    // Sort by total orders (most active factories first)
    factoryStats.sort((a, b) => b.totalOrders - a.totalOrders);

    // Calculate aggregate statistics
    const totalFactories = factories.length;
    const totalOrdersAllFactories = factoryStats.reduce(
      (sum, f) => sum + f.totalOrders,
      0
    );
    const averageOrdersPerFactory =
      totalFactories > 0
        ? Math.round(totalOrdersAllFactories / totalFactories)
        : 0;

    // Find top performers (highest on-time rate with at least 3 completed orders)
    const topPerformers = factoryStats
      .filter((f) => f.completedOrders >= 3)
      .sort((a, b) => b.onTimeRate - a.onTimeRate)
      .slice(0, 5);

    // Find factories needing attention (highest issue rate with active orders)
    const needsAttention = factoryStats
      .filter((f) => f.activeOrders > 0)
      .sort((a, b) => b.issueRate - a.issueRate)
      .slice(0, 5);

    // Most utilized factories (most active orders)
    const mostUtilized = factoryStats
      .filter((f) => f.activeOrders > 0)
      .sort((a, b) => b.activeOrders - a.activeOrders)
      .slice(0, 5);

    // Least utilized factories (fewest total orders or no active orders)
    const leastUtilized = factoryStats
      .filter((f) => f.activeOrders === 0)
      .sort((a, b) => a.totalOrders - b.totalOrders)
      .slice(0, 5);

    const stats = {
      summary: {
        totalFactories,
        totalOrders: totalOrdersAllFactories,
        averageOrdersPerFactory,
      },
      factories: factoryStats,
      insights: {
        topPerformers,
        needsAttention,
        mostUtilized,
        leastUtilized,
      },
    };

    return api.success(stats);
  } catch (error) {
    console.error("Dashboard factory stats error:", error);
    return api.error("Failed to fetch factory statistics");
  }
}
