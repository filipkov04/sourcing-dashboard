import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { success, error, unauthorized, handleError } from "@/lib/api";
import { auth } from "@/lib/auth";

// PATCH /api/user/active-project - Switch the user's active project
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) return unauthorized();

    const { projectId } = await request.json();

    if (!projectId) {
      return error("projectId is required", 400);
    }

    // Verify project belongs to user's org
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        organizationId: session.user.organizationId,
      },
    });

    if (!project) {
      return error("Project not found or does not belong to your organization", 404);
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { activeProjectId: projectId },
    });

    return success({ projectId: project.id, projectName: project.name });
  } catch (err) {
    return handleError(err);
  }
}
