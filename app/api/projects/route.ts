import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { success, error, unauthorized, forbidden, handleError } from "@/lib/api";
import { auth } from "@/lib/auth";

// GET /api/projects - List all projects for the organization
export async function GET() {
  try {
    const session = await auth();
    if (!session) return unauthorized();

    const projects = await prisma.project.findMany({
      where: { organizationId: session.user.organizationId },
      include: {
        _count: {
          select: { orders: true, factories: true },
        },
      },
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    });

    return success(projects);
  } catch (err) {
    return handleError(err);
  }
}

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) return unauthorized();

    if (!["OWNER", "ADMIN"].includes(session.user.role)) {
      return forbidden("Only admins can create projects");
    }

    const body = await request.json();
    const { name, description, color, icon } = body;

    if (!name || !name.trim()) {
      return error("Project name is required", 400);
    }

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    // Check for duplicate slug in org
    const existing = await prisma.project.findUnique({
      where: {
        organizationId_slug: {
          organizationId: session.user.organizationId,
          slug,
        },
      },
    });

    if (existing) {
      return error("A project with this name already exists", 400);
    }

    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        slug,
        description: description || null,
        color: color || "#6366F1",
        icon: icon || null,
        organizationId: session.user.organizationId,
        createdById: session.user.id,
      },
      include: {
        _count: {
          select: { orders: true, factories: true },
        },
      },
    });

    return success(project, "Project created successfully", 201);
  } catch (err) {
    return handleError(err);
  }
}
