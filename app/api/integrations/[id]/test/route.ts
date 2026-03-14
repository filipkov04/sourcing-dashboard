import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { success, unauthorized, forbidden, notFound, handleError } from "@/lib/api";
import { NextRequest } from "next/server";
import { integrationManager } from "@/lib/integrations/manager";
import "@/lib/integrations/adapters";

// POST /api/integrations/[id]/test — test connection
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return unauthorized();

    const role = session.user.role;
    if (role !== "OWNER" && role !== "ADMIN") {
      return forbidden("Only admins can test integrations");
    }

    const { id } = await params;

    const integration = await prisma.integration.findFirst({
      where: { id, organizationId: session.user.organizationId },
    });

    if (!integration) return notFound("Integration");

    const connected = await integrationManager.testConnection(id);

    // Update status based on test result
    if (connected) {
      await prisma.integration.update({
        where: { id },
        data: { status: "ACTIVE" },
      });
    }

    return success({ connected });
  } catch (err) {
    return handleError(err);
  }
}
