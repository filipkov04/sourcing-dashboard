"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { useBreadcrumb } from "@/lib/breadcrumb-context";

const SECTION_MAP: Record<string, { label: string; href: string }> = {
  dashboard: { label: "Home", href: "/dashboard" },
  factories: { label: "Factories", href: "/factories" },
  orders: { label: "Orders", href: "/orders" },
  timeline: { label: "Timeline", href: "/timeline" },
  team: { label: "Team", href: "/team" },
  requests: { label: "Requests", href: "/requests" },
  messages: { label: "Messages", href: "/messages" },
  settings: { label: "Settings", href: "/settings" },
  alerts: { label: "Alerts", href: "/alerts" },
  analytics: { label: "Analytics", href: "/analytics" },
};

interface BreadcrumbNavProps {
  onToggleSidebar?: () => void;
}

export function BreadcrumbNav({ onToggleSidebar }: BreadcrumbNavProps) {
  const pathname = usePathname();
  const { detail } = useBreadcrumb();

  const segments = pathname.split("/").filter(Boolean);
  const sectionKey = segments[0] || "dashboard";
  const section = SECTION_MAP[sectionKey];

  // Determine if we're on a detail page (has an ID segment after the section)
  const hasDetail = segments.length >= 2 && sectionKey !== "dashboard";
  // Check for /edit suffix
  const isEdit = segments[segments.length - 1] === "edit";

  if (!section) return null;

  const isDashboard = sectionKey === "dashboard";

  return (
    <nav className="flex items-center gap-2 min-w-0" aria-label="Breadcrumb">
      {/* Sidebar toggle button */}
      <button
        onClick={onToggleSidebar}
        className="flex-shrink-0 rounded-md p-0.5 hover:opacity-70 transition-opacity"
        aria-label="Toggle sidebar"
        title="Toggle sidebar"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-gray-700 dark:text-zinc-300"
        >
          <rect x="2" y="2" width="20" height="20" rx="4" />
          <line x1="9" y1="2" x2="9" y2="22" />
          <circle cx="5.5" cy="9" r="0.9" fill="currentColor" stroke="none" />
          <circle cx="5.5" cy="14" r="0.9" fill="currentColor" stroke="none" />
        </svg>
      </button>

      {isDashboard ? (
        <span className="text-sm font-medium text-gray-900 dark:text-white">Home</span>
      ) : (
        <>
          {/* Divider */}
          <div className="h-5 w-px bg-gray-200 dark:bg-zinc-700 flex-shrink-0" />

          {/* Section link */}
          <Link
            href={section.href}
            className="text-sm text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors truncate"
          >
            {section.label}
          </Link>

          {/* Detail segment */}
          {hasDetail && detail && (
            <>
              <ChevronRight className="h-3.5 w-3.5 text-gray-300 dark:text-zinc-600 flex-shrink-0" />
              <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {detail}
              </span>
            </>
          )}

          {/* Edit suffix */}
          {isEdit && (
            <>
              <ChevronRight className="h-3.5 w-3.5 text-gray-300 dark:text-zinc-600 flex-shrink-0" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Edit</span>
            </>
          )}
        </>
      )}
    </nav>
  );
}
