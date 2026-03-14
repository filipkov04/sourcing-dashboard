import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { success, notFound, unauthorized, forbidden, noContent, handleError, error , projectScope } from "@/lib/api";
import { auth } from "@/lib/auth";
import { logOrderEvent, OrderEventType } from "@/lib/history";
import { notifyOrderStatusChange } from "@/lib/notifications";
import { checkAndUpdateDelays } from "@/lib/check-delays";

/**
 * Auto-sync tracking data from 17Track when a tracking number is set.
 * Fire-and-forget — errors are logged but don't fail the order update.
 * The order's lastTrackingSync should already be reset before calling this.
 */
async function triggerTrackingSync(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { trackingNumber: true, organizationId: true },
  });
  if (!order?.trackingNumber) return;

  try {
    const { TrackingAdapter } = await import("@/lib/integrations/adapters/tracking-adapter");
    const adapter = new TrackingAdapter();
    await adapter.sync({
      integration: {
        id: "auto-sync",
        name: "Auto Sync",
        type: "CARRIER_TRACKING",
        status: "ACTIVE",
        credentials: null,
        config: null,
        syncFrequency: 0,
        lastSyncAt: null,
        lastSyncStatus: "NEVER",
        lastSyncError: null,
        factoryId: "",
        organizationId: order.organizationId,
        projectId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      factoryId: "",
      organizationId: order.organizationId,
    });
  } catch (err) {
    console.error("Auto tracking sync failed:", err);
  }
}

// GET /api/orders/[id] - Get a single order with all details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return unauthorized();
    }

    const { id } = await params;

    const order = await prisma.order.findFirst({
      where: {
        id,
        ...projectScope(session),
      },
      include: {
        factory: true,
        stages: {
          orderBy: { sequence: "asc" },
        },
      },
    });

    if (!order) {
      return notFound("Order");
    }

    // Real-time delay detection: check for overdue stages before returning
    const updatedIds = await checkAndUpdateDelays([order.id]);

    // Re-read if status was updated so response reflects current state
    if (updatedIds.length > 0) {
      const freshOrder = await prisma.order.findFirst({
        where: {
          id,
          ...projectScope(session),
        },
        include: {
          factory: true,
          stages: {
            orderBy: { sequence: "asc" },
          },
        },
      });

      if (freshOrder) {
        return success(freshOrder);
      }
    }

    return success(order);
  } catch (err) {
    return handleError(err);
  }
}

// PATCH /api/orders/[id] - Update an existing order
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return unauthorized();
    }

    const { id } = await params;
    const body = await request.json();

    // Check if order exists and belongs to organization
    const existingOrder = await prisma.order.findFirst({
      where: {
        id,
        ...projectScope(session),
      },
      include: {
        stages: true,
        factory: { select: { name: true } },
      },
    });

    if (!existingOrder) {
      return notFound("Order");
    }

    const {
      orderNumber,
      productName,
      productSKU,
      productImage,
      quantity,
      unit,
      factoryId,
      orderDate,
      expectedDate,
      priority,
      status,
      notes,
      tags,
      stages,
      recurrenceEnabled,
      recurrenceIntervalDays,
      recurrenceNextDate,
      trackingNumber,
      shippingMethod,
    } = body;

    // Validate required fields if provided
    if (orderNumber !== undefined && orderNumber !== null && !orderNumber.trim()) {
      return error("Order number cannot be empty", 400);
    }
    if (productName !== undefined && productName !== null && !productName.trim()) {
      return error("Product name cannot be empty", 400);
    }
    if (quantity !== undefined && quantity !== null && quantity <= 0) {
      return error("Quantity must be greater than 0", 400);
    }

    // If changing factory, verify it belongs to organization
    if (factoryId && factoryId !== existingOrder.factoryId) {
      const factory = await prisma.factory.findFirst({
        where: {
          id: factoryId,
          ...projectScope(session),
        },
      });
      if (!factory) {
        return error("Factory not found", 404);
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (orderNumber !== undefined && orderNumber !== null) updateData.orderNumber = orderNumber.trim();
    if (productName !== undefined && productName !== null) updateData.productName = productName.trim();
    if (productSKU !== undefined) updateData.productSKU = productSKU ? productSKU.trim() : null;
    if (productImage !== undefined) updateData.productImage = productImage || null;
    if (quantity !== undefined) updateData.quantity = quantity;
    if (unit !== undefined) updateData.unit = unit;
    if (factoryId !== undefined) updateData.factoryId = factoryId;
    if (orderDate !== undefined) updateData.orderDate = new Date(orderDate);
    if (expectedDate !== undefined) updateData.expectedDate = new Date(expectedDate);
    if (priority !== undefined) updateData.priority = priority;
    if (status !== undefined) {
      updateData.status = status;

      // Auto-sync overallProgress and actualDate with status
      if (["COMPLETED", "SHIPPED", "DELIVERED"].includes(status)) {
        updateData.overallProgress = 100;
        if (!existingOrder.actualDate) {
          updateData.actualDate = new Date();
        }
      } else {
        // Clear actualDate when moving away from completed statuses
        if (existingOrder.actualDate) {
          updateData.actualDate = null;
        }
        if (status === "PENDING") {
          updateData.overallProgress = 0;
        }
      }
    }
    if (notes !== undefined) updateData.notes = notes ? notes.trim() : null;
    if (tags !== undefined) updateData.tags = tags;
    if (trackingNumber !== undefined) {
      const newTN = trackingNumber ? trackingNumber.trim() : null;
      updateData.trackingNumber = newTN;
      // Reset tracking state when number changes so 17Track can re-sync
      if (newTN !== existingOrder.trackingNumber) {
        updateData.lastTrackingSync = null;
        updateData.trackingStatus = null;
        updateData.currentLat = null;
        updateData.currentLng = null;
        updateData.currentLocation = null;
        updateData.carrier = null;
        updateData.carrierCode = null;
      }
    }
    if (shippingMethod !== undefined) updateData.shippingMethod = shippingMethod || null;

    // Handle recurrence fields
    if (recurrenceEnabled !== undefined) {
      updateData.recurrenceEnabled = recurrenceEnabled;
      if (!recurrenceEnabled) {
        // Disable: clear all recurrence fields
        updateData.recurrenceIntervalDays = null;
        updateData.recurrenceNextDate = null;
        updateData.recurrenceLastAlertAt = null;
      }
    }
    if (recurrenceEnabled || (recurrenceEnabled === undefined && existingOrder.recurrenceEnabled)) {
      if (recurrenceIntervalDays !== undefined) {
        updateData.recurrenceIntervalDays = recurrenceIntervalDays;
      }
      if (recurrenceNextDate !== undefined) {
        // Manual date override takes precedence
        updateData.recurrenceNextDate = recurrenceNextDate ? new Date(recurrenceNextDate) : null;
      } else if (recurrenceIntervalDays !== undefined && recurrenceIntervalDays) {
        // Recompute from order date + interval
        const baseDate = orderDate ? new Date(orderDate) : existingOrder.orderDate;
        updateData.recurrenceNextDate = new Date(new Date(baseDate).getTime() + recurrenceIntervalDays * 24 * 60 * 60 * 1000);
      }
      // Reset alert timestamp when next date changes so a new alert fires
      if (updateData.recurrenceNextDate !== undefined) {
        updateData.recurrenceLastAlertAt = null;
      }
    }

    // Handle stages update — upsert to preserve IDs, metadata, timestamps, and relations
    if (stages !== undefined) {
      type StageInput = { id?: string; name: string; sequence: number; progress?: number; status?: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "SKIPPED" | "DELAYED" | "BLOCKED"; notes?: string };
      const incomingStages: StageInput[] = stages;
      const existingStageIds = existingOrder.stages.map((s) => s.id);
      const incomingIds = incomingStages.filter((s) => s.id).map((s) => s.id!);

      // Delete stages that were removed (not in incoming list)
      const idsToDelete = existingStageIds.filter((eid) => !incomingIds.includes(eid));
      if (idsToDelete.length > 0) {
        await prisma.orderStage.deleteMany({
          where: { id: { in: idsToDelete }, orderId: id },
        });
      }

      // Update existing stages and create new ones
      for (const stage of incomingStages) {
        if (stage.id && existingStageIds.includes(stage.id)) {
          // Update existing — only touch name and sequence, preserve everything else
          await prisma.orderStage.update({
            where: { id: stage.id },
            data: {
              name: stage.name,
              sequence: stage.sequence,
            },
          });
        } else {
          // Create new stage
          await prisma.orderStage.create({
            data: {
              orderId: id,
              name: stage.name,
              sequence: stage.sequence,
              progress: stage.progress || 0,
              status: stage.status || "NOT_STARTED",
              notes: stage.notes || null,
            },
          });
        }
      }
    }

    // Update order
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        factory: true,
        stages: {
          orderBy: { sequence: "asc" },
        },
      },
    });

    // Log events for changed fields
    const eventPromises: Promise<unknown>[] = [];

    // Track field changes
    const fieldsToTrack: { field: string; oldValue: string | null; newValue: string | null; eventType: OrderEventType }[] = [];

    // Status change
    if (status !== undefined && status !== existingOrder.status) {
      fieldsToTrack.push({
        field: "status",
        oldValue: existingOrder.status,
        newValue: status,
        eventType: "STATUS_CHANGE",
      });
    }

    // Priority change
    if (priority !== undefined && priority !== existingOrder.priority) {
      fieldsToTrack.push({
        field: "priority",
        oldValue: existingOrder.priority,
        newValue: priority,
        eventType: "FIELD_CHANGE",
      });
    }

    // Expected date change
    if (expectedDate !== undefined) {
      const oldDate = existingOrder.expectedDate.toISOString().split("T")[0];
      const newDate = new Date(expectedDate).toISOString().split("T")[0];
      if (oldDate !== newDate) {
        fieldsToTrack.push({
          field: "expectedDate",
          oldValue: existingOrder.expectedDate.toISOString(),
          newValue: new Date(expectedDate).toISOString(),
          eventType: "FIELD_CHANGE",
        });
      }
    }

    // Notes change
    if (notes !== undefined) {
      const newNotes = notes ? notes.trim() : null;
      if (newNotes !== existingOrder.notes) {
        fieldsToTrack.push({
          field: "notes",
          oldValue: existingOrder.notes,
          newValue: newNotes,
          eventType: "NOTE_CHANGE",
        });
      }
    }

    // Product name change
    if (productName !== undefined && productName !== null) {
      const newProductName = productName.trim();
      if (newProductName !== existingOrder.productName) {
        fieldsToTrack.push({
          field: "productName",
          oldValue: existingOrder.productName,
          newValue: newProductName,
          eventType: "FIELD_CHANGE",
        });
      }
    }

    // Quantity change
    if (quantity !== undefined && quantity !== existingOrder.quantity) {
      fieldsToTrack.push({
        field: "quantity",
        oldValue: String(existingOrder.quantity),
        newValue: String(quantity),
        eventType: "FIELD_CHANGE",
      });
    }

    // Order number change
    if (orderNumber !== undefined && orderNumber !== null) {
      const newOrderNumber = orderNumber.trim();
      if (newOrderNumber !== existingOrder.orderNumber) {
        fieldsToTrack.push({
          field: "orderNumber",
          oldValue: existingOrder.orderNumber,
          newValue: newOrderNumber,
          eventType: "FIELD_CHANGE",
        });
      }
    }

    // Factory change
    if (factoryId !== undefined && factoryId !== existingOrder.factoryId) {
      // Resolve new factory name for readable event log
      let newFactoryName = factoryId;
      try {
        const newFactory = await prisma.factory.findUnique({
          where: { id: factoryId },
          select: { name: true },
        });
        if (newFactory) newFactoryName = newFactory.name;
      } catch {}
      fieldsToTrack.push({
        field: "factoryId",
        oldValue: existingOrder.factory?.name || existingOrder.factoryId,
        newValue: newFactoryName,
        eventType: "FIELD_CHANGE",
      });
    }

    // SKU change
    if (productSKU !== undefined) {
      const newSKU = productSKU ? productSKU.trim() : null;
      if (newSKU !== existingOrder.productSKU) {
        fieldsToTrack.push({
          field: "productSKU",
          oldValue: existingOrder.productSKU,
          newValue: newSKU,
          eventType: "FIELD_CHANGE",
        });
      }
    }

    // Unit change
    if (unit !== undefined && unit !== existingOrder.unit) {
      fieldsToTrack.push({
        field: "unit",
        oldValue: existingOrder.unit,
        newValue: unit,
        eventType: "FIELD_CHANGE",
      });
    }

    // Order date change
    if (orderDate !== undefined) {
      const oldDate = existingOrder.orderDate.toISOString().split("T")[0];
      const newDate = new Date(orderDate).toISOString().split("T")[0];
      if (oldDate !== newDate) {
        fieldsToTrack.push({
          field: "orderDate",
          oldValue: existingOrder.orderDate.toISOString(),
          newValue: new Date(orderDate).toISOString(),
          eventType: "FIELD_CHANGE",
        });
      }
    }

    // Tags change
    if (tags !== undefined) {
      const oldTags = JSON.stringify(existingOrder.tags || []);
      const newTags = JSON.stringify(tags || []);
      if (oldTags !== newTags) {
        fieldsToTrack.push({
          field: "tags",
          oldValue: oldTags,
          newValue: newTags,
          eventType: "FIELD_CHANGE",
        });
      }
    }

    // Recurrence changes
    if (recurrenceEnabled !== undefined && recurrenceEnabled !== existingOrder.recurrenceEnabled) {
      fieldsToTrack.push({
        field: "recurrenceEnabled",
        oldValue: String(existingOrder.recurrenceEnabled),
        newValue: String(recurrenceEnabled),
        eventType: "FIELD_CHANGE",
      });
    }
    if (recurrenceIntervalDays !== undefined && recurrenceIntervalDays !== existingOrder.recurrenceIntervalDays) {
      fieldsToTrack.push({
        field: "recurrenceIntervalDays",
        oldValue: existingOrder.recurrenceIntervalDays ? String(existingOrder.recurrenceIntervalDays) : null,
        newValue: recurrenceIntervalDays ? String(recurrenceIntervalDays) : null,
        eventType: "FIELD_CHANGE",
      });
    }
    if (recurrenceNextDate !== undefined) {
      const oldDate = existingOrder.recurrenceNextDate?.toISOString().split("T")[0] || null;
      const newDate = recurrenceNextDate ? new Date(recurrenceNextDate).toISOString().split("T")[0] : null;
      if (oldDate !== newDate) {
        fieldsToTrack.push({
          field: "recurrenceNextDate",
          oldValue: existingOrder.recurrenceNextDate?.toISOString() || null,
          newValue: recurrenceNextDate ? new Date(recurrenceNextDate).toISOString() : null,
          eventType: "FIELD_CHANGE",
        });
      }
    }

    // Log all field changes
    for (const change of fieldsToTrack) {
      eventPromises.push(
        logOrderEvent(
          id,
          change.eventType,
          change.field,
          change.oldValue,
          change.newValue
        )
      );
    }

    // Track stage changes — match by sequence to detect renames
    if (stages !== undefined) {
      const oldBySeq = new Map<number, string>();
      for (const s of existingOrder.stages) {
        oldBySeq.set(s.sequence, s.name);
      }
      const newBySeq = new Map<number, string>();
      for (const s of stages as { name: string; sequence: number }[]) {
        newBySeq.set(s.sequence, s.name);
      }

      for (const [seq, oldName] of oldBySeq) {
        const newName = newBySeq.get(seq);
        if (newName === undefined) {
          eventPromises.push(logOrderEvent(id, "STAGE_REMOVED", null, oldName, null));
        } else if (newName !== oldName) {
          eventPromises.push(logOrderEvent(id, "STAGE_RENAMED", null, oldName, newName));
        }
      }

      for (const [seq, newName] of newBySeq) {
        if (!oldBySeq.has(seq)) {
          eventPromises.push(logOrderEvent(id, "STAGE_ADDED", null, null, newName));
        }
      }
    }

    // Execute all event logging in parallel
    if (eventPromises.length > 0) {
      await Promise.all(eventPromises);
    }

    // Send email notification for status changes (fire-and-forget)
    if (status !== undefined && status !== existingOrder.status) {
      notifyOrderStatusChange({
        orderId: id,
        ...projectScope(session),
        orderNumber: updatedOrder.orderNumber,
        productName: updatedOrder.productName,
        oldStatus: existingOrder.status,
        newStatus: status,
        factoryName: updatedOrder.factory?.name,
      }).catch(console.error);
    }

    // Auto-sync tracking when tracking number is set/changed (fire-and-forget)
    if (trackingNumber !== undefined && trackingNumber && trackingNumber.trim() !== existingOrder.trackingNumber) {
      triggerTrackingSync(id).catch(console.error);
    }

    return success(updatedOrder, "Order updated successfully");
  } catch (err) {
    return handleError(err);
  }
}

// DELETE /api/orders/[id] - Delete an order. ADMIN/OWNER only.
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return unauthorized();

    if (!["ADMIN", "OWNER"].includes(session.user.role)) {
      return forbidden("Only admins can delete orders");
    }

    const { id } = await params;

    const order = await prisma.order.findFirst({
      where: { id, ...projectScope(session) },
    });

    if (!order) return notFound("Order");

    await prisma.order.delete({ where: { id } });

    return noContent();
  } catch (err) {
    return handleError(err);
  }
}
