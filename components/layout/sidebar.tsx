"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Factory,
  Package,
  CalendarRange,
  Users,
  MessageSquare,
  Settings,
  ChevronLeft,
} from "lucide-react";
import { useState } from "react";
import { useMessageUnreadCount } from "@/lib/use-conversations";

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Factories",
    href: "/factories",
    icon: Factory,
  },
  {
    name: "Orders",
    href: "/orders",
    icon: Package,
  },
  {
    name: "Timeline",
    href: "/timeline",
    icon: CalendarRange,
  },
  {
    name: "Team",
    href: "/team",
    icon: Users,
  },
  {
    name: "Messages",
    href: "/messages",
    icon: MessageSquare,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { count: unreadMessageCount } = useMessageUnreadCount();

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 flex h-full flex-col border-r border-gray-200/60 bg-[#f5f5f5] transition-all duration-300 dark:border-zinc-800 dark:bg-zinc-900",
          collapsed ? "w-16" : "w-64",
          // Mobile: hide by default, show when mobileOpen
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-gray-200/60 px-4 dark:border-zinc-800">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-b from-[#FFA53A] via-[#FF8C1A] to-[#F97316]">
              <Factory className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">SourceTrack</span>
          </Link>
        )}
        {collapsed && (
          <Link href="/dashboard" className="flex items-center justify-center w-full">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-b from-[#FFA53A] via-[#FF8C1A] to-[#F97316]">
              <Factory className="h-5 w-5 text-white" />
            </div>
          </Link>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => onMobileClose?.()}
              className={cn(
                "relative flex items-center rounded-lg text-sm font-medium transition-colors",
                collapsed ? "justify-center p-2" : "gap-3 px-3 py-2",
                isActive
                  ? "bg-[#FF8C1A]/10 text-[#F97316] font-semibold dark:bg-[#FF8C1A]/15 dark:text-[#F97316]"
                  : "text-gray-500 hover:bg-gray-200/50 hover:text-gray-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
              )}
              title={collapsed ? item.name : undefined}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span>{item.name}</span>}
              {item.name === "Messages" && unreadMessageCount > 0 && (
                <span className={cn(
                  "flex items-center justify-center rounded-full bg-gradient-to-b from-[#FFA53A] via-[#FF8C1A] to-[#F97316] text-[10px] font-bold text-white",
                  collapsed ? "absolute -right-0.5 -top-0.5 h-4 min-w-4 px-1" : "ml-auto h-5 min-w-5 px-1.5"
                )}>
                  {unreadMessageCount > 9 ? "9+" : unreadMessageCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <div className="border-t border-gray-200/60 p-4 dark:border-zinc-800">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center justify-center rounded-lg p-2 text-gray-400 hover:bg-gray-200/50 hover:text-gray-700 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronLeft
            className={cn(
              "h-5 w-5 transition-transform",
              collapsed && "rotate-180"
            )}
          />
        </button>
      </div>
    </div>
    </>
  );
}
