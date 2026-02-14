import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { success, notFound, unauthorized, handleError, error } from "@/lib/api";
import { auth } from "@/lib/auth";
import { logOrderEvent } from "@/lib/history";
import { fireAlert } from "@/lib/alert-generator";

// PATCH /api/orders/[id]/stages/[stageId] - Update a stage's progress
// NOTE: This is an admin-only feature. Role-based access control will be added in Week 5.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; stageId: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return unauthorized();
    }

    // TODO: Add role check when role-based access is implemented (Task 5.28)
    // if (session.user.role === 'CLIENT' || session.user.role === 'VIEWER') {
    //   return error("Only admins can update stage progress", 403);
    // }

    const { id: orderId, stageId } = await params;
    const body = await request.json();

    // Verify order belongs to organization
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        organizationId: session.user.organizationId,
      },
    });

    if (!order) {
      return notFound("Order");
    }

    // Verify stage belongs to order
    const existingStage = await prisma.orderStage.findFirst({
      where: {
        id: stageId,
        orderId: orderId,
      },
    });

    if (!existingStage) {
      return notFound("Stage");
    }

    const { progress, status, notes, metadata, expectedStartDate, expectedEndDate } = body;

    // Validate progress
    if (progress !== undefined) {
      if (typeof progress !== "number" || progress < 0 || progress > 100) {
        return error("Progress must be a number between 0 and 100", 400);
      }
    }

    // Validate status (ignore empty string)
    const validStatuses = ["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "SKIPPED", "DELAYED", "BLOCKED"];
    if (status !== undefined && status !== "" && !validStatuses.includes(status)) {
      return error("Invalid status", 400);
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    // Check if stage is in a "problem" state (DELAYED or BLOCKED)
    const isProblemStatus = existingStage.status === "DELAYED" || existingStage.status === "BLOCKED";
    const isSettingProblemStatus = status === "DELAYED" || status === "BLOCKED";

    if (progress !== undefined) {
      updateData.progress = progress;

      // Only auto-update status based on progress if NOT in a problem state
      // and NOT explicitly setting a problem status
      if (!isProblemStatus && !isSettingProblemStatus && (status === undefined || status === "")) {
        if (progress === 0) {
          updateData.status = "NOT_STARTED";
          updateData.startedAt = null;
          updateData.completedAt = null;
        } else if (progress > 0 && progress < 100) {
          updateData.status = "IN_PROGRESS";
          if (!existingStage.startedAt) {
            updateData.startedAt = new Date();
          }
          updateData.completedAt = null;
        } else if (progress === 100) {
          updateData.status = "COMPLETED";
          if (!existingStage.startedAt) {
            updateData.startedAt = new Date();
          }
          updateData.completedAt = new Date();
        }
      }
    }

    if (status !== undefined && status !== "") {
      updateData.status = status;

      // Update timestamps based on status
      if (status === "IN_PROGRESS" && !existingStage.startedAt) {
        updateData.startedAt = new Date();
      }
      if (status === "COMPLETED") {
        if (!existingStage.startedAt) {
          updateData.startedAt = new Date();
        }
        updateData.completedAt = new Date();
        if (progress === undefined) {
          updateData.progress = 100;
        }
      }
      if (status === "NOT_STARTED") {
        updateData.startedAt = null;
        updateData.completedAt = null;
        if (progress === undefined) {
          updateData.progress = 0;
        }
      }
      // DELAYED and BLOCKED keep existing timestamps but don't auto-complete
      if (status === "DELAYED" || status === "BLOCKED") {
        if (!existingStage.startedAt) {
          updateData.startedAt = new Date();
        }
        updateData.completedAt = null;
      }
    }

    if (notes !== undefined) {
      updateData.notes = notes ? notes.trim() : null;
    }

    if (expectedStartDate !== undefined) {
      updateData.expectedStartDate = expectedStartDate ? new Date(expectedStartDate) : null;
    }

    if (expectedEndDate !== undefined) {
      updateData.expectedEndDate = expectedEndDate ? new Date(expectedEndDate) : null;
    }

    if (metadata !== undefined) {
      if (metadata !== null && typeof metadata !== "object") {
        return error("Metadata must be an object or null", 400);
      }
      updateData.metadata = metadata || [];
    }

    // Use transaction to prevent race conditions in progress calculation
    const result = await prisma.$transaction(async (tx) => {
      // Update stage
      const updatedStage = await tx.orderStage.update({
        where: { id: stageId },
        data: updateData,
      });

      // Recalculate overall order progress
      const allStages = await tx.orderStage.findMany({
        where: { orderId: orderId },
      });

      const totalProgress = allStages.reduce((sum, s) => sum + s.progress, 0);
      const overallProgress = Math.round(totalProgress / allStages.length);

      // Determine order status based on stage statuses
      const hasBlockedStage = allStages.some((s) => s.status === "BLOCKED");
      const hasDelayedStage = allStages.some((s) => s.status === "DELAYED");
      const allCompleted = allStages.every((s) => s.status === "COMPLETED" || s.status === "SKIPPED");
      const anyInProgress = allStages.some((s) => s.status === "IN_PROGRESS");
      const allNotStarted = allStages.every((s) => s.status === "NOT_STARTED");

      // Only auto-update status for active orders (not completed, shipped, delivered, or cancelled)
      const activeStatuses = ["PENDING", "IN_PROGRESS", "DELAYED", "DISRUPTED"];
      let newOrderStatus: string | undefined;

      if (activeStatuses.includes(order.status)) {
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
      }

      // Update order's overall progress and status
      const orderUpdateData: Record<string, unknown> = { overallProgress };
      if (newOrderStatus) {
        orderUpdateData.status = newOrderStatus;
      }

      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: orderUpdateData,
      });

      return { updatedStage, overallProgress, orderStatus: updatedOrder.status };
    });

    // Fire inline alerts for problem statuses (non-critical, fire-and-forget)
    if (updateData.status !== undefined && updateData.status !== existingStage.status) {
      if (updateData.status === "BLOCKED") {
        fireAlert({
          organizationId: session.user.organizationId,
          title: "Stage blocked",
          message: `Stage "${existingStage.name}" on order ${order.orderNumber} has been blocked.`,
          severity: "CRITICAL",
          orderId: orderId,
          factoryId: order.factoryId,
        });
      } else if (updateData.status === "DELAYED") {
        fireAlert({
          organizationId: session.user.organizationId,
          title: "Stage delayed",
          message: `Stage "${existingStage.name}" on order ${order.orderNumber} has been delayed.`,
          severity: "WARNING",
          orderId: orderId,
          factoryId: order.factoryId,
        });
      }
    }

    // Log events outside the transaction (non-critical, fire-and-forget)
    const eventPromises: Promise<unknown>[] = [];

    if (updateData.status !== undefined && updateData.status !== existingStage.status) {
      eventPromises.push(
        logOrderEvent(
          orderId,
          "STATUS_CHANGE",
          "status",
          existingStage.status,
          String(updateData.status),
          stageId,
          existingStage.name
        )
      );
    }

    if (updateData.progress !== undefined && updateData.progress !== existingStage.progress) {
      eventPromises.push(
        logOrderEvent(
          orderId,
          "PROGRESS_CHANGE",
          "progress",
          String(existingStage.progress),
          String(updateData.progress),
          stageId,
          existingStage.name
        )
      );
    }

    if (updateData.notes !== undefined && updateData.notes !== existingStage.notes) {
      eventPromises.push(
        logOrderEvent(
          orderId,
          "NOTE_CHANGE",
          "notes",
          existingStage.notes,
          updateData.notes as string | null,
          stageId,
          existingStage.name
        )
      );
    }

    if (eventPromises.length > 0) {
      Promise.all(eventPromises).catch(console.error);
    }

    return success({
      stage: result.updatedStage,
      overallProgress: result.overallProgress,
      orderStatus: result.orderStatus,
    }, "Stage updated successfully");
  } catch (err) {
    return handleError(err);
  }
}
