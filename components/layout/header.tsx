"use client";

import { Bell, Search, User, LogOut, Menu, CheckCheck } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { useUnreadCount, useRecentAlerts, markAlertRead, markAllRead, type Alert } from "@/lib/use-alerts";

function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function severityEmoji(severity: Alert["severity"]) {
  switch (severity) {
    case "CRITICAL": return "\u{1F6D1}";
    case "ERROR": return "\u{1F534}";
    case "WARNING": return "\u{1F514}";
    case "INFO":
    default: return "\u2705";
  }
}

function formatTimestamp(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const time = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  if (isToday) return `Today at ${time}`;
  if (isYesterday) return `Yesterday at ${time}`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + ` at ${time}`;
}

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const { count: unreadCount, refresh: refreshCount } = useUnreadCount();
  const { alerts, refresh: refreshAlerts } = useRecentAlerts(5);

  const user = {
    name: session?.user?.name || "User",
    email: session?.user?.email || "",
    initials: getInitials(session?.user?.name),
    orgName: session?.user?.organizationName || "",
  };

  const handleViewOrder = async (e: React.MouseEvent, alert: Alert) => {
    e.stopPropagation();
    if (!alert.read) {
      await markAlertRead(alert.id);
      refreshCount();
      refreshAlerts();
    }
    if (alert.orderId) {
      router.push(`/orders/${alert.orderId}`);
    } else if (alert.factoryId) {
      router.push(`/factories/${alert.factoryId}`);
    }
  };

  const handleMarkAllRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const unreadIds = alerts.filter((a) => !a.read).map((a) => a.id);
    if (unreadIds.length > 0) {
      await markAllRead(unreadIds);
      refreshCount();
      refreshAlerts();
    }
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-gray-100 bg-white/80 backdrop-blur-sm px-4 sm:px-6 dark:border-zinc-800 dark:bg-zinc-900/80">
      {/* Left side - Mobile menu + Search */}
      <div className="flex flex-1 items-center gap-2 sm:gap-4">
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden rounded-lg p-2 text-gray-400 hover:bg-gray-50 dark:text-zinc-500 dark:hover:bg-zinc-800"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Search */}
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300 dark:text-zinc-500" />
          <input
            type="text"
            placeholder="Search orders, factories..."
            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-[#FF8C1A] focus:outline-none focus:ring-1 focus:ring-[#FF8C1A]/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-400"
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Alerts Dropdown */}
        <DropdownMenu onOpenChange={(open) => { if (open) refreshAlerts(); }}>
          <DropdownMenuTrigger asChild>
            <button
              suppressHydrationWarning
              aria-label="Alerts"
              className="relative rounded-lg p-2 text-gray-400 hover:bg-gray-50 hover:text-gray-700 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-96 p-0">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <DropdownMenuLabel className="p-0 text-base font-semibold text-gray-900 dark:text-white">Notifications</DropdownMenuLabel>
                <span className="text-xs text-gray-400 dark:text-zinc-500">All</span>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                >
                  Mark all as read
                  <CheckCheck className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Alert List */}
            <div className="max-h-[400px] overflow-y-auto">
              {alerts.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-gray-400 dark:text-zinc-500">
                  No notifications yet
                </div>
              ) : (
                alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="relative flex gap-3 px-4 py-4 border-b border-gray-50 dark:border-zinc-800/50 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    {/* Unread dot */}
                    {!alert.read && (
                      <span className="absolute left-1.5 top-5 h-2 w-2 rounded-full bg-gradient-to-b from-[#FFA53A] via-[#FF8C1A] to-[#F97316]" />
                    )}

                    {/* Avatar */}
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-900 dark:bg-zinc-700 mt-0.5">
                      <span className="text-xs font-bold text-white">ST</span>
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <p className={`text-sm leading-tight ${alert.read ? "text-gray-500 dark:text-zinc-400" : "font-semibold text-gray-900 dark:text-white"}`}>
                        {severityEmoji(alert.severity)} {alert.title}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-zinc-400 leading-snug">
                        {alert.message}
                      </p>
                      {(alert.orderId || alert.factoryId) ? (
                        <button
                          onClick={(e) => handleViewOrder(e, alert)}
                          className="inline-block rounded-md border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1 text-xs font-medium text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
                        >
                          {alert.orderId ? "View Order" : "View Factory"}
                        </button>
                      ) : null}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400 dark:text-zinc-500">
                          {formatTimestamp(alert.createdAt)}
                        </span>
                        {alert.factory && (
                          <span className="text-xs text-gray-400 dark:text-zinc-500 italic">
                            {alert.factory.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div
              className="border-t border-gray-100 dark:border-zinc-800 px-4 py-2.5 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
              onClick={() => router.push("/alerts")}
            >
              <span className="text-sm font-medium text-[#F97316]">View all alerts</span>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button suppressHydrationWarning className="flex items-center gap-3 rounded-lg p-2 hover:bg-gray-50 dark:hover:bg-zinc-800">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-b from-[#FFA53A] via-[#FF8C1A] to-[#F97316] text-sm font-semibold text-white">
                {user.initials}
              </div>
              <div className="hidden text-left sm:block">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</p>
                <p className="text-xs text-gray-500 dark:text-zinc-400">{user.email}</p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 cursor-pointer"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
