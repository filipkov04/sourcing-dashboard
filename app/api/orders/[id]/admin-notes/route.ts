import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { success, error, notFound, unauthorized, forbidden, handleError, created } from "@/lib/api";
import { auth } from "@/lib/auth";

// GET /api/orders/[id]/admin-notes - Fetch admin notes for an order
// All authenticated org members can read; only admins can write
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
        organizationId: session.user.organizationId,
      },
    });

    if (!order) {
      return notFound("Order");
    }

    // Get optional stageId filter
    const { searchParams } = new URL(request.url);
    const stageId = searchParams.get("stageId");

    const notes = await prisma.stageAdminNote.findMany({
      where: {
        orderId: id,
        ...(stageId ? { stageId } : {}),
      },
      orderBy: { createdAt: "desc" },
    });

    return success(notes);
  } catch (err) {
    return handleError(err);
  }
}

// POST /api/orders/[id]/admin-notes - Create an admin note
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return unauthorized();
    }

    if (!["OWNER", "ADMIN"].includes(session.user.role)) {
      return forbidden();
    }

    const { id } = await params;

    // Verify order belongs to organization
    const order = await prisma.order.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
    });

    if (!order) {
      return notFound("Order");
    }

    const body = await request.json();
    const { stageId, type, content } = body;

    if (!stageId || !content) {
      return error("stageId and content are required");
    }

    const note = await prisma.stageAdminNote.create({
      data: {
        stageId,
        orderId: id,
        type: type || "NOTE",
        content,
        authorId: session.user.id,
        authorName: session.user.name || session.user.email,
      },
    });

    return created(note);
  } catch (err) {
    return handleError(err);
  }
}
