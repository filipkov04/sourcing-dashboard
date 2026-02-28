import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { success, unauthorized, handleError } from "@/lib/api";
import { auth } from "@/lib/auth";

// POST /api/presence/heartbeat — Update user's presence status
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) return unauthorized();

    let status = "online";
    try {
      const body = await request.json();
      if (body.status === "away" || body.status === "busy") {
        status = body.status;
      }
    } catch {
      // No body or invalid JSON — default to "online"
    }

    await prisma.userPresence.upsert({
      where: { userId: session.user.id },
      update: { lastSeen: new Date(), status },
      create: { userId: session.user.id, lastSeen: new Date(), status },
    });

    return success(null, "Heartbeat recorded");
  } catch (err) {
    return handleError(err);
  }
}
