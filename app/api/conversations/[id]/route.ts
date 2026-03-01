import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { success, notFound, unauthorized, forbidden, handleError } from "@/lib/api";
import { auth } from "@/lib/auth";
import { getChatAttachmentUrl } from "@/lib/supabase";

// GET /api/conversations/[id] — Get conversation with messages
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return unauthorized();

    const { id } = await params;

    const conversation = await prisma.conversation.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
        participants: { some: { userId: session.user.id } },
      },
      include: {
        participants: {
          include: { user: { select: { id: true, name: true, email: true, image: true } } },
        },
        order: { select: { id: true, orderNumber: true, productName: true } },
        factory: { select: { id: true, name: true, location: true, contactName: true, contactEmail: true, contactPhone: true } },
        request: { select: { id: true, type: true, status: true } },
        messages: {
          where: { parentId: null },
          orderBy: { createdAt: "asc" },
          include: {
            sender: { select: { id: true, name: true, email: true, image: true } },
            readBy: { select: { userId: true, readAt: true } },
            reactions: { orderBy: { createdAt: "asc" } },
            attachments: true,
          },
        },
      },
    });

    if (!conversation) return notFound("Conversation");

    // Add public URLs to attachments
    const data = {
      ...conversation,
      messages: conversation.messages.map((msg) => ({
        ...msg,
        attachments: msg.attachments.map((att) => ({
          ...att,
          url: getChatAttachmentUrl(att.storagePath),
        })),
      })),
    };

    return success(data);
  } catch (err) {
    return handleError(err);
  }
}

// DELETE /api/conversations/[id] — Delete a conversation (participant only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return unauthorized();

    if (session.user.role === "VIEWER") {
      return forbidden("Viewers cannot delete conversations");
    }

    const { id } = await params;

    // Verify user is a participant in this conversation
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId: id,
        userId: session.user.id,
        conversation: { organizationId: session.user.organizationId },
      },
    });

    if (!participant) return notFound("Conversation");

    // Cascade delete handles participants, messages, attachments, reactions, etc.
    await prisma.conversation.delete({ where: { id } });

    return success({ id }, "Conversation deleted");
  } catch (err) {
    return handleError(err);
  }
}
