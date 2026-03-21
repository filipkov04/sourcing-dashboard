import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import * as api from "@/lib/api";

/**
 * GET /api/dashboard/delay-analysis
 * Delay breakdown: which factories delay most, how often orders slip,
 * avg days late, and delay trends over time.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return api.unauthorized();
    }

    const scope = api.projectScope(session);
    const now = new Date();

    // Query 1: All orders with factory info
    const orders = await prisma.order.findMany({
      where: scope,
      select: {
        id: true,
        status: true,
        expectedDate: true,
        actualDate: true,
        factory: { select: { id: true, name: true } },
      },
    });

    // Query 2: All DELAYED/BLOCKED stages with order + factory info
    const delayedStages = await prisma.orderStage.findMany({
      where: {
        order: scope,
        status: { in: ["DELAYED", "BLOCKED"] },
      },
      select: {
        name: true,
        status: true,
        order: {
          select: {
            id: true,
            orderNumber: true,
            productName: true,
            factory: { select: { id: true, name: true } },
          },
        },
      },
    });

    // Determine which orders are "delayed"
    const DAY_MS = 1000 * 60 * 60 * 24;

    type OrderInfo = {
      isDelayed: boolean;
      daysLate: number;
      factoryId: string;
      factoryName: string;
      expectedDate: Date;
    };

    const orderInfos: OrderInfo[] = orders.map((o) => {
      const isStatusDelayed = o.status === "BEHIND_SCHEDULE" || o.status === "DELAYED" || o.status === "DISRUPTED";
      const completedLate = o.actualDate && new Date(o.actualDate) > new Date(o.expectedDate);
      const isDelayed = isStatusDelayed || !!completedLate;

      let daysLate = 0;
      if (completedLate) {
        daysLate = Math.ceil(
          (new Date(o.actualDate!).getTime() - new Date(o.expectedDate).getTime()) / DAY_MS
        );
      } else if (isStatusDelayed && new Date(o.expectedDate) < now) {
        daysLate = Math.ceil((now.getTime() - new Date(o.expectedDate).getTime()) / DAY_MS);
      }

      return {
        isDelayed,
        daysLate,
        factoryId: o.factory.id,
        factoryName: o.factory.name,
        expectedDate: new Date(o.expectedDate),
      };
    });

    // Summary
    const totalOrders = orderInfos.length;
    const delayedOrders = orderInfos.filter((o) => o.isDelayed).length;
    const delayRate = totalOrders > 0 ? Math.round((delayedOrders / totalOrders) * 1000) / 10 : 0;
    const lateOrders = orderInfos.filter((o) => o.daysLate > 0);
    const avgDaysLate =
      lateOrders.length > 0
        ? Math.round((lateOrders.reduce((sum, o) => sum + o.daysLate, 0) / lateOrders.length) * 10) / 10
        : 0;

    // By Factory
    const factoryMap = new Map<string, { name: string; total: number; delayed: number; lateDays: number[] }>();
    for (const o of orderInfos) {
      let entry = factoryMap.get(o.factoryId);
      if (!entry) {
        entry = { name: o.factoryName, total: 0, delayed: 0, lateDays: [] };
        factoryMap.set(o.factoryId, entry);
      }
      entry.total++;
      if (o.isDelayed) {
        entry.delayed++;
        if (o.daysLate > 0) entry.lateDays.push(o.daysLate);
      }
    }

    const byFactory = Array.from(factoryMap.entries()).map(([factoryId, f]) => ({
      factoryId,
      factoryName: f.name,
      totalOrders: f.total,
      delayedCount: f.delayed,
      delayRate: f.total > 0 ? Math.round((f.delayed / f.total) * 1000) / 10 : 0,
      avgDaysLate:
        f.lateDays.length > 0
          ? Math.round((f.lateDays.reduce((a, b) => a + b, 0) / f.lateDays.length) * 10) / 10
          : 0,
    }));

    // By Stage (from delayed/blocked stages) — with order details
    type StageIncident = { orderId: string; orderNumber: string | null; productName: string; factoryName: string; status: string };
    const stageMap = new Map<string, { delayed: number; blocked: number; orders: StageIncident[] }>();
    for (const s of delayedStages) {
      let entry = stageMap.get(s.name);
      if (!entry) {
        entry = { delayed: 0, blocked: 0, orders: [] };
        stageMap.set(s.name, entry);
      }
      if (s.status === "DELAYED") entry.delayed++;
      if (s.status === "BLOCKED") entry.blocked++;
      entry.orders.push({
        orderId: s.order.id,
        orderNumber: s.order.orderNumber,
        productName: s.order.productName,
        factoryName: s.order.factory.name,
        status: s.status,
      });
    }

    const byStage = Array.from(stageMap.entries())
      .map(([stageName, data]) => ({
        stageName,
        delayedCount: data.delayed,
        blockedCount: data.blocked,
        totalIncidents: data.delayed + data.blocked,
        orders: data.orders,
      }))
      .sort((a, b) => b.totalIncidents - a.totalIncidents);

    // Trend: last 6 months bucketed by expectedDate
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const trend: Array<{ month: string; totalOrders: number; delayedOrders: number; delayRate: number }> = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthLabel = monthNames[d.getMonth()];

      const monthOrders = orderInfos.filter((o) => {
        return o.expectedDate.getFullYear() === d.getFullYear() && o.expectedDate.getMonth() === d.getMonth();
      });

      const monthTotal = monthOrders.length;
      const monthDelayed = monthOrders.filter((o) => o.isDelayed).length;

      trend.push({
        month: monthLabel,
        totalOrders: monthTotal,
        delayedOrders: monthDelayed,
        delayRate: monthTotal > 0 ? Math.round((monthDelayed / monthTotal) * 1000) / 10 : 0,
      });
    }

    return api.success({
      summary: { totalOrders, delayedOrders, delayRate, avgDaysLate },
      byFactory,
      byStage,
      trend,
    });
  } catch (error) {
    console.error("Delay analysis error:", error);
    return api.error("Failed to fetch delay analysis");
  }
}
