"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";

export type ChartView = {
  id: string;
  icon: LucideIcon;
  label: string;
};

interface ChartToggleProps {
  views: ChartView[];
  activeView: string;
  onViewChange: (viewId: string) => void;
  storageKey?: string;
}

export function ChartToggle({ views, activeView, onViewChange, storageKey }: ChartToggleProps) {
  // Restore from localStorage on mount
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (storageKey) {
      const saved = localStorage.getItem(`chart-view-${storageKey}`);
      if (saved && views.some((v) => v.id === saved)) {
        onViewChange(saved);
      }
    }
    setMounted(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (viewId: string) => {
    onViewChange(viewId);
    if (storageKey) {
      localStorage.setItem(`chart-view-${storageKey}`, viewId);
    }
  };

  if (!mounted) return null;

  return (
    <div className="flex items-center gap-0.5 rounded-lg bg-gray-100 dark:bg-zinc-800 p-0.5">
      {views.map((view) => {
        const Icon = view.icon;
        const isActive = activeView === view.id;
        return (
          <button
            key={view.id}
            onClick={() => handleChange(view.id)}
            title={view.label}
            className={cn(
              "flex items-center justify-center rounded-md p-1.5 transition-colors",
              isActive
                ? "bg-white dark:bg-zinc-700 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        );
      })}
    </div>
  );
}
