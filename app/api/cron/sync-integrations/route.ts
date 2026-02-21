import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { integrationQueue } from "@/lib/queues/integration-queue";

// Sync scheduler — called by Vercel Cron every 15 minutes.
// Finds all active integrations that are due for a sync and enqueues BullMQ jobs.
//
// Each integration has a syncFrequency (minutes). We compare lastSyncAt against
// now to decide if it's time — this way integrations can have different frequencies
// (e.g. 15 min for REST, 60 min for SFTP) without needing separate cron schedules.
//
// Webhook integrations are push-based and are skipped.

export async function GET(request: NextRequest) {
  // Verify cron secret so only Vercel (or authorised callers) can trigger this
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  // Fetch all active, non-webhook integrations
  const integrations = await prisma.integration.findMany({
    where: {
      status: "ACTIVE",
      type: { not: "WEBHOOK" }, // webhooks are push-based
    },
    select: {
      id: true,
      factoryId: true,
      organizationId: true,
      type: true,
      syncFrequency: true,
      lastSyncAt: true,
    },
  });

  const enqueued: string[] = [];
  const skipped: string[] = [];

  for (const integration of integrations) {
    const frequencyMs = integration.syncFrequency * 60 * 1000;
    const lastSync = integration.lastSyncAt?.getTime() ?? 0;
    const isDue = now.getTime() - lastSync >= frequencyMs;

    if (!isDue) {
      skipped.push(integration.id);
      continue;
    }

    await integrationQueue.add("sync" as never, {
      integrationId: integration.id,
      factoryId: integration.factoryId,
      organizationId: integration.organizationId,
      type: integration.type,
    });

    enqueued.push(integration.id);
  }

  console.log(`[sync-scheduler] Enqueued ${enqueued.length}, skipped ${skipped.length}`);

  return NextResponse.json({
    success: true,
    enqueued: enqueued.length,
    skipped: skipped.length,
    enqueuedIds: enqueued,
  });
}
