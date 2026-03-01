import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkAndUpdateDelays } from "@/lib/check-delays";

// Delay detector — called by Vercel Cron every hour.
// Auto-marks overdue stages and orders as DELAYED, triggering alerts/events/emails.

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch all active order IDs
  const orders = await prisma.order.findMany({
    where: {
      status: { in: ["PENDING", "IN_PROGRESS"] },
    },
    select: { id: true },
  });

  const orderIds = orders.map((o) => o.id);
  const updatedOrderIds = await checkAndUpdateDelays(orderIds);

  return NextResponse.json({
    success: true,
    data: {
      ordersChecked: orderIds.length,
      ordersUpdated: updatedOrderIds.length,
    },
  });
}
