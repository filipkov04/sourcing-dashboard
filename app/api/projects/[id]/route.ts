import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { success, error, unauthorized, forbidden, notFound, noContent, handleError } from "@/lib/api";
import { auth } from "@/lib/auth";

// GET /api/projects/[id] - Get a single project
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return unauthorized();

    const { id } = await params;

    const project = await prisma.project.findFirst({
      where: { id, organizationId: session.user.organizationId },
      include: {
        _count: {
          select: { orders: true, factories: true },
        },
      },
    });

    if (!project) return notFound("Project");

    return success(project);
  } catch (err) {
    return handleError(err);
  }
}

// PATCH /api/projects/[id] - Update a project
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return unauthorized();

    if (!["OWNER", "ADMIN"].includes(session.user.role)) {
      return forbidden("Only admins can update projects");
    }

    const { id } = await params;
    const body = await request.json();
    const { name, description, color, icon } = body;

    const project = await prisma.project.findFirst({
      where: { id, organizationId: session.user.organizationId },
    });

    if (!project) return notFound("Project");

    const data: Record<string, unknown> = {};
    if (name !== undefined) {
      data.name = name.trim();
      data.slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    }
    if (description !== undefined) data.description = description;
    if (color !== undefined) data.color = color;
    if (icon !== undefined) data.icon = icon;

    const updated = await prisma.project.update({
      where: { id },
      data,
      include: {
        _count: {
          select: { orders: true, factories: true },
        },
      },
    });

    return success(updated);
  } catch (err) {
    return handleError(err);
  }
}

// DELETE /api/projects/[id] - Delete a project
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return unauthorized();

    if (!["OWNER", "ADMIN"].includes(session.user.role)) {
      return forbidden("Only admins can delete projects");
    }

    const { id } = await params;

    const project = await prisma.project.findFirst({
      where: { id, organizationId: session.user.organizationId },
    });

    if (!project) return notFound("Project");

    if (project.isDefault) {
      return error("Cannot delete the default project", 400);
    }

    // Check if project has orders
    const orderCount = await prisma.order.count({ where: { projectId: id } });
    if (orderCount > 0) {
      return error(
        `Cannot delete project with ${orderCount} order(s). Move or delete them first.`,
        400
      );
    }

    await prisma.project.delete({ where: { id } });

    return noContent();
  } catch (err) {
    return handleError(err);
  }
}
