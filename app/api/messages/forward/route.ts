import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { success, error, notFound, unauthorized, handleError } from "@/lib/api";
import { auth } from "@/lib/auth";
import { serverBroadcast } from "@/lib/realtime-server";

// POST /api/messages/forward — Forward a message to one or more conversations
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) return unauthorized();

    const body = await request.json();
    const { messageId, conversationIds } = body;

    if (!messageId || typeof messageId !== "string") {
      return error("messageId is required");
    }

    if (!Array.isArray(conversationIds) || conversationIds.length === 0) {
      return error("conversationIds must be a non-empty array");
    }

    if (conversationIds.length > 10) {
      return error("Cannot forward to more than 10 conversations at once");
    }

    // Verify source message exists and user is a participant in its conversation
    const sourceMessage = await prisma.message.findFirst({
      where: {
        id: messageId,
        deletedAt: null,
        conversation: {
          organizationId: session.user.organizationId,
          participants: {
            some: { userId: session.user.id },
          },
        },
      },
      include: {
        attachments: true,
      },
    });

    if (!sourceMessage) return notFound("Message");

    // Verify user is a participant in ALL target conversations
    const targetParticipations = await prisma.conversationParticipant.findMany({
      where: {
        userId: session.user.id,
        conversationId: { in: conversationIds },
        conversation: { organizationId: session.user.organizationId },
      },
      select: { conversationId: true },
    });

    const participatingIds = new Set(targetParticipations.map((p) => p.conversationId));
    const missingIds = conversationIds.filter((cid: string) => !participatingIds.has(cid));

    if (missingIds.length > 0) {
      return error(`Not a participant in conversation(s): ${missingIds.join(", ")}`, 403);
    }

    // Forward message to each target conversation in a transaction
    const forwardedMessages = await prisma.$transaction(async (tx) => {
      const messages = [];

      for (const targetConversationId of conversationIds) {
        // Create forwarded message
        const fwdMsg = await tx.message.create({
          data: {
            conversationId: targetConversationId,
            senderId: session.user.id,
            content: sourceMessage.content,
            messageType: "TEXT",
            forwardedFromId: messageId,
            // Reference same attachment storage paths (no re-upload)
            ...(sourceMessage.attachments.length > 0
              ? {
                  attachments: {
                    create: sourceMessage.attachments.map((att) => ({
                      fileName: att.fileName,
                      fileType: att.fileType,
                      fileSize: att.fileSize,
                      storagePath: att.storagePath,
                      uploadedById: session.user.id,
                    })),
                  },
                }
              : {}),
          },
          include: {
            sender: { select: { id: true, name: true, email: true, image: true } },
            attachments: true,
          },
        });

        // Mark sender as having read their own forwarded message
        await tx.messageRead.create({
          data: { messageId: fwdMsg.id, userId: session.user.id },
        });

        // Update conversation lastMessageAt
        await tx.conversation.update({
          where: { id: targetConversationId },
          data: { lastMessageAt: new Date() },
        });

        // Increment unread count for all other participants
        await tx.conversationParticipant.updateMany({
          where: {
            conversationId: targetConversationId,
            userId: { not: session.user.id },
          },
          data: { unreadCount: { increment: 1 } },
        });

        // Reset sender's unread count in target conversation
        await tx.conversationParticipant.update({
          where: {
            conversationId_userId: {
              conversationId: targetConversationId,
              userId: session.user.id,
            },
          },
          data: { unreadCount: 0, lastReadAt: new Date() },
        });

        messages.push(fwdMsg);
      }

      return messages;
    });

    // Broadcast new_message for each target conversation
    for (const fwdMsg of forwardedMessages) {
      serverBroadcast(fwdMsg.conversationId, {
        type: "new_message",
        messageId: fwdMsg.id,
        userId: session.user.id,
      }).catch(() => {});
    }

    return success(forwardedMessages, "Message forwarded");
  } catch (err) {
    return handleError(err);
  }
}
