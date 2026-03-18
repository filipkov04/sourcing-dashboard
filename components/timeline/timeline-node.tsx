"use client";

import { useMemo } from "react";
import {
  ClipboardList,
  Check,
} from "lucide-react";
import { statusConfig, NODE_CARD_WIDTH, NODE_CARD_HEIGHT, type StageStatus, type TimelineStage } from "./timeline-types";

type TimelineNodeProps = {
  type: "order-info" | "stage";
  stage?: TimelineStage;
  sequence?: number;
  orderStatus?: string;
  orderPriority?: string;
  isExpanded: boolean;
  onClick: () => void;
  eventCount?: number;
  isFocused?: boolean;
  "data-timeline-node"?: boolean;
};

// Format status text for display
function formatStatus(status: string): string {
  const labels: Record<string, string> = {
    NOT_STARTED: "Not Started",
    IN_PROGRESS: "In Progress",
    BEHIND_SCHEDULE: "Behind Schedule",
    COMPLETED: "Completed",
    SKIPPED: "Skipped",
    DELAYED: "Delayed",
    BLOCKED: "Blocked",
  };
  return labels[status] || status.replace(/_/g, " ");
}

// Status badge colors
const statusBadgeColors: Record<string, string> = {
  NOT_STARTED: "bg-gray-200 dark:bg-zinc-700 text-gray-500 dark:text-zinc-400",
  IN_PROGRESS: "bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300",
  BEHIND_SCHEDULE: "bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300",
  COMPLETED: "bg-green-100 dark:bg-green-900/60 text-green-700 dark:text-green-300",
  SKIPPED: "bg-gray-200 dark:bg-zinc-700 text-gray-500 dark:text-zinc-400",
  DELAYED: "bg-orange-100 dark:bg-orange-900/60 text-orange-700 dark:text-orange-300",
  BLOCKED: "bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-300",
};

// Progress percentage text colors
const progressTextColors: Record<string, string> = {
  NOT_STARTED: "text-gray-400 dark:text-zinc-500",
  IN_PROGRESS: "text-blue-600 dark:text-blue-400",
  BEHIND_SCHEDULE: "text-amber-600 dark:text-amber-400",
  COMPLETED: "text-green-600 dark:text-green-400",
  SKIPPED: "text-gray-400 dark:text-zinc-500",
  DELAYED: "text-orange-600 dark:text-orange-400",
  BLOCKED: "text-red-600 dark:text-red-400",
};

// Progress bar fill colors
const progressBarColors: Record<string, string> = {
  NOT_STARTED: "bg-gray-400 dark:bg-zinc-500",
  IN_PROGRESS: "bg-blue-500 dark:bg-blue-400",
  BEHIND_SCHEDULE: "bg-amber-500 dark:bg-amber-400",
  COMPLETED: "bg-green-500 dark:bg-green-400",
  SKIPPED: "bg-gray-400 dark:bg-zinc-500",
  DELAYED: "bg-orange-500 dark:bg-orange-400",
  BLOCKED: "bg-red-500 dark:bg-red-400",
};

export function TimelineNode({
  type,
  stage,
  sequence,
  orderStatus,
  orderPriority,
  isExpanded,
  onClick,
  eventCount = 0,
  isFocused = false,
}: TimelineNodeProps) {
  const config = useMemo(() => {
    if (type === "order-info") return statusConfig.ORDER;
    const status = (stage?.status || "NOT_STARTED") as StageStatus;
    return statusConfig[status] || statusConfig.NOT_STARTED;
  }, [type, stage?.status]);

  const progress = stage?.progress ?? 0;
  const isCompleted = stage?.status === "COMPLETED";
  const status = stage?.status || "NOT_STARTED";
  const label = type === "order-info" ? "Order Info" : stage?.name || "Stage";

  // Order-info card
  if (type === "order-info") {
    return (
      <button
        onClick={onClick}
        className={`
          relative flex flex-col rounded-xl border-2 p-3
          transition-all duration-200 cursor-pointer
          bg-purple-50 dark:bg-purple-900/30 border-purple-300 dark:border-purple-600
          ${isExpanded ? "shadow-lg shadow-purple-500/30" : ""}
          ${isFocused ? "ring-[3px] ring-black/30 dark:ring-white/70 ring-offset-[3px] ring-offset-white dark:ring-offset-zinc-900 scale-105 shadow-xl" : ""}
          hover:shadow-lg hover:shadow-purple-500/20 hover:scale-[1.02]
          focus:outline-none focus-visible:ring-[3px] focus-visible:ring-black/30 dark:focus-visible:ring-white/70 focus-visible:ring-offset-[3px]
        `}
        style={{ width: NODE_CARD_WIDTH, height: NODE_CARD_HEIGHT }}
        data-timeline-node
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-label="Order Information Changes"
      >
        {/* Top row: icon */}
        <div className="flex items-center w-full mb-1.5">
          <ClipboardList className="h-5 w-5 text-purple-500 dark:text-purple-400" />
        </div>

        {/* Name */}
        <p className="text-xs font-semibold text-purple-700 dark:text-purple-200 text-left truncate w-full">
          {label}
        </p>

        {/* Priority */}
        {orderPriority && (
          <span className={`mt-auto text-[10px] font-medium self-start ${
            orderPriority === "URGENT" ? "text-red-500" :
            orderPriority === "HIGH" ? "text-orange-500" :
            "text-purple-400 dark:text-purple-300"
          }`}>
            {orderPriority.charAt(0) + orderPriority.slice(1).toLowerCase()} priority
          </span>
        )}

        {/* Event count badge */}
        {eventCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-gray-200 dark:bg-zinc-700 text-gray-600 dark:text-zinc-300 text-xs font-medium rounded-full w-6 h-6 flex items-center justify-center border border-gray-300 dark:border-zinc-600 z-20">
            {eventCount > 9 ? "9+" : eventCount}
          </span>
        )}
      </button>
    );
  }

  // Stage card
  return (
    <button
      onClick={onClick}
      className={`
        relative flex flex-col rounded-xl border-2 p-3
        transition-all duration-200 cursor-pointer
        ${config.bgColor} ${config.borderColor} ${config.glowColor}
        ${isExpanded ? "shadow-lg" : ""}
        ${isFocused ? "ring-[3px] ring-black/30 dark:ring-white/70 ring-offset-[3px] ring-offset-white dark:ring-offset-zinc-900 scale-105 shadow-xl" : ""}
        hover:shadow-lg hover:scale-[1.02]
        focus:outline-none focus-visible:ring-[3px] focus-visible:ring-black/30 dark:focus-visible:ring-white/70 focus-visible:ring-offset-[3px]
      `}
      style={{ width: NODE_CARD_WIDTH, height: NODE_CARD_HEIGHT }}
      data-timeline-node
      tabIndex={0}
      aria-expanded={isExpanded}
      aria-label={`${label}, ${progress}% complete`}
    >
      {/* Top row: sequence number + status badge */}
      <div className="flex items-center justify-between w-full mb-1">
        <span className={`h-6 w-6 flex items-center justify-center rounded-full text-xs font-bold ${config.iconColor} ${config.sequenceBgColor}`}>
          {sequence ?? stage?.sequence ?? ""}
        </span>
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${statusBadgeColors[status] || statusBadgeColors.NOT_STARTED}`}>
          {formatStatus(status)}
        </span>
      </div>

      {/* Stage name */}
      <p className="text-xs font-semibold text-gray-800 dark:text-zinc-100 text-left truncate w-full mb-auto">
        {label}
      </p>

      {/* Expected date range */}
      {stage?.expectedStartDate && stage?.expectedEndDate && (
        <p className="text-[9px] text-gray-700 dark:text-zinc-200 font-medium truncate w-full">
          {new Date(stage.expectedStartDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} – {new Date(stage.expectedEndDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </p>
      )}

      {/* Progress bar */}
      <div className="w-full mt-auto">
        <div className="w-full h-1.5 bg-gray-200 dark:bg-zinc-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${progressBarColors[status] || progressBarColors.NOT_STARTED}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-1">
          <p className={`text-[10px] font-medium ${progressTextColors[status] || progressTextColors.NOT_STARTED}`}>
            {progress}% complete
          </p>
          {/* Schedule indicator */}
          {stage?.expectedEndDate && status !== "COMPLETED" && status !== "SKIPPED" && (() => {
            const now = new Date();
            const expectedEnd = new Date(stage.expectedEndDate);
            const diffMs = expectedEnd.getTime() - now.getTime();
            const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

            if (diffDays < 0) {
              return <span className="text-[9px] font-medium text-red-500 dark:text-red-400">{Math.abs(diffDays)}d overdue</span>;
            } else if (diffDays === 0) {
              return <span className="text-[9px] font-medium text-orange-500 dark:text-orange-400">Due today</span>;
            } else {
              return <span className="text-[9px] font-medium text-green-500 dark:text-green-400">{diffDays}d left</span>;
            }
          })()}
        </div>
      </div>

      {/* Event count badge */}
      {eventCount > 0 && (
        <span className="absolute -top-2 -right-2 bg-gray-200 dark:bg-zinc-700 text-gray-600 dark:text-zinc-300 text-xs font-medium rounded-full w-6 h-6 flex items-center justify-center border border-gray-300 dark:border-zinc-600 z-20">
          {eventCount > 9 ? "9+" : eventCount}
        </span>
      )}

      {/* Completed checkmark overlay */}
      {isCompleted && (
        <span className="absolute -bottom-1 -right-1 bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center border-2 border-white dark:border-zinc-900 z-20">
          <Check className="h-3.5 w-3.5" strokeWidth={3} />
        </span>
      )}
    </button>
  );
}
