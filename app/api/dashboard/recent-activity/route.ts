import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import * as api from "@/lib/api";

/**
 * GET /api/dashboard/recent-activity
 * Returns recent activities (orders created, completed, status changes)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return api.unauthorized();
    }

    const organizationId = session.user.organizationId;
    const projectId = session.user.projectId;

    // Get recent orders (last 10) with factory info
    const recentOrders = await prisma.order.findMany({
      where: { organizationId, ...(projectId ? { projectId } : {}) },
      include: {
        factory: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    });

    // Transform orders into activity items
    const activities = recentOrders.map((order) => {
      const createdAt = new Date(order.createdAt);
      const now = new Date();
      const diffMs = now.getTime() - createdAt.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      let timeAgo = "";
      if (diffMins < 1) {
        timeAgo = "Just now";
      } else if (diffMins < 60) {
        timeAgo = `${diffMins}m ago`;
      } else if (diffHours < 24) {
        timeAgo = `${diffHours}h ago`;
      } else if (diffDays < 7) {
        timeAgo = `${diffDays}d ago`;
      } else {
        timeAgo = createdAt.toLocaleDateString();
      }

      return {
        id: order.id,
        type: order.status === "COMPLETED" ? "completed" : "created",
        orderNumber: order.orderNumber,
        productName: order.productName,
        factoryName: order.factory.name,
        status: order.status,
        timeAgo,
        createdAt: order.createdAt,
      };
    });

    return api.success(activities);
  } catch (error) {
    console.error("Recent activity error:", error);
    return api.error("Failed to fetch recent activity");
  }
}
