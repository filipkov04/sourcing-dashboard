import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import * as api from "@/lib/api";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ factoryId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return api.unauthorized();
    }

    const { factoryId } = await params;

    // Verify factory belongs to user's org/project
    const factory = await prisma.factory.findFirst({
      where: {
        id: factoryId,
        ...api.projectScope(session),
      },
      select: {
        id: true,
        contactName: true,
        contactEmail: true,
        contactPhone: true,
      },
    });

    if (!factory) {
      return api.notFound("Factory");
    }

    const orders = await prisma.order.findMany({
      where: {
        factoryId,
        status: { in: ["PENDING", "IN_PROGRESS", "DELAYED", "DISRUPTED"] },
      },
      select: {
        id: true,
        orderNumber: true,
        productName: true,
        status: true,
        quantity: true,
        unit: true,
        overallProgress: true,
        expectedDate: true,
        priority: true,
      },
      orderBy: { expectedDate: "asc" },
    });

    return api.success({
      orders: orders.map((o) => ({
        ...o,
        expectedDate: o.expectedDate.toISOString(),
      })),
      contact: {
        name: factory.contactName,
        email: factory.contactEmail,
        phone: factory.contactPhone,
      },
    });
  } catch (error) {
    console.error("Factory orders error:", error);
    return api.error("Failed to fetch factory orders");
  }
}
