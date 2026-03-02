"use client";

import { motion, AnimatePresence } from "framer-motion";
import { BarChart3 } from "lucide-react";
import { CustomChartCard } from "./custom-chart-card";
import type { CustomChart } from "@/lib/use-custom-charts";

type Props = {
  charts: CustomChart[];
  userId: string;
  onEdit: (chart: CustomChart) => void;
  onDelete: (id: string) => void;
  onCreateFirst: () => void;
};

export function CustomChartGrid({ charts, userId, onEdit, onDelete, onCreateFirst }: Props) {
  if (charts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-gray-100 dark:bg-zinc-800 p-4 mb-4">
          <BarChart3 className="h-8 w-8 text-gray-400 dark:text-zinc-500" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No custom charts yet</h3>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mb-4 max-w-sm">
          Build your own visualizations by selecting a chart type, picking a metric, and configuring the display.
        </p>
        <button
          onClick={onCreateFirst}
          className="inline-flex items-center gap-2 rounded-lg bg-[#EB5D2E] hover:bg-[#d4522a] text-white px-4 py-2 text-sm font-medium transition-colors"
        >
          <BarChart3 className="h-4 w-4" /> Create your first chart
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <AnimatePresence mode="popLayout">
        {charts.map((chart) => (
          <motion.div
            key={chart.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            layout
          >
            <CustomChartCard
              chart={chart}
              onEdit={onEdit}
              onDelete={onDelete}
              isOwner={chart.creatorId === userId}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
