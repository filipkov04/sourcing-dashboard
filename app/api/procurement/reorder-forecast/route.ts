import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { success, unauthorized, handleError, projectScope } from "@/lib/api";
import { auth } from "@/lib/auth";
import { computeAllForecasts, ProductForecastInput } from "@/lib/forecasting/runway-calculator";

// GET /api/procurement/reorder-forecast - Returns only products needing reorder
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) return unauthorized();

    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

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
    });

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

    const { items, summary } = computeAllForecasts(forecastInputs);
    const reorderItems = items.filter(i => i.reorderRecommended);

    return success({
      items: reorderItems,
      totalReorders: reorderItems.length,
      summary,
    });
  } catch (err) {
    return handleError(err);
  }
}
