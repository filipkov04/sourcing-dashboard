import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import * as api from "@/lib/api";

/**
 * GET /api/dashboard/historical-delays
 * Analyze completed orders that were late, historical delay events,
 * resolution times, and delay reasons.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return api.unauthorized();
    }

    const scope = api.projectScope(session);
    const DAY_MS = 1000 * 60 * 60 * 24;

    // Query A: Completed orders with factory + stages
    const completedOrders = await prisma.order.findMany({
      where: {
        ...scope,
        status: { in: ["COMPLETED", "SHIPPED", "DELIVERED"] },
        actualDate: { not: null },
      },
      select: {
        id: true,
        orderNumber: true,
        productName: true,
        status: true,
        expectedDate: true,
        actualDate: true,
        factory: { select: { id: true, name: true } },
        stages: {
          select: {
            id: true,
            name: true,
            notes: true,
            status: true,
            startedAt: true,
            completedAt: true,
            expectedStartDate: true,
            expectedEndDate: true,
          },
        },
      },
    });

    // Query B: Historical delay events (stages that entered DELAYED/BLOCKED)
    const delayEvents = await prisma.orderEvent.findMany({
      where: {
        order: scope,
        eventType: "STATUS_CHANGE",
        newValue: { in: ["DELAYED", "BLOCKED"] },
        stageId: { not: null },
      },
      select: {
        orderId: true,
        stageId: true,
        stageName: true,
        newValue: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    // Resolution events (stages that moved out of DELAYED/BLOCKED)
    const resolutionEvents = await prisma.orderEvent.findMany({
      where: {
        order: scope,
        eventType: "STATUS_CHANGE",
        field: "status",
        newValue: { in: ["COMPLETED", "IN_PROGRESS"] },
        stageId: { not: null },
      },
      select: {
        orderId: true,
        stageId: true,
        newValue: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    // Query C: Delay reasons
    const delayReasons = await prisma.stageAdminNote.findMany({
      where: {
        order: scope,
        type: "DELAY_REASON",
      },
      select: {
        stageId: true,
        orderId: true,
        content: true,
        authorName: true,
        createdAt: true,
      },
    });

    // --- Computation ---

    // Filter to late orders (actualDate > expectedDate)
    const lateOrders = completedOrders.filter(
      (o) => new Date(o.actualDate!).getTime() > new Date(o.expectedDate).getTime()
    );

    // Summary
    const totalCompletedOrders = completedOrders.length;
    const lateCount = lateOrders.length;
    const lateRate =
      totalCompletedOrders > 0
        ? Math.round((lateCount / totalCompletedOrders) * 1000) / 10
        : 0;
    const avgDaysLate =
      lateOrders.length > 0
        ? Math.round(
            (lateOrders.reduce((sum, o) => {
              return sum + Math.ceil((new Date(o.actualDate!).getTime() - new Date(o.expectedDate).getTime()) / DAY_MS);
            }, 0) / lateOrders.length) * 10
          ) / 10
        : 0;

    // Match delay events to resolution events → compute resolution days
    const resolutionMap = new Map<string, Date>(); // key: orderId:stageId → earliest resolution after delay
    const resolutionDays: number[] = [];

    for (const de of delayEvents) {
      const key = `${de.orderId}:${de.stageId}`;
      // Find the first resolution event for this orderId+stageId after the delay event
      const resolution = resolutionEvents.find(
        (re) =>
          re.orderId === de.orderId &&
          re.stageId === de.stageId &&
          new Date(re.createdAt).getTime() > new Date(de.createdAt).getTime()
      );
      if (resolution) {
        const days = Math.ceil(
          (new Date(resolution.createdAt).getTime() - new Date(de.createdAt).getTime()) / DAY_MS
        );
        resolutionDays.push(days);
      }
    }

    const avgResolutionDays =
      resolutionDays.length > 0
        ? Math.round((resolutionDays.reduce((a, b) => a + b, 0) / resolutionDays.length) * 10) / 10
        : 0;

    // Delay reasons grouped by stageId — with order context
    type ReasonEntry = { content: string; authorName: string | null; orderId: string };
    const reasonsByStage = new Map<string, ReasonEntry[]>();
    for (const dr of delayReasons) {
      const arr = reasonsByStage.get(dr.stageId) || [];
      arr.push({ content: dr.content, authorName: dr.authorName, orderId: dr.orderId });
      reasonsByStage.set(dr.stageId, arr);
    }

    // By Factory
    const factoryMap = new Map<string, { name: string; completed: number; late: number; lateDays: number[] }>();
    for (const o of completedOrders) {
      let entry = factoryMap.get(o.factory.id);
      if (!entry) {
        entry = { name: o.factory.name, completed: 0, late: 0, lateDays: [] };
        factoryMap.set(o.factory.id, entry);
      }
      entry.completed++;
      const daysLate = Math.ceil(
        (new Date(o.actualDate!).getTime() - new Date(o.expectedDate).getTime()) / DAY_MS
      );
      if (daysLate > 0) {
        entry.late++;
        entry.lateDays.push(daysLate);
      }
    }

    const byFactory = Array.from(factoryMap.entries()).map(([factoryId, f]) => ({
      factoryId,
      factoryName: f.name,
      completedOrders: f.completed,
      lateOrders: f.late,
      lateRate: f.completed > 0 ? Math.round((f.late / f.completed) * 1000) / 10 : 0,
      avgDaysLate:
        f.lateDays.length > 0
          ? Math.round((f.lateDays.reduce((a, b) => a + b, 0) / f.lateDays.length) * 10) / 10
          : 0,
    }));

    // Build order lookup for delay event → order/factory info
    // Include ALL orders that had delay events, not just completed ones
    const delayedOrderIds = [...new Set(delayEvents.map((de) => de.orderId))];
    const allDelayedOrders = await prisma.order.findMany({
      where: { id: { in: delayedOrderIds } },
      select: {
        id: true,
        orderNumber: true,
        productName: true,
        factory: { select: { name: true } },
      },
    });
    const orderLookup = new Map<string, { orderNumber: string; productName: string; factoryName: string }>();
    for (const o of allDelayedOrders) {
      orderLookup.set(o.id, { orderNumber: o.orderNumber, productName: o.productName, factoryName: o.factory.name });
    }

    // By Stage — aggregate delay events by stageName
    type StageIncident = { orderId: string; orderNumber: string; productName: string; factoryName: string; delayType: string; incidentCount: number };
    type RichReason = { content: string; orderId: string; orderNumber: string; factoryName: string };
    const stageMap = new Map<
      string,
      { incidents: number; resolutionDays: number[]; reasons: RichReason[]; orders: StageIncident[] }
    >();

    for (const de of delayEvents) {
      const name = de.stageName || "Unknown";
      let entry = stageMap.get(name);
      if (!entry) {
        entry = { incidents: 0, resolutionDays: [], reasons: [], orders: [] };
        stageMap.set(name, entry);
      }
      entry.incidents++;

      // Track which order/factory had this delay, count repeat incidents per order
      const orderInfo = orderLookup.get(de.orderId);
      if (orderInfo) {
        const existing = entry.orders.find((o) => o.orderId === de.orderId && o.delayType === de.newValue);
        if (existing) {
          existing.incidentCount++;
        } else {
          entry.orders.push({
            orderId: de.orderId,
            orderNumber: orderInfo.orderNumber,
            productName: orderInfo.productName,
            factoryName: orderInfo.factoryName,
            delayType: de.newValue || "DELAYED",
            incidentCount: 1,
          });
        }
      }

      // Find resolution
      const resolution = resolutionEvents.find(
        (re) =>
          re.orderId === de.orderId &&
          re.stageId === de.stageId &&
          new Date(re.createdAt).getTime() > new Date(de.createdAt).getTime()
      );
      if (resolution) {
        entry.resolutionDays.push(
          Math.ceil((new Date(resolution.createdAt).getTime() - new Date(de.createdAt).getTime()) / DAY_MS)
        );
      }

      // Gather reasons for this stage — with order context
      if (de.stageId) {
        const reasons = reasonsByStage.get(de.stageId) || [];
        for (const r of reasons) {
          const rOrderInfo = orderLookup.get(r.orderId);
          entry.reasons.push({
            content: r.content,
            orderId: r.orderId,
            orderNumber: rOrderInfo?.orderNumber || "Unknown",
            factoryName: rOrderInfo?.factoryName || "Unknown",
          });
        }
      }
    }

    // Also add stage notes as fallback reasons
    for (const o of completedOrders) {
      for (const s of o.stages) {
        if (s.notes && stageMap.has(s.name)) {
          const entry = stageMap.get(s.name)!;
          if (!entry.reasons.some((r) => r.content === s.notes && r.orderId === o.id)) {
            entry.reasons.push({
              content: s.notes,
              orderId: o.id,
              orderNumber: o.orderNumber,
              factoryName: o.factory.name,
            });
          }
        }
      }
    }

    const byStage = Array.from(stageMap.entries())
      .map(([stageName, data]) => {
        // Deduplicate reasons by content+orderId
        const seen = new Set<string>();
        const reasons = data.reasons.filter((r) => {
          const key = `${r.content}::${r.orderId}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        return {
          stageName,
          delayIncidents: data.incidents,
          avgResolutionDays:
            data.resolutionDays.length > 0
              ? Math.round(
                  (data.resolutionDays.reduce((a, b) => a + b, 0) / data.resolutionDays.length) * 10
                ) / 10
              : 0,
          reasons,
          orders: data.orders,
        };
      })
      .sort((a, b) => b.delayIncidents - a.delayIncidents);

    // Recent Late Orders (last 10)
    const recentLateOrders = lateOrders
      .sort((a, b) => new Date(b.actualDate!).getTime() - new Date(a.actualDate!).getTime())
      .slice(0, 10)
      .map((o) => {
        const daysLate = Math.ceil(
          (new Date(o.actualDate!).getTime() - new Date(o.expectedDate).getTime()) / DAY_MS
        );

        // Find which stages were delayed
        const delayedStages = o.stages
          .filter((s) => {
            // Check if this stage had a delay event
            return delayEvents.some((de) => de.orderId === o.id && de.stageId === s.id);
          })
          .map((s) => {
            const stageDelayEvent = delayEvents.find(
              (de) => de.orderId === o.id && de.stageId === s.id
            );
            const stageResolution = stageDelayEvent
              ? resolutionEvents.find(
                  (re) =>
                    re.orderId === o.id &&
                    re.stageId === s.id &&
                    new Date(re.createdAt).getTime() > new Date(stageDelayEvent.createdAt).getTime()
                )
              : null;

            const delayDays = stageDelayEvent && stageResolution
              ? Math.ceil(
                  (new Date(stageResolution.createdAt).getTime() - new Date(stageDelayEvent.createdAt).getTime()) / DAY_MS
                )
              : 0;

            // Get reason
            const reasons = reasonsByStage.get(s.id);
            const reason = reasons?.[0] || s.notes || null;

            return {
              stageName: s.name,
              reason,
              delayDays,
            };
          });

        return {
          orderId: o.id,
          orderNumber: o.orderNumber,
          productName: o.productName,
          factoryName: o.factory.name,
          expectedDate: o.expectedDate,
          actualDate: o.actualDate,
          daysLate,
          delayedStages,
        };
      });

    return api.success({
      summary: {
        totalCompletedOrders,
        lateOrders: lateCount,
        lateRate,
        avgDaysLate,
        avgResolutionDays,
      },
      byFactory,
      byStage,
      recentLateOrders,
    });
  } catch (error) {
    console.error("Historical delay analysis error:", error);
    return api.error("Failed to fetch historical delay analysis");
  }
}
