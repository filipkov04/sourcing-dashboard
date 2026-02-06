"use client";

import { useState, useRef, useCallback, useEffect, type ReactNode } from "react";
import { TimelineControls } from "./timeline-controls";

type TimelineCanvasProps = {
  children: ReactNode;
  stageCount?: number;
};

export function TimelineCanvas({ children, stageCount = 0 }: TimelineCanvasProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const viewportRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Helper: compute auto-fit zoom and centering pan for non-fullscreen
  const calcFitView = useCallback(() => {
    const vw = viewportRef.current?.clientWidth || 800;
    const vh = viewportRef.current?.clientHeight || 300;
    if (stageCount <= 0) return { zoom: 1, pan: { x: 0, y: 0 } };

    // Measure actual rendered content size (most accurate), fallback to estimate
    // The 1.06 factor accounts for absolutely-positioned badges and arrow tips
    // that extend beyond the measured scrollWidth
    const fallbackWidth = (stageCount + 1) * 88 + stageCount * 360 + 96;
    const measuredWidth = canvasRef.current?.scrollWidth || fallbackWidth;
    const canvasWidth = measuredWidth * 1.06;

    const fitZoom = Math.max(0.2, Math.min(1, vw / canvasWidth));
    // Center the actual content — distributes breathing room equally on both sides
    const panX = Math.max(0, (vw - measuredWidth * fitZoom) / 2 - 12);

    // For vertical centering, use actual content height (not canvas min-h-full)
    // Content sits at y=32 (p-8 padding) inside the canvas div
    const contentHeight = contentRef.current?.offsetHeight || 200;
    const contentTop = 32; // p-8 top padding on canvas div
    const contentCenterScaled = (contentTop + contentHeight / 2) * fitZoom;
    const panY = Math.max(0, vh / 2 - contentCenterScaled);

    return { zoom: fitZoom, pan: { x: panX, y: panY } };
  }, [stageCount]);

  // Auto-fit zoom on mount for non-fullscreen mode
  useEffect(() => {
    if (hasInitialized || isFullscreen || stageCount <= 0) return;
    const raf = requestAnimationFrame(() => {
      const fit = calcFitView();
      setZoom(fit.zoom);
      setPan(fit.pan);
      setHasInitialized(true);
    });
    return () => cancelAnimationFrame(raf);
  }, [stageCount, isFullscreen, hasInitialized, calcFitView]);

  // Escape key to exit fullscreen
  useEffect(() => {
    if (!isFullscreen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsFullscreen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  // Lock body scroll in fullscreen
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isFullscreen]);

  // Wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom((z) => Math.min(2, Math.max(0.2, z + delta)));
  }, []);

  // Pan via drag - start
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest("button")) return;
      if ((e.target as HTMLElement).closest("input")) return;
      if ((e.target as HTMLElement).closest("textarea")) return;

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
    if (isFullscreen) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
    } else {
      const fit = calcFitView();
      setZoom(fit.zoom);
      setPan(fit.pan);
    }
  }, [isFullscreen, calcFitView]);

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

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => {
      if (prev) {
        // Exiting fullscreen — wait for viewport to resize, then center
        requestAnimationFrame(() => {
          const fit = calcFitView();
          setZoom(fit.zoom);
          setPan(fit.pan);
        });
      }
      return !prev;
    });
  }, [calcFitView]);

  const containerClasses = isFullscreen
    ? "fixed inset-0 z-50 bg-zinc-950 border-none rounded-none"
    : "relative overflow-hidden rounded-lg bg-zinc-900/50 border border-zinc-700";

  const viewportHeight = isFullscreen ? "h-full" : "h-[300px]";

  return (
    <div className={containerClasses}>
      {/* Viewport - clips the visible area */}
      <div
        ref={viewportRef}
        className={`${viewportHeight} overflow-hidden timeline-canvas select-none ${
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
          ref={canvasRef}
          className={`min-w-full min-h-full p-8 ${
            isDragging ? "" : "transition-transform duration-100"
          }`}
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "0 0",
          }}
        >
          {/* Timeline content — centering is handled by pan offsets in calcFitView */}
          <div ref={contentRef} className="min-h-[200px]">
            {children}
          </div>
        </div>
      </div>

      {/* Controls overlay */}
      <TimelineControls
        zoom={zoom}
        onZoomChange={setZoom}
        onReset={handleReset}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
      />
    </div>
  );
}
