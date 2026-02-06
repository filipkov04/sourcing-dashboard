"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Minus, Plus, Maximize2, Minimize2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type TimelineControlsProps = {
  zoom: number;
  onZoomChange: (zoom: number | ((prev: number) => number)) => void;
  onReset: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
};

export function TimelineControls({
  zoom,
  onZoomChange,
  onReset,
  isFullscreen,
  onToggleFullscreen,
}: TimelineControlsProps) {
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  const handleZoomOut = () => {
    onZoomChange((z) => Math.max(0.2, z - 0.1));
  };

  const handleZoomIn = () => {
    onZoomChange((z) => Math.min(2, z + 0.1));
  };

  // Calculate slider fill percentage (0.2 to 2.0 range)
  const sliderFill = ((zoom - 0.2) / 1.8) * 100;

  // Convert a clientX position on the slider to a zoom value
  const zoomFromSliderX = useCallback(
    (clientX: number) => {
      if (!sliderRef.current) return;
      const rect = sliderRef.current.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const newZoom = 0.2 + ratio * 1.8;
      onZoomChange(Math.round(newZoom * 100) / 100);
    },
    [onZoomChange]
  );

  // Global mousemove/mouseup for slider drag
  useEffect(() => {
    if (!isDraggingSlider) return;
    const handleMouseMove = (e: MouseEvent) => zoomFromSliderX(e.clientX);
    const handleMouseUp = () => setIsDraggingSlider(false);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDraggingSlider, zoomFromSliderX]);

  return (
    <>
      {/* Fullscreen exit button - top right */}
      {isFullscreen && onToggleFullscreen && (
        <div className="absolute top-4 right-4 z-10">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleFullscreen}
            className="h-9 w-9 bg-zinc-800/90 backdrop-blur border border-zinc-700 text-zinc-400 hover:text-zinc-200"
            aria-label="Exit fullscreen"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* Fullscreen title hint */}
      {isFullscreen && (
        <div className="absolute top-4 left-4 text-sm text-zinc-500 z-10">
          Activity Timeline — Press <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-xs text-zinc-400">Esc</kbd> to exit
        </div>
      )}

      {/* Zoom controls - bottom left */}
      <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-zinc-800/90 backdrop-blur rounded-lg px-3 py-2 border border-zinc-700 z-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleZoomOut}
          disabled={zoom <= 0.2}
          className="h-7 w-7 text-zinc-400 hover:text-zinc-200 disabled:opacity-50"
          aria-label="Zoom out"
        >
          <Minus className="h-4 w-4" />
        </Button>

        <div
          ref={sliderRef}
          className="relative w-20 h-4 flex items-center cursor-pointer"
          onMouseDown={(e) => {
            e.stopPropagation();
            setIsDraggingSlider(true);
            zoomFromSliderX(e.clientX);
          }}
        >
          {/* Track */}
          <div className="w-full h-1.5 bg-zinc-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full"
              style={{ width: `${sliderFill}%` }}
            />
          </div>
          {/* Thumb */}
          <div
            className="absolute w-3 h-3 bg-blue-500 rounded-full shadow-sm pointer-events-none"
            style={{ left: `calc(${sliderFill}% - 6px)` }}
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

        {onToggleFullscreen && (
          <>
            <div className="w-px h-4 bg-zinc-700" />
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleFullscreen}
              className="h-7 w-7 text-zinc-400 hover:text-zinc-200"
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          </>
        )}
      </div>

      {/* Hint text - bottom right */}
      <div className="absolute bottom-3 right-3 text-xs text-zinc-500 z-10">
        Scroll to zoom • Drag to pan • Arrow keys to navigate
      </div>
    </>
  );
}
