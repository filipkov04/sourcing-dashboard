import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { success, unauthorized, forbidden, notFound, handleError, noContent } from "@/lib/api";
import { NextRequest } from "next/server";
import { encryptCredentials, getCredentials } from "@/lib/integrations/encryption";

// GET /api/integrations/[id] — get integration details
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return unauthorized();

    const { id } = await params;

    const integration = await prisma.integration.findFirst({
      where: { id, organizationId: session.user.organizationId },
      include: {
        factory: { select: { id: true, name: true, location: true } },
      },
    });

    if (!integration) return notFound("Integration");

    // Mask credentials — never send raw encrypted blob to client
    const safeIntegration = {
      ...integration,
      credentials: integration.credentials
        ? { _encrypted: true, ...maskCredentials(getCredentials(integration.credentials as string)) }
        : null,
    };

    return success(safeIntegration);
  } catch (err) {
    return handleError(err);
  }
}

// PATCH /api/integrations/[id] — update integration
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return unauthorized();

    const role = session.user.role;
    if (role !== "OWNER" && role !== "ADMIN") {
      return forbidden("Only admins can update integrations");
    }

    const { id } = await params;
    const body = await req.json();
    const { name, credentials, config, syncFrequency, status } = body;

    const existing = await prisma.integration.findFirst({
      where: { id, organizationId: session.user.organizationId },
    });

    if (!existing) return notFound("Integration");

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (config !== undefined) updateData.config = config;
    if (syncFrequency !== undefined) updateData.syncFrequency = syncFrequency;
    if (status !== undefined) updateData.status = status;
    if (credentials !== undefined) {
      updateData.credentials = encryptCredentials(credentials);
    }

    const updated = await prisma.integration.update({
      where: { id },
      data: updateData,
      include: {
        factory: { select: { id: true, name: true, location: true } },
      },
    });

    return success(updated);
  } catch (err) {
    return handleError(err);
  }
}

// DELETE /api/integrations/[id] — delete integration
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return unauthorized();

    const role = session.user.role;
    if (role !== "OWNER" && role !== "ADMIN") {
      return forbidden("Only admins can delete integrations");
    }

    const { id } = await params;

    const existing = await prisma.integration.findFirst({
      where: { id, organizationId: session.user.organizationId },
    });

    if (!existing) return notFound("Integration");

    await prisma.integration.delete({ where: { id } });

    return noContent();
  } catch (err) {
    return handleError(err);
  }
}

function maskCredentials(creds: Record<string, unknown> | null): Record<string, string> {
  if (!creds) return {};
  const masked: Record<string, string> = {};
  for (const [key, val] of Object.entries(creds)) {
    if (typeof val === "string" && val.length > 4) {
      masked[key] = "••••" + val.slice(-4);
    } else {
      masked[key] = "••••";
    }
  }
  return masked;
}
