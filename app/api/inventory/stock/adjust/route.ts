import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { created, unauthorized, handleError, validationError, projectScope, forbidden, notFound } from "@/lib/api";
import { auth } from "@/lib/auth";
import { z } from "zod";

// Validation schema for stock adjustment
const adjustStockSchema = z.object({
  productId: z.string().min(1),
  locationId: z.string().min(1),
  quantity: z.number().int(), // can be negative
  reason: z.string().min(1).max(200),
  notes: z.string().max(1000).optional(),
});

// POST /api/inventory/stock/adjust - Manual stock adjustment
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return unauthorized();
    }

    // Only ADMIN and OWNER can adjust stock
    const role = session.user?.role;
    if (role !== "ADMIN" && role !== "OWNER") {
      return forbidden("Only admins can adjust stock levels.");
    }

    const body = await request.json();

    // Validate request body
    const validation = adjustStockSchema.safeParse(body);
    if (!validation.success) {
      return validationError(validation.error);
    }

    const data = validation.data;

    // Verify product exists and belongs to org/project
    const product = await prisma.product.findFirst({
      where: { id: data.productId, ...projectScope(session) },
    });
    if (!product) {
      return notFound("Product");
    }

    // Verify location exists and belongs to org/project
    const location = await prisma.inventoryLocation.findFirst({
      where: { id: data.locationId, ...projectScope(session) },
    });
    if (!location) {
      return notFound("Location");
    }

    // Atomic transaction: upsert stock + create transaction record
    const transaction = await prisma.$transaction(async (tx) => {
      // 1. Upsert the stock record
      await tx.stock.upsert({
        where: {
          productId_locationId: {
            productId: data.productId,
            locationId: data.locationId,
          },
        },
        create: {
          organizationId: session.user.organizationId,
          projectId: session.user.projectId || null,
          productId: data.productId,
          locationId: data.locationId,
          onHand: data.quantity,
          available: data.quantity,
        },
        update: {
          onHand: { increment: data.quantity },
          available: { increment: data.quantity },
        },
      });

      // 2. Read back the updated stock for balanceAfter
      const updatedStock = await tx.stock.findUnique({
        where: {
          productId_locationId: {
            productId: data.productId,
            locationId: data.locationId,
          },
        },
      });

      // 3. Create the inventory transaction record
      const inventoryTransaction = await tx.inventoryTransaction.create({
        data: {
          organizationId: session.user.organizationId,
          projectId: session.user.projectId || null,
          productId: data.productId,
          locationId: data.locationId,
          type: "ADJUSTMENT",
          quantity: data.quantity,
          reason: data.reason,
          notes: data.notes || null,
          balanceBefore: updatedStock!.onHand - data.quantity,
          balanceAfter: updatedStock!.onHand,
          performedBy: session.user.id,
        },
      });

      return inventoryTransaction;
    });

    return created(transaction, "Stock adjusted successfully");
  } catch (err) {
    return handleError(err);
  }
}
