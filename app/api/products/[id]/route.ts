import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { success, notFound, unauthorized, handleError, error, validationError, projectScope } from "@/lib/api";
import { auth } from "@/lib/auth";
import { z } from "zod";

// GET /api/products/[id] - Get a single product with stock levels and transaction count
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

    const product = await prisma.product.findFirst({
      where: {
        id,
        ...projectScope(session),
      },
      include: {
        stockLevels: {
          include: {
            location: true,
          },
          orderBy: {
            location: { name: "asc" },
          },
        },
        _count: {
          select: { transactions: true },
        },
      },
    });

    if (!product) {
      return notFound("Product not found");
    }

    return success(product);
  } catch (err) {
    return handleError(err);
  }
}

// Validation schema for product update
const updateProductSchema = z.object({
  sku: z.string().min(1, "SKU is required").max(50).optional(),
  name: z.string().min(1, "Product name is required").max(200).optional(),
  description: z.string().optional(),
  category: z.string().max(100).optional(),
  weight: z.number().positive("Weight must be positive").optional(),
  length: z.number().positive("Length must be positive").optional(),
  width: z.number().positive("Width must be positive").optional(),
  height: z.number().positive("Height must be positive").optional(),
  cogs: z.number().min(0, "COGS cannot be negative").optional(),
  currency: z.string().optional(),
  hsCode: z.string().max(20).optional(),
  originCountry: z.string().max(100).optional(),
  minStock: z.number().int().min(0).optional(),
  maxStock: z.number().int().min(0).optional(),
  safetyStock: z.number().int().min(0).optional(),
  tags: z.array(z.string()).optional(),
  leadTimeProdDays: z.number().int().min(0).optional(),
  leadTimeShipDays: z.number().int().min(0).optional(),
  moq: z.number().int().min(1).optional(),
  dailySalesEstimate: z.number().min(0, "Daily sales estimate cannot be negative").optional(),
});

// PATCH /api/products/[id] - Update an existing product
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return unauthorized();
    }

    const { id } = await params;
    const body = await request.json();

    // Check if product exists and belongs to organization
    const existingProduct = await prisma.product.findFirst({
      where: {
        id,
        ...projectScope(session),
      },
    });

    if (!existingProduct) {
      return notFound("Product not found");
    }

    // Validate request body
    const validation = updateProductSchema.safeParse(body);
    if (!validation.success) {
      return validationError(validation.error);
    }

    const data = validation.data;

    // If SKU is being changed, check uniqueness (exclude current product)
    if (data.sku !== undefined && data.sku !== existingProduct.sku) {
      const duplicateSku = await prisma.product.findFirst({
        where: {
          organizationId: session.user.organizationId,
          sku: data.sku,
          id: { not: id },
        },
      });

      if (duplicateSku) {
        return error("A product with this SKU already exists in your organization", 409);
      }
    }

    // Build update data — only include fields that were provided
    const updateData: Record<string, unknown> = {};
    if (data.sku !== undefined) updateData.sku = data.sku;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description || null;
    if (data.category !== undefined) updateData.category = data.category || null;
    if (data.weight !== undefined) updateData.weight = data.weight;
    if (data.length !== undefined) updateData.length = data.length;
    if (data.width !== undefined) updateData.width = data.width;
    if (data.height !== undefined) updateData.height = data.height;
    if (data.cogs !== undefined) updateData.cogs = data.cogs;
    if (data.currency !== undefined) updateData.currency = data.currency;
    if (data.hsCode !== undefined) updateData.hsCode = data.hsCode || null;
    if (data.originCountry !== undefined) updateData.originCountry = data.originCountry || null;
    if (data.minStock !== undefined) updateData.minStock = data.minStock;
    if (data.maxStock !== undefined) updateData.maxStock = data.maxStock;
    if (data.safetyStock !== undefined) updateData.safetyStock = data.safetyStock;
    if (data.tags !== undefined) updateData.tags = data.tags;
    if (data.leadTimeProdDays !== undefined) updateData.leadTimeProdDays = data.leadTimeProdDays;
    if (data.leadTimeShipDays !== undefined) updateData.leadTimeShipDays = data.leadTimeShipDays;
    if (data.moq !== undefined) updateData.moq = data.moq;
    if (data.dailySalesEstimate !== undefined) updateData.dailySalesEstimate = data.dailySalesEstimate;

    // Recalculate volumeCBM/isBulkCargo if any dimension changes
    const finalLength = data.length !== undefined ? data.length : existingProduct.length;
    const finalWidth = data.width !== undefined ? data.width : existingProduct.width;
    const finalHeight = data.height !== undefined ? data.height : existingProduct.height;

    if (data.length !== undefined || data.width !== undefined || data.height !== undefined) {
      if (finalLength && finalWidth && finalHeight) {
        const volumeCBM = (finalLength * finalWidth * finalHeight) / 1000000;
        updateData.volumeCBM = volumeCBM;
        updateData.isBulkCargo = volumeCBM > 1;
      } else {
        updateData.volumeCBM = null;
        updateData.isBulkCargo = false;
      }
    }

    // Update product
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: updateData,
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

    return success(updatedProduct, "Product updated successfully");
  } catch (err) {
    return handleError(err);
  }
}

// DELETE /api/products/[id] - Delete a product
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return unauthorized();
    }

    const { id } = await params;

    // Check if product exists and belongs to organization
    const existingProduct = await prisma.product.findFirst({
      where: {
        id,
        ...projectScope(session),
      },
      include: {
        _count: {
          select: { stockLevels: true },
        },
        stockLevels: {
          where: { onHand: { gt: 0 } },
        },
      },
    });

    if (!existingProduct) {
      return notFound("Product not found");
    }

    // Block deletion if any stock levels have onHand > 0
    if (existingProduct.stockLevels.length > 0) {
      return error(
        `Cannot delete product with ${existingProduct.stockLevels.length} stock location${
          existingProduct.stockLevels.length === 1 ? "" : "s"
        } that still have inventory on hand. Please zero out stock first.`,
        400
      );
    }

    // Delete product
    await prisma.product.delete({
      where: { id },
    });

    return success(null, "Product deleted successfully");
  } catch (err) {
    return handleError(err);
  }
}
