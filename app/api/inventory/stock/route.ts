import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { success, unauthorized, handleError, error, projectScope } from "@/lib/api";
import { auth } from "@/lib/auth";

// GET /api/inventory/stock - Get stock levels for a product
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return unauthorized();
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      return error("productId query parameter is required", 400);
    }

    const stockLevels = await prisma.stock.findMany({
      where: {
        productId,
        ...projectScope(session),
      },
      include: {
        location: true,
        product: {
          select: { name: true, sku: true },
        },
      },
      orderBy: {
        location: { name: "asc" },
      },
    });

    return success(stockLevels);
  } catch (err) {
    return handleError(err);
  }
}
