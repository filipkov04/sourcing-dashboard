import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { DashboardStatsCards } from "./_components/dashboard-stats-cards";
import { DashboardStatsSkeleton } from "./_components/dashboard-stats-skeleton";
import { OrdersOverTimeSection } from "./_components/orders-over-time-section";
import { OrdersOverTimeSkeleton } from "./_components/orders-over-time-skeleton";
import { OrdersByStatusSection } from "./_components/orders-by-status-section";
import { OrdersByStatusSkeleton } from "./_components/orders-by-status-skeleton";
import { DashboardEmptyState } from "./_components/dashboard-empty-state";

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const organizationId = session.user.organizationId;

  // Check if user has any orders
  const totalOrders = await prisma.order.count({
    where: { organizationId },
  });

  // Show empty state if no orders
  if (totalOrders === 0) {
    return (
      <>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">
            Dashboard
          </h1>
          <p className="mt-1 text-zinc-400">
            Welcome back, {session.user.name || session.user.email}
          </p>
        </div>
        <DashboardEmptyState />
      </>
    );
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">
          Dashboard
        </h1>
        <p className="mt-1 text-zinc-400">
          Welcome back, {session.user.name || session.user.email}
        </p>
      </div>

      {/* Stats Cards Grid */}
      <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Suspense fallback={<DashboardStatsSkeleton />}>
          <DashboardStatsCards organizationId={organizationId} />
        </Suspense>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        <Suspense fallback={<OrdersOverTimeSkeleton />}>
          <OrdersOverTimeSection organizationId={organizationId} />
        </Suspense>

        <Suspense fallback={<OrdersByStatusSkeleton />}>
          <OrdersByStatusSection organizationId={organizationId} />
        </Suspense>
      </div>
    </>
  );
}
