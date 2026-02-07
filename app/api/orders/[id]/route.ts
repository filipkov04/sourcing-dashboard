import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { success, notFound, unauthorized, handleError, error } from "@/lib/api";
import { auth } from "@/lib/auth";
import { logOrderEvent, OrderEventType } from "@/lib/history";

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
        organizationId: session.user.organizationId,
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
        organizationId: session.user.organizationId,
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
          organizationId: session.user.organizationId,
        },
      });
      if (!factory) {
        return error("Factory not found", 404);
      }
    }

    // Build update data
    const updateData: any = {};
    if (orderNumber !== undefined && orderNumber !== null) updateData.orderNumber = orderNumber.trim();
    if (productName !== undefined && productName !== null) updateData.productName = productName.trim();
    if (productSKU !== undefined) updateData.productSKU = productSKU ? productSKU.trim() : null;
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
      } else if (status === "PENDING") {
        updateData.overallProgress = 0;
        updateData.actualDate = null;
      } else if (status === "CANCELLED") {
        updateData.actualDate = null;
      }
    }
    if (notes !== undefined) updateData.notes = notes ? notes.trim() : null;
    if (tags !== undefined) updateData.tags = tags;

    // Handle stages update
    if (stages !== undefined) {
      // Delete existing stages and create new ones
      await prisma.orderStage.deleteMany({
        where: { orderId: id },
      });

      if (stages.length > 0) {
        await prisma.orderStage.createMany({
          data: stages.map((stage: { name: string; sequence: number; progress?: number; status?: string; notes?: string }) => ({
            orderId: id,
            name: stage.name,
            sequence: stage.sequence,
            progress: stage.progress || 0,
            status: stage.status || "NOT_STARTED",
            notes: stage.notes || null,
          })),
        });
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
    const eventPromises: Promise<any>[] = [];

    // Track field changes
    const fieldsToTrack: { field: string; oldValue: any; newValue: any; eventType: OrderEventType }[] = [];

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

    // Track stage changes
    if (stages !== undefined) {
      const existingStageNames = existingOrder.stages.map(s => s.name);
      const newStageNames = stages.map((s: { name: string }) => s.name);

      // Find removed stages
      for (const stageName of existingStageNames) {
        if (!newStageNames.includes(stageName)) {
          eventPromises.push(
            logOrderEvent(id, "STAGE_REMOVED", null, stageName, null)
          );
        }
      }

      // Find added stages
      for (const stageName of newStageNames) {
        if (!existingStageNames.includes(stageName)) {
          eventPromises.push(
            logOrderEvent(id, "STAGE_ADDED", null, null, stageName)
          );
        }
      }
    }

    // Execute all event logging in parallel
    if (eventPromises.length > 0) {
      await Promise.all(eventPromises);
    }

    return success(updatedOrder, "Order updated successfully");
  } catch (err) {
    return handleError(err);
  }
}
