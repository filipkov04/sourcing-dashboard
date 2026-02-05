"use client";

import { Minus, Plus, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type TimelineControlsProps = {
  zoom: number;
  onZoomChange: (zoom: number | ((prev: number) => number)) => void;
  onReset: () => void;
};

export function TimelineControls({
  zoom,
  onZoomChange,
  onReset,
}: TimelineControlsProps) {
  const handleZoomOut = () => {
    onZoomChange((z) => Math.max(0.5, z - 0.1));
  };

  const handleZoomIn = () => {
    onZoomChange((z) => Math.min(2, z + 0.1));
  };

  // Calculate slider fill percentage (0.5 to 2.0 range)
  const sliderFill = ((zoom - 0.5) / 1.5) * 100;

  return (
    <>
      {/* Zoom controls - bottom left */}
      <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-zinc-800/90 backdrop-blur rounded-lg px-3 py-2 border border-zinc-700">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleZoomOut}
          disabled={zoom <= 0.5}
          className="h-7 w-7 text-zinc-400 hover:text-zinc-200 disabled:opacity-50"
          aria-label="Zoom out"
        >
          <Minus className="h-4 w-4" />
        </Button>

        <div className="w-20 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-100"
            style={{ width: `${sliderFill}%` }}
          />
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleZoomIn}
          disabled={zoom >= 2}
          className="h-7 w-7 text-zinc-400 hover:text-zinc-200 disabled:opacity-50"
          aria-label="Zoom in"
        >
          <Plus className="h-4 w-4" />
        </Button>

        <span className="text-xs text-zinc-400 w-10 text-right">
          {Math.round(zoom * 100)}%
        </span>

        <div className="w-px h-4 bg-zinc-700" />

        <Button
          variant="ghost"
          size="icon"
          onClick={onReset}
          className="h-7 w-7 text-zinc-400 hover:text-zinc-200"
          aria-label="Reset view"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Hint text - bottom right */}
      <div className="absolute bottom-3 right-3 text-xs text-zinc-500">
        Scroll to zoom • Drag to pan
      </div>
    </>
  );
}
