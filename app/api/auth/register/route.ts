import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { isEmailWhitelisted, getWhitelistErrorMessage } from "@/lib/access-control";

export async function POST(request: Request) {
  try {
    const { name, email, password, organizationName, invitationToken } = await request.json();

    // Normalize email
    const normalizedEmail = email?.trim().toLowerCase();

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // ---- INVITATION FLOW ----
    if (invitationToken) {
      const invitation = await prisma.userInvitation.findUnique({
        where: { token: invitationToken },
        include: { organization: true },
      });

      if (!invitation) {
        return NextResponse.json(
          { error: "Invalid invitation token" },
          { status: 400 }
        );
      }

      if (invitation.status !== "PENDING") {
        return NextResponse.json(
          { error: `This invitation is ${invitation.status.toLowerCase()}` },
          { status: 400 }
        );
      }

      if (invitation.expiresAt < new Date()) {
        await prisma.userInvitation.update({
          where: { id: invitation.id },
          data: { status: "EXPIRED" },
        });
        return NextResponse.json(
          { error: "This invitation has expired" },
          { status: 400 }
        );
      }

      if (invitation.email !== normalizedEmail) {
        return NextResponse.json(
          { error: "This invitation was sent to a different email address" },
          { status: 400 }
        );
      }

      // Create user and accept invitation in a transaction
      const result = await prisma.$transaction(async (tx) => {
        // Find the org's default project to set as active
        const defaultProject = await tx.project.findFirst({
          where: { organizationId: invitation.organizationId, isDefault: true },
        });

        const user = await tx.user.create({
          data: {
            name,
            email: normalizedEmail,
            password: hashedPassword,
            role: invitation.role,
            organizationId: invitation.organizationId,
            activeProjectId: defaultProject?.id || null,
          },
        });

        await tx.userInvitation.update({
          where: { id: invitation.id },
          data: { status: "ACCEPTED", acceptedAt: new Date() },
        });

        return { organization: invitation.organization, user };
      });

      return NextResponse.json(
        {
          success: true,
          message: "Account created successfully",
          data: {
            userId: result.user.id,
            organizationId: result.organization.id,
          },
        },
        { status: 201 }
      );
    }

    // ---- STANDARD REGISTRATION FLOW ----
    if (!organizationName) {
      return NextResponse.json(
        { error: "Organization name is required" },
        { status: 400 }
      );
    }

    // Check if email is whitelisted
    if (!isEmailWhitelisted(normalizedEmail)) {
      return NextResponse.json(
        { error: getWhitelistErrorMessage() },
        { status: 403 }
      );
    }

    // Create slug from organization name
    const slug = organizationName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    // Check if organization slug already exists
    const existingOrg = await prisma.organization.findUnique({
      where: { slug },
    });

    if (existingOrg) {
      return NextResponse.json(
        { error: "An organization with this name already exists" },
        { status: 400 }
      );
    }

    // Create organization, user, and default project in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          name: organizationName,
          slug,
        },
      });

      const user = await tx.user.create({
        data: {
          name,
          email: normalizedEmail,
          password: hashedPassword,
          role: "OWNER",
          organizationId: organization.id,
        },
      });

      // Create a default project and set it as the user's active project
      const project = await tx.project.create({
        data: {
          name: "Default Project",
          slug: "default",
          description: "Your first project",
          color: "#6366F1",
          organizationId: organization.id,
          createdById: user.id,
          isDefault: true,
        },
      });

      await tx.user.update({
        where: { id: user.id },
        data: { activeProjectId: project.id },
      });

      return { organization, user, project };
    });

    return NextResponse.json(
      {
        success: true,
        message: "Account created successfully",
        data: {
          userId: result.user.id,
          organizationId: result.organization.id,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
