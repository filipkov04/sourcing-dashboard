import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import * as api from "@/lib/api";

/**
 * GET /api/dashboard/status-breakdown
 * Returns order count breakdown by status
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return api.unauthorized();
    }

    const organizationId = session.user.organizationId;
    const projectId = session.user.projectId;

    // Parse period filter
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "all";
    const where: any = { organizationId, ...(projectId ? { projectId } : {}) };

    if (period !== "all") {
      const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;
      where.orderDate = { gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) };
    }

    // Get all orders grouped by status
    const orders = await prisma.order.groupBy({
      by: ["status"],
      where,
      _count: {
        id: true,
      },
    });

    // Calculate total for percentages
    const total = orders.reduce((sum, item) => sum + item._count.id, 0);

    // Format data for chart
    const statusBreakdown = orders.map((item) => {
      const count = item._count.id;
      const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

      return {
        status: formatStatusLabel(item.status),
        count,
        percentage,
        color: getStatusColor(item.status),
      };
    });

    // Sort by count descending
    statusBreakdown.sort((a, b) => b.count - a.count);

    return api.success(statusBreakdown);
  } catch (error) {
    console.error("Dashboard status breakdown error:", error);
    return api.error("Failed to fetch status breakdown");
  }
}

/**
 * Format status label for display
 */
function formatStatusLabel(status: string): string {
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Get color for status
 */
function getStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    PENDING: "#f59e0b", // amber-500
    IN_PROGRESS: "#3b82f6", // blue-500
    DELAYED: "#f97316", // orange-500
    DISRUPTED: "#ef4444", // red-500
    COMPLETED: "#10b981", // green-500
    SHIPPED: "#8b5cf6", // purple-500
    DELIVERED: "#6b7280", // gray-500
    CANCELLED: "#9ca3af", // gray-400
  };

  return colorMap[status] || "#6b7280";
}
