"use client";

import Link from "next/link";
import {
  Bell,
  Plug,
  BookOpen,
  ChevronRight,
  Settings,
} from "lucide-react";

const SETTINGS_SECTIONS = [
  {
    href: "/settings/notifications",
    label: "Notifications",
    description: "Email alerts, delay notifications, weekly digest, and sound preferences",
    icon: Bell,
    iconColor: "text-orange-500",
    tag: "NTF",
  },
  {
    href: "/settings/integrations",
    label: "Integrations",
    description: "Manage factory data connections, sync schedules, and credentials",
    icon: Plug,
    iconColor: "text-blue-500",
    tag: "INT",
  },
  {
    href: "/settings/docs",
    label: "User Guide",
    description: "Everything you need to know about using SourceTrack",
    icon: BookOpen,
    iconColor: "text-purple-500",
    tag: "DOC",
  },
];

export default function SettingsPage() {
  return (
    <div className="relative space-y-6">
      {/* HUD Grid Overlay */}
      <div
        className="pointer-events-none fixed inset-0 opacity-0 dark:opacity-[0.02]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,77,21,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,77,21,0.3) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Settings className="h-5 w-5 text-[#FF4D15]" />
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Settings
          </h1>
        </div>
        <p className="text-sm text-gray-600 dark:text-zinc-400">
          System settings and configuration
        </p>
      </div>

      {/* Vertical Nav */}
      <div className="space-y-3">
        {SETTINGS_SECTIONS.map((section) => {
          const Icon = section.icon;
          return (
            <Link
              key={section.href}
              href={section.href}
              className="flex items-center gap-4 p-4 bg-white dark:bg-[#0d0f13] border border-gray-100 dark:border-zinc-800/60 rounded-xl card-hover-glow hud-corners transition-colors hover:bg-gray-50 dark:hover:bg-zinc-800/30"
            >
              <div className="p-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-800">
                <Icon className={`h-5 w-5 ${section.iconColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-600">
                    {section.tag}
                  </span>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                    {section.label}
                  </h3>
                </div>
                <p className="text-sm text-gray-500 dark:text-zinc-400 mt-0.5">
                  {section.description}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-zinc-400 flex-shrink-0" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
