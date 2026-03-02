import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import * as api from "@/lib/api";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

const createChartSchema = z.object({
  title: z.string().min(1).max(100),
  chartType: z.enum(["BAR", "LINE", "PIE", "AREA", "RADAR", "STACKED_BAR"]),
  dataSource: z.string().min(1),
  metric: z.string().min(1),
  config: z.record(z.string(), z.any()).default({}),
  visibility: z.enum(["PERSONAL", "SHARED"]).default("PERSONAL"),
});

/**
 * GET /api/dashboard/custom-charts
 * List charts visible to user (own personal + all shared in org)
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return api.unauthorized();
    }

    const organizationId = session.user.organizationId;
    const userId = session.user.id;

    const charts = await prisma.customChart.findMany({
      where: {
        organizationId,
        OR: [
          { creatorId: userId },
          { visibility: "SHARED" },
        ],
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });

    return api.success(charts);
  } catch (error) {
    console.error("Custom charts list error:", error);
    return api.error("Failed to fetch custom charts");
  }
}

/**
 * POST /api/dashboard/custom-charts
 * Create a new custom chart
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return api.unauthorized();
    }

    const body = await request.json();
    const parsed = createChartSchema.safeParse(body);
    if (!parsed.success) {
      return api.validationError(parsed.error);
    }

    const { title, chartType, dataSource, metric, config, visibility } = parsed.data;

    const chart = await prisma.customChart.create({
      data: {
        organizationId: session.user.organizationId,
        creatorId: session.user.id,
        title,
        chartType,
        dataSource,
        metric,
        config: config as Prisma.InputJsonValue,
        visibility,
      },
    });

    return api.created(chart);
  } catch (error) {
    console.error("Custom chart create error:", error);
    return api.error("Failed to create custom chart");
  }
}
