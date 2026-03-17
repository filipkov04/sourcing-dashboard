import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import * as api from "@/lib/api";

/**
 * GET /api/dashboard/daily-stats
 * Returns daily order counts for the last 7 days (for sparkline charts)
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
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const scope = {
      organizationId,
      ...(projectId ? { projectId } : {}),
    };

    // Get all orders for the org to compute daily snapshots
    const orders = await prisma.order.findMany({
      where: scope,
      select: {
        status: true,
        orderDate: true,
        updatedAt: true,
      },
    });

    // Build daily stats for the last 7 days
    const days: { day: string; created: number; completed: number; delayed: number; active: number }[] = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayLabel = date.toLocaleDateString("en-US", { weekday: "short" });

      const created = orders.filter((o) => {
        const d = new Date(o.orderDate);
        return d >= date && d < nextDate;
      }).length;

      const completed = orders.filter((o) => {
        const d = new Date(o.updatedAt);
        return d >= date && d < nextDate && ["COMPLETED", "SHIPPED", "DELIVERED"].includes(o.status);
      }).length;

      const delayed = orders.filter((o) => {
        const d = new Date(o.updatedAt);
        return d >= date && d < nextDate && ["BEHIND_SCHEDULE", "DELAYED", "DISRUPTED"].includes(o.status);
      }).length;

      // Active orders as of this day (created before nextDate and not yet completed)
      const active = orders.filter((o) => {
        const created = new Date(o.orderDate);
        return created < nextDate && ["PENDING", "IN_PROGRESS", "BEHIND_SCHEDULE", "DELAYED", "DISRUPTED"].includes(o.status);
      }).length;

      days.push({ day: dayLabel, created, completed, delayed, active });
    }

    return api.success(days);
  } catch (error) {
    console.error("Daily stats error:", error);
    return api.error("Failed to fetch daily stats");
  }
}
