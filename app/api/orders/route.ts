import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { success, error, unauthorized, forbidden, handleError, projectScope } from "@/lib/api";
import { auth } from "@/lib/auth";
import { checkAndUpdateDelays } from "@/lib/check-delays";

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
    const validStatuses = [
      "PENDING", "IN_PROGRESS", "BEHIND_SCHEDULE", "DELAYED", "DISRUPTED",
      "COMPLETED", "SHIPPED", "IN_TRANSIT", "CUSTOMS", "DELIVERED", "CANCELLED",
    ] as const;
    const validPriorities = ["LOW", "NORMAL", "HIGH", "URGENT"] as const;

    const where: Prisma.OrderWhereInput = {
      ...projectScope(session),
    };

    if (status && (validStatuses as readonly string[]).includes(status)) {
      where.status = status as (typeof validStatuses)[number];
    }

    if (factoryId) {
      where.factoryId = factoryId;
    }

    if (priority && (validPriorities as readonly string[]).includes(priority)) {
      where.priority = priority as (typeof validPriorities)[number];
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: "insensitive" } },
        { productName: { contains: search, mode: "insensitive" } },
        { productSKU: { contains: search, mode: "insensitive" } },
      ];
    }

    const includeStages = searchParams.get("include") === "stages";

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
        stages: includeStages
          ? {
              select: {
                id: true,
                name: true,
                sequence: true,
                status: true,
                expectedStartDate: true,
                expectedEndDate: true,
                startedAt: true,
                completedAt: true,
              },
              orderBy: { sequence: "asc" },
            }
          : {
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

    // Real-time delay detection: check for overdue stages before returning
    const orderIds = orders.map((o) => o.id);
    const updatedIds = await checkAndUpdateDelays(orderIds);

    // Re-read updated orders so the response reflects current status
    let finalOrders = orders;
    if (updatedIds.length > 0) {
      finalOrders = await prisma.order.findMany({
        where,
        include: {
          factory: {
            select: {
              id: true,
              name: true,
              location: true,
            },
          },
          stages: includeStages
            ? {
                select: {
                  id: true,
                  name: true,
                  sequence: true,
                  status: true,
                  expectedStartDate: true,
                  expectedEndDate: true,
                  startedAt: true,
                  completedAt: true,
                },
                orderBy: { sequence: "asc" },
              }
            : {
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
    }

    // Add computed fields for stage status summary
    const ordersWithStageStatus = finalOrders.map((order) => ({
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

    // Only ADMIN and OWNER can create orders directly
    const role = session.user?.role;
    if (role !== "ADMIN" && role !== "OWNER") {
      return forbidden("Only admins can create orders directly. Please submit a request instead.");
    }

    const body = await request.json();

    const {
      orderNumber,
      productName,
      productSKU,
      productImage,
      quantity,
      unit,
      factoryId,
      orderDate,
      expectedDate,
      priority,
      notes,
      tags,
      stages,
      recurrenceEnabled,
      recurrenceIntervalDays,
      recurrenceNextDate,
    } = body;

    // Validate required fields
    if (!orderNumber || !productName || !quantity || !factoryId || !orderDate || !expectedDate) {
      return error("Missing required fields", 400);
    }

    // Verify factory belongs to organization
    const factory = await prisma.factory.findFirst({
      where: {
        id: factoryId,
        ...projectScope(session),
      },
    });

    if (!factory) {
      return error("Factory not found", 404);
    }

    // Compute recurrence next date if enabled but not manually provided
    let computedRecurrenceNextDate: Date | null = null;
    if (recurrenceEnabled && recurrenceIntervalDays) {
      if (recurrenceNextDate) {
        computedRecurrenceNextDate = new Date(recurrenceNextDate);
      } else {
        const base = new Date(orderDate);
        computedRecurrenceNextDate = new Date(base.getTime() + recurrenceIntervalDays * 24 * 60 * 60 * 1000);
      }
    }

    // Create order with stages
    const order = await prisma.order.create({
      data: {
        orderNumber,
        productName,
        productSKU,
        productImage: productImage || null,
        quantity,
        unit: unit || "pieces",
        factoryId,
        ...projectScope(session),
        orderDate: new Date(orderDate),
        expectedDate: new Date(expectedDate),
        priority: priority || "NORMAL",
        notes,
        tags: tags || [],
        recurrenceEnabled: recurrenceEnabled || false,
        recurrenceIntervalDays: recurrenceEnabled ? (recurrenceIntervalDays || null) : null,
        recurrenceNextDate: recurrenceEnabled ? computedRecurrenceNextDate : null,
        recurrenceLastAlertAt: null,
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
