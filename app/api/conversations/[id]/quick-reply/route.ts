import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { success, error, notFound, unauthorized, handleError, projectScope } from "@/lib/api";
import { auth } from "@/lib/auth";
import { getCategoryLabel, getAutoReply, SUPPORT_CATEGORIES } from "@/lib/chat-constants";

// POST /api/conversations/[id]/quick-reply — Select a support category (quick reply)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return unauthorized();

    const { id } = await params;
    const body = await request.json();
    const { category } = body;

    if (!category || typeof category !== "string") {
      return error("Category is required");
    }

    // Validate category exists
    const validCategories = SUPPORT_CATEGORIES.map((c) => c.key);
    if (!validCategories.includes(category)) {
      return error("Invalid category");
    }

    // Verify user is a participant
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId: id,
        userId: session.user.id,
        conversation: {
          ...projectScope(session),
          type: "SUPPORT",
        },
      },
      include: { conversation: { select: { category: true } } },
    });

    if (!participant) return notFound("Conversation");

    if (participant.conversation.category) {
      return error("Category already selected for this conversation");
    }

    const categoryLabel = getCategoryLabel("SUPPORT", category);
    const autoReply = getAutoReply(category);

    // Transaction: update category + create user message + bot reply
    const messages = await prisma.$transaction(async (tx) => {
      // Update conversation category
      await tx.conversation.update({
        where: { id },
        data: { category, lastMessageAt: new Date() },
      });

      // Create user message with category label
      const userMsg = await tx.message.create({
        data: {
          conversationId: id,
          senderId: session.user.id,
          content: categoryLabel,
          messageType: "TEXT",
        },
        include: {
          sender: { select: { id: true, name: true, email: true, image: true } },
        },
      });

      // Mark sender as having read their own message
      await tx.messageRead.create({
        data: { messageId: userMsg.id, userId: session.user.id },
      });

      // Create BOT auto-reply
      const botMsg = await tx.message.create({
        data: {
          conversationId: id,
          senderId: null,
          content: autoReply,
          messageType: "BOT",
        },
      });

      // Increment unread count for other participants
      await tx.conversationParticipant.updateMany({
        where: {
          conversationId: id,
          userId: { not: session.user.id },
        },
        data: { unreadCount: { increment: 2 } },
      });

      // Reset sender's unread count
      await tx.conversationParticipant.update({
        where: { conversationId_userId: { conversationId: id, userId: session.user.id } },
        data: { unreadCount: 0, lastReadAt: new Date() },
      });

      return [userMsg, botMsg];
    });

    return success(messages, "Quick reply sent");
  } catch (err) {
    return handleError(err);
  }
}
