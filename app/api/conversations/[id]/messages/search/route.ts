import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { success, error, notFound, unauthorized, handleError, projectScope } from "@/lib/api";
import { auth } from "@/lib/auth";
import { getChatAttachmentUrl } from "@/lib/supabase";

// GET /api/conversations/[id]/messages/search?q=keyword — In-conversation message search
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return unauthorized();

    const { id } = await params;

    // Verify user is a participant
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId: id,
        userId: session.user.id,
        conversation: { ...projectScope(session) },
      },
    });

    if (!participant) return notFound("Conversation");

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim();

    if (!query || query.length === 0) {
      return error("Search query (q) is required");
    }

    if (query.length < 2) {
      return error("Search query must be at least 2 characters");
    }

    // Search within this conversation
    const messages = await prisma.message.findMany({
      where: {
        conversationId: id,
        deletedAt: null,
        content: {
          contains: query,
          mode: "insensitive",
        },
      },
      orderBy: { createdAt: "desc" },
      include: {
        sender: {
          select: { id: true, name: true, email: true, image: true },
        },
        attachments: true,
      },
    });

    // Add public URLs to attachments
    const messagesWithUrls = messages.map((msg) => ({
      ...msg,
      attachments: (msg.attachments || []).map((att) => ({
        ...att,
        url: getChatAttachmentUrl(att.storagePath),
      })),
    }));

    return success(messagesWithUrls);
  } catch (err) {
    return handleError(err);
  }
}
