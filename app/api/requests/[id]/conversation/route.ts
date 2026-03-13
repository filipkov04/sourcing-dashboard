import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { success, error, unauthorized, notFound, handleError, projectScope } from "@/lib/api";

/**
 * POST /api/requests/[id]/conversation
 * Returns the existing DIRECT conversation for a request, or creates one.
 * Admin clicks → DM with the requester.
 * Requester clicks → DM with the first admin/owner.
 * No message is auto-sent — the user drafts their own with the request attached.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return unauthorized();

    const { id } = await params;

    const request = await prisma.request.findFirst({
      where: {
        id,
        ...projectScope(session),
      },
      include: {
        requester: { select: { id: true, name: true } },
      },
    });

    if (!request) return notFound("Request");

    // Only the requester or admins/owners can access
    const isAdmin = session.user.role === "ADMIN" || session.user.role === "OWNER";
    if (!isAdmin && request.requester.id !== session.user.id) {
      return error("You don't have access to this request", 403);
    }

    // If a DIRECT conversation already exists for this request, return it
    if (request.conversationId) {
      const existing = await prisma.conversation.findUnique({
        where: { id: request.conversationId },
        select: { type: true },
      });
      if (existing?.type === "DIRECT") {
        return success({ conversationId: request.conversationId });
      }
      // Old SUPPORT conversation — clear it and create a proper DIRECT one
      await prisma.request.update({
        where: { id: request.id },
        data: { conversationId: null },
      });
    }

    // Determine the other party for the DM
    let otherUserId: string;

    if (session.user.id === request.requester.id) {
      // Requester is clicking → find an admin/owner to chat with
      const admin = await prisma.user.findFirst({
        where: {
          organizationId: session.user.organizationId,
          role: { in: ["OWNER", "ADMIN"] },
          id: { not: session.user.id },
        },
        select: { id: true },
        orderBy: { createdAt: "asc" },
      });
      if (!admin) {
        return error("No admin available to chat with", 400);
      }
      otherUserId = admin.id;
    } else {
      // Admin is clicking → chat with the requester
      otherUserId = request.requester.id;
    }

    // Check for existing DIRECT conversation between these two users
    const existingDM = await prisma.conversation.findFirst({
      where: {
        organizationId: session.user.organizationId,
        type: "DIRECT",
        AND: [
          { participants: { some: { userId: session.user.id } } },
          { participants: { some: { userId: otherUserId } } },
        ],
      },
      select: { id: true },
    });

    if (existingDM) {
      // Link request to existing DM and return it
      await prisma.request.update({
        where: { id: request.id },
        data: { conversationId: existingDM.id },
      });
      return success({ conversationId: existingDM.id });
    }

    // Create a new DIRECT conversation
    const conv = await prisma.conversation.create({
      data: {
        ...projectScope(session),
        subject: null,
        type: "DIRECT",
        participants: {
          create: [
            { userId: session.user.id },
            { userId: otherUserId },
          ],
        },
        lastMessageAt: new Date(),
      },
    });

    // Link conversation back to request
    await prisma.request.update({
      where: { id: request.id },
      data: { conversationId: conv.id },
    });

    return success({ conversationId: conv.id });
  } catch (err) {
    return handleError(err);
  }
}
