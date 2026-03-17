"use client";

import { useState } from "react";
import { Plus, FileText } from "lucide-react";
import { useCustomCharts, useChartFolders, type CustomChart } from "@/lib/use-custom-charts";
import { ChartBuilderWizard } from "./chart-builder-wizard";
import { CustomChartGrid } from "./custom-chart-grid";
import { SavedReportsSection } from "./saved-reports-section";

type Props = {
  userId: string;
  userName?: string;
};

export function CustomChartsTab({ userId, userName }: Props) {
  const { charts, loading, createChart, updateChart, deleteChart, addAnnotation, deleteAnnotation } = useCustomCharts();
  const { folders, loading: foldersLoading, createFolder, updateFolder, deleteFolder } = useChartFolders();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editingChart, setEditingChart] = useState<CustomChart | null>(null);
  const [showReports, setShowReports] = useState(false);

  const handleSave = async (data: {
    title: string;
    chartType: string;
    dataSource: string;
    metric: string;
    config: Record<string, unknown>;
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

  const handleMoveToFolder = async (chartId: string, folderId: string | null) => {
    await updateChart(chartId, { folderId });
  };

  const handleWizardClose = (open: boolean) => {
    setWizardOpen(open);
    if (!open) setEditingChart(null);
  };

  if (loading || foldersLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#EB5D2E]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Custom Charts</h2>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            Build and save your own visualizations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowReports(!showReports)}
            className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
              showReports
                ? "border-[#EB5D2E] bg-[#EB5D2E]/5 text-[#EB5D2E]"
                : "border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:border-gray-300 dark:hover:border-zinc-600"
            }`}
          >
            <FileText className="h-4 w-4" /> Reports
          </button>
          <button
            onClick={() => setWizardOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-[#EB5D2E] hover:bg-[#d4522a] text-white px-4 py-2 text-sm font-medium transition-colors"
          >
            <Plus className="h-4 w-4" /> New Chart
          </button>
        </div>
      </div>

      {showReports && (
        <SavedReportsSection charts={charts} />
      )}

      <CustomChartGrid
        charts={charts}
        folders={folders}
        userId={userId}
        userName={userName}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCreateFirst={() => setWizardOpen(true)}
        onCreateFolder={createFolder}
        onUpdateFolder={updateFolder}
        onDeleteFolder={deleteFolder}
        onMoveToFolder={handleMoveToFolder}
        onAddAnnotation={addAnnotation}
        onDeleteAnnotation={deleteAnnotation}
      />

      <ChartBuilderWizard
        key={editingChart?.id || "new"}
        open={wizardOpen}
        onOpenChange={handleWizardClose}
        onSave={handleSave}
        editChart={editingChart}
      />
    </div>
  );
}
