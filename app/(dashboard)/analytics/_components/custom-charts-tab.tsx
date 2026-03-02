"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useCustomCharts, type CustomChart } from "@/lib/use-custom-charts";
import { ChartBuilderWizard } from "./chart-builder-wizard";
import { CustomChartGrid } from "./custom-chart-grid";

type Props = {
  userId: string;
};

export function CustomChartsTab({ userId }: Props) {
  const { charts, loading, createChart, updateChart, deleteChart } = useCustomCharts();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editingChart, setEditingChart] = useState<CustomChart | null>(null);

  const handleSave = async (data: {
    title: string;
    chartType: string;
    dataSource: string;
    metric: string;
    config: Record<string, any>;
    visibility: "PERSONAL" | "SHARED";
  }) => {
    if (editingChart) {
      const result = await updateChart(editingChart.id, {
        title: data.title,
        config: data.config,
        visibility: data.visibility,
      });
      setEditingChart(null);
      return result;
    }
    return await createChart(data);
  };

  const handleEdit = (chart: CustomChart) => {
    setEditingChart(chart);
    setWizardOpen(true);
  };

  const handleDelete = async (id: string) => {
    await deleteChart(id);
  };

  const handleWizardClose = (open: boolean) => {
    setWizardOpen(open);
    if (!open) setEditingChart(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#EB5D2E]" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Custom Charts</h2>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            Build and save your own visualizations
          </p>
        </div>
        <button
          onClick={() => setWizardOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-[#EB5D2E] hover:bg-[#d4522a] text-white px-4 py-2 text-sm font-medium transition-colors"
        >
          <Plus className="h-4 w-4" /> New Chart
        </button>
      </div>

      <CustomChartGrid
        charts={charts}
        userId={userId}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCreateFirst={() => setWizardOpen(true)}
      />

      <ChartBuilderWizard
        open={wizardOpen}
        onOpenChange={handleWizardClose}
        onSave={handleSave}
        editChart={editingChart}
      />
    </div>
  );
}
