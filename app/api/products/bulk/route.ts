import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { success, unauthorized, handleError, validationError, projectScope, forbidden, error } from "@/lib/api";
import { auth } from "@/lib/auth";
import { z } from "zod";

// Validation schema for bulk edit
const bulkUpdateSchema = z.object({
  ids: z.array(z.string()).min(1, "At least one product ID is required").max(100),
  updates: z.object({
    cogs: z.number().min(0).optional(),
    currency: z.string().optional(),
    category: z.string().max(100).optional(),
    leadTimeProdDays: z.number().int().min(0).optional(),
    leadTimeShipDays: z.number().int().min(0).optional(),
    moq: z.number().int().min(1).optional(),
    tags: z.array(z.string()).optional(),
  }).partial(),
  tagAction: z.enum(["replace", "add", "remove"]).optional().default("replace"),
});

// PATCH /api/products/bulk - Bulk edit products
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return unauthorized();
    }

    // Only ADMIN and OWNER can bulk edit
    const role = session.user?.role;
    if (role !== "ADMIN" && role !== "OWNER") {
      return forbidden("Only admins can bulk edit products.");
    }

    const body = await request.json();

    // Validate request body
    const validation = bulkUpdateSchema.safeParse(body);
    if (!validation.success) {
      return validationError(validation.error);
    }

    const { ids, updates, tagAction } = validation.data;

    // Verify all product IDs belong to user's org/project
    const scope = projectScope(session);
    const existingProducts = await prisma.product.findMany({
      where: {
        id: { in: ids },
        ...scope,
      },
      select: { id: true, tags: true },
    });

    if (existingProducts.length !== ids.length) {
      const foundIds = new Set(existingProducts.map((p) => p.id));
      const missingIds = ids.filter((id) => !foundIds.has(id));
      return error(
        `${missingIds.length} product${missingIds.length === 1 ? "" : "s"} not found or not accessible.`,
        404
      );
    }

    // Build base update data (non-tag fields)
    const baseUpdateData: Record<string, unknown> = {};
    if (updates.cogs !== undefined) baseUpdateData.cogs = updates.cogs;
    if (updates.currency !== undefined) baseUpdateData.currency = updates.currency;
    if (updates.category !== undefined) baseUpdateData.category = updates.category;
    if (updates.leadTimeProdDays !== undefined) baseUpdateData.leadTimeProdDays = updates.leadTimeProdDays;
    if (updates.leadTimeShipDays !== undefined) baseUpdateData.leadTimeShipDays = updates.leadTimeShipDays;
    if (updates.moq !== undefined) baseUpdateData.moq = updates.moq;

    // Handle tag operations
    const hasTags = updates.tags !== undefined && updates.tags.length > 0;
    const hasBaseUpdates = Object.keys(baseUpdateData).length > 0;

    if (!hasTags && !hasBaseUpdates) {
      return error("No updates provided", 400);
    }

    let count = 0;

    await prisma.$transaction(async (tx) => {
      if (tagAction === "replace" || !hasTags) {
        // Simple case: replace tags or no tag changes — single updateMany
        const data: Record<string, unknown> = { ...baseUpdateData };
        if (hasTags) {
          data.tags = updates.tags;
        }

        const result = await tx.product.updateMany({
          where: { id: { in: ids } },
          data,
        });
        count = result.count;
      } else {
        // "add" or "remove" — need per-product tag manipulation
        const productMap = new Map(existingProducts.map((p) => [p.id, p.tags]));

        for (const id of ids) {
          const existingTags = productMap.get(id) || [];
          let newTags: string[];

          if (tagAction === "add") {
            const mergedSet = new Set([...existingTags, ...updates.tags!]);
            newTags = Array.from(mergedSet);
          } else {
            // "remove"
            const removeSet = new Set(updates.tags!);
            newTags = existingTags.filter((t) => !removeSet.has(t));
          }

          await tx.product.update({
            where: { id },
            data: {
              ...baseUpdateData,
              tags: newTags,
            },
          });
        }
        count = ids.length;
      }
    });

    return success({ updated: count });
  } catch (err) {
    return handleError(err);
  }
}
