import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { success, created, unauthorized, handleError, validationError, projectScope, forbidden, error } from "@/lib/api";
import { auth } from "@/lib/auth";
import { z } from "zod";

// Validation schema for product creation
const createProductSchema = z.object({
  sku: z.string().min(1, "SKU is required").max(50),
  name: z.string().min(1, "Product name is required").max(200),
  description: z.string().optional(),
  category: z.string().max(100).optional(),
  weight: z.number().positive("Weight must be positive").optional(),
  length: z.number().positive("Length must be positive").optional(),
  width: z.number().positive("Width must be positive").optional(),
  height: z.number().positive("Height must be positive").optional(),
  cogs: z.number().min(0, "COGS cannot be negative").optional(),
  currency: z.string().default("USD"),
  hsCode: z.string().max(20).optional(),
  originCountry: z.string().max(100).optional(),
  minStock: z.number().int().min(0).optional(),
  maxStock: z.number().int().min(0).optional(),
  safetyStock: z.number().int().min(0).optional(),
  tags: z.array(z.string()).optional(),
  leadTimeProdDays: z.number().int().min(0).optional(),
  leadTimeShipDays: z.number().int().min(0).optional(),
  moq: z.number().int().min(1).optional(),
});

// GET /api/products - List products with search, filter, pagination
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return unauthorized();
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const category = searchParams.get("category");
    const tag = searchParams.get("tag");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));

    const where: {
      organizationId: string;
      projectId?: string;
      OR?: Array<Record<string, unknown>>;
      category?: string;
      tags?: { has: string };
    } = {
      ...projectScope(session),
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
        { category: { contains: search, mode: "insensitive" } },
      ];
    }

    if (category) {
      where.category = category;
    }

    if (tag) {
      where.tags = { has: tag };
    }

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          _count: {
            select: { stockLevels: true, transactions: true },
          },
          stockLevels: {
            select: {
              onHand: true,
              reserved: true,
              available: true,
              runwayStatus: true,
            },
          },
        },
        orderBy: { name: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return success({ items, total, page, limit, totalPages });
  } catch (err) {
    return handleError(err);
  }
}

// POST /api/products - Create a new product
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return unauthorized();
    }

    // Only ADMIN and OWNER can create products directly
    const role = session.user?.role;
    if (role !== "ADMIN" && role !== "OWNER") {
      return forbidden("Only admins can create products directly.");
    }

    const body = await request.json();

    // Validate request body
    const validation = createProductSchema.safeParse(body);
    if (!validation.success) {
      return validationError(validation.error);
    }

    const data = validation.data;

    // Check for duplicate SKU within organization
    const existingProduct = await prisma.product.findFirst({
      where: {
        organizationId: session.user.organizationId,
        sku: data.sku,
      },
    });

    if (existingProduct) {
      return error("A product with this SKU already exists in your organization", 409);
    }

    // Auto-calculate volumeCBM and isBulkCargo
    let volumeCBM: number | undefined;
    let isBulkCargo = false;

    if (data.length && data.width && data.height) {
      volumeCBM = (data.length * data.width * data.height) / 1000000;
      isBulkCargo = volumeCBM > 1;
    }

    // Create product
    const product = await prisma.product.create({
      data: {
        sku: data.sku,
        name: data.name,
        description: data.description || null,
        category: data.category || null,
        weight: data.weight ?? null,
        length: data.length ?? null,
        width: data.width ?? null,
        height: data.height ?? null,
        volumeCBM: volumeCBM ?? null,
        isBulkCargo,
        cogs: data.cogs ?? null,
        currency: data.currency,
        hsCode: data.hsCode || null,
        originCountry: data.originCountry || null,
        minStock: data.minStock ?? null,
        maxStock: data.maxStock ?? null,
        safetyStock: data.safetyStock ?? null,
        tags: data.tags || [],
        leadTimeProdDays: data.leadTimeProdDays ?? null,
        leadTimeShipDays: data.leadTimeShipDays ?? null,
        moq: data.moq ?? null,
        ...projectScope(session),
      },
      include: {
        _count: {
          select: { stockLevels: true, transactions: true },
        },
        stockLevels: {
          select: {
            onHand: true,
            reserved: true,
            available: true,
            runwayStatus: true,
          },
        },
      },
    });

    return created(product, "Product created successfully");
  } catch (err) {
    return handleError(err);
  }
}
