import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { success, notFound, unauthorized, handleError , projectScope } from "@/lib/api";
import { auth } from "@/lib/auth";

// PATCH /api/conversations/[id]/read — Mark conversation as read
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return unauthorized();

    const { id } = await params;

    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId: id,
        userId: session.user.id,
        conversation: { ...projectScope(session) },
      },
    });

    if (!participant) return notFound("Conversation");

    await prisma.conversationParticipant.update({
      where: { conversationId_userId: { conversationId: id, userId: session.user.id } },
      data: { unreadCount: 0, lastReadAt: new Date() },
    });

    // Create MessageRead records for all unread messages
    const unreadMessages = await prisma.message.findMany({
      where: {
        conversationId: id,
        senderId: { not: session.user.id },
        readBy: { none: { userId: session.user.id } },
      },
      select: { id: true },
    });
    if (unreadMessages.length > 0) {
      await prisma.messageRead.createMany({
        data: unreadMessages.map((msg) => ({ messageId: msg.id, userId: session.user.id })),
        skipDuplicates: true,
      });
    }

    return success(null, "Marked as read");
  } catch (err) {
    return handleError(err);
  }
}
