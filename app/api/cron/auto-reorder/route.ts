import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Auto-reorder — called by Vercel Cron daily at 6 AM UTC.
// Creates new orders from recurring orders that have autoReorder enabled
// and whose recurrenceNextDate has passed.

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  // Find all orders due for auto-reorder
  const dueOrders = await prisma.order.findMany({
    where: {
      autoReorder: true,
      recurrenceEnabled: true,
      recurrenceNextDate: { lte: now },
    },
    include: {
      stages: { orderBy: { sequence: "asc" } },
    },
  });

  let created = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const order of dueOrders) {
    try {
      const intervalDays = order.recurrenceIntervalDays ?? 60;
      const intervalMs = intervalDays * 24 * 60 * 60 * 1000;

      // Compute dates for new order
      const newExpectedStartDate = order.autoReorderStartDate
        ?? new Date(order.expectedStartDate.getTime() + intervalMs);
      const newExpectedDate = order.autoReorderEndDate
        ?? new Date(order.expectedDate.getTime() + intervalMs);
      const newOrderNumber = order.autoReorderOrderNumber ?? null;

      // Compute next recurrence date for the NEW order
      const newRecurrenceNextDate = new Date(newExpectedStartDate.getTime() + intervalMs);

      await prisma.$transaction(async (tx) => {
        // 1. Create new order
        const newOrder = await tx.order.create({
          data: {
            orderNumber: newOrderNumber,
            productName: order.productName,
            productSKU: order.productSKU,
            productImage: order.productImage,
            quantity: order.quantity,
            unit: order.unit,
            factoryId: order.factoryId,
            organizationId: order.organizationId,
            projectId: order.projectId,
            priority: order.priority,
            notes: order.notes,
            tags: order.tags,
            expectedStartDate: newExpectedStartDate,
            expectedDate: newExpectedDate,
            status: "PENDING",
            overallProgress: 0,
            // Carry forward recurrence + auto-reorder settings
            recurrenceEnabled: true,
            recurrenceIntervalDays: intervalDays,
            recurrenceNextDate: newRecurrenceNextDate,
            autoReorder: true,
            // Clear pre-set fields on new order (one-time overrides)
            autoReorderOrderNumber: null,
            autoReorderStartDate: null,
            autoReorderEndDate: null,
          },
        });

        // 2. Copy stages with shifted dates
        if (order.stages.length > 0) {
          await tx.orderStage.createMany({
            data: order.stages.map((stage) => ({
              orderId: newOrder.id,
              name: stage.name,
              sequence: stage.sequence,
              notes: stage.notes,
              metadata: stage.metadata ?? undefined,
              progress: 0,
              status: "NOT_STARTED" as const,
              expectedStartDate: stage.expectedStartDate
                ? new Date(stage.expectedStartDate.getTime() + intervalMs)
                : null,
              expectedEndDate: stage.expectedEndDate
                ? new Date(stage.expectedEndDate.getTime() + intervalMs)
                : null,
            })),
          });
        }

        // 3. Disable recurrence on old order
        await tx.order.update({
          where: { id: order.id },
          data: {
            recurrenceEnabled: false,
            autoReorder: false,
            recurrenceNextDate: null,
            recurrenceLastAlertAt: null,
            autoReorderOrderNumber: null,
            autoReorderStartDate: null,
            autoReorderEndDate: null,
          },
        });

        // 4. Create alert if no order number
        if (!newOrderNumber) {
          await tx.alert.create({
            data: {
              organizationId: order.organizationId,
              ...(order.projectId ? { projectId: order.projectId } : {}),
              orderId: newOrder.id,
              title: "Auto-created order needs an order number",
              message: `Auto-created order for "${order.productName}" needs a PO number assigned.`,
              severity: "WARNING",
            },
          });
        }
      });

      created++;
    } catch (err: unknown) {
      failed++;
      const message = err instanceof Error ? err.message : "Unknown error";
      errors.push(`Order ${order.id}: ${message}`);

      // If it was a unique constraint violation on orderNumber, retry without it
      if (message.includes("Unique constraint")) {
        try {
          const intervalDays = order.recurrenceIntervalDays ?? 60;
          const intervalMs = intervalDays * 24 * 60 * 60 * 1000;
          const newExpectedStartDate = order.autoReorderStartDate
            ?? new Date(order.expectedStartDate.getTime() + intervalMs);
          const newExpectedDate = order.autoReorderEndDate
            ?? new Date(order.expectedDate.getTime() + intervalMs);
          const newRecurrenceNextDate = new Date(newExpectedStartDate.getTime() + intervalMs);

          await prisma.$transaction(async (tx) => {
            const newOrder = await tx.order.create({
              data: {
                orderNumber: null,
                productName: order.productName,
                productSKU: order.productSKU,
                productImage: order.productImage,
                quantity: order.quantity,
                unit: order.unit,
                factoryId: order.factoryId,
                organizationId: order.organizationId,
                projectId: order.projectId,
                priority: order.priority,
                notes: order.notes,
                tags: order.tags,
                expectedStartDate: newExpectedStartDate,
                expectedDate: newExpectedDate,
                status: "PENDING",
                overallProgress: 0,
                recurrenceEnabled: true,
                recurrenceIntervalDays: intervalDays,
                recurrenceNextDate: newRecurrenceNextDate,
                autoReorder: true,
              },
            });

            if (order.stages.length > 0) {
              await tx.orderStage.createMany({
                data: order.stages.map((stage) => ({
                  orderId: newOrder.id,
                  name: stage.name,
                  sequence: stage.sequence,
                  notes: stage.notes,
                  metadata: stage.metadata ?? undefined,
                  progress: 0,
                  status: "NOT_STARTED" as const,
                  expectedStartDate: stage.expectedStartDate
                    ? new Date(stage.expectedStartDate.getTime() + intervalMs)
                    : null,
                  expectedEndDate: stage.expectedEndDate
                    ? new Date(stage.expectedEndDate.getTime() + intervalMs)
                    : null,
                })),
              });
            }

            await tx.order.update({
              where: { id: order.id },
              data: {
                recurrenceEnabled: false,
                autoReorder: false,
                recurrenceNextDate: null,
                recurrenceLastAlertAt: null,
                autoReorderOrderNumber: null,
                autoReorderStartDate: null,
                autoReorderEndDate: null,
              },
            });

            await tx.alert.create({
              data: {
                organizationId: order.organizationId,
                ...(order.projectId ? { projectId: order.projectId } : {}),
                orderId: newOrder.id,
                title: "Auto-created order needs an order number",
                message: `Auto-created order for "${order.productName}" had a duplicate PO number "${order.autoReorderOrderNumber}". Order created without a number.`,
                severity: "WARNING",
              },
            });
          });

          // Fix counts — retry succeeded
          created++;
          failed--;
          errors.pop();
        } catch (retryErr: unknown) {
          const retryMessage = retryErr instanceof Error ? retryErr.message : "Unknown error";
          errors.push(`Order ${order.id} (retry): ${retryMessage}`);
        }
      }
    }
  }

  return NextResponse.json({
    success: true,
    data: {
      ordersChecked: dueOrders.length,
      ordersCreated: created,
      ordersFailed: failed,
      ...(errors.length > 0 ? { errors } : {}),
    },
  });
}
