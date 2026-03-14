import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import * as api from "@/lib/api";
import { z } from "zod";

const createAnnotationSchema = z.object({
  chartId: z.string().min(1),
  content: z.string().min(1).max(500),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) return api.unauthorized();

    const body = await request.json();
    const parsed = createAnnotationSchema.safeParse(body);
    if (!parsed.success) return api.validationError(parsed.error);

    // Verify the chart belongs to the user's org
    const chart = await prisma.customChart.findFirst({
      where: { id: parsed.data.chartId, organizationId: session.user.organizationId },
    });
    if (!chart) return api.notFound("Chart");

    const annotation = await prisma.chartAnnotation.create({
      data: {
        chartId: parsed.data.chartId,
        content: parsed.data.content,
        color: parsed.data.color || "#FF4D15",
        authorId: session.user.id,
        authorName: session.user.name || "Unknown",
      },
    });

    return api.created(annotation);
  } catch (error) {
    console.error("Chart annotation create error:", error);
    return api.error("Failed to create annotation");
  }
}
