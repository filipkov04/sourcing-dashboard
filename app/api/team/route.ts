import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import * as api from "@/lib/api";

/**
 * GET /api/team
 * Returns all team members for the current user's organization
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return api.unauthorized();
    }

    const organizationId = session.user.organizationId;

    // Get all users in the organization
    const users = await prisma.user.findMany({
      where: { organizationId },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [
        { role: "asc" }, // OWNER first, then ADMIN, MEMBER, VIEWER
        { createdAt: "asc" },
      ],
    });

    return api.success(users);
  } catch (error) {
    console.error("Team fetch error:", error);
    return api.error("Failed to fetch team members");
  }
}
