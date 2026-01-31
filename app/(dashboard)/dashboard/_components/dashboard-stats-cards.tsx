import { prisma } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, TrendingUp, Factory as FactoryIcon, AlertTriangle } from "lucide-react";

export async function DashboardStatsCards({ organizationId }: { organizationId: string }) {
  // Fetch all metrics in parallel using transaction
  const [totalOrders, activeOrders, totalFactories, delayedOrders] = await prisma.$transaction([
    prisma.order.count({
      where: { organizationId },
    }),
    prisma.order.count({
      where: {
        organizationId,
        status: { in: ["IN_PROGRESS", "DELAYED"] },
      },
    }),
    prisma.factory.count({
      where: { organizationId },
    }),
    prisma.order.count({
      where: {
        organizationId,
        status: "DELAYED",
      },
    }),
  ]);

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalOrders}</div>
          <p className="text-xs text-muted-foreground">
            {totalOrders === 0 ? "No orders yet" : "All-time orders"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeOrders}</div>
          <p className="text-xs text-muted-foreground">
            {activeOrders === 0 ? "No active orders" : "In progress"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Factories</CardTitle>
          <FactoryIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalFactories}</div>
          <p className="text-xs text-muted-foreground">
            {totalFactories === 0 ? "No factories" : "Connected"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Delayed Orders</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{delayedOrders}</div>
          <p className="text-xs text-muted-foreground">
            {delayedOrders === 0 ? "All on track" : "Needs attention"}
          </p>
        </CardContent>
      </Card>
    </>
  );
}
