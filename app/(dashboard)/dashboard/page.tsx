import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardStatsCards } from "./_components/dashboard-stats-cards";
import { OrdersTrendSection } from "./_components/orders-trend-section";
import { OrdersByStatusSection } from "./_components/orders-by-status-section";

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8 dark:bg-zinc-900">
      {/* Page Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-zinc-400">
          Welcome back, {session.user.name || session.user.email}
        </p>
      </div>

      {/* Stats Cards Grid - 4 columns on desktop, 2 on tablet, 1 on mobile */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardStatsCards />
      </div>

      {/* Charts Grid */}
      <div className="grid gap-4 sm:gap-6">
        {/* Full width trend chart */}
        <OrdersTrendSection />

        {/* Status breakdown chart */}
        <OrdersByStatusSection />
      </div>
    </div>
  );
}
