import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardStatsCards } from "./_components/dashboard-stats-cards";
import { OrdersTrendSection } from "./_components/orders-trend-section";
import { OrdersByStatusSection } from "./_components/orders-by-status-section";
import { RecentActivityFeed } from "./_components/recent-activity-feed";
import { QuickActions } from "./_components/quick-actions";
import { DashboardHeader } from "./_components/dashboard-header";
import { FactoryPerformanceSection } from "./_components/factory-performance-section";

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <DashboardHeader userName={session.user.name || session.user.email} />

      {/* Stats Cards with Period Selector — 5 cards, 3-column grid */}
      <div className="animate-in fade-in slide-in-from-top-4 duration-700">
        <DashboardStatsCards />
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-150">
        {/* Full width trend chart */}
        <OrdersTrendSection />

        {/* Status breakdown chart */}
        <OrdersByStatusSection />
      </div>

      {/* Factory Performance Section */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-700 delay-200">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-5">
          Factory Performance
        </h2>
        <FactoryPerformanceSection />
      </div>

      {/* Activity & Quick Actions Grid */}
      <div className="grid gap-6 lg:grid-cols-2 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-300">
        {/* Recent Activity Feed */}
        <RecentActivityFeed />

        {/* Quick Actions */}
        <QuickActions />
      </div>
    </div>
  );
}
