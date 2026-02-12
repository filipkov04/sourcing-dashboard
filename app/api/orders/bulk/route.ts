import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { success, error, unauthorized, forbidden, handleError } from "@/lib/api";
import { auth } from "@/lib/auth";
import { logOrderEvent } from "@/lib/history";

// PATCH /api/orders/bulk - Bulk update order status
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return unauthorized();
    }

    if (!["OWNER", "ADMIN"].includes(session.user.role)) {
      return forbidden("Only admins can perform bulk actions");
    }

    const body = await request.json();
    const { orderIds, status } = body;

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return error("orderIds must be a non-empty array");
    }

    if (orderIds.length > 100) {
      return error("Cannot update more than 100 orders at once");
    }

    const validStatuses = [
      "PENDING", "IN_PROGRESS", "DELAYED", "DISRUPTED",
      "COMPLETED", "SHIPPED", "DELIVERED", "CANCELLED",
    ];
    if (!validStatuses.includes(status)) {
      return error("Invalid status");
    }

    // Verify all orders belong to the organization
    const orders = await prisma.order.findMany({
      where: {
        id: { in: orderIds },
        organizationId: session.user.organizationId,
      },
      select: { id: true, status: true, actualDate: true },
    });

    if (orders.length !== orderIds.length) {
      return error("Some orders were not found or don't belong to your organization");
    }

    // Build update data with auto-progress logic
    const updateData: Record<string, unknown> = { status };

    if (["COMPLETED", "SHIPPED", "DELIVERED"].includes(status)) {
      updateData.overallProgress = 100;
    } else if (status === "PENDING") {
      updateData.overallProgress = 0;
      updateData.actualDate = null;
    } else if (status === "CANCELLED") {
      updateData.actualDate = null;
    }

    // Bulk update
    await prisma.order.updateMany({
      where: {
        id: { in: orderIds },
        organizationId: session.user.organizationId,
      },
      data: updateData,
    });

    // Set actualDate for completed/shipped/delivered (only if not already set)
    if (["COMPLETED", "SHIPPED", "DELIVERED"].includes(status)) {
      const idsWithoutActualDate = orders
        .filter((o) => !o.actualDate)
        .map((o) => o.id);

      if (idsWithoutActualDate.length > 0) {
        await prisma.order.updateMany({
          where: { id: { in: idsWithoutActualDate } },
          data: { actualDate: new Date() },
        });
      }
    }

    // Log events for orders that actually changed status
    const eventPromises = orders
      .filter((o) => o.status !== status)
      .map((o) =>
        logOrderEvent(o.id, "STATUS_CHANGE", "status", o.status, status)
      );

    if (eventPromises.length > 0) {
      await Promise.all(eventPromises);
    }

    return success(
      { updatedCount: orders.length },
      `${orders.length} order${orders.length !== 1 ? "s" : ""} updated to ${status.replace("_", " ")}`
    );
  } catch (err) {
    return handleError(err);
  }
}
