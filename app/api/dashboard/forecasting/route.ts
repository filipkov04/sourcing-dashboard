import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import * as api from "@/lib/api";

/**
 * GET /api/dashboard/forecasting
 * For active orders: estimate completion date based on actual stage completion
 * deltas vs planned dates. If a stage finishes 2 days late, the predicted
 * delivery shifts 2 days later. Cumulative across all completed stages.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return api.unauthorized();
    }

    const organizationId = session.user.organizationId;
    const projectId = session.user.projectId;

    // Get active orders with their stages
    const activeOrders = await prisma.order.findMany({
      where: {
        organizationId,
        ...(projectId ? { projectId } : {}),
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
        stages: {
          select: {
            sequence: true,
            status: true,
            expectedStartDate: true,
            expectedEndDate: true,
            startedAt: true,
            completedAt: true,
          },
          orderBy: { sequence: "asc" },
        },
      },
    });

    const now = new Date();

    const forecasts = activeOrders.map((order) => {
      const expectedDate = new Date(order.expectedDate);
      let cumulativeDeltaDays = 0;
      let hasStageData = false;

      for (const stage of order.stages) {
        if (stage.status === "SKIPPED") continue;

        if (
          stage.status === "COMPLETED" &&
          stage.completedAt &&
          stage.expectedEndDate
        ) {
          // Completed stage: delta = actual end - planned end
          const delta =
            (new Date(stage.completedAt).getTime() -
              new Date(stage.expectedEndDate).getTime()) /
            (1000 * 60 * 60 * 24);
          cumulativeDeltaDays += delta;
          hasStageData = true;
        } else if (
          stage.status === "IN_PROGRESS" &&
          stage.startedAt &&
          stage.expectedStartDate
        ) {
          // In-progress stage: check if it started late/early
          const startDelta =
            (new Date(stage.startedAt).getTime() -
              new Date(stage.expectedStartDate).getTime()) /
            (1000 * 60 * 60 * 24);
          cumulativeDeltaDays += startDelta;
          hasStageData = true;
        } else if (
          stage.status === "NOT_STARTED" &&
          stage.expectedStartDate &&
          new Date(stage.expectedStartDate) < now
        ) {
          // Should have started but hasn't — count delay from expected start
          const overdueDays =
            (now.getTime() - new Date(stage.expectedStartDate).getTime()) /
            (1000 * 60 * 60 * 24);
          cumulativeDeltaDays += overdueDays;
          hasStageData = true;
          // Only count the first overdue not-started stage
          break;
        }
      }

      // Round to nearest day
      cumulativeDeltaDays = Math.round(cumulativeDeltaDays);

      let predictedCompletionDate: Date;
      let method: string;

      if (hasStageData) {
        // Shift expected date by cumulative stage delta
        predictedCompletionDate = new Date(
          expectedDate.getTime() + cumulativeDeltaDays * 24 * 60 * 60 * 1000
        );
        method = "stage-delta";
      } else {
        // No stage date data — use the original expected date as-is
        predictedCompletionDate = new Date(expectedDate);
        method = "planned";
      }

      const daysUntilExpected = Math.ceil(
        (expectedDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      const predictedDaysLate = Math.ceil(
        (predictedCompletionDate.getTime() - expectedDate.getTime()) /
          (1000 * 60 * 60 * 24)
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
          ? Math.max(
              1,
              Math.ceil(
                (now.getTime() - expectedDate.getTime()) /
                  (1000 * 60 * 60 * 24)
              )
            )
          : Math.max(0, predictedDaysLate),
        daysUntilExpected,
        deltaDays: cumulativeDeltaDays,
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
