"use client";

import { Plus, Factory, Package, Users, BarChart3 } from "lucide-react";
import Link from "next/link";

const quickActions = [
  {
    name: "Create Order",
    description: "Add a new production order",
    href: "/orders/new",
    icon: Package,
    color: "bg-blue-50 dark:bg-blue-950",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
  {
    name: "Add Factory",
    description: "Register a new factory",
    href: "/factories/new",
    icon: Factory,
    color: "bg-purple-50 dark:bg-purple-950",
    iconColor: "text-purple-600 dark:text-purple-400",
  },
  {
    name: "View Orders",
    description: "See all production orders",
    href: "/orders",
    icon: BarChart3,
    color: "bg-green-50 dark:bg-green-950",
    iconColor: "text-green-600 dark:text-green-400",
  },
  {
    name: "View Factories",
    description: "Manage your factories",
    href: "/factories",
    icon: Users,
    color: "bg-orange-50 dark:bg-orange-950",
    iconColor: "text-orange-600 dark:text-orange-400",
  },
];

export function QuickActions() {
  return (
    <div className="bg-white rounded-lg border border-gray-100 p-6 shadow-sm dark:bg-zinc-900 dark:border-zinc-800 card-hover-glow">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Quick Actions</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {quickActions.map((action) => (
          <Link
            key={action.name}
            href={action.href}
            className="group relative flex items-start gap-4 p-4 rounded-lg border border-gray-100 dark:border-zinc-800 hover:border-gray-200 dark:hover:border-zinc-700 hover:shadow-sm transition-all"
          >
            <div
              className={`flex-shrink-0 w-10 h-10 rounded-lg ${action.color} flex items-center justify-center transition-colors`}
            >
              <action.icon className={`h-5 w-5 ${action.iconColor}`} strokeWidth={2} />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-[#F97316] dark:group-hover:text-[#F97316] transition-colors">
                {action.name}
              </p>
              <p className="text-xs text-gray-600 dark:text-zinc-400 mt-0.5">
                {action.description}
              </p>
            </div>

            <Plus className="h-4 w-4 text-gray-300 dark:text-zinc-600 group-hover:text-[#F97316] dark:group-hover:text-[#F97316] transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  );
}
