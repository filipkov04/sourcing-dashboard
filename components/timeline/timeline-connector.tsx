"use client";

import { useMemo } from "react";
import { statusConfig, type StageStatus } from "./timeline-types";

type TimelineConnectorProps = {
  sourceStatus: StageStatus | "ORDER";
  targetStatus: StageStatus;
  sourceProgress: number;
  isActive: boolean;
};

export function TimelineConnector({
  sourceStatus,
  targetStatus,
  sourceProgress,
  isActive,
}: TimelineConnectorProps) {
  const sourceConfig = useMemo(
    () => statusConfig[sourceStatus] || statusConfig.NOT_STARTED,
    [sourceStatus]
  );
  const targetConfig = useMemo(
    () => statusConfig[targetStatus] || statusConfig.NOT_STARTED,
    [targetStatus]
  );

  // Calculate fill percentage: 100% if source is completed, otherwise based on source progress
  const fillPercentage =
    sourceStatus === "COMPLETED" || sourceProgress === 100
      ? 100
      : sourceProgress > 0
      ? Math.min(50 + sourceProgress / 2, 90) // Partial fill when in progress
      : 0;

  // Determine the color based on source status
  const getGradientColor = () => {
    if (sourceStatus === "COMPLETED") return "from-green-500 to-green-500";
    if (sourceStatus === "ORDER") return "from-purple-500 to-purple-500";
    if (sourceStatus === "IN_PROGRESS") return "from-blue-500 to-blue-500";
    if (sourceStatus === "DELAYED") return "from-orange-500 to-orange-500";
    if (sourceStatus === "BLOCKED") return "from-red-500 to-red-500";
    return "from-zinc-600 to-zinc-600";
  };

  // Arrow color matches the fill color when connector is fully filled
  const getArrowBorderClass = () => {
    if (fillPercentage < 100) return "border-l-zinc-600";
    if (sourceStatus === "COMPLETED") return "border-l-green-500";
    if (sourceStatus === "ORDER") return "border-l-purple-500";
    if (sourceStatus === "IN_PROGRESS") return "border-l-blue-500";
    if (sourceStatus === "DELAYED") return "border-l-orange-500";
    if (sourceStatus === "BLOCKED") return "border-l-red-500";
    return "border-l-zinc-600";
  };

  return (
    <div className="flex items-center min-w-[360px] h-[88px] self-start mt-0">
      {/* Line area */}
      <div className="relative flex-1 h-full flex items-center">
        {/* Background line */}
        <div className="absolute top-1/2 -translate-y-1/2 w-full h-1.5 bg-zinc-700 rounded-full" />

        {/* Progress fill */}
        <div
          className={`absolute top-1/2 -translate-y-1/2 h-1.5 rounded-full bg-gradient-to-r ${getGradientColor()} transition-all duration-500 ease-out`}
          style={{ width: `${fillPercentage}%` }}
        />

        {/* Animated dot for active connectors */}
        {isActive && fillPercentage > 0 && fillPercentage < 100 && (
          <div
            className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-blue-400 rounded-full animate-pulse shadow-lg shadow-blue-500/50"
            style={{ left: `${fillPercentage}%`, transform: "translate(-50%, -50%)" }}
          />
        )}
      </div>

      {/* Directional arrow */}
      <div
        className={`w-0 h-0 border-t-[7px] border-b-[7px] border-l-[10px] border-t-transparent border-b-transparent ${getArrowBorderClass()} transition-colors duration-500 flex-shrink-0 mr-1`}
      />
    </div>
  );
}
