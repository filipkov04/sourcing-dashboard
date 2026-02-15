import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { success, notFound, unauthorized, handleError } from "@/lib/api";
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
        factory: { select: { id: true, name: true } },
        messages: {
          orderBy: { createdAt: "asc" },
          include: {
            sender: { select: { id: true, name: true, email: true, image: true } },
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
