"use client";

import { useState, useRef, useCallback, type ReactNode } from "react";
import { TimelineControls } from "./timeline-controls";

type TimelineCanvasProps = {
  children: ReactNode;
};

export function TimelineCanvas({ children }: TimelineCanvasProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const viewportRef = useRef<HTMLDivElement>(null);

  // Wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom((z) => Math.min(2, Math.max(0.5, z + delta)));
  }, []);

  // Pan via drag - start
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Only start drag if clicking on the canvas background, not on interactive elements
      if ((e.target as HTMLElement).closest("button")) return;

      setIsDragging(true);
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        panX: pan.x,
        panY: pan.y,
      };
    },
    [pan.x, pan.y]
  );

  // Pan via drag - move
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      setPan({
        x: dragStartRef.current.panX + dx,
        y: dragStartRef.current.panY + dy,
      });
    },
    [isDragging]
  );

  // Pan via drag - end
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Reset to fit
  const handleReset = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  // Touch support for pan
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      setIsDragging(true);
      dragStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        panX: pan.x,
        panY: pan.y,
      };
    },
    [pan.x, pan.y]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging || e.touches.length !== 1) return;
      const touch = e.touches[0];
      const dx = touch.clientX - dragStartRef.current.x;
      const dy = touch.clientY - dragStartRef.current.y;
      setPan({
        x: dragStartRef.current.panX + dx,
        y: dragStartRef.current.panY + dy,
      });
    },
    [isDragging]
  );

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  return (
    <div className="relative overflow-hidden rounded-lg bg-zinc-900/50 border border-zinc-700">
      {/* Viewport - clips the visible area */}
      <div
        ref={viewportRef}
        className={`h-[300px] overflow-hidden timeline-canvas select-none ${
          isDragging ? "cursor-grabbing" : "cursor-grab"
        }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Canvas - transforms to pan/zoom */}
        <div
          className={`min-w-full min-h-full p-8 ${
            isDragging ? "" : "transition-transform duration-100"
          }`}
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "0 0",
          }}
        >
          {/* Timeline content centered in larger space */}
          <div className="flex items-center justify-center min-h-[200px]">
            {children}
          </div>
        </div>
      </div>

      {/* Controls overlay */}
      <TimelineControls zoom={zoom} onZoomChange={setZoom} onReset={handleReset} />
    </div>
  );
}
