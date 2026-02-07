import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET /api/orders/export - Export orders as CSV
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    // Same filters as the orders list
    const status = searchParams.get("status");
    const factoryId = searchParams.get("factoryId");
    const search = searchParams.get("search");
    const priority = searchParams.get("priority");

    const where: Record<string, unknown> = {
      organizationId: session.user.organizationId,
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
        stages: { select: { name: true, progress: true, status: true }, orderBy: { sequence: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Build CSV
    const headers = [
      "Order Number",
      "Product Name",
      "SKU",
      "Quantity",
      "Unit",
      "Factory",
      "Factory Location",
      "Status",
      "Priority",
      "Progress (%)",
      "Order Date",
      "Expected Date",
      "Actual Date",
      "Notes",
      "Tags",
      "Stages",
    ];

    const escapeCSV = (value: string | null | undefined): string => {
      if (value == null) return "";
      const str = String(value);
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const formatDate = (date: Date | null): string => {
      if (!date) return "";
      return new Date(date).toISOString().split("T")[0];
    };

    const rows = orders.map((order) => {
      const stagesSummary = order.stages
        .map((s) => `${s.name} (${s.progress}% - ${s.status})`)
        .join("; ");

      return [
        order.orderNumber,
        order.productName,
        order.productSKU,
        String(order.quantity),
        order.unit,
        order.factory.name,
        order.factory.location,
        order.status.replace("_", " "),
        order.priority,
        String(order.overallProgress),
        formatDate(order.orderDate),
        formatDate(order.expectedDate),
        formatDate(order.actualDate),
        order.notes,
        (order.tags as string[])?.join(", "),
        stagesSummary,
      ].map(escapeCSV).join(",");
    });

    const csv = [headers.join(","), ...rows].join("\n");

    const filename = `orders-export-${new Date().toISOString().split("T")[0]}.csv`;

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
