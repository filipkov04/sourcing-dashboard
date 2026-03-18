import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { success, notFound, unauthorized, handleError, projectScope } from "@/lib/api";
import { auth } from "@/lib/auth";

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/conversations/[id]/settings — Get user's conversation preferences
export async function GET(request: NextRequest, { params }: RouteParams) {
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
      select: {
        muted: true,
        pinned: true,
        notifyReplies: true,
        notifyMentions: true,
      },
    });

    if (!participant) return notFound("Conversation");

    return success(participant);
  } catch (err) {
    return handleError(err);
  }
}

// PATCH /api/conversations/[id]/settings — Update user's conversation preferences
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session) return unauthorized();

    const { id } = await params;
    const body = await request.json();

    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId: id,
        userId: session.user.id,
        conversation: { ...projectScope(session) },
      },
    });

    if (!participant) return notFound("Conversation");

    // Only allow updating known settings fields
    const allowedFields = ["muted", "pinned", "notifyReplies", "notifyMentions"] as const;
    const updates: Record<string, boolean> = {};

    for (const field of allowedFields) {
      if (typeof body[field] === "boolean") {
        updates[field] = body[field];
      }
    }

    const updated = await prisma.conversationParticipant.update({
      where: {
        conversationId_userId: {
          conversationId: id,
          userId: session.user.id,
        },
      },
      data: updates,
      select: {
        muted: true,
        pinned: true,
        notifyReplies: true,
        notifyMentions: true,
      },
    });

    return success(updated);
  } catch (err) {
    return handleError(err);
  }
}
