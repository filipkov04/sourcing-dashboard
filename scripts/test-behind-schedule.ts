/**
 * Test BEHIND_SCHEDULE detection.
 * Sets up realistic stage data: some completed (late), one in-progress,
 * then runs checkAndUpdateDelays to verify BEHIND_SCHEDULE triggers.
 * Reverts all changes afterward.
 *
 * Usage: npx tsx scripts/test-behind-schedule.ts
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Find IN_PROGRESS order
  const order = await prisma.order.findFirst({
    where: { status: "IN_PROGRESS" },
    include: {
      stages: { orderBy: { sequence: "asc" } },
      factory: { select: { name: true } },
    },
  });

  if (!order) {
    console.log("No IN_PROGRESS orders found.");
    return;
  }

  console.log(`\n=== Order: ${order.orderNumber} — ${order.productName} ===`);
  console.log(`Expected delivery: ${order.expectedDate.toISOString().split("T")[0]}`);
  console.log(`Stages: ${order.stages.length}`);

  // Save original state for revert
  const originalStages = order.stages.map(s => ({
    id: s.id,
    status: s.status,
    expectedStartDate: s.expectedStartDate,
    expectedEndDate: s.expectedEndDate,
    startedAt: s.startedAt,
    completedAt: s.completedAt,
    progress: s.progress,
  }));
  const originalOrderStatus = order.status;

  // Set up realistic scenario:
  // Stage 1 (Cutting): COMPLETED, finished 10 days late
  // Stage 2 (Sewing): COMPLETED, finished 8 days late
  // Stage 3 (Quality Check): IN_PROGRESS, on time so far
  // Stage 4 (Packaging): NOT_STARTED
  // Total slippage: 18 days → should push past expected date
  const now = new Date();
  const stages = order.stages;

  if (stages.length >= 3) {
    // Stage 1: completed 10 days late
    await prisma.orderStage.update({
      where: { id: stages[0].id },
      data: {
        status: "COMPLETED",
        expectedStartDate: new Date(now.getTime() - 60 * 86400000),
        expectedEndDate: new Date(now.getTime() - 45 * 86400000),
        startedAt: new Date(now.getTime() - 60 * 86400000),
        completedAt: new Date(now.getTime() - 35 * 86400000), // 10 days late
        progress: 100,
      },
    });
    console.log(`  ${stages[0].name}: COMPLETED (10 days late)`);

    // Stage 2: completed 8 days late
    await prisma.orderStage.update({
      where: { id: stages[1].id },
      data: {
        status: "COMPLETED",
        expectedStartDate: new Date(now.getTime() - 45 * 86400000),
        expectedEndDate: new Date(now.getTime() - 30 * 86400000),
        startedAt: new Date(now.getTime() - 35 * 86400000),
        completedAt: new Date(now.getTime() - 22 * 86400000), // 8 days late
        progress: 100,
      },
    });
    console.log(`  ${stages[1].name}: COMPLETED (8 days late)`);

    // Stage 3: in progress, not yet overdue
    await prisma.orderStage.update({
      where: { id: stages[2].id },
      data: {
        status: "IN_PROGRESS",
        expectedStartDate: new Date(now.getTime() - 22 * 86400000),
        expectedEndDate: new Date(now.getTime() + 5 * 86400000), // ends in 5 days
        startedAt: new Date(now.getTime() - 22 * 86400000),
        completedAt: null,
        progress: 60,
      },
    });
    console.log(`  ${stages[2].name}: IN_PROGRESS (not overdue yet)`);

    // Stage 4+: not started
    for (let i = 3; i < stages.length; i++) {
      await prisma.orderStage.update({
        where: { id: stages[i].id },
        data: {
          status: "NOT_STARTED",
          expectedStartDate: new Date(now.getTime() + 5 * 86400000),
          expectedEndDate: new Date(now.getTime() + 15 * 86400000),
          startedAt: null,
          completedAt: null,
          progress: 0,
        },
      });
      console.log(`  ${stages[i].name}: NOT_STARTED`);
    }

    // Ensure order expected date is close enough that 18 days slippage matters
    // Set expected date to 20 days from now — with 18 days slippage it'll project to day 38
    const orderExpected = new Date(now.getTime() + 20 * 86400000);
    await prisma.order.update({
      where: { id: order.id },
      data: { expectedDate: orderExpected, status: "IN_PROGRESS" },
    });
    console.log(`\n  Order expected date set to: ${orderExpected.toISOString().split("T")[0]}`);
    console.log(`  Cumulative slippage: ~18 days → projected ${18} days late`);
  }

  // Run detection
  console.log("\n>>> Running checkAndUpdateDelays...");
  const { checkAndUpdateDelays } = await import("../lib/check-delays");
  const updated = await checkAndUpdateDelays([order.id]);

  const after = await prisma.order.findUnique({
    where: { id: order.id },
    select: { status: true },
  });

  console.log(`\n=== Result ===`);
  console.log(`Order status: ${originalOrderStatus} → ${after?.status}`);
  if (after?.status === "BEHIND_SCHEDULE") {
    console.log("BEHIND_SCHEDULE detection is working!\n");
  } else {
    console.log(`Expected BEHIND_SCHEDULE but got ${after?.status}\n`);
  }

  // Ask before reverting
  console.log(">>> Reverting test data...");
  for (const orig of originalStages) {
    await prisma.orderStage.update({
      where: { id: orig.id },
      data: {
        status: orig.status as never,
        expectedStartDate: orig.expectedStartDate,
        expectedEndDate: orig.expectedEndDate,
        startedAt: orig.startedAt,
        completedAt: orig.completedAt,
        progress: orig.progress,
      },
    });
  }
  await prisma.order.update({
    where: { id: order.id },
    data: { status: originalOrderStatus as never, expectedDate: order.expectedDate },
  });
  console.log("All test data reverted.\n");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
