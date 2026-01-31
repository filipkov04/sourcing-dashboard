import { prisma } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OrdersByStatusChart } from "./orders-by-status-chart";
import type { OrdersByStatusData } from "@/lib/types";

const STATUS_CONFIG = {
  PENDING: { color: "#fbbf24", label: "Pending" },
  IN_PROGRESS: { color: "#3b82f6", label: "In Progress" },
  DELAYED: { color: "#ef4444", label: "Delayed" },
  COMPLETED: { color: "#10b981", label: "Completed" },
  SHIPPED: { color: "#8b5cf6", label: "Shipped" },
  DELIVERED: { color: "#6b7280", label: "Delivered" },
  CANCELLED: { color: "#9ca3af", label: "Cancelled" },
} as const;

function processStatusData(
  data: { status: string; _count: { _all: number } }[]
): OrdersByStatusData {
  return data.map((item) => ({
    name:
      STATUS_CONFIG[item.status as keyof typeof STATUS_CONFIG]?.label ||
      item.status,
    value: item._count._all,
    color:
      STATUS_CONFIG[item.status as keyof typeof STATUS_CONFIG]?.color ||
      "#9ca3af",
  }));
}

export async function OrdersByStatusSection({ organizationId }: { organizationId: string }) {
  const ordersByStatus = await prisma.order.groupBy({
    by: ["status"],
    where: { organizationId },
    _count: { _all: true },
  });

  const chartData = processStatusData(ordersByStatus);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Orders by Status</CardTitle>
        <CardDescription>Current breakdown</CardDescription>
      </CardHeader>
      <CardContent>
        <OrdersByStatusChart data={chartData} />
      </CardContent>
    </Card>
  );
}
