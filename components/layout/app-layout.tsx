"use client";

import { useState, useCallback } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { NewsTicker } from "./news-ticker";
import { PageTransition } from "@/components/page-transition";
import { ChatWidget } from "@/components/chat/chat-widget";
import { usePresenceHeartbeat } from "@/lib/use-presence";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [tickerVisible, setTickerVisible] = useState(false);

  // Keep user presence alive for online indicators
  usePresenceHeartbeat();

  const handleTickerVisibility = useCallback((visible: boolean) => {
    setTickerVisible(visible);
  }, []);

  return (
    <div className="relative h-screen overflow-hidden bg-[#f8f9fa] dark:bg-zinc-950">
      {/* News Ticker — full width overlay at top, reveals on hover */}
      <NewsTicker onVisibilityChange={handleTickerVisibility} />

      {/* Main layout — shifts down when ticker is visible */}
      <div
        className="flex h-full overflow-hidden transition-transform duration-300 ease-out"
        style={{ transform: tickerVisible ? "translateY(36px)" : "translateY(0)" }}
      >
        {/* Sidebar */}
        <Sidebar mobileOpen={mobileMenuOpen} onMobileClose={() => setMobileMenuOpen(false)} />

        {/* Main Content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Header */}
          <Header onMenuClick={() => setMobileMenuOpen(true)} />

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <PageTransition>{children}</PageTransition>
          </main>
        </div>
      </div>

      {/* Floating Chat Widget */}
      <ChatWidget />
    </div>
  );
}
