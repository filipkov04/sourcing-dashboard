import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import * as api from "@/lib/api";

/**
 * GET /api/dashboard/trends
 * Returns orders trend data grouped by week for the last 12 weeks
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return api.unauthorized();
    }

    const organizationId = session.user.organizationId;

    // Get orders from last 12 weeks
    const now = new Date();
    const twelveWeeksAgo = new Date(now);
    twelveWeeksAgo.setDate(now.getDate() - 84); // 12 weeks = 84 days

    const orders = await prisma.order.findMany({
      where: {
        organizationId,
        orderDate: {
          gte: twelveWeeksAgo,
        },
      },
      select: {
        orderDate: true,
        status: true,
      },
    });

    // Group orders by week and status
    const weeklyData = new Map<string, { [key: string]: number }>();

    // Initialize weeks
    for (let i = 11; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (i * 7));
      const weekKey = getWeekLabel(weekStart);
      weeklyData.set(weekKey, {
        Pending: 0,
        "In Progress": 0,
        Completed: 0,
        Delayed: 0,
        Disrupted: 0,
      });
    }

    // Count orders by week and status
    orders.forEach((order) => {
      const orderDate = new Date(order.orderDate);
      const weekKey = getWeekLabel(orderDate);

      if (weeklyData.has(weekKey)) {
        const weekStats = weeklyData.get(weekKey)!;
        const statusLabel = formatStatus(order.status);
        if (statusLabel in weekStats) {
          weekStats[statusLabel]++;
        }
      }
    });

    // Convert to array format for chart
    const trends = Array.from(weeklyData.entries()).map(([week, stats]) => ({
      week,
      ...stats,
    }));

    return api.success(trends);
  } catch (error) {
    console.error("Dashboard trends error:", error);
    return api.error("Failed to fetch dashboard trends");
  }
}

/**
 * Get week label in format "Jan 1" for the start of the week
 */
function getWeekLabel(date: Date): string {
  const weekStart = new Date(date);
  // Get the Monday of the week
  const dayOfWeek = weekStart.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust to Monday
  weekStart.setDate(weekStart.getDate() + diff);

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[weekStart.getMonth()]} ${weekStart.getDate()}`;
}

/**
 * Format order status for display
 */
function formatStatus(status: string): string {
  switch (status) {
    case "PENDING":
      return "Pending";
    case "IN_PROGRESS":
      return "In Progress";
    case "COMPLETED":
      return "Completed";
    case "DELAYED":
      return "Delayed";
    case "DISRUPTED":
      return "Disrupted";
    default:
      return "Completed"; // Group SHIPPED, DELIVERED, CANCELLED as completed for simplicity
  }
}
