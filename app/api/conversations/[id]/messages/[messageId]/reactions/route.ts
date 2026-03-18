import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { success, error, notFound, unauthorized, handleError, projectScope } from "@/lib/api";
import { auth } from "@/lib/auth";
import { serverBroadcast } from "@/lib/realtime-server";

type RouteParams = { params: Promise<{ id: string; messageId: string }> };

// POST /api/conversations/[id]/messages/[messageId]/reactions — Toggle emoji reaction
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session) return unauthorized();

    const { id, messageId } = await params;
    const body = await request.json();
    const emoji = body.emoji?.trim();

    if (!emoji || emoji.length === 0 || emoji.length > 8) {
      return error("Invalid emoji");
    }

    // Verify message exists and user is a participant
    const message = await prisma.message.findFirst({
      where: {
        id: messageId,
        conversationId: id,
        deletedAt: null,
        conversation: {
          ...projectScope(session),
          participants: { some: { userId: session.user.id } },
        },
      },
    });

    if (!message) return notFound("Message");

    // Toggle: if reaction exists, remove it; otherwise add it
    const existing = await prisma.messageReaction.findUnique({
      where: {
        messageId_userId_emoji: {
          messageId,
          userId: session.user.id,
          emoji,
        },
      },
    });

    if (existing) {
      await prisma.messageReaction.delete({ where: { id: existing.id } });
    } else {
      await prisma.messageReaction.create({
        data: { messageId, userId: session.user.id, emoji },
      });
    }

    // Return updated reactions for this message
    const reactions = await prisma.messageReaction.findMany({
      where: { messageId },
      orderBy: { createdAt: "asc" },
    });

    serverBroadcast(id, {
      type: "reaction_changed",
      messageId,
      userId: session.user.id,
    }).catch(() => {});

    return success({
      messageId,
      reactions,
      action: existing ? "removed" : "added",
    });
  } catch (err) {
    return handleError(err);
  }
}
