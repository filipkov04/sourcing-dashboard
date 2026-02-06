import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import * as api from "@/lib/api";

/**
 * POST /api/invitations
 * Create a new invitation (Admin/Owner only)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return api.unauthorized();
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!currentUser || !["OWNER", "ADMIN"].includes(currentUser.role)) {
      return api.error("Only admins and owners can send invitations", 403);
    }

    const body = await request.json();
    const { email, role } = body;

    if (!email) {
      return api.error("Email is required");
    }

    const validRoles = ["OWNER", "ADMIN", "MEMBER", "VIEWER"];
    const inviteRole = role && validRoles.includes(role) ? role : "MEMBER";

    if (inviteRole === "OWNER" && currentUser.role !== "OWNER") {
      return api.error("Only owners can invite new owners", 403);
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await prisma.user.findFirst({
      where: {
        email: normalizedEmail,
        organizationId: session.user.organizationId,
      },
    });

    if (existingUser) {
      return api.error("This user is already a member of your organization");
    }

    const existingInvitation = await prisma.userInvitation.findFirst({
      where: {
        email: normalizedEmail,
        organizationId: session.user.organizationId,
        status: "PENDING",
        expiresAt: { gt: new Date() },
      },
    });

    if (existingInvitation) {
      return api.error("A pending invitation already exists for this email");
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invitation = await prisma.userInvitation.create({
      data: {
        email: normalizedEmail,
        role: inviteRole,
        organizationId: session.user.organizationId,
        invitedById: session.user.id,
        expiresAt,
      },
      include: {
        organization: { select: { name: true } },
        invitedBy: { select: { name: true, email: true } },
      },
    });

    return api.created(invitation, "Invitation sent successfully");
  } catch (error) {
    console.error("Create invitation error:", error);
    return api.error("Failed to create invitation");
  }
}

/**
 * GET /api/invitations
 * List all invitations for the current user's organization
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return api.unauthorized();
    }

    const invitations = await prisma.userInvitation.findMany({
      where: {
        organizationId: session.user.organizationId,
      },
      include: {
        invitedBy: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return api.success(invitations);
  } catch (error) {
    console.error("List invitations error:", error);
    return api.error("Failed to fetch invitations");
  }
}
