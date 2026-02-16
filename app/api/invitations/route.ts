import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import * as api from "@/lib/api";
import { sendEmail } from "@/lib/email";

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

    // Send invitation email
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const inviteUrl = `${baseUrl}/invite/${invitation.token}`;
    const orgName = invitation.organization.name;
    const inviterName = invitation.invitedBy?.name || invitation.invitedBy?.email || "Your team";

    await sendEmail({
      to: normalizedEmail,
      subject: `You're invited to join ${orgName} on SourceTrack`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px;">
          <h2 style="color: #18181b; margin: 0 0 8px;">You've been invited</h2>
          <p style="color: #52525b; margin: 0 0 24px; font-size: 15px;">
            <strong>${inviterName}</strong> invited you to join <strong>${orgName}</strong> on SourceTrack as a <strong>${inviteRole}</strong>.
          </p>
          <a href="${inviteUrl}" style="display: inline-block; background: #f97316; color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 15px;">
            Accept Invitation
          </a>
          <p style="color: #a1a1aa; font-size: 13px; margin: 24px 0 0;">
            This invitation expires in 7 days. If you didn't expect this, you can ignore this email.
          </p>
          <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0 16px;" />
          <p style="color: #a1a1aa; font-size: 12px; margin: 0;">SourceTrack — Production tracking for brands</p>
        </div>
      `,
      text: `${inviterName} invited you to join ${orgName} on SourceTrack as a ${inviteRole}.\n\nAccept your invitation: ${inviteUrl}\n\nThis invitation expires in 7 days.`,
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
