import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import * as api from "@/lib/api";

/**
 * PATCH /api/team/[userId]
 * Update a team member's role (Admin/Owner only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return api.unauthorized();
    }

    const { userId } = await params;
    const organizationId = session.user.organizationId;

    // Check if current user is ADMIN or OWNER
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!currentUser || !["OWNER", "ADMIN"].includes(currentUser.role)) {
      return api.error("Only admins and owners can change user roles", 403);
    }

    // Get the new role from request body
    const body = await request.json();
    const { role } = body;

    if (!role || !["OWNER", "ADMIN", "MEMBER", "VIEWER"].includes(role)) {
      return api.error("Invalid role specified");
    }

    // Get the target user to verify they're in the same organization
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true, role: true },
    });

    if (!targetUser) {
      return api.error("User not found", 404);
    }

    if (targetUser.organizationId !== organizationId) {
      return api.error("User not in your organization", 403);
    }

    // Prevent changing your own role
    if (userId === session.user.id) {
      return api.error("You cannot change your own role");
    }

    // Only OWNER can assign OWNER role
    if (role === "OWNER" && currentUser.role !== "OWNER") {
      return api.error("Only owners can assign the owner role", 403);
    }

    // Prevent ADMIN from changing OWNER's role
    if (targetUser.role === "OWNER" && currentUser.role !== "OWNER") {
      return api.error("Only owners can change another owner's role", 403);
    }

    // Prevent removing the last owner
    if (targetUser.role === "OWNER" && role !== "OWNER") {
      const ownerCount = await prisma.user.count({
        where: {
          organizationId,
          role: "OWNER",
        },
      });

      if (ownerCount <= 1) {
        return api.error(
          "Cannot change the role of the last owner. Assign another owner first."
        );
      }
    }

    // Update the user's role
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return api.success(updatedUser, "User role updated successfully");
  } catch (error) {
    console.error("Team member update error:", error);
    return api.error("Failed to update team member");
  }
}

/**
 * DELETE /api/team/[userId]
 * Remove a team member (Admin/Owner only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return api.unauthorized();
    }

    const { userId } = await params;
    const organizationId = session.user.organizationId;

    // Check if current user is ADMIN or OWNER
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!currentUser || !["OWNER", "ADMIN"].includes(currentUser.role)) {
      return api.error("Only admins and owners can remove users", 403);
    }

    // Get the target user to verify they're in the same organization
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true, role: true },
    });

    if (!targetUser) {
      return api.error("User not found", 404);
    }

    if (targetUser.organizationId !== organizationId) {
      return api.error("User not in your organization", 403);
    }

    // Prevent removing yourself
    if (userId === session.user.id) {
      return api.error("You cannot remove yourself from the team");
    }

    // Prevent ADMIN from removing OWNER
    if (targetUser.role === "OWNER" && currentUser.role !== "OWNER") {
      return api.error("Only owners can remove another owner", 403);
    }

    // Prevent removing the last owner
    if (targetUser.role === "OWNER") {
      const ownerCount = await prisma.user.count({
        where: {
          organizationId,
          role: "OWNER",
        },
      });

      if (ownerCount <= 1) {
        return api.error(
          "Cannot remove the last owner. Transfer ownership first."
        );
      }
    }

    // Delete the user
    await prisma.user.delete({
      where: { id: userId },
    });

    return api.success(null, "User removed successfully");
  } catch (error) {
    console.error("Team member removal error:", error);
    return api.error("Failed to remove team member");
  }
}
