import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { success, notFound, unauthorized, handleError } from "@/lib/api";
import { auth } from "@/lib/auth";

// GET /api/orders/[id]/timeline - Get order event history
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return unauthorized();
    }

    const { id } = await params;

    // Verify order belongs to organization
    const order = await prisma.order.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
    });

    if (!order) {
      return notFound("Order");
    }

    // Get pagination params from URL
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Fetch events for the order
    const [events, totalCount] = await Promise.all([
      prisma.orderEvent.findMany({
        where: { orderId: id },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.orderEvent.count({
        where: { orderId: id },
      }),
    ]);

    return success({
      events,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + events.length < totalCount,
      },
    });
  } catch (err) {
    return handleError(err);
  }
}
