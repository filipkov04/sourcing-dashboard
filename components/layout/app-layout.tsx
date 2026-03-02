"use client";

import { useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { NewsTicker } from "./news-ticker";
import { PageTransition } from "@/components/page-transition";
import { ChatWidget } from "@/components/chat/chat-widget";
import { usePresenceHeartbeat } from "@/lib/use-presence";
import { RealtimeProvider } from "@/components/providers/realtime-provider";
import { BreadcrumbProvider } from "@/lib/breadcrumb-context";
import { ProfilePanelProvider } from "@/lib/profile-panel-context";
import { ProfilePanel } from "@/components/profile/profile-panel";

function AppLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [tickerVisible, setTickerVisible] = useState(false);
  const isMessagesPage = pathname.startsWith("/messages");

  // Keep user presence alive for online indicators
  usePresenceHeartbeat();

  const handleTickerVisibility = useCallback((visible: boolean) => {
    setTickerVisible(visible);
  }, []);

  return (
    <div className="relative h-screen overflow-hidden bg-white dark:bg-[#0C0E12]">
      {/* Dark mode cinematic background layers */}
      <div className="glow-layer" aria-hidden="true" />
      <div className="noise-layer" aria-hidden="true" />

      {/* News Ticker — full width overlay at top, reveals on hover */}
      <NewsTicker onVisibilityChange={handleTickerVisibility} />

      {/* Main layout — shifts down when ticker is visible */}
      <div
        className="relative z-[1] flex h-full overflow-hidden transition-transform duration-300 ease-out"
        style={{ transform: tickerVisible ? "translateY(36px)" : "translateY(0)" }}
      >
        {/* Sidebar */}
        <Sidebar mobileOpen={mobileMenuOpen} onMobileClose={() => setMobileMenuOpen(false)} collapsed={sidebarCollapsed} />

        {/* Main Content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Header */}
          <Header onMenuClick={() => setMobileMenuOpen(true)} onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />

          {/* Page Content */}
          <main className={`flex-1 ${isMessagesPage ? "overflow-hidden p-0 bg-white dark:bg-transparent" : "overflow-y-auto p-4 sm:p-6 lg:p-8"}`}>
            {isMessagesPage ? children : <PageTransition>{children}</PageTransition>}
          </main>
        </div>

      </div>

      {/* Floating Chat Widget — hidden on /messages to avoid duplicate UI */}
      {!isMessagesPage && <ChatWidget />}

      {/* Profile Modal */}
      <ProfilePanel />
    </div>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProfilePanelProvider>
    <BreadcrumbProvider>
    <RealtimeProvider>
      <AppLayoutInner>{children}</AppLayoutInner>
    </RealtimeProvider>
    </BreadcrumbProvider>
    </ProfilePanelProvider>
  );
}
