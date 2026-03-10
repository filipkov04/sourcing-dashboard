"use client";

import { ZoomIn, ZoomOut, RotateCcw, Maximize2, Layers, ShieldCheck, Route } from "lucide-react";
import type { MapCanvasHandle } from "./map-canvas";

type MapControlsProps = {
  mapRef: React.RefObject<MapCanvasHandle | null>;
  clusteringEnabled: boolean;
  onToggleClustering: () => void;
  verifiedOnly: boolean;
  onToggleVerifiedOnly: () => void;
  routesEnabled: boolean;
  onToggleRoutes: () => void;
};

const btnClass =
  "p-1.5 rounded bg-white/80 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors";

export function MapControls({
  mapRef,
  clusteringEnabled,
  onToggleClustering,
  verifiedOnly,
  onToggleVerifiedOnly,
  routesEnabled,
  onToggleRoutes,
}: MapControlsProps) {
  return (
    <div className="absolute top-3 right-3 z-10 flex flex-col gap-1">
      <button
        onClick={() => mapRef.current?.zoomIn()}
        className={btnClass}
        title="Zoom in"
      >
        <ZoomIn className="h-3.5 w-3.5 text-gray-600 dark:text-zinc-400" />
      </button>
      <button
        onClick={() => mapRef.current?.zoomOut()}
        className={btnClass}
        title="Zoom out"
      >
        <ZoomOut className="h-3.5 w-3.5 text-gray-600 dark:text-zinc-400" />
      </button>
      <button
        onClick={() => mapRef.current?.resetView()}
        className={btnClass}
        title="Reset view"
      >
        <RotateCcw className="h-3.5 w-3.5 text-gray-600 dark:text-zinc-400" />
      </button>
      <button
        onClick={() => mapRef.current?.fitToMarkers()}
        className={btnClass}
        title="Fit to markers"
      >
        <Maximize2 className="h-3.5 w-3.5 text-gray-600 dark:text-zinc-400" />
      </button>
      <div className="h-px bg-gray-200 dark:bg-zinc-700 my-0.5" />
      <button
        onClick={onToggleClustering}
        className={`${btnClass} ${clusteringEnabled ? "ring-1 ring-[#FF4D15]/50" : ""}`}
        title={clusteringEnabled ? "Disable clustering" : "Enable clustering"}
      >
        <Layers className={`h-3.5 w-3.5 ${clusteringEnabled ? "text-[#FF4D15]" : "text-gray-600 dark:text-zinc-400"}`} />
      </button>
      <button
        onClick={onToggleVerifiedOnly}
        className={`${btnClass} ${verifiedOnly ? "ring-1 ring-green-500/50" : ""}`}
        title={verifiedOnly ? "Show all factories" : "Show verified only"}
      >
        <ShieldCheck className={`h-3.5 w-3.5 ${verifiedOnly ? "text-green-500" : "text-gray-600 dark:text-zinc-400"}`} />
      </button>
      <button
        onClick={onToggleRoutes}
        className={`${btnClass} ${routesEnabled ? "ring-1 ring-orange-500/50" : ""}`}
        title={routesEnabled ? "Hide shipping routes" : "Show shipping routes"}
      >
        <Route className={`h-3.5 w-3.5 ${routesEnabled ? "text-orange-500" : "text-gray-600 dark:text-zinc-400"}`} />
      </button>
    </div>
  );
}
