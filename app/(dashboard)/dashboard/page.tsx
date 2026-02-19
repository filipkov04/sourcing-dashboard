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
import { ScrollReveal } from "@/components/scroll-reveal";

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
      <ScrollReveal>
        <DashboardStatsCards />
      </ScrollReveal>

      {/* Status Breakdown + Product Portfolio */}
      <ScrollReveal className="grid gap-5 lg:grid-cols-2" stagger>
        <OrdersByStatusSection />
        <ProductPortfolioSection />
      </ScrollReveal>

      {/* Reorder Suggestions & Best Sellers */}
      <ScrollReveal className="grid gap-5 lg:grid-cols-2 items-start" stagger delay={0.1}>
        <ReorderSuggestions />
        <BestSellers />
      </ScrollReveal>

      {/* Exchange Rates & Factory Globe */}
      <ScrollReveal className="grid gap-5 lg:grid-cols-2 items-start" stagger delay={0.1}>
        <ExchangeRateCards />
        <FactoryGlobe />
      </ScrollReveal>

      {/* Factory Performance Section */}
      <ScrollReveal direction="down" delay={0.2}>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-5">
          Factory Performance
        </h2>
        <FactoryPerformanceSection />
      </ScrollReveal>

      {/* Activity & Quick Actions Grid */}
      <ScrollReveal className="grid gap-5 lg:grid-cols-2" stagger direction="down" delay={0.3}>
        <RecentActivityFeed />
        <QuickActions />
      </ScrollReveal>
    </div>
  );
}
