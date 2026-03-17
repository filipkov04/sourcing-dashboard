import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import * as api from "@/lib/api";

/**
 * GET /api/dashboard/order-progress
 * Returns top 8 active orders sorted by nearest expected delivery date,
 * then by highest completion percentage.
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

    const orders = await prisma.order.findMany({
      where: {
        organizationId,
        ...(projectId ? { projectId } : {}),
        status: { in: ["PENDING", "IN_PROGRESS", "BEHIND_SCHEDULE", "DELAYED", "DISRUPTED", "SHIPPED"] },
      },
      include: {
        factory: { select: { name: true } },
      },
      orderBy: [
        { expectedDate: "asc" },
        { overallProgress: "desc" },
      ],
      take: 8,
    });

    const data = orders.map((order) => {
      const expectedMs = new Date(order.expectedDate).getTime();
      const daysRemaining = Math.ceil((expectedMs - now.getTime()) / (1000 * 60 * 60 * 24));

      return {
        id: order.id,
        orderNumber: order.orderNumber,
        productName: order.productName,
        factoryName: order.factory.name,
        status: order.status,
        overallProgress: order.overallProgress,
        expectedDate: order.expectedDate.toISOString(),
        daysRemaining,
      };
    });

    return api.success(data);
  } catch (error) {
    console.error("Order progress error:", error);
    return api.error("Failed to fetch order progress");
  }
}
