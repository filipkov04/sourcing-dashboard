import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import * as api from "@/lib/api";

/**
 * POST /api/seed-historical-delays
 * Seeds realistic historical delay data for testing.
 * Admin-only, dev-only endpoint — delete after testing.
 */
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return api.unauthorized();
    }
    if (!["OWNER", "ADMIN"].includes(session.user.role)) {
      return api.forbidden();
    }

    const orgId = session.user.organizationId;
    const projectId = session.user.projectId || null;

    // Get factories
    const factories = await prisma.factory.findMany({
      where: { organizationId: orgId, ...(projectId ? { projectId } : {}) },
      select: { id: true, name: true },
      take: 5,
    });

    if (factories.length === 0) {
      return api.error("No factories found. Create at least one factory first.");
    }

    const userId = session.user.id;
    const userName = session.user.name || session.user.email || "System";

    // Production stage templates
    const stageTemplates = [
      "Material Sourcing",
      "Cutting",
      "Sewing",
      "Washing",
      "Quality Check",
      "Packing",
    ];

    // Realistic order scenarios
    const scenarios = [
      {
        product: "Organic Cotton T-Shirt",
        sku: "OCT-2025-001",
        qty: 5000,
        orderDate: "2025-01-10",
        expectedDate: "2025-03-15",
        actualDate: "2025-03-28",
        status: "COMPLETED" as const,
        delayedStage: "Material Sourcing",
        delayReason: "Supplier delayed raw cotton shipment due to port congestion",
        blockedStage: null,
        blockReason: null,
      },
      {
        product: "Slim Fit Denim Jeans",
        sku: "SFD-2025-002",
        qty: 3000,
        orderDate: "2025-02-01",
        expectedDate: "2025-04-20",
        actualDate: "2025-05-08",
        status: "DELIVERED" as const,
        delayedStage: "Washing",
        delayReason: "Washing machine breakdown, parts on backorder",
        blockedStage: "Quality Check",
        blockReason: "Dye lot inconsistency detected — full re-inspection required",
      },
      {
        product: "Merino Wool Sweater",
        sku: "MWS-2025-003",
        qty: 2000,
        orderDate: "2025-01-20",
        expectedDate: "2025-04-01",
        actualDate: "2025-04-03",
        status: "SHIPPED" as const,
        delayedStage: "Sewing",
        delayReason: "Complex cable-knit pattern slowed production line",
        blockedStage: null,
        blockReason: null,
      },
      {
        product: "Linen Summer Dress",
        sku: "LSD-2025-004",
        qty: 4000,
        orderDate: "2025-03-05",
        expectedDate: "2025-05-25",
        actualDate: "2025-06-10",
        status: "COMPLETED" as const,
        delayedStage: "Cutting",
        delayReason: "Pattern grading errors required re-cutting 40% of fabric",
        blockedStage: "Material Sourcing",
        blockReason: "Linen supplier went bankrupt, had to find alternative source",
      },
      {
        product: "Performance Running Shorts",
        sku: "PRS-2025-005",
        qty: 8000,
        orderDate: "2025-02-15",
        expectedDate: "2025-04-30",
        actualDate: "2025-05-20",
        status: "DELIVERED" as const,
        delayedStage: "Quality Check",
        delayReason: "Elastic waistband failed stretch test, needed replacement batch",
        blockedStage: null,
        blockReason: null,
      },
      {
        product: "Silk Blouse Collection",
        sku: "SBC-2025-006",
        qty: 1500,
        orderDate: "2025-04-01",
        expectedDate: "2025-06-15",
        actualDate: "2025-07-02",
        status: "COMPLETED" as const,
        delayedStage: "Sewing",
        delayReason: "Silk fabric too delicate for standard needles, had to switch equipment",
        blockedStage: "Packing",
        blockReason: "Custom tissue paper packaging stock depleted, waiting on print run",
      },
      {
        product: "Recycled Polyester Hoodie",
        sku: "RPH-2025-007",
        qty: 6000,
        orderDate: "2025-03-20",
        expectedDate: "2025-06-01",
        actualDate: "2025-06-15",
        status: "SHIPPED" as const,
        delayedStage: "Material Sourcing",
        delayReason: "Recycled polyester yarn certification delay from supplier",
        blockedStage: null,
        blockReason: null,
      },
      {
        product: "Cashmere Scarf Set",
        sku: "CSS-2025-008",
        qty: 3000,
        orderDate: "2025-05-01",
        expectedDate: "2025-07-15",
        actualDate: "2025-08-05",
        status: "DELIVERED" as const,
        delayedStage: "Washing",
        delayReason: "Softening treatment required extra cycles for premium hand feel",
        blockedStage: "Sewing",
        blockReason: "Key operator on medical leave, no trained replacement available",
      },
      // Orders that were on time (to have a mix)
      {
        product: "Basic Cotton Polo",
        sku: "BCP-2025-009",
        qty: 10000,
        orderDate: "2025-01-05",
        expectedDate: "2025-03-20",
        actualDate: "2025-03-18",
        status: "COMPLETED" as const,
        delayedStage: null,
        delayReason: null,
        blockedStage: null,
        blockReason: null,
      },
      {
        product: "Nylon Windbreaker",
        sku: "NWB-2025-010",
        qty: 4000,
        orderDate: "2025-02-10",
        expectedDate: "2025-04-25",
        actualDate: "2025-04-22",
        status: "DELIVERED" as const,
        delayedStage: null,
        delayReason: null,
        blockedStage: null,
        blockReason: null,
      },
      {
        product: "Bamboo Fiber Socks (12-pack)",
        sku: "BFS-2025-011",
        qty: 20000,
        orderDate: "2025-04-15",
        expectedDate: "2025-06-10",
        actualDate: "2025-06-08",
        status: "COMPLETED" as const,
        delayedStage: null,
        delayReason: null,
        blockedStage: null,
        blockReason: null,
      },
      {
        product: "Canvas Tote Bag",
        sku: "CTB-2025-012",
        qty: 15000,
        orderDate: "2025-05-20",
        expectedDate: "2025-07-10",
        actualDate: "2025-07-08",
        status: "SHIPPED" as const,
        delayedStage: null,
        delayReason: null,
        blockedStage: null,
        blockReason: null,
      },
      // Currently DELAYED order — for testing delay reason input live
      {
        product: "Heavyweight Flannel Shirt",
        sku: "HFS-2026-013",
        qty: 3500,
        orderDate: "2026-01-15",
        expectedDate: "2026-03-25",
        actualDate: null as any, // still in progress
        status: "DELAYED" as const,
        delayedStage: "Sewing",
        delayReason: null, // no reason yet — user should add one
        blockedStage: null,
        blockReason: null,
      },
    ];

    const created: string[] = [];

    for (let i = 0; i < scenarios.length; i++) {
      const s = scenarios[i];
      const factory = factories[i % factories.length];
      const orderNum = `HIST-${String(i + 1).padStart(3, "0")}`;

      // Check if order already exists
      const existing = await prisma.order.findFirst({
        where: { organizationId: orgId, orderNumber: orderNum },
      });
      if (existing) {
        created.push(`${orderNum} (skipped — already exists)`);
        continue;
      }

      const orderDate = new Date(s.orderDate);
      const expectedDate = new Date(s.expectedDate);
      const actualDate = s.actualDate ? new Date(s.actualDate) : null;
      const isCurrentlyActive = !actualDate; // order still in progress

      // For active orders, use "now" as the reference end date for stage spacing
      const refEndDate = actualDate || new Date();
      const totalDays = Math.ceil((refEndDate.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
      const daysPerStage = Math.floor(totalDays / stageTemplates.length);

      // Determine which stage index the delayed/blocked stage is at
      const delayedStageIdx = s.delayedStage ? stageTemplates.indexOf(s.delayedStage) : -1;
      const blockedStageIdx = s.blockedStage ? stageTemplates.indexOf(s.blockedStage) : -1;

      // For active orders, figure out overall progress
      let overallProgress = 100;
      if (isCurrentlyActive && delayedStageIdx >= 0) {
        // Stages before the delayed one are complete
        overallProgress = Math.round((delayedStageIdx / stageTemplates.length) * 100);
      }

      // Create order
      const order = await prisma.order.create({
        data: {
          orderNumber: orderNum,
          productName: s.product,
          productSKU: s.sku,
          quantity: s.qty,
          unit: "pieces",
          status: s.status,
          overallProgress,
          orderDate,
          expectedDate,
          actualDate,
          priority: s.delayedStage ? "HIGH" : "NORMAL",
          organizationId: orgId,
          ...(projectId ? { projectId } : {}),
          factoryId: factory.id,
        },
      });

      // Create stages
      for (let j = 0; j < stageTemplates.length; j++) {
        const stageName = stageTemplates[j];
        const stageStart = new Date(orderDate.getTime() + j * daysPerStage * 86400000);
        const stageEnd = new Date(orderDate.getTime() + (j + 1) * daysPerStage * 86400000);
        const expectedStageEnd = new Date(orderDate.getTime() + ((j + 1) * Math.floor((expectedDate.getTime() - orderDate.getTime()) / (stageTemplates.length * 86400000))) * 86400000);

        // For currently active orders, set stage statuses appropriately
        let stageStatus: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "SKIPPED" | "DELAYED" | "BLOCKED" = "COMPLETED";
        let stageProgress = 100;
        let stageStartedAt: Date | null = stageStart;
        let stageCompletedAt: Date | null = stageEnd;

        if (isCurrentlyActive) {
          if (j < delayedStageIdx) {
            stageStatus = "COMPLETED";
          } else if (j === delayedStageIdx) {
            stageStatus = "DELAYED";
            stageProgress = 40;
            stageCompletedAt = null;
          } else {
            stageStatus = "NOT_STARTED";
            stageProgress = 0;
            stageStartedAt = null;
            stageCompletedAt = null;
          }
        }

        await prisma.orderStage.create({
          data: {
            orderId: order.id,
            name: stageName,
            sequence: j + 1,
            progress: stageProgress,
            status: stageStatus,
            startedAt: stageStartedAt,
            completedAt: stageCompletedAt,
            expectedStartDate: new Date(orderDate.getTime() + j * Math.floor((expectedDate.getTime() - orderDate.getTime()) / stageTemplates.length)),
            expectedEndDate: expectedStageEnd,
            notes: stageName === s.delayedStage ? s.delayReason : stageName === s.blockedStage ? s.blockReason : null,
          },
        });
      }

      // Fetch stages to get IDs
      const stages = await prisma.orderStage.findMany({
        where: { orderId: order.id },
        orderBy: { sequence: "asc" },
      });

      // Create delay events for delayed stage
      if (s.delayedStage) {
        const delayedStage = stages.find((st) => st.name === s.delayedStage);
        if (delayedStage && delayedStage.startedAt) {
          const delayStart = new Date(delayedStage.startedAt.getTime() + 3 * 86400000);
          const delayEnd = new Date(delayStart.getTime() + 7 * 86400000);

          // Stage goes DELAYED
          await prisma.orderEvent.create({
            data: {
              orderId: order.id,
              stageId: delayedStage.id,
              eventType: "STATUS_CHANGE",
              field: "status",
              oldValue: "IN_PROGRESS",
              newValue: "DELAYED",
              stageName: delayedStage.name,
              createdAt: delayStart,
            },
          });

          // Only add resolution + completion events for completed stages
          if (delayedStage.completedAt) {
            await prisma.orderEvent.create({
              data: {
                orderId: order.id,
                stageId: delayedStage.id,
                eventType: "STATUS_CHANGE",
                field: "status",
                oldValue: "DELAYED",
                newValue: "IN_PROGRESS",
                stageName: delayedStage.name,
                createdAt: delayEnd,
              },
            });

            await prisma.orderEvent.create({
              data: {
                orderId: order.id,
                stageId: delayedStage.id,
                eventType: "STATUS_CHANGE",
                field: "status",
                oldValue: "IN_PROGRESS",
                newValue: "COMPLETED",
                stageName: delayedStage.name,
                createdAt: delayedStage.completedAt,
              },
            });
          }

          // Add delay reason note
          if (s.delayReason) {
            await prisma.stageAdminNote.create({
              data: {
                stageId: delayedStage.id,
                orderId: order.id,
                type: "DELAY_REASON",
                content: s.delayReason,
                authorId: userId,
                authorName: userName,
                createdAt: new Date(delayStart.getTime() + 86400000),
              },
            });
          }
        }
      }

      // Create blocked events for blocked stage
      if (s.blockedStage) {
        const blockedStage = stages.find((st) => st.name === s.blockedStage);
        if (blockedStage && blockedStage.startedAt) {
          const blockStart = new Date(blockedStage.startedAt.getTime() + 2 * 86400000);
          const blockEnd = new Date(blockStart.getTime() + 10 * 86400000);

          await prisma.orderEvent.create({
            data: {
              orderId: order.id,
              stageId: blockedStage.id,
              eventType: "STATUS_CHANGE",
              field: "status",
              oldValue: "IN_PROGRESS",
              newValue: "BLOCKED",
              stageName: blockedStage.name,
              createdAt: blockStart,
            },
          });

          if (blockedStage.completedAt) {
            await prisma.orderEvent.create({
              data: {
                orderId: order.id,
                stageId: blockedStage.id,
                eventType: "STATUS_CHANGE",
                field: "status",
                oldValue: "BLOCKED",
                newValue: "IN_PROGRESS",
                stageName: blockedStage.name,
                createdAt: blockEnd,
              },
            });

            await prisma.orderEvent.create({
              data: {
                orderId: order.id,
                stageId: blockedStage.id,
                eventType: "STATUS_CHANGE",
                field: "status",
                oldValue: "IN_PROGRESS",
                newValue: "COMPLETED",
                stageName: blockedStage.name,
                createdAt: blockedStage.completedAt,
              },
            });
          }

          if (s.blockReason) {
            await prisma.stageAdminNote.create({
              data: {
                stageId: blockedStage.id,
                orderId: order.id,
                type: "DELAY_REASON",
                content: s.blockReason,
                authorId: userId,
                authorName: userName,
                createdAt: new Date(blockStart.getTime() + 86400000),
              },
            });
          }
        }
      }

      const lateLabel = !actualDate ? "in-progress" : actualDate > expectedDate ? "LATE" : "on-time";
      created.push(`${orderNum} — ${s.product} (${s.status}, ${lateLabel})`);
    }

    return api.success({ message: "Seed complete", orders: created });
  } catch (error) {
    console.error("Seed error:", error);
    return api.error("Failed to seed data: " + String(error));
  }
}

// Also support GET for easy browser triggering (just returns info)
export async function GET() {
  return api.success({ message: "POST to this endpoint to seed historical delay data. Admin-only." });
}
