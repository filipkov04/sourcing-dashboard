import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import * as api from "@/lib/api";
import { z } from "zod";

const createReportSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  schedule: z.enum(["DAILY", "WEEKLY", "MONTHLY"]),
  recipients: z.array(z.string().email()).min(1).max(20),
  chartIds: z.array(z.string()).min(1).max(20),
});

function computeNextSendAt(schedule: "DAILY" | "WEEKLY" | "MONTHLY"): Date {
  const now = new Date();
  const next = new Date(now);
  // Schedule for 8am UTC next occurrence
  next.setUTCHours(8, 0, 0, 0);
  switch (schedule) {
    case "DAILY":
      next.setUTCDate(next.getUTCDate() + 1);
      break;
    case "WEEKLY":
      // Next Monday
      const daysUntilMonday = ((8 - next.getUTCDay()) % 7) || 7;
      next.setUTCDate(next.getUTCDate() + daysUntilMonday);
      break;
    case "MONTHLY":
      // 1st of next month
      next.setUTCMonth(next.getUTCMonth() + 1, 1);
      break;
  }
  return next;
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) return api.unauthorized();

    const reports = await prisma.savedReport.findMany({
      where: {
        ...api.projectScope(session),
        creatorId: session.user.id,
      },
      include: {
        charts: {
          include: { chart: { select: { id: true, title: true, chartType: true } } },
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return api.success(reports);
  } catch (error) {
    console.error("Saved reports list error:", error);
    return api.error("Failed to fetch saved reports");
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) return api.unauthorized();

    const body = await request.json();
    const parsed = createReportSchema.safeParse(body);
    if (!parsed.success) return api.validationError(parsed.error);

    const { name, description, schedule, recipients, chartIds } = parsed.data;

    // Verify all charts belong to the org
    const charts = await prisma.customChart.findMany({
      where: { id: { in: chartIds }, organizationId: session.user.organizationId },
      select: { id: true },
    });
    if (charts.length !== chartIds.length) {
      return api.error("One or more charts not found");
    }

    const report = await prisma.savedReport.create({
      data: {
        ...api.projectScope(session),
        creatorId: session.user.id,
        name,
        description,
        schedule,
        recipients,
        nextSendAt: computeNextSendAt(schedule),
        charts: {
          create: chartIds.map((chartId, i) => ({ chartId, sortOrder: i })),
        },
      },
      include: {
        charts: {
          include: { chart: { select: { id: true, title: true, chartType: true } } },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    return api.created(report);
  } catch (error) {
    console.error("Saved report create error:", error);
    return api.error("Failed to create saved report");
  }
}
