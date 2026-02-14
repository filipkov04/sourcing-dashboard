import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { success, notFound, unauthorized, handleError } from "@/lib/api";
import { auth } from "@/lib/auth";

// PATCH /api/alerts/[id] — Update alert (mark read/resolved)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return unauthorized();
    }

    const { id } = await params;
    const body = await request.json();

    // Verify alert belongs to organization
    const alert = await prisma.alert.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
    });

    if (!alert) {
      return notFound("Alert");
    }

    const updateData: Record<string, unknown> = {};

    if (body.read !== undefined) {
      updateData.read = body.read;
    }

    if (body.resolved !== undefined) {
      updateData.resolved = body.resolved;
      if (body.resolved) {
        updateData.resolvedAt = new Date();
        updateData.resolvedBy = session.user.name || session.user.email;
      } else {
        updateData.resolvedAt = null;
        updateData.resolvedBy = null;
      }
    }

    const updated = await prisma.alert.update({
      where: { id },
      data: updateData,
    });

    return success(updated);
  } catch (err) {
    return handleError(err);
  }
}
