import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import * as api from "@/lib/api";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return api.unauthorized();
    }

    const userId = session.user.id;

    const [user, orderCount, messageCount, presence] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { createdAt: true },
      }),
      prisma.order.count({
        where: { organization: { users: { some: { id: userId } } } },
      }),
      prisma.message.count({
        where: { senderId: userId },
      }),
      prisma.userPresence.findUnique({
        where: { userId },
        select: { lastSeen: true },
      }),
    ]);

    return api.success({
      joinDate: user?.createdAt?.toISOString() ?? null,
      lastActive: presence?.lastSeen?.toISOString() ?? null,
      orderCount,
      messagesSent: messageCount,
    });
  } catch (err) {
    return api.handleError(err);
  }
}
