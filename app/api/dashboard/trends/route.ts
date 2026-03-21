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
    const projectId = session.user.projectId;

    // Parse period filter
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "all";

    const now = new Date();
    let days: number;
    switch (period) {
      case "7d": days = 7; break;
      case "30d": days = 30; break;
      case "90d": days = 90; break;
      default: days = 84; break; // "all" defaults to 12 weeks for trends
    }
    const weeks = Math.max(1, Math.ceil(days / 7));
    const from = new Date(now.getTime() - weeks * 7 * 24 * 60 * 60 * 1000);

    const orders = await prisma.order.findMany({
      where: {
        organizationId,
        ...(projectId ? { projectId } : {}),
        expectedStartDate: {
          gte: from,
        },
      },
      select: {
        expectedStartDate: true,
        status: true,
      },
    });

    // Group orders by week and status
    const weeklyData = new Map<string, { [key: string]: number }>();

    // Initialize weeks
    for (let i = weeks - 1; i >= 0; i--) {
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
      const expectedStartDate = new Date(order.expectedStartDate);
      const weekKey = getWeekLabel(expectedStartDate);

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
