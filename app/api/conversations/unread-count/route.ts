import { prisma } from "@/lib/db";
import { success, unauthorized, handleError , projectScope } from "@/lib/api";
import { auth } from "@/lib/auth";

// GET /api/conversations/unread-count — Total unread conversation count
export async function GET() {
  try {
    const session = await auth();
    if (!session) return unauthorized();

    const result = await prisma.conversationParticipant.aggregate({
      where: {
        userId: session.user.id,
        unreadCount: { gt: 0 },
        conversation: { ...projectScope(session) },
      },
      _sum: { unreadCount: true },
    });

    return success({ count: result._sum.unreadCount ?? 0 });
  } catch (err) {
    return handleError(err);
  }
}
