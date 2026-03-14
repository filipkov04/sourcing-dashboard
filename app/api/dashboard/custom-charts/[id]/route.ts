import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import * as api from "@/lib/api";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

const updateChartSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  config: z.record(z.string(), z.any()).optional(),
  visibility: z.enum(["PERSONAL", "SHARED"]).optional(),
  sortOrder: z.number().int().optional(),
  folderId: z.string().nullish(),
});

/**
 * GET /api/dashboard/custom-charts/[id]
 * Fetch a single chart (verify org ownership)
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return api.unauthorized();
    }

    const { id } = await params;

    const chart = await prisma.customChart.findFirst({
      where: {
        id,
        ...api.projectScope(session),
      },
    });

    if (!chart) {
      return api.notFound("Chart");
    }

    return api.success(chart);
  } catch (error) {
    console.error("Custom chart fetch error:", error);
    return api.error("Failed to fetch custom chart");
  }
}

/**
 * PATCH /api/dashboard/custom-charts/[id]
 * Update chart (creator only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return api.unauthorized();
    }

    const { id } = await params;

    const existing = await prisma.customChart.findFirst({
      where: {
        id,
        ...api.projectScope(session),
      },
    });

    if (!existing) {
      return api.notFound("Chart");
    }

    if (existing.creatorId !== session.user.id) {
      return api.forbidden("Only the chart creator can edit this chart");
    }

    const body = await request.json();
    const parsed = updateChartSchema.safeParse(body);
    if (!parsed.success) {
      return api.validationError(parsed.error);
    }

    const { config: configData, folderId, ...rest } = parsed.data;
    const updateData: Prisma.CustomChartUpdateInput = { ...rest };
    if (folderId !== undefined) {
      updateData.folder = folderId ? { connect: { id: folderId } } : { disconnect: true };
    }
    if (configData !== undefined) {
      updateData.config = configData as Prisma.InputJsonValue;
    }

    const chart = await prisma.customChart.update({
      where: { id },
      data: updateData,
    });

    return api.success(chart);
  } catch (error) {
    console.error("Custom chart update error:", error);
    return api.error("Failed to update custom chart");
  }
}

/**
 * DELETE /api/dashboard/custom-charts/[id]
 * Remove chart (creator only)
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return api.unauthorized();
    }

    const { id } = await params;

    const existing = await prisma.customChart.findFirst({
      where: {
        id,
        ...api.projectScope(session),
      },
    });

    if (!existing) {
      return api.notFound("Chart");
    }

    if (existing.creatorId !== session.user.id) {
      return api.forbidden("Only the chart creator can delete this chart");
    }

    await prisma.customChart.delete({ where: { id } });

    return api.noContent();
  } catch (error) {
    console.error("Custom chart delete error:", error);
    return api.error("Failed to delete custom chart");
  }
}
