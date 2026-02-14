import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { success, unauthorized, handleError } from "@/lib/api";
import { auth } from "@/lib/auth";

// GET /api/alerts — List alerts for the current organization
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return unauthorized();
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get("limit")) || 20, 100);
    const unreadOnly = searchParams.get("unread") === "true";

    const where: Record<string, unknown> = {
      organizationId: session.user.organizationId,
    };
    if (unreadOnly) {
      where.read = false;
    }

    const alerts = await prisma.alert.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        order: { select: { id: true, orderNumber: true, productName: true } },
        factory: { select: { id: true, name: true } },
      },
    });

    return success(alerts);
  } catch (err) {
    return handleError(err);
  }
}
