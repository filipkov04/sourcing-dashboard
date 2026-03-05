import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { success, error, notFound, unauthorized, forbidden, handleError , projectScope } from "@/lib/api";
import { auth } from "@/lib/auth";

// PATCH /api/orders/[id]/admin-notes/[noteId] - Update an admin note
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return unauthorized();
    }

    if (!["OWNER", "ADMIN"].includes(session.user.role)) {
      return forbidden();
    }

    const { id, noteId } = await params;

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

    // Find the note and verify it belongs to this order
    const existingNote = await prisma.stageAdminNote.findFirst({
      where: {
        id: noteId,
        orderId: id,
      },
    });

    if (!existingNote) {
      return notFound("Admin note");
    }

    const body = await request.json();
    const { content, type } = body;

    const updated = await prisma.stageAdminNote.update({
      where: { id: noteId },
      data: {
        ...(content !== undefined ? { content } : {}),
        ...(type !== undefined ? { type } : {}),
      },
    });

    return success(updated);
  } catch (err) {
    return handleError(err);
  }
}

// DELETE /api/orders/[id]/admin-notes/[noteId] - Delete an admin note
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return unauthorized();
    }

    if (!["OWNER", "ADMIN"].includes(session.user.role)) {
      return forbidden();
    }

    const { id, noteId } = await params;

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

    // Find the note and verify it belongs to this order
    const existingNote = await prisma.stageAdminNote.findFirst({
      where: {
        id: noteId,
        orderId: id,
      },
    });

    if (!existingNote) {
      return notFound("Admin note");
    }

    await prisma.stageAdminNote.delete({
      where: { id: noteId },
    });

    return success({ deleted: true });
  } catch (err) {
    return handleError(err);
  }
}
