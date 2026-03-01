import { prisma } from "@/lib/db";
import { fireAlert } from "@/lib/alert-generator";
import { logOrderEvent } from "@/lib/history";
import { notifyOrderStatusChange } from "@/lib/notifications";

/**
 * Check orders for overdue stages and auto-mark them as DELAYED.
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
      status: { in: ["PENDING", "IN_PROGRESS"] },
    },
    include: {
      stages: true,
      factory: { select: { name: true } },
    },
  });

  for (const order of orders) {
    const delayedStageIds: string[] = [];

    // Check each stage for overdue conditions
    for (const stage of order.stages) {
      let shouldDelay = false;

      if (
        stage.status === "NOT_STARTED" &&
        stage.expectedStartDate &&
        stage.expectedStartDate < now
      ) {
        shouldDelay = true;
      } else if (
        stage.status === "IN_PROGRESS" &&
        stage.expectedEndDate &&
        stage.expectedEndDate < now
      ) {
        shouldDelay = true;
      }

      if (!shouldDelay) continue;

      // Update stage to DELAYED
      const updateData: Record<string, unknown> = {
        status: "DELAYED",
        completedAt: null,
      };
      if (!stage.startedAt) {
        updateData.startedAt = now;
      }

      await prisma.orderStage.update({
        where: { id: stage.id },
        data: updateData,
      });

      delayedStageIds.push(stage.id);

      // Fire alert for stage (fire-and-forget)
      fireAlert({
        organizationId: order.organizationId,
        title: "Stage delayed",
        message: `Stage "${stage.name}" on order ${order.orderNumber} is overdue and has been automatically marked as delayed.`,
        severity: "WARNING",
        orderId: order.id,
        factoryId: order.factoryId,
      });

      // Log stage event (fire-and-forget)
      logOrderEvent(
        order.id,
        "STATUS_CHANGE",
        "status",
        stage.status,
        "DELAYED",
        stage.id,
        stage.name
      ).catch(console.error);
    }

    // Propagate to order if any stages were delayed
    if (delayedStageIds.length > 0) {
      const allStages = await prisma.orderStage.findMany({
        where: { orderId: order.id },
      });

      const hasBlockedStage = allStages.some((s) => s.status === "BLOCKED");
      const hasDelayedStage = allStages.some((s) => s.status === "DELAYED");
      const allCompleted = allStages.every(
        (s) => s.status === "COMPLETED" || s.status === "SKIPPED"
      );
      const anyInProgress = allStages.some((s) => s.status === "IN_PROGRESS");
      const allNotStarted = allStages.every((s) => s.status === "NOT_STARTED");
      const totalProgress = allStages.reduce((sum, s) => sum + s.progress, 0);
      const overallProgress = Math.round(totalProgress / allStages.length);

      let newOrderStatus: string | undefined;
      if (hasBlockedStage) {
        newOrderStatus = "DISRUPTED";
      } else if (hasDelayedStage) {
        newOrderStatus = "DELAYED";
      } else if (allCompleted) {
        newOrderStatus = "COMPLETED";
      } else if (allNotStarted && overallProgress === 0) {
        newOrderStatus = "PENDING";
      } else if (anyInProgress || overallProgress > 0) {
        newOrderStatus = "IN_PROGRESS";
      }

      if (newOrderStatus && newOrderStatus !== order.status) {
        await prisma.order.update({
          where: { id: order.id },
          data: { status: newOrderStatus as never, overallProgress },
        });

        updatedOrderIds.push(order.id);

        logOrderEvent(
          order.id,
          "STATUS_CHANGE",
          "status",
          order.status,
          newOrderStatus
        ).catch(console.error);

        notifyOrderStatusChange({
          orderId: order.id,
          organizationId: order.organizationId,
          orderNumber: order.orderNumber,
          productName: order.productName,
          oldStatus: order.status,
          newStatus: newOrderStatus,
          factoryName: order.factory?.name,
        }).catch(console.error);
      }
    }

    // Check order-level deadline independently
    if (order.expectedDate < now && order.status !== "DELAYED") {
      const currentOrder = await prisma.order.findUnique({
        where: { id: order.id },
        select: { status: true },
      });

      if (
        currentOrder &&
        (currentOrder.status === "PENDING" || currentOrder.status === "IN_PROGRESS")
      ) {
        await prisma.order.update({
          where: { id: order.id },
          data: { status: "DELAYED" },
        });

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

        logOrderEvent(
          order.id,
          "STATUS_CHANGE",
          "status",
          currentOrder.status,
          "DELAYED"
        ).catch(console.error);

        notifyOrderStatusChange({
          orderId: order.id,
          organizationId: order.organizationId,
          orderNumber: order.orderNumber,
          productName: order.productName,
          oldStatus: currentOrder.status,
          newStatus: "DELAYED",
          factoryName: order.factory?.name,
        }).catch(console.error);
      }
    }
  }

  return updatedOrderIds;
}
