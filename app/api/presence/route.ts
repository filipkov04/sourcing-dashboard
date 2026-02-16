import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { success, error, unauthorized, handleError } from "@/lib/api";
import { auth } from "@/lib/auth";

const ONLINE_THRESHOLD_MS = 2 * 60 * 1000; // 2 minutes
const MAX_USER_IDS = 50;

// GET /api/presence?userIds=id1,id2 — Check online status of users
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) return unauthorized();

    const userIdsParam = request.nextUrl.searchParams.get("userIds");
    if (!userIdsParam) return error("userIds parameter is required");

    const userIds = userIdsParam.split(",").filter(Boolean);
    if (userIds.length === 0) return error("At least one userId is required");
    if (userIds.length > MAX_USER_IDS) return error(`Maximum ${MAX_USER_IDS} user IDs allowed`);

    const threshold = new Date(Date.now() - ONLINE_THRESHOLD_MS);

    const presenceRecords = await prisma.userPresence.findMany({
      where: {
        userId: { in: userIds },
        lastSeen: { gte: threshold },
      },
      select: { userId: true },
    });

    const onlineSet = new Set(presenceRecords.map((p) => p.userId));
    const result: Record<string, boolean> = {};
    for (const id of userIds) {
      result[id] = onlineSet.has(id);
    }

    return success(result);
  } catch (err) {
    return handleError(err);
  }
}
