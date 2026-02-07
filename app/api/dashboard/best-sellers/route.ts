import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import * as api from "@/lib/api";

/**
 * GET /api/dashboard/best-sellers
 * Returns top 5 products ranked by total quantity ordered
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return api.unauthorized();
    }

    const organizationId = session.user.organizationId;

    // Fetch all orders with factory info
    const orders = await prisma.order.findMany({
      where: { organizationId },
      include: {
        factory: { select: { name: true } },
      },
      orderBy: { orderDate: "desc" },
    });

    if (orders.length === 0) {
      return api.success([]);
    }

    // Group by productName
    const productGroups = new Map<
      string,
      typeof orders
    >();

    for (const order of orders) {
      const key = order.productName;
      if (!productGroups.has(key)) {
        productGroups.set(key, []);
      }
      productGroups.get(key)!.push(order);
    }

    type BestSeller = {
      productName: string;
      productSKU: string | null;
      productImage: string | null;
      totalQuantity: number;
      unit: string;
      orderCount: number;
      lastOrderDate: string;
      factoryName: string;
    };

    const bestSellers: BestSeller[] = [];

    for (const [productName, productOrders] of productGroups) {
      const totalQuantity = productOrders.reduce((sum, o) => sum + o.quantity, 0);
      const orderCount = productOrders.length;

      // Latest order (already sorted desc by orderDate)
      const latest = productOrders[0];

      bestSellers.push({
        productName,
        productSKU: latest.productSKU,
        productImage: latest.productImage,
        totalQuantity,
        unit: latest.unit,
        orderCount,
        lastOrderDate: latest.orderDate.toISOString(),
        factoryName: latest.factory.name,
      });
    }

    // Sort by total quantity descending
    bestSellers.sort((a, b) => b.totalQuantity - a.totalQuantity);

    return api.success(bestSellers.slice(0, 5));
  } catch (error) {
    console.error("Best sellers error:", error);
    return api.error("Failed to fetch best sellers");
  }
}
