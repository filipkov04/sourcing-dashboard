import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import * as api from "@/lib/api";

/**
 * GET /api/invitations/[token]
 * Validate an invitation token (public endpoint)
 * Returns organization name, role, and email for the accept page
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const invitation = await prisma.userInvitation.findUnique({
      where: { token },
      include: {
        organization: { select: { name: true } },
        invitedBy: { select: { name: true, email: true } },
      },
    });

    if (!invitation) {
      return api.error("Invitation not found", 404);
    }

    if (invitation.status === "ACCEPTED") {
      return api.error("This invitation has already been used");
    }

    if (invitation.status === "REVOKED") {
      return api.error("This invitation has been revoked");
    }

    if (invitation.expiresAt < new Date()) {
      if (invitation.status !== "EXPIRED") {
        await prisma.userInvitation.update({
          where: { id: invitation.id },
          data: { status: "EXPIRED" },
        });
      }
      return api.error("This invitation has expired");
    }

    return api.success({
      email: invitation.email,
      role: invitation.role,
      organizationName: invitation.organization.name,
      invitedByName: invitation.invitedBy?.name || invitation.invitedBy?.email || "your team",
      expiresAt: invitation.expiresAt,
    });
  } catch (error) {
    console.error("Validate invitation error:", error);
    return api.error("Failed to validate invitation");
  }
}

/**
 * DELETE /api/invitations/[token]
 * Revoke an invitation (Admin/Owner only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return api.unauthorized();
    }

    const { token } = await params;

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!currentUser || !["OWNER", "ADMIN"].includes(currentUser.role)) {
      return api.error("Only admins and owners can revoke invitations", 403);
    }

    const invitation = await prisma.userInvitation.findUnique({
      where: { token },
    });

    if (!invitation) {
      return api.error("Invitation not found", 404);
    }

    if (invitation.organizationId !== session.user.organizationId) {
      return api.error("Invitation not in your organization", 403);
    }

    if (invitation.status !== "PENDING") {
      return api.error(`Cannot revoke an invitation with status: ${invitation.status}`);
    }

    const updated = await prisma.userInvitation.update({
      where: { id: invitation.id },
      data: { status: "REVOKED" },
    });

    return api.success(updated, "Invitation revoked successfully");
  } catch (error) {
    console.error("Revoke invitation error:", error);
    return api.error("Failed to revoke invitation");
  }
}
