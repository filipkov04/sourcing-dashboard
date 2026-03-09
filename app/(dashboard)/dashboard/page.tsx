import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardStatsCards } from "./_components/dashboard-stats-cards";
import { OrdersByStatusSection } from "./_components/orders-by-status-section";
import { ProductPortfolioSection } from "./_components/product-portfolio-section";
import { RecentActivityFeed } from "./_components/recent-activity-feed";
import { QuickActions } from "./_components/quick-actions";
import { UpcomingDeliveries } from "./_components/upcoming-deliveries";
import { DashboardHeader } from "./_components/dashboard-header";
import { FactoryPerformanceSection } from "./_components/factory-performance-section";
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
    <div className="relative space-y-6">
      {/* Subtle grid overlay — dark mode only, orange tinted */}
      <div
        className="pointer-events-none fixed inset-0 opacity-0 dark:opacity-[0.02]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,77,21,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,77,21,0.3) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

        <ScrollReveal>
          <DashboardHeader userName={session.user?.name} />
        </ScrollReveal>

        <ScrollReveal>
          <DashboardStatsCards />
        </ScrollReveal>

      {/* ── SECTION: Alerts + Recent Activity ── */}
      {/* Immediate situational awareness — what needs attention, what just happened */}
      <ScrollReveal className="grid gap-5 lg:grid-cols-2" stagger>
        <DashboardAlertsWidget />
        <RecentActivityFeed />
      </ScrollReveal>

      {/* ── SECTION: Order Health ── */}
      {/* Status breakdown + Factory performance — both answer "how are things going?" */}
      <ScrollReveal>
        <p className="hud-section-label font-mono text-[10px] uppercase tracking-[0.15em] text-zinc-500 dark:text-zinc-500 mb-4">
          Order Health
        </p>
      </ScrollReveal>
      <ScrollReveal className="grid gap-5 lg:grid-cols-2" stagger>
        <OrdersByStatusSection />
        <FactoryPerformanceSection />
      </ScrollReveal>

      {/* ── SECTION: Product Intelligence ── */}
      {/* Portfolio + Upcoming deliveries — what are we buying + what's arriving */}
      <ScrollReveal>
        <p className="hud-section-label font-mono text-[10px] uppercase tracking-[0.15em] text-zinc-500 dark:text-zinc-500 mb-4">
          Product Intelligence
        </p>
      </ScrollReveal>
      <ScrollReveal className="grid gap-5 lg:grid-cols-2 items-start" stagger delay={0.1}>
        <ProductPortfolioSection />
        <UpcomingDeliveries />
      </ScrollReveal>

      {/* ── SECTION: Market & Logistics ── */}
      <ScrollReveal>
        <p className="hud-section-label font-mono text-[10px] uppercase tracking-[0.15em] text-zinc-500 dark:text-zinc-500 mb-4">
          Market & Logistics
        </p>
      </ScrollReveal>
      <ScrollReveal className="grid gap-5 lg:grid-cols-2 items-start" stagger delay={0.1}>
        <ExchangeRateCards />
        <div />
      </ScrollReveal>

      {/* Manufacturer Intelligence Map */}
      <ScrollReveal delay={0.15}>
        <ManufacturerMap />
      </ScrollReveal>

      {/* ── SECTION: Quick Actions ── */}
      <ScrollReveal direction="down" delay={0.2}>
        <QuickActions />
      </ScrollReveal>
    </div>
  );
}
