import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import * as api from "@/lib/api";

/**
 * GET /api/dashboard/reorder-suggestions
 * Analyzes historical ordering patterns and suggests reorders
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return api.unauthorized();
    }

    const organizationId = session.user.organizationId;

    // Fetch completed/delivered orders with factory info
    const orders = await prisma.order.findMany({
      where: {
        organizationId,
        status: { in: ["COMPLETED", "DELIVERED"] },
      },
      include: {
        factory: { select: { id: true, name: true } },
        stages: { select: { name: true, sequence: true }, orderBy: { sequence: "asc" } },
      },
      orderBy: { orderDate: "desc" },
    });

    if (orders.length === 0) {
      return api.success([]);
    }

    const now = new Date();
    const currentMonth = now.getMonth(); // 0-indexed
    const nextMonth = (currentMonth + 1) % 12;
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // Group orders by productName
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

    type Suggestion = {
      lastOrderId: string;
      productName: string;
      productSKU: string | null;
      productImage: string | null;
      lastQuantity: number;
      unit: string;
      avgQuantity: number;
      lastOrderDate: string;
      factoryId: string;
      factoryName: string;
      orderCount: number;
      seasonLabel: string;
      isSeasonal: boolean;
    };

    const suggestions: Suggestion[] = [];

    for (const [productName, productOrders] of productGroups) {
      const orderCount = productOrders.length;
      if (orderCount < 2) continue; // Need at least 2 orders to suggest

      // Sort by date descending
      productOrders.sort(
        (a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()
      );

      const latest = productOrders[0];
      const lastOrderDate = new Date(latest.orderDate);

      // Calculate average quantity
      const totalQty = productOrders.reduce((sum, o) => sum + o.quantity, 0);
      const avgQuantity = Math.round(totalQty / orderCount);

      // Check seasonal match: was this product ordered in current or next month historically?
      const orderMonths = productOrders.map((o) => new Date(o.orderDate).getMonth());
      const isSeasonal =
        orderMonths.includes(currentMonth) || orderMonths.includes(nextMonth);

      // Check if recurring but not recently ordered
      const isOverdue = lastOrderDate < sixtyDaysAgo;

      if (!isSeasonal && !isOverdue) continue; // No reason to suggest

      // Build season label
      let seasonLabel = "";
      const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December",
      ];

      if (isSeasonal) {
        // Find which months this product was historically ordered
        const uniqueMonths = [...new Set(orderMonths)].sort((a, b) => a - b);
        const matchingMonths = uniqueMonths.filter(
          (m) => m === currentMonth || m === nextMonth
        );
        if (matchingMonths.length > 0) {
          seasonLabel = `Ordered every ${matchingMonths.map((m) => monthNames[m]).join(" & ")}`;
        }
      } else if (isOverdue) {
        const daysSince = Math.floor(
          (now.getTime() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        seasonLabel = `Last ordered ${daysSince} days ago`;
      }

      suggestions.push({
        lastOrderId: latest.id,
        productName,
        productSKU: latest.productSKU,
        productImage: latest.productImage,
        lastQuantity: latest.quantity,
        unit: latest.unit,
        avgQuantity,
        lastOrderDate: latest.orderDate.toISOString(),
        factoryId: latest.factory.id,
        factoryName: latest.factory.name,
        orderCount,
        seasonLabel,
        isSeasonal,
      });
    }

    // Sort: seasonal matches first, then by frequency
    suggestions.sort((a, b) => {
      if (a.isSeasonal !== b.isSeasonal) return a.isSeasonal ? -1 : 1;
      return b.orderCount - a.orderCount;
    });

    // Cap at 5 suggestions
    return api.success(suggestions.slice(0, 5));
  } catch (error) {
    console.error("Reorder suggestions error:", error);
    return api.error("Failed to fetch reorder suggestions");
  }
}
