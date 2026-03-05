import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { success, error, notFound, unauthorized, forbidden, handleError, created , projectScope } from "@/lib/api";
import { auth } from "@/lib/auth";

const MAX_COMMENT_LENGTH = 2000;

// GET /api/orders/[id]/comments - List comments for an order
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return unauthorized();
    }

    const { id } = await params;

    // Verify order belongs to organization
    const order = await prisma.order.findFirst({
      where: {
        id,
        ...projectScope(session),
      },
    });

    if (!order) {
      return notFound("Order");
    }

    const comments = await prisma.orderComment.findMany({
      where: { orderId: id },
      orderBy: { createdAt: "asc" },
    });

    return success(comments);
  } catch (err) {
    return handleError(err);
  }
}

// POST /api/orders/[id]/comments - Create a comment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return unauthorized();
    }

    if (session.user.role === "VIEWER") {
      return forbidden("Viewers cannot post comments");
    }

    const { id } = await params;

    // Verify order belongs to organization
    const order = await prisma.order.findFirst({
      where: {
        id,
        ...projectScope(session),
      },
    });

    if (!order) {
      return notFound("Order");
    }

    const body = await request.json();
    const { content } = body;

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return error("Comment content is required");
    }

    if (content.length > MAX_COMMENT_LENGTH) {
      return error(`Comment must be ${MAX_COMMENT_LENGTH} characters or less`);
    }

    const comment = await prisma.orderComment.create({
      data: {
        orderId: id,
        content: content.trim(),
        authorId: session.user.id,
        authorName: session.user.name || session.user.email,
      },
    });

    return created(comment, "Comment posted");
  } catch (err) {
    return handleError(err);
  }
}
