"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart3, ChevronDown, ChevronRight, FolderPlus, Pencil, Trash2, X, Check } from "lucide-react";
import { CustomChartCard } from "./custom-chart-card";
import type { CustomChart, ChartFolder, ChartAnnotation } from "@/lib/use-custom-charts";

const FOLDER_COLORS = [
  "#FF4D15", "#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899", "#06B6D4", "#84CC16",
];

type Props = {
  charts: CustomChart[];
  folders: ChartFolder[];
  userId: string;
  userName?: string;
  onEdit: (chart: CustomChart) => void;
  onDelete: (id: string) => void;
  onCreateFirst: () => void;
  onCreateFolder: (name: string, color?: string) => Promise<ChartFolder | null>;
  onUpdateFolder: (id: string, data: { name?: string; color?: string | null }) => Promise<boolean>;
  onDeleteFolder: (id: string) => Promise<boolean>;
  onMoveToFolder: (chartId: string, folderId: string | null) => Promise<void>;
  onAddAnnotation: (chartId: string, content: string, color?: string) => Promise<ChartAnnotation | null>;
  onDeleteAnnotation: (annotationId: string, chartId: string) => Promise<boolean>;
};

export function CustomChartGrid({
  charts, folders, userId, userName,
  onEdit, onDelete, onCreateFirst,
  onCreateFolder, onUpdateFolder, onDeleteFolder, onMoveToFolder,
  onAddAnnotation, onDeleteAnnotation,
}: Props) {
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderColor, setNewFolderColor] = useState(FOLDER_COLORS[0]);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editFolderName, setEditFolderName] = useState("");

  if (charts.length === 0 && folders.length === 0) {
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

  const toggleFolder = (id: string) => {
    setCollapsedFolders((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    await onCreateFolder(newFolderName.trim(), newFolderColor);
    setNewFolderName("");
    setCreatingFolder(false);
  };

  const handleRenameFolder = async (id: string) => {
    if (!editFolderName.trim()) return;
    await onUpdateFolder(id, { name: editFolderName.trim() });
    setEditingFolderId(null);
  };

  // Group charts by folder
  const chartsByFolder = new Map<string | null, CustomChart[]>();
  chartsByFolder.set(null, []);
  for (const folder of folders) {
    chartsByFolder.set(folder.id, []);
  }
  for (const chart of charts) {
    const key = chart.folderId && chartsByFolder.has(chart.folderId) ? chart.folderId : null;
    chartsByFolder.get(key)!.push(chart);
  }

  const uncategorized = chartsByFolder.get(null) || [];

  const renderChartCard = (chart: CustomChart) => (
    <CustomChartCard
      chart={chart}
      folders={folders}
      onEdit={onEdit}
      onDelete={onDelete}
      isOwner={chart.creatorId === userId}
      userName={userName}
      onMoveToFolder={onMoveToFolder}
      onAddAnnotation={onAddAnnotation}
      onDeleteAnnotation={onDeleteAnnotation}
    />
  );

  return (
    <div className="space-y-8">
      {/* Section 1: Folders */}
      <div>
        <p className="hud-section-label font-mono text-xs uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-500 mb-4">
          Folders
        </p>

        {creatingFolder ? (
          <div className="flex items-center gap-2 mb-4">
            <div className="flex gap-1">
              {FOLDER_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setNewFolderColor(c)}
                  className="w-4 h-4 rounded-full transition-transform"
                  style={{
                    backgroundColor: c,
                    transform: newFolderColor === c ? "scale(1.25)" : "scale(1)",
                    outline: newFolderColor === c ? "2px solid white" : "none",
                    outlineOffset: "1px",
                    boxShadow: newFolderColor === c ? `0 0 0 2px ${c}40` : "none",
                  }}
                />
              ))}
            </div>
            <input
              autoFocus
              type="text"
              id="new-folder-name"
              name="new-folder-name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleCreateFolder(); if (e.key === "Escape") setCreatingFolder(false); }}
              placeholder="Folder name..."
              className="w-40 rounded-md border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2.5 py-1 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#EB5D2E]/50"
            />
            <button onClick={handleCreateFolder} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-zinc-800 text-green-600">
              <Check className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => setCreatingFolder(false)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-400">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setCreatingFolder(true)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#EB5D2E] hover:text-[#d4522a] transition-colors mb-4"
          >
            <FolderPlus className="h-3.5 w-3.5" /> New Folder
          </button>
        )}

        {folders.length === 0 ? (
          <p className="text-xs text-gray-400 dark:text-zinc-500 py-4">No folders yet — create one to organize your charts</p>
        ) : (
          <div className="space-y-5">
            {folders.map((folder) => {
              const folderCharts = chartsByFolder.get(folder.id) || [];
              const isCollapsed = collapsedFolders.has(folder.id);
              const isEditing = editingFolderId === folder.id;

              return (
                <div key={folder.id}>
                  {/* Folder header */}
                  <div
                    className="flex items-center gap-2 mb-2 cursor-pointer select-none group"
                    onClick={() => !isEditing && toggleFolder(folder.id)}
                  >
                    <div className="w-3 h-3 rounded flex-shrink-0" style={{ backgroundColor: folder.color || "#888" }} />
                    {isEditing ? (
                      <div className="flex items-center gap-2 flex-1" onClick={(e) => e.stopPropagation()}>
                        <input
                          autoFocus
                          type="text"
                          id={`edit-folder-${folder.id}`}
                          name={`edit-folder-${folder.id}`}
                          value={editFolderName}
                          onChange={(e) => setEditFolderName(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") handleRenameFolder(folder.id); if (e.key === "Escape") setEditingFolderId(null); }}
                          className="flex-1 max-w-xs rounded-md border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 py-0.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#EB5D2E]/50"
                        />
                        <button onClick={() => handleRenameFolder(folder.id)} className="p-0.5 text-green-600 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded">
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => setEditingFolderId(null)} className="p-0.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        {isCollapsed ? <ChevronRight className="h-3.5 w-3.5 text-gray-400" /> : <ChevronDown className="h-3.5 w-3.5 text-gray-400" />}
                        <span className="text-sm font-medium text-gray-700 dark:text-zinc-300">{folder.name}</span>
                        <span className="text-[10px] text-gray-400 dark:text-zinc-500">{folderCharts.length}</span>
                        <div className="flex-1" />
                        <div className="hidden group-hover:flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => { setEditingFolderId(folder.id); setEditFolderName(folder.name); }}
                            className="p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 rounded"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => onDeleteFolder(folder.id)}
                            className="p-0.5 text-gray-400 hover:text-red-500 rounded"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Folder contents */}
                  <AnimatePresence initial={false}>
                    {!isCollapsed && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        {folderCharts.length === 0 ? (
                          <div className="flex items-center justify-center py-5 rounded-lg border border-dashed border-gray-200 dark:border-zinc-700 text-xs text-gray-400 dark:text-zinc-500">
                            Add charts using the folder icon on each chart
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pl-5 border-l-2" style={{ borderColor: folder.color || "#888" }}>
                            {folderCharts.map((chart) => (
                              <motion.div key={chart.id} layout>
                                {renderChartCard(chart)}
                              </motion.div>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Section 2: Uncategorized */}
      <div>
        <p className="hud-section-label font-mono text-xs uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-500 mb-4">Uncategorized</p>
        {uncategorized.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <AnimatePresence mode="popLayout">
              {uncategorized.map((chart) => (
                <motion.div
                  key={chart.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  layout
                >
                  {renderChartCard(chart)}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <p className="text-xs text-gray-400 dark:text-zinc-500 py-4">No uncategorized charts</p>
        )}
      </div>
    </div>
  );
}
