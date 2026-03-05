import { projectScope } from "@/lib/api";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import * as XLSX from "xlsx";

/**
 * GET /api/orders/export-xlsx
 * Export orders as XLSX with 3 sheets: Orders, Summary, Stages
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
        stages: { select: { name: true, progress: true, status: true, sequence: true, startedAt: true, completedAt: true }, orderBy: { sequence: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatDate = (d: Date | null) => d ? new Date(d).toISOString().split("T")[0] : "";

    // Sheet 1: Orders
    const ordersData = orders.map((order) => ({
      "Order Number": order.orderNumber,
      "Product Name": order.productName,
      SKU: order.productSKU || "",
      Quantity: order.quantity,
      Unit: order.unit,
      Factory: order.factory.name,
      "Factory Location": order.factory.location,
      Status: order.status.replace("_", " "),
      Priority: order.priority,
      "Progress (%)": order.overallProgress,
      "Order Date": formatDate(order.orderDate),
      "Expected Date": formatDate(order.expectedDate),
      "Actual Date": formatDate(order.actualDate),
      Notes: order.notes || "",
      Tags: (order.tags as string[])?.join(", ") || "",
    }));

    // Sheet 2: Summary
    const statusCounts: Record<string, number> = {};
    const factoryCounts: Record<string, number> = {};
    for (const order of orders) {
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
      factoryCounts[order.factory.name] = (factoryCounts[order.factory.name] || 0) + 1;
    }

    const summaryData = [
      { Metric: "Total Orders", Value: orders.length },
      { Metric: "Export Date", Value: new Date().toISOString().split("T")[0] },
      { Metric: "", Value: "" },
      { Metric: "--- By Status ---", Value: "" },
      ...Object.entries(statusCounts).map(([status, count]) => ({
        Metric: status.replace("_", " "),
        Value: count,
      })),
      { Metric: "", Value: "" },
      { Metric: "--- By Factory ---", Value: "" },
      ...Object.entries(factoryCounts).map(([factory, count]) => ({
        Metric: factory,
        Value: count,
      })),
    ];

    // Sheet 3: Stages
    const stagesData = orders.flatMap((order) =>
      order.stages.map((stage) => ({
        "Order Number": order.orderNumber,
        "Product Name": order.productName,
        Factory: order.factory.name,
        "Stage #": stage.sequence,
        "Stage Name": stage.name,
        "Stage Status": stage.status.replace("_", " "),
        "Progress (%)": stage.progress,
        "Started At": stage.startedAt ? formatDate(stage.startedAt) : "",
        "Completed At": stage.completedAt ? formatDate(stage.completedAt) : "",
      }))
    );

    // Build workbook
    const wb = XLSX.utils.book_new();
    const ws1 = XLSX.utils.json_to_sheet(ordersData);
    const ws2 = XLSX.utils.json_to_sheet(summaryData);
    const ws3 = XLSX.utils.json_to_sheet(stagesData);

    // Set column widths
    ws1["!cols"] = [
      { wch: 15 }, { wch: 25 }, { wch: 12 }, { wch: 10 }, { wch: 8 },
      { wch: 20 }, { wch: 20 }, { wch: 14 }, { wch: 10 }, { wch: 12 },
      { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 30 }, { wch: 20 },
    ];

    XLSX.utils.book_append_sheet(wb, ws1, "Orders");
    XLSX.utils.book_append_sheet(wb, ws2, "Summary");
    XLSX.utils.book_append_sheet(wb, ws3, "Stages");

    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    const filename = `orders-export-${new Date().toISOString().split("T")[0]}.xlsx`;

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("XLSX export error:", error);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
