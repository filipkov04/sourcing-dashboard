"use client";

import { useCallback, useRef, useState } from "react";
import {
  Download, Loader2, MoreHorizontal, Pencil, Trash2, Lock, Users, Clock,
  Folder, MessageSquarePlus, X, Send,
} from "lucide-react";
import { toPng } from "html-to-image";
import { useChartData, type CustomChart, type ChartFolder, type ChartAnnotation } from "@/lib/use-custom-charts";
import { getDataSource, getMetric } from "@/lib/chart-data-sources";
import { CustomChartRenderer } from "./custom-chart-renderer";

const CHART_TYPE_LABELS: Record<string, string> = {
  BAR: "Bar Chart", LINE: "Line Chart", PIE: "Pie Chart",
  AREA: "Area Chart", RADAR: "Radar Chart", STACKED_BAR: "Stacked Bar",
};

const PERIOD_LABELS: Record<string, string> = {
  "7d": "Last 7 days", "30d": "Last 30 days", "90d": "Last 90 days", "all": "All time",
};

const ANNOTATION_COLORS = ["#FF4D15", "#3B82F6", "#10B981", "#F59E0B", "#8B5CF6"];

type Props = {
  chart: CustomChart;
  folders: ChartFolder[];
  onEdit: (chart: CustomChart) => void;
  onDelete: (id: string) => void;
  isOwner: boolean;
  userName?: string;
  onMoveToFolder: (chartId: string, folderId: string | null) => Promise<void>;
  onAddAnnotation: (chartId: string, content: string, color?: string) => Promise<ChartAnnotation | null>;
  onDeleteAnnotation: (annotationId: string, chartId: string) => Promise<boolean>;
};

export function CustomChartCard({
  chart, folders, onEdit, onDelete, isOwner, userName,
  onMoveToFolder, onAddAnnotation, onDeleteAnnotation,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [folderPickerOpen, setFolderPickerOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [annotationInput, setAnnotationInput] = useState("");
  const [annotationColor, setAnnotationColor] = useState(ANNOTATION_COLORS[0]);
  const [showAnnotationForm, setShowAnnotationForm] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const { transformedData, loading } = useChartData(chart.dataSource, chart.metric, chart.config);

  const periodLabel = PERIOD_LABELS[chart.config?.period || "all"] || "All time";
  const annotations = chart.annotations || [];
  const currentFolder = folders.find((f) => f.id === chart.folderId);

  const handleDownload = useCallback(async () => {
    const card = cardRef.current;
    if (!card) return;
    setExporting(true);

    const metricDef = getMetric(chart.dataSource, chart.metric);
    const dsDef = getDataSource(chart.dataSource);
    const chartTypeLabel = CHART_TYPE_LABELS[chart.chartType] || chart.chartType;
    const exportDate = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

    const accent = document.createElement("div");
    accent.setAttribute("data-export", "true");
    accent.style.cssText = "height:4px;background:linear-gradient(90deg,#FF4D15,#FFB21A);border-radius:8px 8px 0 0;";

    const header = document.createElement("div");
    header.setAttribute("data-export", "true");
    header.style.cssText = "padding:24px 32px 16px;font-family:system-ui,-apple-system,sans-serif;";
    header.innerHTML = `
      <div style="font-size:20px;font-weight:600;color:#111;margin-bottom:4px;">${chart.title}</div>
      <div style="font-size:13px;color:#888;margin-bottom:16px;">${chartTypeLabel} &middot; ${dsDef?.name || chart.dataSource} &middot; ${metricDef?.name || chart.metric}</div>
      <div style="display:flex;gap:12px;flex-wrap:wrap;">
        <div style="display:flex;align-items:center;gap:6px;font-size:12px;color:#666;background:#f5f5f5;padding:5px 12px;border-radius:6px;">
          <span style="color:#FF4D15;">&#9719;</span> ${periodLabel}
        </div>
        ${userName ? `<div style="display:flex;align-items:center;gap:6px;font-size:12px;color:#666;background:#f5f5f5;padding:5px 12px;border-radius:6px;">
          <span style="color:#FF4D15;">&#9737;</span> Created by ${userName}
        </div>` : ""}
        <div style="display:flex;align-items:center;gap:6px;font-size:12px;color:#666;background:#f5f5f5;padding:5px 12px;border-radius:6px;">
          <span style="color:#FF4D15;">&#9707;</span> Exported ${exportDate}
        </div>
      </div>
    `;

    const divider = document.createElement("div");
    divider.setAttribute("data-export", "true");
    divider.style.cssText = "height:1px;background:#eee;margin:0 32px;";

    const footer = document.createElement("div");
    footer.setAttribute("data-export", "true");
    footer.style.cssText = "padding:14px 32px;display:flex;justify-content:space-between;align-items:center;border-top:1px solid #eee;font-family:system-ui,-apple-system,sans-serif;";
    footer.innerHTML = `
      <div style="font-size:11px;color:#aaa;">Generated from SourceTrack Analytics</div>
      <div style="font-size:11px;font-weight:600;color:#FF4D15;">SourceTrack</div>
    `;

    const origBorder = card.style.border;
    const origBorderRadius = card.style.borderRadius;
    const origOverflow = card.style.overflow;

    const cardHeader = card.querySelector("[data-card-header]") as HTMLElement | null;
    const annotationsArea = card.querySelector("[data-annotations-area]") as HTMLElement | null;
    if (cardHeader) cardHeader.style.display = "none";
    if (annotationsArea) annotationsArea.style.display = "none";

    const chartArea = card.querySelector("[data-chart-area]") as HTMLElement;
    card.insertBefore(accent, card.firstChild);
    card.insertBefore(header, chartArea || accent.nextSibling);
    card.insertBefore(divider, chartArea || header.nextSibling);
    card.appendChild(footer);

    card.style.border = "1px solid #e5e5e5";
    card.style.borderRadius = "10px";
    card.style.overflow = "hidden";

    try {
      const dataUrl = await toPng(card, { pixelRatio: 3, cacheBust: true, backgroundColor: "#ffffff" });
      const link = document.createElement("a");
      link.download = `${chart.title.replace(/[^a-zA-Z0-9-_ ]/g, "").replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().split("T")[0]}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Chart export failed:", error);
    } finally {
      card.querySelectorAll("[data-export]").forEach((el) => el.remove());
      if (cardHeader) cardHeader.style.display = "";
      if (annotationsArea) annotationsArea.style.display = "";
      card.style.border = origBorder;
      card.style.borderRadius = origBorderRadius;
      card.style.overflow = origOverflow;
      setExporting(false);
    }
  }, [chart, userName, periodLabel]);

  const handleAddAnnotation = async () => {
    if (!annotationInput.trim()) return;
    await onAddAnnotation(chart.id, annotationInput.trim(), annotationColor);
    setAnnotationInput("");
    setShowAnnotationForm(false);
  };

  return (
    <div ref={cardRef} className="rounded-lg border bg-white dark:bg-zinc-900 border-gray-100 dark:border-zinc-800 card-hover-glow overflow-hidden">
      {/* Header */}
      <div data-card-header="" className="px-4 pt-4 pb-2 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">{chart.title}</h3>
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Folder picker */}
            <div className="relative">
              <button
                onClick={() => setFolderPickerOpen(!folderPickerOpen)}
                title={currentFolder ? `In: ${currentFolder.name}` : "Add to folder"}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
              >
                {currentFolder ? (
                  <Folder className="h-3.5 w-3.5" style={{ color: currentFolder.color || "#888" }} />
                ) : (
                  <Folder className="h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
                )}
              </button>
              {folderPickerOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setFolderPickerOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 z-20 w-52 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-xl overflow-hidden">
                    {/* Header */}
                    <div className="px-3 py-2 border-b border-gray-100 dark:border-zinc-700/60">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
                        {currentFolder ? "Move to folder" : "Add to folder"}
                      </p>
                    </div>

                    {/* Current folder indicator + remove */}
                    {currentFolder && (
                      <div className="px-3 py-2 bg-[#EB5D2E]/5 dark:bg-[#EB5D2E]/10 border-b border-gray-100 dark:border-zinc-700/60">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: currentFolder.color || "#888" }} />
                            <span className="text-xs font-medium text-[#EB5D2E]">{currentFolder.name}</span>
                          </div>
                          <button
                            onClick={() => { onMoveToFolder(chart.id, null); setFolderPickerOpen(false); }}
                            className="text-[10px] font-medium text-gray-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Folder list */}
                    <div className="py-1 max-h-48 overflow-y-auto">
                      {folders.length === 0 ? (
                        <div className="px-3 py-4 text-center">
                          <Folder className="h-5 w-5 text-gray-300 dark:text-zinc-600 mx-auto mb-1.5" />
                          <p className="text-[11px] text-gray-400 dark:text-zinc-500">No folders yet</p>
                          <p className="text-[10px] text-gray-300 dark:text-zinc-600">Create one from the Folders section</p>
                        </div>
                      ) : (
                        folders.filter((f) => f.id !== chart.folderId).map((f) => (
                          <button
                            key={f.id}
                            onClick={() => { onMoveToFolder(chart.id, f.id); setFolderPickerOpen(false); }}
                            className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700/50 transition-colors"
                          >
                            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: f.color || "#888" }} />
                            <span>Add to <span className="font-medium">{f.name}</span></span>
                          </button>
                        ))
                      )}
                      {folders.length > 0 && folders.every((f) => f.id === chart.folderId) && (
                        <p className="px-3 py-2 text-[11px] text-gray-400 dark:text-zinc-500 text-center">No other folders available</p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
            {/* Add note */}
            <button
              onClick={() => setShowAnnotationForm(!showAnnotationForm)}
              title="Add note"
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <MessageSquarePlus className="h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
            </button>
            <button
              onClick={handleDownload}
              disabled={exporting || loading}
              title="Download as image"
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
            >
              {exporting ? (
                <Loader2 className="h-3.5 w-3.5 text-gray-400 dark:text-zinc-500 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
              )}
            </button>
            {isOwner && (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="p-1 rounded hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <MoreHorizontal className="h-4 w-4 text-gray-400 dark:text-zinc-500" />
                </button>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-1 z-20 w-36 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-lg py-1">
                      <button
                        onClick={() => { setMenuOpen(false); onEdit(chart); }}
                        className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-700"
                      >
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </button>
                      <button
                        onClick={() => { setMenuOpen(false); onDelete(chart.id); }}
                        className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Tags row: visibility, period */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {chart.visibility === "PERSONAL" ? (
            <span className="flex items-center gap-1 text-[10px] font-medium text-gray-400 dark:text-zinc-500 bg-gray-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
              <Lock className="h-2.5 w-2.5" /> Personal
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] font-medium text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 px-1.5 py-0.5 rounded">
              <Users className="h-2.5 w-2.5" /> Shared
            </span>
          )}
          <span className="flex items-center gap-1 text-[10px] font-medium text-gray-400 dark:text-zinc-500 bg-gray-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
            <Clock className="h-2.5 w-2.5" /> {periodLabel}
          </span>
        </div>
      </div>

      {/* Annotation form */}
      {showAnnotationForm && (
        <div data-card-header="" className="px-4 pb-2">
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {ANNOTATION_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setAnnotationColor(c)}
                  className="w-4 h-4 rounded-full transition-transform"
                  style={{
                    backgroundColor: c,
                    transform: annotationColor === c ? "scale(1.25)" : "scale(1)",
                    outline: annotationColor === c ? "2px solid white" : "none",
                    outlineOffset: "1px",
                    boxShadow: annotationColor === c ? `0 0 0 2px ${c}40` : "none",
                  }}
                />
              ))}
            </div>
            <input
              autoFocus
              type="text"
              id={`annotation-${chart.id}`}
              name={`annotation-${chart.id}`}
              value={annotationInput}
              onChange={(e) => setAnnotationInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleAddAnnotation(); if (e.key === "Escape") setShowAnnotationForm(false); }}
              placeholder="Add a note..."
              className="flex-1 rounded-md border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 px-2.5 py-1 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#EB5D2E]/50"
            />
            <button onClick={handleAddAnnotation} disabled={!annotationInput.trim()} className="p-1 text-[#EB5D2E] hover:bg-[#EB5D2E]/10 rounded disabled:opacity-30">
              <Send className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => setShowAnnotationForm(false)} className="p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Chart */}
      <div data-chart-area="" className="px-4 pb-2">
        {loading ? (
          <div className="flex items-center justify-center h-[360px]">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#EB5D2E]" />
          </div>
        ) : transformedData ? (
          <CustomChartRenderer
            chartType={chart.chartType}
            data={transformedData.chartData}
            dataKeys={transformedData.dataKeys}
            nameKey={transformedData.nameKey}
            colors={transformedData.colors}
            config={chart.config}
            height={360}
          />
        ) : (
          <div className="flex items-center justify-center h-[360px] text-sm text-gray-400 dark:text-zinc-500">
            Unable to load chart data
          </div>
        )}
      </div>

      {/* Annotations */}
      {annotations.length > 0 && (
        <div data-annotations-area="" className="px-4 pb-3 space-y-1.5">
          {annotations.map((a) => (
            <div key={a.id} className="flex items-start gap-2 group">
              <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: a.color }} />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-700 dark:text-zinc-300">{a.content}</p>
                <p className="text-[10px] text-gray-400 dark:text-zinc-500">
                  {a.authorName} &middot; {new Date(a.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </p>
              </div>
              <button
                onClick={() => onDeleteAnnotation(a.id, chart.id)}
                className="hidden group-hover:block p-0.5 text-gray-300 dark:text-zinc-600 hover:text-red-500 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
