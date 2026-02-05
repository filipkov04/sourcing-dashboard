"use client";

import { Plus, Factory, Package, Users, BarChart3 } from "lucide-react";
import Link from "next/link";

const quickActions = [
  {
    name: "Create Order",
    description: "Add a new production order",
    href: "/orders/new",
    icon: Package,
    color: "bg-blue-500 dark:bg-blue-600",
    hoverColor: "hover:bg-blue-600 dark:hover:bg-blue-700",
  },
  {
    name: "Add Factory",
    description: "Register a new factory",
    href: "/factories/new",
    icon: Factory,
    color: "bg-purple-500 dark:bg-purple-600",
    hoverColor: "hover:bg-purple-600 dark:hover:bg-purple-700",
  },
  {
    name: "View Orders",
    description: "See all production orders",
    href: "/orders",
    icon: BarChart3,
    color: "bg-green-500 dark:bg-green-600",
    hoverColor: "hover:bg-green-600 dark:hover:bg-green-700",
  },
  {
    name: "View Factories",
    description: "Manage your factories",
    href: "/factories",
    icon: Users,
    color: "bg-orange-500 dark:bg-orange-600",
    hoverColor: "hover:bg-orange-600 dark:hover:bg-orange-700",
  },
];

export function QuickActions() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 dark:bg-zinc-800 dark:border-zinc-700">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {quickActions.map((action) => (
          <Link
            key={action.name}
            href={action.href}
            className="group relative flex items-start gap-4 p-4 rounded-lg border border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600 transition-all hover:shadow-sm"
          >
            <div
              className={`flex-shrink-0 w-10 h-10 rounded-lg ${action.color} ${action.hoverColor} flex items-center justify-center transition-colors`}
            >
              <action.icon className="h-5 w-5 text-white" strokeWidth={2} />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {action.name}
              </p>
              <p className="text-xs text-gray-600 dark:text-zinc-400 mt-0.5">
                {action.description}
              </p>
            </div>

            <Plus className="h-4 w-4 text-gray-400 dark:text-zinc-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  );
}
