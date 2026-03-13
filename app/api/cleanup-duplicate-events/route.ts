import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import * as api from "@/lib/api";

/**
 * POST /api/cleanup-duplicate-events
 * Removes duplicate DELAYED/BLOCKED events created by the cron bug.
 * Keeps only the first event per (orderId, stageId, newValue) group.
 * Admin-only — delete after use.
 */
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) return api.unauthorized();
    if (!["OWNER", "ADMIN"].includes(session.user.role)) return api.forbidden();

    // Find all DELAYED/BLOCKED stage events for this org
    const events = await prisma.orderEvent.findMany({
      where: {
        order: { organizationId: session.user.organizationId },
        eventType: "STATUS_CHANGE",
        newValue: { in: ["DELAYED", "BLOCKED"] },
        stageId: { not: null },
      },
      select: { id: true, orderId: true, stageId: true, newValue: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    // Group by orderId:stageId:newValue — keep first, mark rest as duplicates
    const seen = new Map<string, string>(); // key → first event id
    const duplicateIds: string[] = [];

    for (const e of events) {
      const key = `${e.orderId}:${e.stageId}:${e.newValue}`;
      if (seen.has(key)) {
        duplicateIds.push(e.id);
      } else {
        seen.set(key, e.id);
      }
    }

    if (duplicateIds.length === 0) {
      return api.success({ message: "No duplicates found", deleted: 0 });
    }

    // Delete duplicates
    const result = await prisma.orderEvent.deleteMany({
      where: { id: { in: duplicateIds } },
    });

    return api.success({
      message: `Cleaned up ${result.count} duplicate delay events`,
      totalEvents: events.length,
      kept: events.length - result.count,
      deleted: result.count,
    });
  } catch (error) {
    console.error("Cleanup error:", error);
    return api.error("Failed to clean up: " + String(error));
  }
}

export async function GET() {
  return api.success({ message: "POST to this endpoint to clean up duplicate delay events. Admin-only." });
}
