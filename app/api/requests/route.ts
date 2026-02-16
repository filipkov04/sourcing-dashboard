import { NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { success, created, error, unauthorized, validationError, handleError } from "@/lib/api";

const orderRequestDataSchema = z.object({
  productName: z.string().min(1, "Product name is required").max(200),
  productSKU: z.string().max(100).optional(),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  unit: z.string().default("pieces"),
  factoryId: z.string().optional(),
  orderDate: z.string().optional(),
  expectedDate: z.string().optional(),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
  notes: z.string().max(2000).optional(),
  tags: z.array(z.string()).optional(),
  stages: z.array(z.object({
    name: z.string().min(1),
    sequence: z.number().int().min(1),
  })).optional(),
});

const factoryRequestDataSchema = z.object({
  name: z.string().min(1, "Factory name is required").max(100),
  location: z.string().min(1, "Location is required").max(100),
  address: z.string().max(500).optional(),
  contactName: z.string().max(100).optional(),
  contactEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  contactPhone: z.string().max(50).optional(),
});

const orderEditRequestDataSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
  changes: z.record(z.string(), z.unknown()),
  reason: z.string().min(1, "Reason is required").max(2000),
});

const factoryEditRequestDataSchema = z.object({
  factoryId: z.string().min(1, "Factory ID is required"),
  changes: z.record(z.string(), z.unknown()),
  reason: z.string().min(1, "Reason is required").max(2000),
});

const orderDeleteRequestDataSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
  reason: z.string().min(1, "Reason is required").max(2000),
});

const factoryDeleteRequestDataSchema = z.object({
  factoryId: z.string().min(1, "Factory ID is required"),
  reason: z.string().min(1, "Reason is required").max(2000),
});

const createRequestSchema = z.object({
  type: z.enum([
    "ORDER_REQUEST",
    "FACTORY_REQUEST",
    "ORDER_EDIT_REQUEST",
    "FACTORY_EDIT_REQUEST",
    "ORDER_DELETE_REQUEST",
    "FACTORY_DELETE_REQUEST",
  ]),
  data: z.record(z.string(), z.unknown()),
});

// GET /api/requests — List requests for the organization
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return unauthorized();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const type = searchParams.get("type");

    const where: Record<string, unknown> = {
      organizationId: session.user.organizationId,
    };
    if (status) where.status = status;
    if (type) where.type = type;

    const requests = await prisma.request.findMany({
      where,
      include: {
        requester: { select: { id: true, name: true, email: true } },
        reviewedBy: { select: { id: true, name: true, email: true } },
        targetOrder: { select: { id: true, orderNumber: true, productName: true } },
        targetFactory: { select: { id: true, name: true, location: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return success(requests);
  } catch (err) {
    return handleError(err);
  }
}

// POST /api/requests — Create a new request
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return unauthorized();

    const body = await req.json();
    const validation = createRequestSchema.safeParse(body);
    if (!validation.success) return validationError(validation.error);

    const { type, data } = validation.data;

    // Track target entity IDs for edit/delete requests
    let targetOrderId: string | undefined;
    let targetFactoryId: string | undefined;

    // Validate the data payload based on request type
    if (type === "ORDER_REQUEST") {
      const dataValidation = orderRequestDataSchema.safeParse(data);
      if (!dataValidation.success) return validationError(dataValidation.error);

      // If factoryId provided, verify it belongs to the org
      if (dataValidation.data.factoryId) {
        const factory = await prisma.factory.findFirst({
          where: {
            id: dataValidation.data.factoryId,
            organizationId: session.user.organizationId,
          },
        });
        if (!factory) return error("Factory not found", 404);
      }
    } else if (type === "FACTORY_REQUEST") {
      const dataValidation = factoryRequestDataSchema.safeParse(data);
      if (!dataValidation.success) return validationError(dataValidation.error);
    } else if (type === "ORDER_EDIT_REQUEST") {
      const dataValidation = orderEditRequestDataSchema.safeParse(data);
      if (!dataValidation.success) return validationError(dataValidation.error);

      const order = await prisma.order.findFirst({
        where: { id: dataValidation.data.orderId, organizationId: session.user.organizationId },
      });
      if (!order) return error("Order not found", 404);
      targetOrderId = order.id;
    } else if (type === "FACTORY_EDIT_REQUEST") {
      const dataValidation = factoryEditRequestDataSchema.safeParse(data);
      if (!dataValidation.success) return validationError(dataValidation.error);

      const factory = await prisma.factory.findFirst({
        where: { id: dataValidation.data.factoryId, organizationId: session.user.organizationId },
      });
      if (!factory) return error("Factory not found", 404);
      targetFactoryId = factory.id;
    } else if (type === "ORDER_DELETE_REQUEST") {
      const dataValidation = orderDeleteRequestDataSchema.safeParse(data);
      if (!dataValidation.success) return validationError(dataValidation.error);

      const order = await prisma.order.findFirst({
        where: { id: dataValidation.data.orderId, organizationId: session.user.organizationId },
      });
      if (!order) return error("Order not found", 404);
      targetOrderId = order.id;
    } else if (type === "FACTORY_DELETE_REQUEST") {
      const dataValidation = factoryDeleteRequestDataSchema.safeParse(data);
      if (!dataValidation.success) return validationError(dataValidation.error);

      const factory = await prisma.factory.findFirst({
        where: { id: dataValidation.data.factoryId, organizationId: session.user.organizationId },
      });
      if (!factory) return error("Factory not found", 404);
      targetFactoryId = factory.id;
    }

    const request = await prisma.request.create({
      data: {
        type,
        data: data as object,
        requesterId: session.user.id,
        organizationId: session.user.organizationId,
        ...(targetOrderId && { targetOrderId }),
        ...(targetFactoryId && { targetFactoryId }),
      },
      include: {
        requester: { select: { id: true, name: true, email: true } },
      },
    });

    return created(request, "Request submitted successfully");
  } catch (err) {
    return handleError(err);
  }
}
