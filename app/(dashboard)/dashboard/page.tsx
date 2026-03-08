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
import { ManufacturerMap } from "./_components/manufacturer-map";
import { ScrollReveal } from "@/components/scroll-reveal";
import { DashboardAlertsWidget } from "./_components/dashboard-alerts-widget";

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="relative">
      {/* Zone A — Status Overview */}
      <div className="space-y-4 mb-10">
        <DashboardHeader userName={session.user.name || session.user.email} />

        <ScrollReveal>
          <DashboardStatsCards />
        </ScrollReveal>

        <ScrollReveal>
          <DashboardAlertsWidget />
        </ScrollReveal>
      </div>

      {/* Zone B — Analytics */}
      <div className="space-y-5 mb-10">
        <ScrollReveal className="grid gap-5 lg:grid-cols-2" stagger>
          <OrdersByStatusSection />
          <ProductPortfolioSection />
        </ScrollReveal>

        <ScrollReveal className="grid gap-5 lg:grid-cols-2 items-start" stagger delay={0.1}>
          <ReorderSuggestions />
          <BestSellers />
        </ScrollReveal>

        <ScrollReveal className="grid gap-5 lg:grid-cols-2 items-start" stagger delay={0.1}>
          <ExchangeRateCards />
        </ScrollReveal>
      </div>

      {/* Manufacturer Intelligence Map */}
      <ScrollReveal delay={0.15}>
        <ManufacturerMap />
      </ScrollReveal>

      {/* Zone C — Operations */}
      <div className="space-y-5">
        <ScrollReveal direction="down" delay={0.2}>
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-5">
            Factory Performance
          </h2>
          <FactoryPerformanceSection />
        </ScrollReveal>

        <ScrollReveal className="grid gap-5 lg:grid-cols-2" stagger direction="down" delay={0.3}>
          <RecentActivityFeed />
          <QuickActions />
        </ScrollReveal>
      </div>
    </div>
  );
}
