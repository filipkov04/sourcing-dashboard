import { projectScope } from "@/lib/api";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import ExcelJS from "exceljs";

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

    const wb = new ExcelJS.Workbook();

    // Sheet 1: Orders
    const ws1 = wb.addWorksheet("Orders");
    ws1.columns = [
      { header: "Order Number", key: "orderNumber", width: 15 },
      { header: "Product Name", key: "productName", width: 25 },
      { header: "SKU", key: "sku", width: 12 },
      { header: "Quantity", key: "quantity", width: 10 },
      { header: "Unit", key: "unit", width: 8 },
      { header: "Factory", key: "factory", width: 20 },
      { header: "Factory Location", key: "factoryLocation", width: 20 },
      { header: "Status", key: "status", width: 14 },
      { header: "Priority", key: "priority", width: 10 },
      { header: "Progress (%)", key: "progress", width: 12 },
      { header: "Order Date", key: "orderDate", width: 12 },
      { header: "Expected Date", key: "expectedDate", width: 12 },
      { header: "Actual Date", key: "actualDate", width: 12 },
      { header: "Notes", key: "notes", width: 30 },
      { header: "Tags", key: "tags", width: 20 },
    ];
    for (const order of orders) {
      ws1.addRow({
        orderNumber: order.orderNumber,
        productName: order.productName,
        sku: order.productSKU || "",
        quantity: order.quantity,
        unit: order.unit,
        factory: order.factory.name,
        factoryLocation: order.factory.location,
        status: order.status.replace(/_/g, " "),
        priority: order.priority,
        progress: order.overallProgress,
        orderDate: formatDate(order.orderDate),
        expectedDate: formatDate(order.expectedDate),
        actualDate: formatDate(order.actualDate),
        notes: order.notes || "",
        tags: (order.tags as string[])?.join(", ") || "",
      });
    }

    // Sheet 2: Summary
    const ws2 = wb.addWorksheet("Summary");
    ws2.columns = [
      { header: "Metric", key: "metric", width: 25 },
      { header: "Value", key: "value", width: 15 },
    ];
    const statusCounts: Record<string, number> = {};
    const factoryCounts: Record<string, number> = {};
    for (const order of orders) {
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
      factoryCounts[order.factory.name] = (factoryCounts[order.factory.name] || 0) + 1;
    }
    ws2.addRow({ metric: "Total Orders", value: orders.length });
    ws2.addRow({ metric: "Export Date", value: new Date().toISOString().split("T")[0] });
    ws2.addRow({ metric: "", value: "" });
    ws2.addRow({ metric: "--- By Status ---", value: "" });
    for (const [s, count] of Object.entries(statusCounts)) {
      ws2.addRow({ metric: s.replace(/_/g, " "), value: count });
    }
    ws2.addRow({ metric: "", value: "" });
    ws2.addRow({ metric: "--- By Factory ---", value: "" });
    for (const [factory, count] of Object.entries(factoryCounts)) {
      ws2.addRow({ metric: factory, value: count });
    }

    // Sheet 3: Stages
    const ws3 = wb.addWorksheet("Stages");
    ws3.columns = [
      { header: "Order Number", key: "orderNumber", width: 15 },
      { header: "Product Name", key: "productName", width: 25 },
      { header: "Factory", key: "factory", width: 20 },
      { header: "Stage #", key: "sequence", width: 8 },
      { header: "Stage Name", key: "name", width: 18 },
      { header: "Stage Status", key: "status", width: 14 },
      { header: "Progress (%)", key: "progress", width: 12 },
      { header: "Started At", key: "startedAt", width: 12 },
      { header: "Completed At", key: "completedAt", width: 12 },
    ];
    for (const order of orders) {
      for (const stage of order.stages) {
        ws3.addRow({
          orderNumber: order.orderNumber,
          productName: order.productName,
          factory: order.factory.name,
          sequence: stage.sequence,
          name: stage.name,
          status: stage.status.replace(/_/g, " "),
          progress: stage.progress,
          startedAt: stage.startedAt ? formatDate(stage.startedAt) : "",
          completedAt: stage.completedAt ? formatDate(stage.completedAt) : "",
        });
      }
    }

    const buffer = await wb.xlsx.writeBuffer();
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
