import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { success, error, unauthorized, handleError } from "@/lib/api";
import { auth } from "@/lib/auth";

// GET /api/orders - Get all orders for the organization
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return unauthorized();
    }

    const { searchParams } = new URL(request.url);

    // Parse filters
    const status = searchParams.get("status");
    const factoryId = searchParams.get("factoryId");
    const search = searchParams.get("search");
    const priority = searchParams.get("priority");

    // Build where clause
    const where: any = {
      organizationId: session.user.organizationId,
    };

    if (status) {
      where.status = status;
    }

    if (factoryId) {
      where.factoryId = factoryId;
    }

    if (priority) {
      where.priority = priority;
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: "insensitive" } },
        { productName: { contains: search, mode: "insensitive" } },
        { productSKU: { contains: search, mode: "insensitive" } },
      ];
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        factory: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
        stages: {
          select: {
            status: true,
          },
        },
        _count: {
          select: { stages: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Add computed fields for stage status summary
    const ordersWithStageStatus = orders.map((order) => ({
      ...order,
      hasBlockedStage: order.stages.some((s) => s.status === "BLOCKED"),
      hasDelayedStage: order.stages.some((s) => s.status === "DELAYED"),
    }));

    return success(ordersWithStageStatus);
  } catch (err) {
    return handleError(err);
  }
}

// POST /api/orders - Create a new order
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return unauthorized();
    }

    const body = await request.json();

    const {
      orderNumber,
      productName,
      productSKU,
      quantity,
      unit,
      factoryId,
      orderDate,
      expectedDate,
      priority,
      notes,
      tags,
      stages,
    } = body;

    // Validate required fields
    if (!orderNumber || !productName || !quantity || !factoryId || !orderDate || !expectedDate) {
      return error("Missing required fields", 400);
    }

    // Verify factory belongs to organization
    const factory = await prisma.factory.findFirst({
      where: {
        id: factoryId,
        organizationId: session.user.organizationId,
      },
    });

    if (!factory) {
      return error("Factory not found", 404);
    }

    // Create order with stages
    const order = await prisma.order.create({
      data: {
        orderNumber,
        productName,
        productSKU,
        quantity,
        unit: unit || "pieces",
        factoryId,
        organizationId: session.user.organizationId,
        orderDate: new Date(orderDate),
        expectedDate: new Date(expectedDate),
        priority: priority || "NORMAL",
        notes,
        tags: tags || [],
        stages: stages
          ? {
              create: stages.map((stage: { name: string; sequence: number; notes?: string }) => ({
                name: stage.name,
                sequence: stage.sequence,
                notes: stage.notes,
              })),
            }
          : undefined,
      },
      include: {
        factory: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
        stages: {
          orderBy: { sequence: "asc" },
        },
      },
    });

    return success(order, "Order created successfully", 201);
  } catch (err) {
    return handleError(err);
  }
}
