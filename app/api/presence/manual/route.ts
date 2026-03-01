import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { success, error, unauthorized, handleError } from "@/lib/api";
import { auth } from "@/lib/auth";

const VALID_STATUSES = ["online", "away", "busy"];

// PATCH /api/presence/manual — Set or clear manual presence override
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) return unauthorized();

    const body = await request.json();
    const { status, customMessage } = body;

    // status=null reverts to auto-detect; otherwise validate
    if (status !== null && status !== undefined) {
      if (!VALID_STATUSES.includes(status)) {
        return error(`Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}, or null to revert to auto-detect`);
      }
    }

    // Validate customMessage length
    if (customMessage !== undefined && customMessage !== null && typeof customMessage === "string" && customMessage.length > 100) {
      return error("Custom message must be 100 characters or less");
    }

    // Upsert presence record
    const presence = await prisma.userPresence.upsert({
      where: { userId: session.user.id },
      update: {
        status: status ?? null,
        customMessage: customMessage !== undefined ? (customMessage ?? null) : undefined,
        lastSeen: new Date(),
      },
      create: {
        userId: session.user.id,
        status: status ?? null,
        customMessage: customMessage ?? null,
        lastSeen: new Date(),
      },
    });

    return success(presence);
  } catch (err) {
    return handleError(err);
  }
}
