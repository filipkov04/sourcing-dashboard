import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import * as api from "@/lib/api";
import { z } from "zod";

const updateFolderSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).nullish(),
  sortOrder: z.number().int().min(0).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) return api.unauthorized();

    const { id } = await params;
    const existing = await prisma.chartFolder.findFirst({
      where: { id, ...api.projectScope(session), creatorId: session.user.id },
    });
    if (!existing) return api.notFound("Folder");

    const body = await request.json();
    const parsed = updateFolderSchema.safeParse(body);
    if (!parsed.success) return api.validationError(parsed.error);

    const folder = await prisma.chartFolder.update({
      where: { id },
      data: parsed.data,
    });

    return api.success(folder);
  } catch (error) {
    console.error("Chart folder update error:", error);
    return api.error("Failed to update chart folder");
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) return api.unauthorized();

    const { id } = await params;
    const existing = await prisma.chartFolder.findFirst({
      where: { id, ...api.projectScope(session), creatorId: session.user.id },
    });
    if (!existing) return api.notFound("Folder");

    // Unset folderId on charts in this folder, then delete the folder
    await prisma.$transaction([
      prisma.customChart.updateMany({ where: { folderId: id }, data: { folderId: null } }),
      prisma.chartFolder.delete({ where: { id } }),
    ]);

    return api.noContent();
  } catch (error) {
    console.error("Chart folder delete error:", error);
    return api.error("Failed to delete chart folder");
  }
}
