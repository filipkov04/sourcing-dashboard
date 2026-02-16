import { prisma } from "@/lib/db";
import { success, unauthorized, handleError } from "@/lib/api";
import { auth } from "@/lib/auth";

// POST /api/presence/heartbeat — Update user's last seen timestamp
export async function POST() {
  try {
    const session = await auth();
    if (!session) return unauthorized();

    await prisma.userPresence.upsert({
      where: { userId: session.user.id },
      update: { lastSeen: new Date() },
      create: { userId: session.user.id, lastSeen: new Date() },
    });

    return success(null, "Heartbeat recorded");
  } catch (err) {
    return handleError(err);
  }
}
