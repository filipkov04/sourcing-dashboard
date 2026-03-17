import { prisma } from "@/lib/db";
import { fireAlert } from "@/lib/alert-generator";
import { logOrderEvent } from "@/lib/history";
import { notifyOrderStatusChange } from "@/lib/notifications";

const DAY_MS = 1000 * 60 * 60 * 24;

/**
 * Calculate cumulative stage slippage for an order and project whether it
 * will finish late. Returns the number of days the order is projected to
 * be late (positive = late, zero or negative = on track).
 */
function projectCompletion(
  stages: Array<{
    status: string;
    expectedStartDate: Date | null;
    expectedEndDate: Date | null;
    startedAt: Date | null;
    completedAt: Date | null;
  }>,
  expectedDate: Date,
  now: Date,
): number {
  let cumulativeDeltaDays = 0;

  for (const stage of stages) {
    if (stage.status === "SKIPPED") continue;

    if (stage.status === "COMPLETED" && stage.completedAt && stage.expectedEndDate) {
      const delta =
        (stage.completedAt.getTime() - stage.expectedEndDate.getTime()) / DAY_MS;
      cumulativeDeltaDays += delta;
    } else if (stage.status === "IN_PROGRESS" || stage.status === "BEHIND_SCHEDULE") {
      // Late start or overrun past expected end
      if (stage.startedAt && stage.expectedStartDate) {
        const startDelta =
          (stage.startedAt.getTime() - stage.expectedStartDate.getTime()) / DAY_MS;
        if (startDelta > 0) cumulativeDeltaDays += startDelta;
      }
      if (stage.expectedEndDate && stage.expectedEndDate < now) {
        const endOverrun =
          (now.getTime() - stage.expectedEndDate.getTime()) / DAY_MS;
        cumulativeDeltaDays += endOverrun;
      }
    } else if (stage.status === "NOT_STARTED") {
      const overdueRef = stage.expectedStartDate ?? stage.expectedEndDate;
      if (overdueRef && overdueRef < now) {
        cumulativeDeltaDays += (now.getTime() - overdueRef.getTime()) / DAY_MS;
        break; // subsequent stages are blocked by this one
      }
    }
  }

  const predictedCompletion = new Date(
    expectedDate.getTime() + Math.ceil(cumulativeDeltaDays) * DAY_MS,
  );

  return Math.ceil(
    (predictedCompletion.getTime() - expectedDate.getTime()) / DAY_MS,
  );
}

/**
 * Check orders for overdue stages and auto-mark them as DELAYED.
 * Also checks projected completion to set BEHIND_SCHEDULE when cumulative
 * stage slippage predicts a late finish.
 * Updates both stage and order statuses, fires alerts/events/notifications.
 * Returns the IDs of orders whose status was changed.
 */
export async function checkAndUpdateDelays(orderIds: string[]): Promise<string[]> {
  if (orderIds.length === 0) return [];

  const now = new Date();
  const updatedOrderIds: string[] = [];

  const orders = await prisma.order.findMany({
    where: {
      id: { in: orderIds },
      status: { in: ["PENDING", "IN_PROGRESS", "BEHIND_SCHEDULE", "DELAYED"] },
    },
    include: {
      stages: true,
      factory: { select: { name: true } },
    },
  });

  for (const order of orders) {
    const changedStageIds: string[] = [];

    // Check each stage for overdue conditions
    for (const stage of order.stages) {
      // Skip stages already delayed, blocked, completed, or skipped
      if (["BEHIND_SCHEDULE", "DELAYED", "BLOCKED", "COMPLETED", "SKIPPED"].includes(stage.status)) {
        continue;
      }

      // NOT_STARTED past its start date → DELAYED (hasn't even begun)
      if (stage.status === "NOT_STARTED") {
        const overdueRef = stage.expectedStartDate ?? stage.expectedEndDate;
        if (overdueRef && overdueRef < now) {
          await prisma.orderStage.update({
            where: { id: stage.id },
            data: { status: "DELAYED", completedAt: null },
          });
          changedStageIds.push(stage.id);

          fireAlert({
            organizationId: order.organizationId,
            title: "Stage delayed",
            message: `Stage "${stage.name}" on order ${order.orderNumber} has not started and is past its expected start date.`,
            severity: "WARNING",
            orderId: order.id,
            factoryId: order.factoryId,
          });

          logOrderEvent(order.id, "STATUS_CHANGE", "status", stage.status, "DELAYED", stage.id, stage.name).catch(console.error);
        }
        continue;
      }

      // IN_PROGRESS past its expected end date → BEHIND_SCHEDULE (still progressing but late)
      if (
        stage.status === "IN_PROGRESS" &&
        stage.expectedEndDate &&
        stage.expectedEndDate < now
      ) {
        await prisma.orderStage.update({
          where: { id: stage.id },
          data: { status: "BEHIND_SCHEDULE" },
        });
        changedStageIds.push(stage.id);

        fireAlert({
          organizationId: order.organizationId,
          title: "Stage behind schedule",
          message: `Stage "${stage.name}" on order ${order.orderNumber} is past its expected end date but still in progress.`,
          severity: "WARNING",
          orderId: order.id,
          factoryId: order.factoryId,
        });

        logOrderEvent(order.id, "STATUS_CHANGE", "status", stage.status, "BEHIND_SCHEDULE", stage.id, stage.name).catch(console.error);
      }
    }

    // Re-fetch stages once if any changed, otherwise use the original set
    const allStages = changedStageIds.length > 0
      ? await prisma.orderStage.findMany({ where: { orderId: order.id }, orderBy: { sequence: "asc" } })
      : order.stages;

    // Track the current order status in memory to avoid re-querying
    let currentOrderStatus: string = order.status;

    // Propagate to order if any stages changed
    if (changedStageIds.length > 0) {
      const hasBlockedStage = allStages.some((s) => s.status === "BLOCKED");
      const hasDelayedStage = allStages.some((s) => s.status === "DELAYED");
      const hasBehindScheduleStage = allStages.some((s) => s.status === "BEHIND_SCHEDULE");
      const allCompleted = allStages.every(
        (s) => s.status === "COMPLETED" || s.status === "SKIPPED"
      );
      const anyInProgress = allStages.some((s) => s.status === "IN_PROGRESS" || s.status === "BEHIND_SCHEDULE");
      const allNotStarted = allStages.every((s) => s.status === "NOT_STARTED");
      const totalProgress = allStages.reduce((sum, s) => sum + s.progress, 0);
      const overallProgress = Math.round(totalProgress / allStages.length);

      let newOrderStatus: string | undefined;
      if (hasBlockedStage) {
        newOrderStatus = "DISRUPTED";
      } else if (hasDelayedStage) {
        newOrderStatus = "DELAYED";
      } else if (hasBehindScheduleStage) {
        newOrderStatus = "BEHIND_SCHEDULE";
      } else if (allCompleted) {
        newOrderStatus = "COMPLETED";
      } else if (allNotStarted && overallProgress === 0) {
        newOrderStatus = "PENDING";
      } else if (anyInProgress || overallProgress > 0) {
        newOrderStatus = "IN_PROGRESS";
      }

      if (newOrderStatus && newOrderStatus !== currentOrderStatus) {
        const isCompleted = ["COMPLETED", "SHIPPED", "DELIVERED"].includes(newOrderStatus);
        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: newOrderStatus as never,
            overallProgress,
            ...(!isCompleted && order.actualDate ? { actualDate: null } : {}),
          },
        });

        const oldStatus = currentOrderStatus;
        currentOrderStatus = newOrderStatus;
        updatedOrderIds.push(order.id);

        logOrderEvent(order.id, "STATUS_CHANGE", "status", oldStatus, newOrderStatus).catch(console.error);

        notifyOrderStatusChange({
          orderId: order.id,
          organizationId: order.organizationId,
          orderNumber: order.orderNumber,
          productName: order.productName,
          oldStatus,
          newStatus: newOrderStatus,
          factoryName: order.factory?.name,
        }).catch(console.error);
      }
    }

    // Check order-level deadline independently
    if (
      order.expectedDate < now &&
      (currentOrderStatus === "PENDING" || currentOrderStatus === "IN_PROGRESS" || currentOrderStatus === "BEHIND_SCHEDULE")
    ) {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "DELAYED" },
      });

      const oldStatus = currentOrderStatus;
      currentOrderStatus = "DELAYED";
      if (!updatedOrderIds.includes(order.id)) {
        updatedOrderIds.push(order.id);
      }

      fireAlert({
        organizationId: order.organizationId,
        title: "Order delayed",
        message: `Order ${order.orderNumber} has passed its expected delivery date and has been automatically marked as delayed.`,
        severity: "ERROR",
        orderId: order.id,
        factoryId: order.factoryId,
      });

      logOrderEvent(order.id, "STATUS_CHANGE", "status", oldStatus, "DELAYED").catch(console.error);

      notifyOrderStatusChange({
        orderId: order.id,
        organizationId: order.organizationId,
        orderNumber: order.orderNumber,
        productName: order.productName,
        oldStatus,
        newStatus: "DELAYED",
        factoryName: order.factory?.name,
      }).catch(console.error);
    }

    // Check projected completion for BEHIND_SCHEDULE
    // Only applies to orders that are IN_PROGRESS or already BEHIND_SCHEDULE
    // (not DELAYED/DISRUPTED which are worse, not PENDING which has no stages started)
    if (!updatedOrderIds.includes(order.id) && (currentOrderStatus === "IN_PROGRESS" || currentOrderStatus === "BEHIND_SCHEDULE")) {
      const projectedDaysLate = projectCompletion(allStages, order.expectedDate, now);

      if (projectedDaysLate > 0 && currentOrderStatus !== "BEHIND_SCHEDULE") {
        await prisma.order.update({
          where: { id: order.id },
          data: { status: "BEHIND_SCHEDULE" as never },
        });

        updatedOrderIds.push(order.id);

        fireAlert({
          organizationId: order.organizationId,
          title: "Order behind schedule",
          message: `Order ${order.orderNumber} is projected to finish ${projectedDaysLate} day${projectedDaysLate !== 1 ? "s" : ""} late based on stage timeline slippage.`,
          severity: "WARNING",
          orderId: order.id,
          factoryId: order.factoryId,
        });

        logOrderEvent(order.id, "STATUS_CHANGE", "status", currentOrderStatus, "BEHIND_SCHEDULE").catch(console.error);

        notifyOrderStatusChange({
          orderId: order.id,
          organizationId: order.organizationId,
          orderNumber: order.orderNumber,
          productName: order.productName,
          oldStatus: currentOrderStatus,
          newStatus: "BEHIND_SCHEDULE",
          factoryName: order.factory?.name,
        }).catch(console.error);
      } else if (projectedDaysLate <= 0 && currentOrderStatus === "BEHIND_SCHEDULE") {
        await prisma.order.update({
          where: { id: order.id },
          data: { status: "IN_PROGRESS" as never },
        });

        updatedOrderIds.push(order.id);

        logOrderEvent(order.id, "STATUS_CHANGE", "status", "BEHIND_SCHEDULE", "IN_PROGRESS").catch(console.error);

        notifyOrderStatusChange({
          orderId: order.id,
          organizationId: order.organizationId,
          orderNumber: order.orderNumber,
          productName: order.productName,
          oldStatus: "BEHIND_SCHEDULE",
          newStatus: "IN_PROGRESS",
          factoryName: order.factory?.name,
        }).catch(console.error);
      }
    }
  }

  return updatedOrderIds;
}
