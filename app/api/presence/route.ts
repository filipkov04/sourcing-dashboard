import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { success, error, unauthorized, handleError } from "@/lib/api";
import { auth } from "@/lib/auth";

const ONLINE_THRESHOLD_MS = 2 * 60 * 1000; // 2 minutes
const AWAY_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes — "last seen" window
const MAX_USER_IDS = 50;

export type PresenceStatus = "online" | "away" | "busy" | "offline";

// GET /api/presence?userIds=id1,id2 — Check presence status of users
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) return unauthorized();

    const userIdsParam = request.nextUrl.searchParams.get("userIds");
    if (!userIdsParam) return error("userIds parameter is required");

    const userIds = userIdsParam.split(",").filter(Boolean);
    if (userIds.length === 0) return error("At least one userId is required");
    if (userIds.length > MAX_USER_IDS) return error(`Maximum ${MAX_USER_IDS} user IDs allowed`);

    const awayThreshold = new Date(Date.now() - AWAY_THRESHOLD_MS);
    const onlineThreshold = new Date(Date.now() - ONLINE_THRESHOLD_MS);

    // Fetch all presence records within the "away" window (10 min)
    const presenceRecords = await prisma.userPresence.findMany({
      where: {
        userId: { in: userIds },
        lastSeen: { gte: awayThreshold },
      },
      select: { userId: true, lastSeen: true, status: true },
    });

    const presenceMap = new Map(presenceRecords.map((p) => [p.userId, p]));

    const result: Record<string, PresenceStatus> = {};
    for (const id of userIds) {
      const p = presenceMap.get(id);
      if (!p) {
        // No heartbeat within 10 minutes — offline
        result[id] = "offline";
      } else if (p.lastSeen >= onlineThreshold) {
        // Active heartbeat within 2 minutes — use their reported status
        result[id] = (p.status as PresenceStatus) || "online";
      } else {
        // Heartbeat between 2-10 minutes ago — away (last seen)
        result[id] = "away";
      }
    }

    return success(result);
  } catch (err) {
    return handleError(err);
  }
}
