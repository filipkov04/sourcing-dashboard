import { NextResponse } from "next/server";
import { integrationQueue } from "@/lib/queues/integration-queue";

// POST /api/jobs/test — enqueue a test job (dev only)
export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  const job = await integrationQueue.add("sync" as never, {
    integrationId: "test-integration-id",
    factoryId: "test-factory-id",
    organizationId: "test-org-id",
    type: "MANUAL",
  });

  const counts = await integrationQueue.getJobCounts();

  return NextResponse.json({
    success: true,
    jobId: job.id,
    queueCounts: counts,
  });
}

// GET /api/jobs/test — check queue status
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  const counts = await integrationQueue.getJobCounts();
  return NextResponse.json({ success: true, queueCounts: counts });
}
