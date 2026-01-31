import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { success, notFound, unauthorized, handleError } from "@/lib/api";
import { auth } from "@/lib/auth";

// GET /api/orders/[id] - Get a single order with all details
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

    const order = await prisma.order.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
      include: {
        factory: true,
        stages: {
          orderBy: { sequence: "asc" },
        },
      },
    });

    if (!order) {
      return notFound("Order");
    }

    return success(order);
  } catch (err) {
    return handleError(err);
  }
}
