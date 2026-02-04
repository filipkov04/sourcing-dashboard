import { prisma } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OrdersByFactoryChart, type OrdersByFactoryData } from "./orders-by-factory-chart";

export async function OrdersByFactorySection({ organizationId }: { organizationId: string }) {
  // Get order counts grouped by factory
  const ordersByFactory = await prisma.order.groupBy({
    by: ["factoryId"],
    where: { organizationId },
    _count: { id: true },
  });

  // Sort by count descending
  const sortedOrders = ordersByFactory.sort((a, b) => b._count.id - a._count.id);

  // Get factory names
  const factoryIds = sortedOrders.map((item) => item.factoryId);
  const factories = await prisma.factory.findMany({
    where: {
      id: { in: factoryIds },
    },
    select: {
      id: true,
      name: true,
    },
  });

  // Map factory names to data
  const factoryMap = new Map(factories.map((f) => [f.id, f.name]));

  const chartData: OrdersByFactoryData = sortedOrders.map((item) => ({
    name: factoryMap.get(item.factoryId) || "Unknown Factory",
    count: item._count.id,
  }));

  // If no data, show placeholder
  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Orders by factory</CardTitle>
          <CardDescription>Top performing factories</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center text-sm text-zinc-500">
            No factory data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Orders by factory</CardTitle>
        <CardDescription>Top performing factories</CardDescription>
      </CardHeader>
      <CardContent>
        <OrdersByFactoryChart data={chartData} />
      </CardContent>
    </Card>
  );
}
