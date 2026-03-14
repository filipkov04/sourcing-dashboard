"use client";

import { Plus, Factory, Package, Users, BarChart3, Zap } from "lucide-react";
import Link from "next/link";

const quickActions = [
  {
    name: "Create Order",
    description: "New production order",
    href: "/orders/new",
    icon: Package,
    accentColor: "from-blue-500/20 to-blue-500/5",
    iconColor: "text-blue-500",
    borderHover: "hover:border-blue-500/30 dark:hover:border-blue-500/20",
  },
  {
    name: "Add Factory",
    description: "Register a factory",
    href: "/factories/new",
    icon: Factory,
    accentColor: "from-purple-500/20 to-purple-500/5",
    iconColor: "text-purple-500",
    borderHover: "hover:border-purple-500/30 dark:hover:border-purple-500/20",
  },
  {
    name: "View Orders",
    description: "All production orders",
    href: "/orders",
    icon: BarChart3,
    accentColor: "from-emerald-500/20 to-emerald-500/5",
    iconColor: "text-emerald-500",
    borderHover: "hover:border-emerald-500/30 dark:hover:border-emerald-500/20",
  },
  {
    name: "View Factories",
    description: "Manage factories",
    href: "/factories",
    icon: Users,
    accentColor: "from-orange-500/20 to-orange-500/5",
    iconColor: "text-orange-500",
    borderHover: "hover:border-orange-500/30 dark:hover:border-orange-500/20",
  },
];

export function QuickActions() {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 dark:border-zinc-800/60 dark:bg-[#0d0f13] card-hover-glow">
      <div className="flex items-center gap-2 mb-4">
        <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-600">CMD</span>
        <Zap className="h-4 w-4 text-zinc-400 dark:text-zinc-600" strokeWidth={1.5} />
        <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Quick Actions</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {quickActions.map((action) => (
          <Link
            key={action.name}
            href={action.href}
            className={`group relative flex items-center gap-3 p-3.5 rounded-lg border border-gray-100 dark:border-zinc-800 ${action.borderHover} transition-all overflow-hidden`}
          >
            {/* Subtle gradient glow on hover */}
            <div className={`absolute inset-0 bg-gradient-to-br ${action.accentColor} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

            <div className="relative flex-shrink-0">
              <action.icon className={`h-4.5 w-4.5 ${action.iconColor} opacity-70 group-hover:opacity-100 transition-opacity`} strokeWidth={1.5} />
            </div>

            <div className="relative flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-[#FF4D15] dark:group-hover:text-[#FF4D15] transition-colors">
                {action.name}
              </p>
              <p className="text-[11px] text-gray-500 dark:text-zinc-500">
                {action.description}
              </p>
            </div>

            <Plus className="relative h-3.5 w-3.5 text-gray-300 dark:text-zinc-700 group-hover:text-[#FF4D15] dark:group-hover:text-[#FF4D15] transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  );
}
