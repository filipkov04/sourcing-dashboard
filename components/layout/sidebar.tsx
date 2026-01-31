"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Factory,
  Package,
  Users,
  Settings,
  ChevronLeft,
} from "lucide-react";
import { useState } from "react";

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
    name: "Team",
    href: "/team",
    icon: Users,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className={cn(
        "flex h-screen flex-col border-r border-zinc-700 bg-zinc-800 transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-zinc-700 px-4">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
              <Factory className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-white">SourceTrack</span>
          </Link>
        )}
        {collapsed && (
          <Link href="/dashboard" className="flex items-center justify-center w-full">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
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
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-zinc-300 hover:bg-zinc-700 hover:text-white"
              )}
              title={collapsed ? item.name : undefined}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <div className="border-t border-zinc-700 p-4">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center justify-center rounded-lg p-2 text-zinc-400 hover:bg-zinc-700 hover:text-white"
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
  );
}
