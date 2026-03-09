import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import * as api from "@/lib/api";

/**
 * GET /api/dashboard/upcoming-deliveries
 * Returns orders nearing their expected delivery date, sorted by soonest first.
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

    // Get active orders with an expected date in the future (or recently passed within 7 days)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const orders = await prisma.order.findMany({
      where: {
        organizationId,
        ...(projectId ? { projectId } : {}),
        status: { in: ["PENDING", "IN_PROGRESS", "DELAYED", "SHIPPED"] },
        expectedDate: { gte: sevenDaysAgo },
      },
      include: {
        factory: {
          select: { name: true },
        },
      },
      orderBy: { expectedDate: "asc" },
      take: 8,
    });

    const deliveries = orders.map((order) => {
      const expectedMs = new Date(order.expectedDate).getTime();
      const diffMs = expectedMs - now.getTime();
      const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      let urgency: "overdue" | "critical" | "soon" | "on-track";
      if (daysRemaining < 0) {
        urgency = "overdue";
      } else if (daysRemaining <= 3) {
        urgency = "critical";
      } else if (daysRemaining <= 7) {
        urgency = "soon";
      } else {
        urgency = "on-track";
      }

      return {
        id: order.id,
        orderNumber: order.orderNumber,
        productName: order.productName,
        productSKU: order.productSKU,
        quantity: order.quantity,
        unit: order.unit,
        status: order.status,
        overallProgress: order.overallProgress,
        expectedDate: order.expectedDate.toISOString(),
        factoryName: order.factory.name,
        daysRemaining,
        urgency,
      };
    });

    return api.success(deliveries);
  } catch (error) {
    console.error("Upcoming deliveries error:", error);
    return api.error("Failed to fetch upcoming deliveries");
  }
}
