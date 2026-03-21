import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import * as api from "@/lib/api";

const COLORS = [
  "#4ade80", // green
  "#FF4D15", // brand orange (replaces red)
  "#facc15", // yellow
  "#86efac", // light green
  "#fb923c", // light orange
  "#fde047", // light yellow
  "#a3e635", // lime
  "#FF4D15", // deeper orange
  "#bef264", // yellow-green
  "#fdba74", // peach
];

/**
 * GET /api/dashboard/product-portfolio
 * Returns total quantity grouped by product name
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return api.unauthorized();
    }

    const organizationId = session.user.organizationId;
    const projectId = session.user.projectId;

    // Parse period filter
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "all";
    const where: any = { organizationId, ...(projectId ? { projectId } : {}) };

    if (period !== "all") {
      const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;
      where.expectedStartDate = { gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) };
    }

    const grouped = await prisma.order.groupBy({
      by: ["productName"],
      where,
      _sum: { quantity: true },
    });

    // Sort descending by quantity
    grouped.sort(
      (a, b) => (b._sum.quantity ?? 0) - (a._sum.quantity ?? 0)
    );

    const totalQuantity = grouped.reduce(
      (sum, item) => sum + (item._sum.quantity ?? 0),
      0
    );

    // If more than 8 products, group the rest into "Other"
    let items = grouped;
    let otherQuantity = 0;

    if (grouped.length > 8) {
      items = grouped.slice(0, 8);
      otherQuantity = grouped
        .slice(8)
        .reduce((sum, item) => sum + (item._sum.quantity ?? 0), 0);
    }

    const portfolio = items.map((item, index) => {
      const value = item._sum.quantity ?? 0;
      const percentage =
        totalQuantity > 0
          ? Math.round(((value / totalQuantity) * 100) * 10) / 10
          : 0;

      return {
        name: item.productName,
        value,
        color: COLORS[index % COLORS.length],
        percentage,
      };
    });

    if (otherQuantity > 0) {
      portfolio.push({
        name: "Other",
        value: otherQuantity,
        color: "#6b7280", // gray
        percentage:
          totalQuantity > 0
            ? Math.round(((otherQuantity / totalQuantity) * 100) * 10) / 10
            : 0,
      });
    }

    return api.success(portfolio);
  } catch (error) {
    console.error("Dashboard product portfolio error:", error);
    return api.error("Failed to fetch product portfolio");
  }
}
