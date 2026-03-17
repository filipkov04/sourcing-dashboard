import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardStatsCards } from "./_components/dashboard-stats-cards";
import { OrdersByStatusSection } from "./_components/orders-by-status-section";
import { RecentActivityFeed } from "./_components/recent-activity-feed";
import { DashboardHeader } from "./_components/dashboard-header";
import { ExchangeRateCards } from "./_components/exchange-rate-cards";
import { ManufacturerMap } from "./_components/manufacturer-map";
import { ScrollReveal } from "@/components/scroll-reveal";
import { DashboardAlertsWidget } from "./_components/dashboard-alerts-widget";
import { ActionRequired } from "./_components/action-required";
import { OrderProgressSnapshot } from "./_components/order-progress-snapshot";

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="relative space-y-3">
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

      {/* ── SECTION: Action Required + Alerts ── */}
      <ScrollReveal className="grid gap-3 lg:grid-cols-2" stagger>
        <ActionRequired />
        <DashboardAlertsWidget />
      </ScrollReveal>

      {/* ── SECTION: Activity + Order Progress ── */}
      <ScrollReveal className="grid gap-3 lg:grid-cols-2" stagger>
        <RecentActivityFeed />
        <OrderProgressSnapshot />
      </ScrollReveal>

      {/* ── SECTION: Orders by Status ── */}
      <ScrollReveal>
        <OrdersByStatusSection />
      </ScrollReveal>

      {/* ── SECTION: Market & Logistics ── */}
      <ScrollReveal>
        <p className="hud-section-label font-mono text-[10px] uppercase tracking-[0.15em] text-zinc-500 dark:text-zinc-500 mb-2">
          Market & Logistics
        </p>
        <div className="space-y-3">
          <ManufacturerMap />
          <ExchangeRateCards />
        </div>
      </ScrollReveal>
    </div>
  );
}
