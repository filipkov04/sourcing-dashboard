import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { success, error, notFound, unauthorized, forbidden, handleError , projectScope } from "@/lib/api";
import { auth } from "@/lib/auth";
import { serverBroadcast } from "@/lib/realtime-server";

type RouteParams = { params: Promise<{ id: string; messageId: string }> };

// PATCH /api/conversations/[id]/messages/[messageId] — Edit own message
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session) return unauthorized();

    const { id, messageId } = await params;

    const body = await request.json();
    const content = body.content?.trim();

    if (!content || content.length === 0) {
      return error("Message content is required");
    }

    if (content.length > 5000) {
      return error("Message must be 5000 characters or less");
    }

    // Find the message and verify ownership
    const message = await prisma.message.findFirst({
      where: {
        id: messageId,
        conversationId: id,
        conversation: {
          ...projectScope(session),
          participants: { some: { userId: session.user.id } },
        },
      },
    });

    if (!message) return notFound("Message");

    if (message.senderId !== session.user.id) {
      return forbidden("You can only edit your own messages");
    }

    if (message.deletedAt) {
      return error("Cannot edit a deleted message");
    }

    if (message.messageType !== "TEXT") {
      return error("Only text messages can be edited");
    }

    const updated = await prisma.message.update({
      where: { id: messageId },
      data: { content, editedAt: new Date() },
      include: {
        sender: { select: { id: true, name: true, email: true, image: true } },
        reactions: true,
        attachments: true,
      },
    });

    serverBroadcast(id, {
      type: "message_edited",
      messageId,
      userId: session.user.id,
    }).catch(() => {});

    return success(updated);
  } catch (err) {
    return handleError(err);
  }
}

// DELETE /api/conversations/[id]/messages/[messageId] — Soft-delete own message
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session) return unauthorized();

    const { id, messageId } = await params;

    const message = await prisma.message.findFirst({
      where: {
        id: messageId,
        conversationId: id,
        conversation: {
          ...projectScope(session),
          participants: { some: { userId: session.user.id } },
        },
      },
    });

    if (!message) return notFound("Message");

    if (message.senderId !== session.user.id) {
      return forbidden("You can only delete your own messages");
    }

    if (message.deletedAt) {
      return error("Message is already deleted");
    }

    const updated = await prisma.message.update({
      where: { id: messageId },
      data: {
        deletedAt: new Date(),
        content: "This message was deleted",
      },
    });

    serverBroadcast(id, {
      type: "message_deleted",
      messageId,
      userId: session.user.id,
    }).catch(() => {});

    return success({ id: updated.id, deletedAt: updated.deletedAt });
  } catch (err) {
    return handleError(err);
  }
}
