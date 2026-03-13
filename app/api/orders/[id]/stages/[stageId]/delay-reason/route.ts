import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { success, error, notFound, unauthorized, forbidden, created, projectScope } from "@/lib/api";
import { auth } from "@/lib/auth";

// GET /api/orders/[id]/stages/[stageId]/delay-reason
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; stageId: string }> }
) {
  try {
    const session = await auth();
    if (!session) return unauthorized();

    const { id, stageId } = await params;

    const order = await prisma.order.findFirst({
      where: { id, ...projectScope(session) },
    });
    if (!order) return notFound("Order");

    const reasons = await prisma.stageAdminNote.findMany({
      where: { orderId: id, stageId, type: "DELAY_REASON" },
      orderBy: { createdAt: "desc" },
    });

    return success(reasons);
  } catch (err) {
    console.error("[delay-reason GET]", err);
    return error("Failed to fetch delay reasons", 500);
  }
}

// POST /api/orders/[id]/stages/[stageId]/delay-reason
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; stageId: string }> }
) {
  try {
    const body = await request.json();
    const { content } = body;

    const session = await auth();
    if (!session) return unauthorized();
    if (session.user.role === "VIEWER") return forbidden();

    const { id, stageId } = await params;

    const order = await prisma.order.findFirst({
      where: { id, ...projectScope(session) },
    });
    if (!order) return notFound("Order");

    const stage = await prisma.orderStage.findFirst({
      where: { id: stageId, orderId: id },
    });
    if (!stage) return notFound("Stage");

    if (stage.status !== "DELAYED" && stage.status !== "BLOCKED") {
      return error("Delay reasons can only be added to DELAYED or BLOCKED stages");
    }

    if (!content || typeof content !== "string" || !content.trim()) {
      return error("Content is required");
    }

    const note = await prisma.stageAdminNote.create({
      data: {
        stageId,
        orderId: id,
        type: "DELAY_REASON",
        content: content.trim(),
        authorId: session.user.id,
        authorName: session.user.name || session.user.email,
      },
    });

    return created(note);
  } catch (err) {
    console.error("[delay-reason POST]", err);
    return error("Failed to create delay reason: " + String(err), 500);
  }
}

// PATCH /api/orders/[id]/stages/[stageId]/delay-reason
// Edit a delay reason. Only the original author can edit.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; stageId: string }> }
) {
  try {
    const body = await request.json();
    const { noteId, content } = body;

    const session = await auth();
    if (!session) return unauthorized();

    const { id } = await params;

    // Verify order belongs to org
    const order = await prisma.order.findFirst({
      where: { id, ...projectScope(session) },
    });
    if (!order) return notFound("Order");

    // Find the note
    const note = await prisma.stageAdminNote.findFirst({
      where: { id: noteId, orderId: id, type: "DELAY_REASON" },
    });
    if (!note) return notFound("Delay reason");

    // Only author or admin/owner can edit
    if (note.authorId !== session.user.id && !["ADMIN", "OWNER"].includes(session.user.role)) {
      return forbidden("You can only edit your own delay reasons");
    }

    if (!content || typeof content !== "string" || !content.trim()) {
      return error("Content is required");
    }

    const updated = await prisma.stageAdminNote.update({
      where: { id: noteId },
      data: { content: content.trim() },
    });

    return success(updated);
  } catch (err) {
    console.error("[delay-reason PATCH]", err);
    return error("Failed to update delay reason: " + String(err), 500);
  }
}

// DELETE /api/orders/[id]/stages/[stageId]/delay-reason
// Delete a delay reason. Only the original author or admin/owner can delete.
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; stageId: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const noteId = searchParams.get("noteId");

    const session = await auth();
    if (!session) return unauthorized();

    const { id } = await params;

    const order = await prisma.order.findFirst({
      where: { id, ...projectScope(session) },
    });
    if (!order) return notFound("Order");

    if (!noteId) return error("noteId is required");

    const note = await prisma.stageAdminNote.findFirst({
      where: { id: noteId, orderId: id, type: "DELAY_REASON" },
    });
    if (!note) return notFound("Delay reason");

    // Only author or admin/owner can delete
    if (note.authorId !== session.user.id && !["ADMIN", "OWNER"].includes(session.user.role)) {
      return forbidden("You can only delete your own delay reasons");
    }

    await prisma.stageAdminNote.delete({ where: { id: noteId } });

    return success({ deleted: true });
  } catch (err) {
    console.error("[delay-reason DELETE]", err);
    return error("Failed to delete delay reason: " + String(err), 500);
  }
}
