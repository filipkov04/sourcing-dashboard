import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import * as api from "@/lib/api";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) return api.unauthorized();

    const { id } = await params;
    const existing = await prisma.chartAnnotation.findFirst({
      where: { id, chart: { organizationId: session.user.organizationId } },
    });
    if (!existing) return api.notFound("Annotation");

    // Only the author or an admin/owner can delete
    if (existing.authorId !== session.user.id && !["ADMIN", "OWNER"].includes(session.user.role)) {
      return api.forbidden("You can only delete your own annotations");
    }

    await prisma.chartAnnotation.delete({ where: { id } });
    return api.noContent();
  } catch (error) {
    console.error("Chart annotation delete error:", error);
    return api.error("Failed to delete annotation");
  }
}
