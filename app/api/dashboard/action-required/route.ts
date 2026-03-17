import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import * as api from "@/lib/api";

/**
 * GET /api/dashboard/action-required
 * Returns orders needing client attention: disrupted, delayed, behind schedule,
 * and AT_RISK (computed indicator for IN_PROGRESS orders without stage dates
 * where progress is significantly behind time elapsed).
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return api.unauthorized();
    }

    const organizationId = session.user.organizationId;
    const projectId = session.user.projectId;

    const now = new Date();

    // Fetch problem orders: DISRUPTED, DELAYED, BEHIND_SCHEDULE
    const problemOrders = await prisma.order.findMany({
      where: {
        organizationId,
        ...(projectId ? { projectId } : {}),
        status: { in: ["DISRUPTED", "DELAYED", "BEHIND_SCHEDULE"] },
      },
      include: {
        factory: { select: { name: true } },
        stages: {
          select: {
            status: true,
            expectedEndDate: true,
            expectedStartDate: true,
          },
          orderBy: { sequence: "asc" },
        },
      },
      orderBy: { expectedDate: "asc" },
      take: 10,
    });

    // Fetch IN_PROGRESS orders to check for AT_RISK
    const inProgressOrders = await prisma.order.findMany({
      where: {
        organizationId,
        ...(projectId ? { projectId } : {}),
        status: "IN_PROGRESS",
      },
      include: {
        factory: { select: { name: true } },
        stages: {
          select: {
            status: true,
            expectedEndDate: true,
            expectedStartDate: true,
          },
          orderBy: { sequence: "asc" },
        },
      },
      orderBy: { expectedDate: "asc" },
    });

    type ActionItem = {
      id: string;
      orderNumber: string;
      productName: string;
      factoryName: string;
      status: string;
      severity: "critical" | "warning" | "attention";
      reason: string;
      expectedDate: string;
      overallProgress: number;
      daysRemaining: number;
    };

    const items: ActionItem[] = [];

    // Add problem orders
    for (const order of problemOrders) {
      const daysRemaining = Math.ceil(
        (order.expectedDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      let severity: "critical" | "warning" | "attention";
      let reason: string;

      if (order.status === "DISRUPTED") {
        severity = "critical";
        const blockedCount = order.stages.filter(s => s.status === "BLOCKED").length;
        reason = `${blockedCount} stage${blockedCount !== 1 ? "s" : ""} blocked`;
      } else if (order.status === "DELAYED") {
        severity = daysRemaining < 0 ? "critical" : "warning";
        const delayedCount = order.stages.filter(s => s.status === "DELAYED").length;
        reason = daysRemaining < 0
          ? `Overdue by ${Math.abs(daysRemaining)} days`
          : `${delayedCount} stage${delayedCount !== 1 ? "s" : ""} delayed`;
      } else {
        // BEHIND_SCHEDULE
        severity = "warning";
        const behindCount = order.stages.filter(s => s.status === "BEHIND_SCHEDULE").length;
        reason = behindCount > 0
          ? `${behindCount} stage${behindCount !== 1 ? "s" : ""} behind schedule`
          : "Projected to finish late";
      }

      items.push({
        id: order.id,
        orderNumber: order.orderNumber,
        productName: order.productName,
        factoryName: order.factory.name,
        status: order.status,
        severity,
        reason,
        expectedDate: order.expectedDate.toISOString(),
        overallProgress: order.overallProgress,
        daysRemaining,
      });
    }

    // Check IN_PROGRESS orders for AT_RISK (computed indicator)
    for (const order of inProgressOrders) {
      const hasExpectedDates = order.stages.some(s => s.expectedEndDate);
      if (hasExpectedDates) continue; // skip — stage timeline projection handles these

      const totalDuration = order.expectedDate.getTime() - order.orderDate.getTime();
      const elapsed = now.getTime() - order.orderDate.getTime();
      if (totalDuration <= 0) continue;

      const timeElapsedPct = (elapsed / totalDuration) * 100;
      const progressGap = timeElapsedPct - order.overallProgress;

      // AT_RISK if progress is 20+ percentage points behind time elapsed
      if (progressGap >= 20 && timeElapsedPct > 30) {
        const daysRemaining = Math.ceil(
          (order.expectedDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        items.push({
          id: order.id,
          orderNumber: order.orderNumber,
          productName: order.productName,
          factoryName: order.factory.name,
          status: "AT_RISK",
          severity: "attention",
          reason: `${order.overallProgress}% done, ${Math.round(timeElapsedPct)}% time elapsed`,
          expectedDate: order.expectedDate.toISOString(),
          overallProgress: order.overallProgress,
          daysRemaining,
        });
      }
    }

    // Sort: critical first, then warning, then attention
    const severityOrder = { critical: 0, warning: 1, attention: 2 };
    items.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    return api.success(items);
  } catch (error) {
    console.error("Action required error:", error);
    return api.error("Failed to fetch action required items");
  }
}
