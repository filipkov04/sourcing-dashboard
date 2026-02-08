"use client";

import { useMemo, useState, useId } from "react";
import { type StageStatus } from "./timeline-types";

type TimelineConnectorProps = {
  sourceStatus: StageStatus | "ORDER";
  targetStatus: StageStatus;
  sourceProgress: number;
  isActive: boolean;
  sourceStartedAt?: string | null;
  sourceCompletedAt?: string | null;
  sourceStatusSince?: string | null;
  sourceStatusLabel?: string;
  /** Explicit pixel width for the connector line */
  width: number;
};

function formatDuration(startDate: string, endDate?: string | null): string {
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date();
  const diffMs = end.getTime() - start.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (diffDays === 0) return `${diffHours}h`;
  if (diffDays === 1) return `1 day`;
  return `${diffDays} days`;
}

const statusHexColors: Record<string, string> = {
  COMPLETED: "#22c55e",
  ORDER: "#a855f7",
  IN_PROGRESS: "#3b82f6",
  DELAYED: "#f97316",
  BLOCKED: "#ef4444",
  NOT_STARTED: "#52525b",
  SKIPPED: "#52525b",
};

function getHexColor(status: string): string {
  return statusHexColors[status] || statusHexColors.NOT_STARTED;
}

export function TimelineConnector({
  sourceStatus,
  targetStatus,
  sourceProgress,
  isActive,
  sourceStartedAt,
  sourceCompletedAt,
  sourceStatusSince,
  sourceStatusLabel,
  width,
}: TimelineConnectorProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const gradientId = useId();

  const fillPercentage =
    sourceStatus === "COMPLETED" || sourceProgress === 100
      ? 100
      : sourceProgress > 0
      ? Math.min(50 + sourceProgress / 2, 90)
      : 0;

  const arrowColor = fillPercentage >= 100
    ? getHexColor(targetStatus)
    : "#3f3f46";

  const tooltipText = useMemo(() => {
    const parts: string[] = [];
    if (sourceStatusSince && sourceStatusLabel) {
      const statusStr = sourceStatusLabel.replace(/_/g, " ").toLowerCase();
      parts.push(`${statusStr} for ${formatDuration(sourceStatusSince)}`);
    }
    if (sourceStartedAt && sourceCompletedAt) {
      parts.push(`Completed in ${formatDuration(sourceStartedAt, sourceCompletedAt)}`);
    } else if (sourceStartedAt && !sourceCompletedAt) {
      if (!sourceStatusSince) {
        parts.push(`In progress for ${formatDuration(sourceStartedAt)}`);
      }
    }
    return parts.length > 0 ? parts.join(" · ") : null;
  }, [sourceStartedAt, sourceCompletedAt, sourceStatusSince, sourceStatusLabel]);

  const lineHeight = 6;
  const arrowW = 10;
  const arrowH = 6;
  const dotSize = 10;

  return (
    <div
      className="relative flex items-center"
      style={{ width, height: 20 }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Tooltip */}
      {showTooltip && tooltipText && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-600 text-gray-700 dark:text-zinc-300 text-xs px-2.5 py-1 rounded-md whitespace-nowrap z-30 shadow-lg pointer-events-none">
          {tooltipText}
        </div>
      )}

      {/* SVG gradient definition */}
      <svg width="0" height="0" className="absolute">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={getHexColor(sourceStatus)} />
            <stop offset="100%" stopColor={getHexColor(targetStatus)} />
          </linearGradient>
        </defs>
      </svg>

      {/* Line area */}
      <div className="relative flex-1 h-full flex items-center">
        {/* Background line */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-full bg-gray-200 dark:bg-zinc-700 rounded-full"
          style={{ height: lineHeight }}
        />

        {/* Gradient progress fill */}
        <div
          className="absolute top-1/2 -translate-y-1/2 rounded-full transition-all duration-500 ease-out"
          style={{
            height: lineHeight,
            width: `${fillPercentage}%`,
            background: `linear-gradient(to right, ${getHexColor(sourceStatus)}, ${getHexColor(targetStatus)})`,
          }}
        />

        {/* Animated dot for active connectors */}
        {isActive && fillPercentage > 0 && fillPercentage < 100 && (
          <div
            className="absolute top-1/2 -translate-y-1/2 bg-blue-400 rounded-full animate-pulse shadow-lg shadow-blue-500/50"
            style={{
              left: `${fillPercentage}%`,
              transform: "translate(-50%, -50%)",
              width: dotSize,
              height: dotSize,
            }}
          />
        )}
      </div>

      {/* Arrow */}
      <svg
        width={arrowW}
        height={arrowH * 2}
        viewBox={`0 0 ${arrowW} ${arrowH * 2}`}
        className="flex-shrink-0 transition-colors duration-500"
      >
        <polygon
          points={`0,0 ${arrowW},${arrowH} 0,${arrowH * 2}`}
          fill={arrowColor}
        />
      </svg>
    </div>
  );
}
