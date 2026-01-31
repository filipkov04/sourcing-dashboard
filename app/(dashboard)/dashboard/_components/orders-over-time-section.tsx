import { prisma } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OrdersOverTimeChart } from "./orders-over-time-chart";
import type { OrdersOverTimeData } from "@/lib/types";

function processOrdersTimeSeries(
  orders: { orderDate: Date }[],
  days: number = 30
): OrdersOverTimeData {
  const result: OrdersOverTimeData = [];
  const today = new Date();

  // Create map of existing dates
  const ordersByDate = new Map<string, number>();
  orders.forEach((order) => {
    const dateKey = order.orderDate.toISOString().split("T")[0];
    ordersByDate.set(dateKey, (ordersByDate.get(dateKey) || 0) + 1);
  });

  // Fill in all days (including zeros)
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateKey = date.toISOString().split("T")[0];

    result.push({
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      count: ordersByDate.get(dateKey) || 0,
    });
  }

  return result;
}

export async function OrdersOverTimeSection({ organizationId }: { organizationId: string }) {
  // Get orders from last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const orders = await prisma.order.findMany({
    where: {
      organizationId,
      orderDate: { gte: thirtyDaysAgo },
    },
    select: { orderDate: true },
  });

  const chartData = processOrdersTimeSeries(orders);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Orders Over Time</CardTitle>
        <CardDescription>Last 30 days</CardDescription>
      </CardHeader>
      <CardContent>
        <OrdersOverTimeChart data={chartData} />
      </CardContent>
    </Card>
  );
}
