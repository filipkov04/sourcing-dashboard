import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardStatsCards } from "./_components/dashboard-stats-cards";
import { OrdersByStatusSection } from "./_components/orders-by-status-section";
import { ProductPortfolioSection } from "./_components/product-portfolio-section";
import { RecentActivityFeed } from "./_components/recent-activity-feed";
import { QuickActions } from "./_components/quick-actions";
import { ReorderSuggestions } from "./_components/reorder-suggestions";
import { DashboardHeader } from "./_components/dashboard-header";
import { FactoryPerformanceSection } from "./_components/factory-performance-section";
import { BestSellers } from "./_components/best-sellers";
import { ExchangeRateCards } from "./_components/exchange-rate-cards";
import { FactoryGlobe } from "./_components/factory-globe";

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <DashboardHeader userName={session.user.name || session.user.email} />

      {/* Stats Cards with Period Selector */}
      <div className="animate-in fade-in slide-in-from-top-4 duration-700">
        <DashboardStatsCards />
      </div>

      {/* Status Breakdown + Product Portfolio */}
      <div className="grid gap-5 lg:grid-cols-2 animate-in fade-in slide-in-from-top-4 duration-700">
        <OrdersByStatusSection />
        <ProductPortfolioSection />
      </div>

      {/* Reorder Suggestions & Best Sellers */}
      <div className="grid gap-5 lg:grid-cols-2 items-start animate-in fade-in slide-in-from-top-4 duration-700 delay-100">
        <ReorderSuggestions />
        <BestSellers />
      </div>

      {/* Exchange Rates & Factory Globe */}
      <div className="grid gap-5 lg:grid-cols-2 items-start animate-in fade-in slide-in-from-top-4 duration-700 delay-100">
        <ExchangeRateCards />
        <FactoryGlobe />
      </div>

      {/* Factory Performance Section */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-700 delay-200">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-5">
          Factory Performance
        </h2>
        <FactoryPerformanceSection />
      </div>

      {/* Activity & Quick Actions Grid */}
      <div className="grid gap-5 lg:grid-cols-2 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-300">
        <RecentActivityFeed />
        <QuickActions />
      </div>
    </div>
  );
}
