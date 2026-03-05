import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { success, error, notFound, unauthorized, forbidden, handleError , projectScope } from "@/lib/api";
import { auth } from "@/lib/auth";

const MAX_COMMENT_LENGTH = 2000;

// PATCH /api/orders/[id]/comments/[commentId] - Edit a comment
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return unauthorized();
    }

    const { id, commentId } = await params;

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

    const comment = await prisma.orderComment.findFirst({
      where: { id: commentId, orderId: id },
    });

    if (!comment) {
      return notFound("Comment");
    }

    // Only the author can edit their comment
    if (comment.authorId !== session.user.id) {
      return forbidden("You can only edit your own comments");
    }

    const body = await request.json();
    const { content } = body;

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return error("Comment content is required");
    }

    if (content.length > MAX_COMMENT_LENGTH) {
      return error(`Comment must be ${MAX_COMMENT_LENGTH} characters or less`);
    }

    const updated = await prisma.orderComment.update({
      where: { id: commentId },
      data: { content: content.trim() },
    });

    return success(updated, "Comment updated");
  } catch (err) {
    return handleError(err);
  }
}

// DELETE /api/orders/[id]/comments/[commentId] - Delete a comment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return unauthorized();
    }

    const { id, commentId } = await params;

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

    const comment = await prisma.orderComment.findFirst({
      where: { id: commentId, orderId: id },
    });

    if (!comment) {
      return notFound("Comment");
    }

    // Author can delete own comment, Admin/Owner can delete any
    const isAuthor = comment.authorId === session.user.id;
    const isAdminOrOwner = ["OWNER", "ADMIN"].includes(session.user.role);

    if (!isAuthor && !isAdminOrOwner) {
      return forbidden("You can only delete your own comments");
    }

    await prisma.orderComment.delete({
      where: { id: commentId },
    });

    return success({ id: commentId }, "Comment deleted");
  } catch (err) {
    return handleError(err);
  }
}
