import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { success, error, notFound, unauthorized, handleError } from "@/lib/api";
import { auth } from "@/lib/auth";
import { getChatAttachmentUrl } from "@/lib/supabase";

// GET /api/conversations/[id]/messages/search — Search messages within a conversation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return unauthorized();

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim();

    if (!query || query.length < 2) {
      return error("Search query must be at least 2 characters");
    }

    // Verify user is a participant
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId: id,
        userId: session.user.id,
        conversation: { organizationId: session.user.organizationId },
      },
    });

    if (!participant) return notFound("Conversation");

    const messages = await prisma.message.findMany({
      where: {
        conversationId: id,
        deletedAt: null,
        content: { contains: query, mode: "insensitive" },
        messageType: { in: ["TEXT", "BOT"] },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        sender: { select: { id: true, name: true, email: true, image: true } },
        attachments: true,
      },
    });

    const data = messages.map((msg) => ({
      ...msg,
      attachments: msg.attachments.map((att) => ({
        ...att,
        url: getChatAttachmentUrl(att.storagePath),
      })),
    }));

    return success(data);
  } catch (err) {
    return handleError(err);
  }
}
