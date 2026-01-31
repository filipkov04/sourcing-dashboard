import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { success, notFound, unauthorized, handleError, error } from "@/lib/api";
import { auth } from "@/lib/auth";

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
    if (orderNumber !== undefined && !orderNumber.trim()) {
      return error("Order number cannot be empty", 400);
    }
    if (productName !== undefined && !productName.trim()) {
      return error("Product name cannot be empty", 400);
    }
    if (quantity !== undefined && quantity <= 0) {
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
    if (orderNumber !== undefined) updateData.orderNumber = orderNumber.trim();
    if (productName !== undefined) updateData.productName = productName.trim();
    if (productSKU !== undefined) updateData.productSKU = productSKU.trim() || null;
    if (quantity !== undefined) updateData.quantity = quantity;
    if (unit !== undefined) updateData.unit = unit;
    if (factoryId !== undefined) updateData.factoryId = factoryId;
    if (orderDate !== undefined) updateData.orderDate = new Date(orderDate);
    if (expectedDate !== undefined) updateData.expectedDate = new Date(expectedDate);
    if (priority !== undefined) updateData.priority = priority;
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes.trim() || null;
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

    return success(updatedOrder, "Order updated successfully");
  } catch (err) {
    return handleError(err);
  }
}
