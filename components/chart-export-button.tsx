"use client";

import { useCallback, useRef, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toPng } from "html-to-image";

interface ChartExportButtonProps {
  /** Ref to the chart container element to capture */
  targetRef: React.RefObject<HTMLElement | null>;
  /** Filename without extension */
  filename?: string;
}

export function ChartExportButton({ targetRef, filename = "chart" }: ChartExportButtonProps) {
  const [exporting, setExporting] = useState(false);

  const handleExport = useCallback(async () => {
    if (!targetRef.current) return;
    setExporting(true);
    try {
      const dataUrl = await toPng(targetRef.current, {
        backgroundColor: "#ffffff",
        pixelRatio: 2,
        cacheBust: true,
      });
      const link = document.createElement("a");
      link.download = `${filename}-${new Date().toISOString().split("T")[0]}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Chart export failed:", error);
    } finally {
      setExporting(false);
    }
  }, [targetRef, filename]);

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      title="Download as image"
      className="flex items-center justify-center rounded-md p-1.5 text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
    >
      {exporting ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Download className="h-3.5 w-3.5" />
      )}
    </button>
  );
}
