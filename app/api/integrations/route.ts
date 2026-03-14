import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { success, created, unauthorized, forbidden, handleError, projectScope } from "@/lib/api";
import { NextRequest } from "next/server";
import { encryptCredentials } from "@/lib/integrations/encryption";

// GET /api/integrations — list integrations for current org/project
export async function GET() {
  try {
    const session = await auth();
    if (!session) return unauthorized();

    const integrations = await prisma.integration.findMany({
      where: projectScope(session),
      include: {
        factory: { select: { id: true, name: true, location: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return success(integrations);
  } catch (err) {
    return handleError(err);
  }
}

// POST /api/integrations — create a new integration
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return unauthorized();

    const role = session.user.role;
    if (role !== "OWNER" && role !== "ADMIN") {
      return forbidden("Only admins can create integrations");
    }

    const body = await req.json();
    const { name, type, factoryId, credentials, config, syncFrequency } = body;

    if (!name || !type || !factoryId) {
      return handleError(new Error("name, type, and factoryId are required"));
    }

    // Verify factory belongs to org
    const factory = await prisma.factory.findFirst({
      where: { id: factoryId, organizationId: session.user.organizationId },
    });

    if (!factory) {
      return handleError(new Error("Factory not found"));
    }

    const integration = await prisma.integration.create({
      data: {
        name,
        type,
        factoryId,
        organizationId: session.user.organizationId,
        projectId: session.user.projectId ?? undefined,
        credentials: credentials ? encryptCredentials(credentials) : undefined,
        config: config ?? undefined,
        syncFrequency: syncFrequency ?? 15,
        status: "PENDING",
      },
      include: {
        factory: { select: { id: true, name: true, location: true } },
      },
    });

    return created(integration);
  } catch (err) {
    return handleError(err);
  }
}
