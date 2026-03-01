import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import * as api from "@/lib/api";

/**
 * GET /api/dashboard/lead-time
 * Compute avg/min/max lead time (orderDate → actualDate)
 * grouped by factory and product. Only from completed orders.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return api.unauthorized();
    }

    const organizationId = session.user.organizationId;

    const completedOrders = await prisma.order.findMany({
      where: {
        organizationId,
        status: { in: ["COMPLETED", "SHIPPED", "DELIVERED"] },
        actualDate: { not: null },
      },
      select: {
        id: true,
        productName: true,
        orderDate: true,
        actualDate: true,
        expectedDate: true,
        factory: { select: { id: true, name: true } },
      },
    });

    // Calculate lead time in days for each order
    const ordersWithLeadTime = completedOrders.map((order) => {
      const leadDays = Math.ceil(
        (new Date(order.actualDate!).getTime() - new Date(order.orderDate).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      const expectedDays = Math.ceil(
        (new Date(order.expectedDate).getTime() - new Date(order.orderDate).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      return { ...order, leadDays, expectedDays };
    });

    // Group by factory
    const byFactory = new Map<string, { name: string; leadTimes: number[]; expectedTimes: number[] }>();
    for (const order of ordersWithLeadTime) {
      const key = order.factory.id;
      if (!byFactory.has(key)) {
        byFactory.set(key, { name: order.factory.name, leadTimes: [], expectedTimes: [] });
      }
      const entry = byFactory.get(key)!;
      entry.leadTimes.push(order.leadDays);
      entry.expectedTimes.push(order.expectedDays);
    }

    const factoryStats = Array.from(byFactory.entries()).map(([id, data]) => {
      const sorted = [...data.leadTimes].sort((a, b) => a - b);
      const avg = Math.round(sorted.reduce((a, b) => a + b, 0) / sorted.length);
      const avgExpected = Math.round(data.expectedTimes.reduce((a, b) => a + b, 0) / data.expectedTimes.length);
      return {
        factoryId: id,
        factoryName: data.name,
        avgLeadTime: avg,
        minLeadTime: sorted[0],
        maxLeadTime: sorted[sorted.length - 1],
        avgExpectedTime: avgExpected,
        orderCount: sorted.length,
        variance: avg - avgExpected, // positive = late, negative = early
      };
    });

    factoryStats.sort((a, b) => a.avgLeadTime - b.avgLeadTime);

    // Group by product
    const byProduct = new Map<string, number[]>();
    for (const order of ordersWithLeadTime) {
      if (!byProduct.has(order.productName)) {
        byProduct.set(order.productName, []);
      }
      byProduct.get(order.productName)!.push(order.leadDays);
    }

    const productStats = Array.from(byProduct.entries())
      .map(([name, times]) => {
        const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
        return { productName: name, avgLeadTime: avg, orderCount: times.length };
      })
      .sort((a, b) => a.avgLeadTime - b.avgLeadTime);

    // Overall
    const allLeadTimes = ordersWithLeadTime.map((o) => o.leadDays);
    const overallAvg = allLeadTimes.length > 0
      ? Math.round(allLeadTimes.reduce((a, b) => a + b, 0) / allLeadTimes.length)
      : 0;

    return api.success({
      overall: {
        avgLeadTime: overallAvg,
        minLeadTime: allLeadTimes.length > 0 ? Math.min(...allLeadTimes) : 0,
        maxLeadTime: allLeadTimes.length > 0 ? Math.max(...allLeadTimes) : 0,
        totalOrders: allLeadTimes.length,
      },
      byFactory: factoryStats,
      byProduct: productStats,
    });
  } catch (error) {
    console.error("Lead time analytics error:", error);
    return api.error("Failed to fetch lead time analytics");
  }
}
