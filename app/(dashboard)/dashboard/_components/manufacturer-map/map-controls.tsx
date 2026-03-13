"use client";

import { ZoomIn, ZoomOut, RotateCcw, Maximize2 } from "lucide-react";
import type { MapCanvasHandle } from "./map-canvas";

type MapControlsProps = {
  mapRef: React.RefObject<MapCanvasHandle | null>;
};

const btnClass =
  "p-1.5 rounded bg-white/80 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors";

export function MapControls({ mapRef }: MapControlsProps) {
  return (
    <div className="absolute top-3 right-3 z-10 flex flex-col gap-1">
      <button onClick={() => mapRef.current?.zoomIn()} className={btnClass} title="Zoom in">
        <ZoomIn className="h-3.5 w-3.5 text-gray-600 dark:text-zinc-400" />
      </button>
      <button onClick={() => mapRef.current?.zoomOut()} className={btnClass} title="Zoom out">
        <ZoomOut className="h-3.5 w-3.5 text-gray-600 dark:text-zinc-400" />
      </button>
      <button onClick={() => mapRef.current?.resetView()} className={btnClass} title="Reset view">
        <RotateCcw className="h-3.5 w-3.5 text-gray-600 dark:text-zinc-400" />
      </button>
      <button onClick={() => mapRef.current?.fitToMarkers()} className={btnClass} title="Fit to markers">
        <Maximize2 className="h-3.5 w-3.5 text-gray-600 dark:text-zinc-400" />
      </button>
    </div>
  );
}
