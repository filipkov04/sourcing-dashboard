import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { success, error, unauthorized, handleError , projectScope } from "@/lib/api";
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
      ...projectScope(session),
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

// PATCH /api/alerts — Bulk mark alerts as read
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return unauthorized();
    }

    const body = await request.json();
    const { ids, read } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return error("ids array is required");
    }

    if (ids.length > 100) {
      return error("Maximum 100 alerts per request");
    }

    const result = await prisma.alert.updateMany({
      where: {
        id: { in: ids },
        ...projectScope(session),
      },
      data: { read: read ?? true },
    });

    return success({ updated: result.count });
  } catch (err) {
    return handleError(err);
  }
}
