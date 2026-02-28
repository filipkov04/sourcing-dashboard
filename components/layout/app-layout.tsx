"use client";

import { useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { NewsTicker } from "./news-ticker";
import { PageTransition } from "@/components/page-transition";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [tickerVisible, setTickerVisible] = useState(false);
  const isMessagesPage = pathname.startsWith("/messages");

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
          <main className={`flex-1 ${isMessagesPage ? "overflow-hidden p-0" : "overflow-y-auto p-4 sm:p-6 lg:p-8"}`}>
            <PageTransition>{children}</PageTransition>
          </main>
        </div>
      </div>

    </div>
  );
}
