import { projectScope } from "@/lib/api";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { renderToBuffer } from "@react-pdf/renderer";
import { BulkOrdersPDF } from "@/lib/pdf/order-report";
import React from "react";

/**
 * GET /api/orders/export-pdf
 * Export bulk summary PDF of all filtered orders
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!["OWNER", "ADMIN", "MEMBER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Viewers cannot export data" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const factoryId = searchParams.get("factoryId");
    const search = searchParams.get("search");
    const priority = searchParams.get("priority");

    const where: Record<string, unknown> = {
      ...projectScope(session),
    };
    if (status) where.status = status;
    if (factoryId) where.factoryId = factoryId;
    if (priority) where.priority = priority;
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: "insensitive" } },
        { productName: { contains: search, mode: "insensitive" } },
        { productSKU: { contains: search, mode: "insensitive" } },
      ];
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        factory: { select: { name: true, location: true } },
        stages: {
          select: { name: true, sequence: true, progress: true, status: true, startedAt: true, completedAt: true },
          orderBy: { sequence: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const ordersData = orders.map((order) => ({
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
    }));

    const orgName = session.user.organizationName || "Organization";

    const buffer = await renderToBuffer(
      React.createElement(BulkOrdersPDF, { orders: ordersData, orgName }) as any
    );

    const filename = `orders-report-${new Date().toISOString().split("T")[0]}.pdf`;

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Bulk PDF export error:", error);
    return NextResponse.json({ error: "PDF export failed" }, { status: 500 });
  }
}
