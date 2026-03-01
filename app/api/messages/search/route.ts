import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { success, error, unauthorized, handleError } from "@/lib/api";
import { auth } from "@/lib/auth";
import { getChatAttachmentUrl } from "@/lib/supabase";

// GET /api/messages/search?q=keyword&limit=20&offset=0 — Global message search
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) return unauthorized();

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim();
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "20", 10), 1), 50);
    const offset = Math.max(parseInt(searchParams.get("offset") || "0", 10), 0);

    if (!query || query.length === 0) {
      return error("Search query (q) is required");
    }

    if (query.length < 2) {
      return error("Search query must be at least 2 characters");
    }

    // Search across all conversations the user participates in
    const messages = await prisma.message.findMany({
      where: {
        deletedAt: null,
        content: {
          contains: query,
          mode: "insensitive",
        },
        conversation: {
          organizationId: session.user.organizationId,
          participants: {
            some: { userId: session.user.id },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit,
      include: {
        conversation: {
          select: { id: true, subject: true, type: true },
        },
        sender: {
          select: { id: true, name: true, image: true },
        },
        attachments: true,
      },
    });

    // Count total matches for pagination
    const total = await prisma.message.count({
      where: {
        deletedAt: null,
        content: {
          contains: query,
          mode: "insensitive",
        },
        conversation: {
          organizationId: session.user.organizationId,
          participants: {
            some: { userId: session.user.id },
          },
        },
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

    return success({
      messages: messagesWithUrls,
      total,
      limit,
      offset,
    });
  } catch (err) {
    return handleError(err);
  }
}
