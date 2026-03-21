"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useState } from "react";
import {
  LayoutDashboard,
  Package,
  Factory,
  Boxes,
  Users,
  ClipboardList,
  MessageSquare,
  Settings,
  BarChart3,
  LogOut,
  User,
  ChevronsUpDown,
} from "lucide-react";
import { SaltoLogo } from "@/components/salto-logo";
import { ProjectSwitcher } from "@/components/layout/project-switcher";
import { signOut, useSession } from "next-auth/react";
import { useMessageUnreadCount } from "@/lib/use-conversations";
import { useProfilePanel } from "@/lib/profile-panel-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { UserAvatar, AvatarPicker } from "@/components/avatar-picker";

const navigation = [
  { name: "Home", href: "/dashboard", icon: LayoutDashboard },
  { name: "Factories", href: "/factories", icon: Factory },
  { name: "Orders", href: "/orders", icon: Package },
  { name: "Products", href: "/products", icon: Boxes },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Team", href: "/team", icon: Users },
  { name: "Requests", href: "/requests", icon: ClipboardList },
  { name: "Messages", href: "/messages", icon: MessageSquare },
  { name: "Settings", href: "/settings", icon: Settings },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  collapsed?: boolean;
}

function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function Sidebar({ mobileOpen = false, onMobileClose, collapsed = false }: SidebarProps) {
  const pathname = usePathname();
  const { data: session, update: updateSession } = useSession();
  const { count: unreadMessageCount } = useMessageUnreadCount();
  const profilePanel = useProfilePanel();
  const [localAvatarId, setLocalAvatarId] = useState<string | null | undefined>(undefined);

  const avatarId = localAvatarId !== undefined ? localAvatarId : session?.user?.avatarId ?? null;

  const user = {
    name: session?.user?.name || "User",
    email: session?.user?.email || "",
    initials: getInitials(session?.user?.name),
  };

  const handleAvatarSelect = async (newAvatarId: string | null) => {
    setLocalAvatarId(newAvatarId);
    // Refresh the session so token picks up the new avatarId
    await updateSession();
  };

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
          "fixed lg:static inset-y-0 left-0 z-50 flex h-full flex-col border-r border-gray-100 bg-[#F7F7F8] transition-all duration-300 dark:border-transparent dark:bg-zinc-900",
          collapsed ? "w-14" : "w-56",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
      {/* Logo */}
      <div className={cn("flex items-center justify-between", collapsed ? "h-16 px-2" : "h-16 px-6")}>
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

      {/* Project Switcher */}
      <ProjectSwitcher collapsed={collapsed} />

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
                collapsed ? "justify-center p-2.5 rounded-xl" : "gap-3 px-3 py-2",
                isActive
                  ? "bg-gray-200/60 text-gray-900 font-semibold dark:bg-zinc-800 dark:text-white"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
              )}
              title={collapsed ? item.name : undefined}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
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

      {/* Bottom: User Account */}
      <div className={cn("p-3", collapsed ? "px-2" : "px-3")}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                suppressHydrationWarning
                className={cn(
                  "relative flex w-full items-center overflow-hidden transition-all",
                  "rounded-2xl shadow-sm hover:shadow-md",
                  /* Light mode */
                  "bg-gradient-to-br from-red-50 via-orange-50 to-amber-50 hover:from-red-100 hover:via-orange-50 hover:to-amber-50",
                  /* Dark mode — premium gradient */
                  "dark:bg-none dark:bg-[#18141A] dark:shadow-[0_2px_16px_rgba(255,77,21,0.08)] dark:hover:shadow-[0_4px_24px_rgba(255,77,21,0.12)]",
                  collapsed ? "justify-center p-2.5" : "gap-3 px-3.5 py-3"
                )}
                title={collapsed ? user.name : undefined}
              >
                {/* Dark mode gradient overlay */}
                <div className="pointer-events-none absolute inset-0 hidden dark:block rounded-2xl opacity-60"
                  style={{
                    background: "linear-gradient(135deg, rgba(255,40,20,0.15) 0%, rgba(255,100,15,0.1) 40%, rgba(255,160,30,0.06) 70%, transparent 100%)",
                  }}
                />
                {/* Dot grid pattern — upper right */}
                <div
                  className="pointer-events-none absolute top-0 right-0 h-full w-1/2 hidden dark:block"
                  style={{
                    backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)",
                    backgroundSize: "8px 8px",
                    maskImage: "radial-gradient(ellipse 70% 70% at 100% 0%, black 0%, transparent 70%)",
                    WebkitMaskImage: "radial-gradient(ellipse 70% 70% at 100% 0%, black 0%, transparent 70%)",
                  }}
                />
                {/* Light mode dot grid */}
                <div
                  className="pointer-events-none absolute top-0 right-0 h-full w-1/2 dark:hidden"
                  style={{
                    backgroundImage: "radial-gradient(circle, rgba(0,0,0,0.06) 1px, transparent 1px)",
                    backgroundSize: "8px 8px",
                    maskImage: "radial-gradient(ellipse 70% 70% at 100% 0%, black 0%, transparent 70%)",
                    WebkitMaskImage: "radial-gradient(ellipse 70% 70% at 100% 0%, black 0%, transparent 70%)",
                  }}
                />
                <div className="relative z-[1] flex items-center gap-3 w-full">
                  <UserAvatar avatarId={avatarId} initials={user.initials} size="md" />
                  {!collapsed && (
                    <>
                      <div className="min-w-0 flex-1 text-left">
                        <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{user.name}</p>
                        <p className="truncate text-xs text-gray-500 dark:text-zinc-400">{user.email}</p>
                      </div>
                      <ChevronsUpDown className="h-4 w-4 flex-shrink-0 text-gray-400 dark:text-zinc-500" />
                    </>
                  )}
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-64">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <AvatarPicker currentAvatarId={avatarId} onSelect={handleAvatarSelect} />
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => profilePanel.open()}>
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
    </div>
    </>
  );
}
