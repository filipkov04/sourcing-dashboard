import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { success, unauthorized, handleError, projectScope } from "@/lib/api";
import { auth } from "@/lib/auth";
import { computeAllForecasts, ProductForecastInput } from "@/lib/forecasting/runway-calculator";

// GET /api/procurement/runway - Returns runway data for all products
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) return unauthorized();

    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    // Fetch all products with stock levels and recent SALE transactions
    const products = await prisma.product.findMany({
      where: { ...projectScope(session) },
      include: {
        stockLevels: {
          select: { onHand: true, reserved: true, available: true, inTransit: true },
        },
        transactions: {
          where: {
            type: "SALE",
            performedAt: { gte: ninetyDaysAgo },
          },
          select: { quantity: true, performedAt: true },
        },
      },
      orderBy: { name: "asc" },
    });

    // Transform to forecast input
    const forecastInputs: ProductForecastInput[] = products.map(p => ({
      id: p.id,
      sku: p.sku,
      name: p.name,
      safetyStock: p.safetyStock,
      minStock: p.minStock,
      moq: p.moq,
      leadTimeProdDays: p.leadTimeProdDays,
      leadTimeShipDays: p.leadTimeShipDays,
      dailySalesEstimate: p.dailySalesEstimate,
      stockLevels: p.stockLevels,
      recentSaleTransactions: p.transactions,
    }));

    const result = computeAllForecasts(forecastInputs);
    return success(result);
  } catch (err) {
    return handleError(err);
  }
}
