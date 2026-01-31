import { prisma } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderSummaryChart } from "./orders-over-time-chart";

export type OrderSummaryData = {
  name: string;
  count: number;
  color: string;
}[];

export async function OrdersOverTimeSection({ organizationId }: { organizationId: string }) {
  // Get counts for each status category
  const [total, pending, inProgress, delayed, disrupted] = await Promise.all([
    prisma.order.count({
      where: { organizationId },
    }),
    prisma.order.count({
      where: { organizationId, status: "PENDING" },
    }),
    prisma.order.count({
      where: { organizationId, status: "IN_PROGRESS" },
    }),
    prisma.order.count({
      where: { organizationId, status: "DELAYED" },
    }),
    prisma.order.count({
      where: { organizationId, status: "DISRUPTED" },
    }),
  ]);

  const chartData: OrderSummaryData = [
    { name: "Total", count: total, color: "#6b7280" },
    { name: "Pending", count: pending, color: "#fbbf24" },
    { name: "In Progress", count: inProgress, color: "#3b82f6" },
    { name: "Delayed", count: delayed, color: "#eab308" },
    { name: "Disrupted", count: disrupted, color: "#ef4444" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
        <CardDescription>Overview by status</CardDescription>
      </CardHeader>
      <CardContent>
        <OrderSummaryChart data={chartData} />
      </CardContent>
    </Card>
  );
}
