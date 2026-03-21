import { projectScope } from "@/lib/api";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { renderToBuffer } from "@react-pdf/renderer";
import { SingleOrderPDF } from "@/lib/pdf/order-report";
import React from "react";

/**
 * GET /api/orders/[id]/export-pdf
 * Export a single order as a detailed PDF
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!["OWNER", "ADMIN", "MEMBER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Viewers cannot export data" }, { status: 403 });
    }

    const { id } = await params;

    const order = await prisma.order.findFirst({
      where: { id, ...projectScope(session) },
      include: {
        factory: { select: { name: true, location: true } },
        stages: {
          select: { name: true, sequence: true, progress: true, status: true, startedAt: true, completedAt: true },
          orderBy: { sequence: "asc" },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const orderData = {
      ...order,
      expectedStartDate: order.expectedStartDate.toISOString(),
      placedDate: order.placedDate?.toISOString() ?? null,
      expectedDate: order.expectedDate.toISOString(),
      actualDate: order.actualDate?.toISOString() || null,
      tags: (order.tags as string[]) || [],
      stages: order.stages.map((s) => ({
        ...s,
        startedAt: s.startedAt?.toISOString() || null,
        completedAt: s.completedAt?.toISOString() || null,
      })),
    };

    const buffer = await renderToBuffer(
      React.createElement(SingleOrderPDF, { order: orderData }) as any
    );

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="order-${order.orderNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Single order PDF export error:", error);
    return NextResponse.json({ error: "PDF export failed" }, { status: 500 });
  }
}
