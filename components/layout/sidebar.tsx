"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  Factory,
  CalendarRange,
  Users,
  ClipboardList,
  MessageSquare,
  Settings,
  ChevronLeft,
  BarChart3,
} from "lucide-react";
import { SaltoLogo } from "@/components/salto-logo";
import { useState } from "react";
import { useMessageUnreadCount } from "@/lib/use-conversations";


const navigation = [
  {
    name: "Home",
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
    name: "Analytics",
    href: "/analytics",
    icon: BarChart3,
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
    name: "Requests",
    href: "/requests",
    icon: ClipboardList,
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
          "fixed lg:static inset-y-0 left-0 z-50 flex h-full flex-col border-r border-gray-100 bg-[#F7F7F8] transition-all duration-300 dark:border-zinc-800 dark:bg-zinc-900",
          collapsed ? "w-20" : "w-56",
          // Mobile: hide by default, show when mobileOpen
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
      {/* Logo */}
      <div className={cn("flex items-center justify-between dark:border-b dark:border-zinc-800", collapsed ? "h-16 px-2" : "h-16 px-6")}>
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-0">
            <SaltoLogo size={46} className="-ml-3 -mr-1" />
            <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">salto</span>
          </Link>
        )}
        {collapsed && (
          <Link href="/dashboard" className="flex items-center justify-center w-full">
            <SaltoLogo size={36} />
          </Link>
        )}
      </div>

      {/* Navigation */}
      <nav className={cn("flex-1 space-y-1", collapsed ? "space-y-1.5 px-2 py-3" : "px-3 py-3")}>
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => onMobileClose?.()}
              className={cn(
                "relative flex items-center rounded-lg text-sm font-medium transition-colors",
                collapsed ? "justify-center p-3 rounded-xl" : "gap-3 px-3 py-2",
                isActive
                  ? "bg-[#FF4D15]/10 text-[#FF4D15] font-semibold dark:bg-[#FF4D15]/15 dark:text-[#FF4D15]"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
              )}
              title={collapsed ? item.name : undefined}
            >
              <item.icon className={cn("flex-shrink-0", collapsed ? "h-6 w-6" : "h-5 w-5")} />
              {!collapsed && <span>{item.name}</span>}
              {item.name === "Messages" && unreadMessageCount > 0 && (
                <span className={cn(
                  "flex items-center justify-center rounded-full bg-[#FF4D15] text-white font-bold",
                  collapsed
                    ? "absolute -right-1 -top-1 h-4 min-w-4 px-1 text-[8px]"
                    : "ml-auto h-5 min-w-5 px-1.5 text-[10px]"
                )}>
                  {unreadMessageCount > 9 ? "9+" : unreadMessageCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <div className="border-t border-gray-100 p-4 dark:border-zinc-800">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center justify-center rounded-lg p-2 text-gray-400 hover:bg-gray-50 hover:text-gray-700 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
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
