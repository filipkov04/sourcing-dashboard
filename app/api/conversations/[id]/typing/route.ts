import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { success, unauthorized, handleError } from "@/lib/api";
import { auth } from "@/lib/auth";

const TYPING_THRESHOLD_MS = 3000;

// POST /api/conversations/[id]/typing — report that current user is typing
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return unauthorized();
    const { id } = await params;

    await prisma.conversationParticipant.updateMany({
      where: { conversationId: id, userId: session.user.id },
      data: { typingAt: new Date() },
    });

    return success({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}

// GET /api/conversations/[id]/typing — get who is currently typing
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return unauthorized();
    const { id } = await params;

    const threshold = new Date(Date.now() - TYPING_THRESHOLD_MS);

    const typing = await prisma.conversationParticipant.findMany({
      where: {
        conversationId: id,
        userId: { not: session.user.id },
        typingAt: { gte: threshold },
      },
      include: {
        user: { select: { id: true, name: true } },
      },
    });

    return success({
      typing: typing.map((p) => ({
        userId: p.userId,
        name: p.user.name,
      })),
    });
  } catch (err) {
    return handleError(err);
  }
}
