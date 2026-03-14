import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import * as api from "@/lib/api";
import { z } from "zod";

const updateReportSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullish(),
  schedule: z.enum(["DAILY", "WEEKLY", "MONTHLY"]).optional(),
  recipients: z.array(z.string().email()).min(1).max(20).optional(),
  chartIds: z.array(z.string()).min(1).max(20).optional(),
  enabled: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) return api.unauthorized();

    const { id } = await params;
    const existing = await prisma.savedReport.findFirst({
      where: { id, ...api.projectScope(session), creatorId: session.user.id },
    });
    if (!existing) return api.notFound("Report");

    const body = await request.json();
    const parsed = updateReportSchema.safeParse(body);
    if (!parsed.success) return api.validationError(parsed.error);

    const { chartIds, ...data } = parsed.data;

    const report = await prisma.$transaction(async (tx) => {
      // If chartIds changed, recreate the join table
      if (chartIds) {
        await tx.reportChart.deleteMany({ where: { reportId: id } });
        await tx.reportChart.createMany({
          data: chartIds.map((chartId, i) => ({ reportId: id, chartId, sortOrder: i })),
        });
      }

      return tx.savedReport.update({
        where: { id },
        data,
        include: {
          charts: {
            include: { chart: { select: { id: true, title: true, chartType: true } } },
            orderBy: { sortOrder: "asc" },
          },
        },
      });
    });

    return api.success(report);
  } catch (error) {
    console.error("Saved report update error:", error);
    return api.error("Failed to update saved report");
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) return api.unauthorized();

    const { id } = await params;
    const existing = await prisma.savedReport.findFirst({
      where: { id, ...api.projectScope(session), creatorId: session.user.id },
    });
    if (!existing) return api.notFound("Report");

    await prisma.savedReport.delete({ where: { id } });
    return api.noContent();
  } catch (error) {
    console.error("Saved report delete error:", error);
    return api.error("Failed to delete saved report");
  }
}
