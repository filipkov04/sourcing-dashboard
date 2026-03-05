import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import * as api from "@/lib/api";

/**
 * GET /api/dashboard/forecasting
 * For active orders: estimate completion date using historical avg daily progress
 * at the same factory. Flag at-risk orders where predicted date exceeds expected date.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return api.unauthorized();
    }

    const organizationId = session.user.organizationId;
    const projectId = session.user.projectId;

    // Get historical completed orders to compute avg daily progress per factory
    const completedOrders = await prisma.order.findMany({
      where: {
        organizationId, ...(projectId ? { projectId } : {}),
        status: { in: ["COMPLETED", "SHIPPED", "DELIVERED"] },
        actualDate: { not: null },
      },
      select: {
        factoryId: true,
        orderDate: true,
        actualDate: true,
      },
    });

    // Compute avg days to complete per factory
    const factoryAvgDays = new Map<string, number>();
    const factoryTotals = new Map<string, { totalDays: number; count: number }>();

    for (const order of completedOrders) {
      const days = Math.ceil(
        (new Date(order.actualDate!).getTime() - new Date(order.orderDate).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      const entry = factoryTotals.get(order.factoryId) || { totalDays: 0, count: 0 };
      entry.totalDays += days;
      entry.count += 1;
      factoryTotals.set(order.factoryId, entry);
    }

    for (const [factoryId, totals] of factoryTotals) {
      factoryAvgDays.set(factoryId, Math.round(totals.totalDays / totals.count));
    }

    // Global average as fallback
    const globalAvgDays = completedOrders.length > 0
      ? Math.round(
          completedOrders.reduce((sum, o) => {
            return sum + Math.ceil(
              (new Date(o.actualDate!).getTime() - new Date(o.orderDate).getTime()) /
                (1000 * 60 * 60 * 24)
            );
          }, 0) / completedOrders.length
        )
      : 30; // default fallback

    // Get active orders
    const activeOrders = await prisma.order.findMany({
      where: {
        organizationId, ...(projectId ? { projectId } : {}),
        status: { in: ["PENDING", "IN_PROGRESS", "DELAYED", "DISRUPTED"] },
      },
      select: {
        id: true,
        orderNumber: true,
        productName: true,
        status: true,
        overallProgress: true,
        orderDate: true,
        expectedDate: true,
        factoryId: true,
        factory: { select: { name: true } },
      },
    });

    const now = new Date();
    const forecasts = activeOrders.map((order) => {
      const progress = order.overallProgress;
      const daysElapsed = Math.ceil(
        (now.getTime() - new Date(order.orderDate).getTime()) / (1000 * 60 * 60 * 24)
      );

      let predictedCompletionDate: Date;
      let method: string;

      if (progress > 5 && daysElapsed > 0) {
        // Estimate based on current pace
        const dailyProgress = progress / daysElapsed;
        const remainingProgress = 100 - progress;
        const remainingDays = dailyProgress > 0 ? Math.ceil(remainingProgress / dailyProgress) : 999;
        predictedCompletionDate = new Date(now.getTime() + remainingDays * 24 * 60 * 60 * 1000);
        method = "pace";
      } else {
        // Use historical factory average
        const avgDays = factoryAvgDays.get(order.factoryId) || globalAvgDays;
        predictedCompletionDate = new Date(
          new Date(order.orderDate).getTime() + avgDays * 24 * 60 * 60 * 1000
        );
        method = "historical";
      }

      const expectedDate = new Date(order.expectedDate);
      const daysUntilExpected = Math.ceil(
        (expectedDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      const predictedDaysLate = Math.ceil(
        (predictedCompletionDate.getTime() - expectedDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      const isOverdue = expectedDate.getTime() < now.getTime();

      let risk: "on-track" | "at-risk" | "critical";
      if (isOverdue) {
        risk = predictedDaysLate > 7 ? "critical" : "at-risk";
      } else if (predictedDaysLate <= 0) {
        risk = "on-track";
      } else if (predictedDaysLate <= 7) {
        risk = "at-risk";
      } else {
        risk = "critical";
      }

      return {
        orderId: order.id,
        orderNumber: order.orderNumber,
        productName: order.productName,
        status: order.status,
        factoryName: order.factory.name,
        progress: order.overallProgress,
        expectedDate: order.expectedDate.toISOString(),
        predictedDate: predictedCompletionDate.toISOString(),
        predictedDaysLate: isOverdue
          ? Math.max(1, Math.ceil((now.getTime() - expectedDate.getTime()) / (1000 * 60 * 60 * 24)))
          : Math.max(0, predictedDaysLate),
        daysUntilExpected,
        risk,
        method,
      };
    });

    // Sort: critical first, then at-risk, then on-track
    const riskOrder = { critical: 0, "at-risk": 1, "on-track": 2 };
    forecasts.sort((a, b) => riskOrder[a.risk] - riskOrder[b.risk]);

    const summary = {
      total: forecasts.length,
      onTrack: forecasts.filter((f) => f.risk === "on-track").length,
      atRisk: forecasts.filter((f) => f.risk === "at-risk").length,
      critical: forecasts.filter((f) => f.risk === "critical").length,
    };

    return api.success({ summary, forecasts });
  } catch (error) {
    console.error("Forecasting analytics error:", error);
    return api.error("Failed to fetch forecasting data");
  }
}
