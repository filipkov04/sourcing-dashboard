import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { success, error, unauthorized, handleError } from "@/lib/api";
import { auth } from "@/lib/auth";

// GET /api/messages/search — Global search across all user's conversations
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) return unauthorized();

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim();

    if (!query || query.length < 2) {
      return error("Search query must be at least 2 characters");
    }

    // Get all conversations the user participates in
    const participations = await prisma.conversationParticipant.findMany({
      where: {
        userId: session.user.id,
        conversation: { organizationId: session.user.organizationId },
      },
      select: { conversationId: true },
    });

    const conversationIds = participations.map((p) => p.conversationId);

    if (conversationIds.length === 0) {
      return success([]);
    }

    const messages = await prisma.message.findMany({
      where: {
        conversationId: { in: conversationIds },
        deletedAt: null,
        content: { contains: query, mode: "insensitive" },
        messageType: { in: ["TEXT", "BOT"] },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        sender: { select: { id: true, name: true, email: true, image: true } },
        conversation: {
          select: {
            id: true,
            subject: true,
            type: true,
          },
        },
      },
    });

    return success(messages);
  } catch (err) {
    return handleError(err);
  }
}
