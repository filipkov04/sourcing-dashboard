"use client";

import { useMemo } from "react";
import {
  Scissors,
  ShieldCheck,
  Package,
  Paintbrush,
  Printer,
  Sparkles,
  ScanSearch,
  Wrench,
  Award,
  Waves,
  Wind,
  Tag,
  FlaskConical,
  ClipboardList,
  Layers,
  ChevronDown,
  Check,
  Shirt,
  Truck,
  PackageCheck,
  Ruler,
  Cog,
} from "lucide-react";
import { statusConfig, type StageStatus, type TimelineStage } from "./timeline-types";

type TimelineNodeProps = {
  type: "order-info" | "stage";
  stage?: TimelineStage;
  orderStatus?: string;
  orderPriority?: string;
  isExpanded: boolean;
  onClick: () => void;
  eventCount?: number;
  isFocused?: boolean;
  "data-timeline-node"?: boolean;
};

// Map stage names to icons
function getStageIcon(stageName: string) {
  const name = stageName.toLowerCase();

  if (name.includes("cut")) return Scissors;
  if (name.includes("sew") || name.includes("stitch")) return Shirt;
  if (name.includes("qc") || name.includes("quality")) return ShieldCheck;
  if (name.includes("ship")) return Truck;
  if (name.includes("pack")) return PackageCheck;
  if (name.includes("dye") || name.includes("color")) return Paintbrush;
  if (name.includes("print")) return Printer;
  if (name.includes("embroid")) return Sparkles;
  if (name.includes("inspect") || name.includes("search")) return ScanSearch;
  if (name.includes("assembl")) return Wrench;
  if (name.includes("finish")) return Award;
  if (name.includes("wash")) return Waves;
  if (name.includes("iron") || name.includes("press")) return Wind;
  if (name.includes("label") || name.includes("tag")) return Tag;
  if (name.includes("sampl") || name.includes("proto")) return FlaskConical;
  if (name.includes("measur") || name.includes("pattern")) return Ruler;
  if (name.includes("receiv") || name.includes("inbound")) return Package;
  if (name.includes("process")) return Cog;

  return Layers;
}

// Format status text for display inside node
function formatStatus(status: string): string {
  const labels: Record<string, string> = {
    NOT_STARTED: "Not Started",
    IN_PROGRESS: "In Progress",
    COMPLETED: "Completed",
    SKIPPED: "Skipped",
    DELAYED: "Delayed",
    BLOCKED: "Blocked",
  };
  return labels[status] || status.replace(/_/g, " ");
}

// Node dimensions
const NODE_SIZE = 110;
const SVG_VIEWBOX = `0 0 ${NODE_SIZE} ${NODE_SIZE}`;
const RING_RADIUS = 48;
const RING_CX = NODE_SIZE / 2;
const RING_CY = NODE_SIZE / 2;

export function TimelineNode({
  type,
  stage,
  orderStatus,
  orderPriority,
  isExpanded,
  onClick,
  eventCount = 0,
  isFocused = false,
  ...rest
}: TimelineNodeProps) {
  const config = useMemo(() => {
    if (type === "order-info") {
      return statusConfig.ORDER;
    }
    const status = (stage?.status || "NOT_STARTED") as StageStatus;
    return statusConfig[status] || statusConfig.NOT_STARTED;
  }, [type, stage?.status]);

  const Icon = useMemo(() => {
    if (type === "order-info") return ClipboardList;
    return getStageIcon(stage?.name || "");
  }, [type, stage?.name]);

  const progress = stage?.progress ?? 0;
  const isCompleted = stage?.status === "COMPLETED";
  const isInProgress = stage?.status === "IN_PROGRESS";
  const label = type === "order-info" ? "Order Information Changes" : stage?.name || "Stage";

  // Progress ring math
  const circumference = 2 * Math.PI * RING_RADIUS;
  const progressOffset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center flex-shrink-0">
      {/* Node */}
      <button
        onClick={onClick}
        className={`
          relative w-[${NODE_SIZE}px] h-[${NODE_SIZE}px] rounded-full border-2 flex flex-col items-center justify-center
          transition-all duration-200 cursor-pointer
          ${config.bgColor} ${config.borderColor}
          ${isExpanded ? `shadow-lg ${config.glowColor}` : ""}
          ${isInProgress ? "animate-pulse-glow" : ""}
          ${isFocused ? "ring-[3px] ring-black/30 dark:ring-white/70 ring-offset-[3px] ring-offset-white dark:ring-offset-zinc-900 scale-110 shadow-xl shadow-black/10 dark:shadow-white/10" : ""}
          hover:shadow-lg hover:${config.glowColor} hover:scale-105
          focus:outline-none focus-visible:ring-[3px] focus-visible:ring-black/30 dark:focus-visible:ring-white/70 focus-visible:ring-offset-[3px] focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-900
        `}
        style={{ width: NODE_SIZE, height: NODE_SIZE }}
        data-timeline-node
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-label={`${label}${type === "stage" ? `, ${progress}% complete` : ""}`}
      >
        {/* Progress ring for stages */}
        {type === "stage" && progress > 0 && progress < 100 && (
          <svg
            className="absolute inset-0 w-full h-full -rotate-90"
            viewBox={SVG_VIEWBOX}
          >
            <circle
              cx={RING_CX}
              cy={RING_CY}
              r={RING_RADIUS}
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              className={config.iconColor}
              strokeDasharray={circumference}
              strokeDashoffset={progressOffset}
              strokeLinecap="round"
              style={{ opacity: 0.5 }}
            />
          </svg>
        )}

        {/* Icon */}
        <Icon className={`h-12 w-12 ${config.iconColor} relative z-10`} />

        {/* Status label inside node for stages */}
        {type === "stage" && stage?.status && (
          <span className={`text-[9px] font-medium ${config.iconColor} relative z-10 mt-0.5 leading-tight`}>
            {formatStatus(stage.status)}
          </span>
        )}

        {/* Event count badge */}
        {eventCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-gray-200 dark:bg-zinc-700 text-gray-600 dark:text-zinc-300 text-xs font-medium rounded-full w-7 h-7 flex items-center justify-center border border-gray-300 dark:border-zinc-600 z-20">
            {eventCount > 9 ? "9+" : eventCount}
          </span>
        )}

        {/* Completed checkmark overlay */}
        {type === "stage" && isCompleted && (
          <span className="absolute -bottom-0.5 -right-0.5 bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center border-2 border-white dark:border-zinc-900 z-20">
            <Check className="h-3.5 w-3.5" strokeWidth={3} />
          </span>
        )}
      </button>

      {/* Label */}
      <span className="mt-2 text-sm text-gray-500 dark:text-zinc-400 text-center max-w-32 truncate">
        {label}
      </span>

      {/* Progress percentage for stages */}
      {type === "stage" && (
        <span
          className={`text-xs font-medium ${
            progress === 100
              ? "text-green-400"
              : progress > 0
              ? "text-blue-400"
              : "text-zinc-500"
          }`}
        >
          {progress}%
        </span>
      )}

      {/* Priority badge for order info */}
      {type === "order-info" && orderPriority && (
        <span
          className={`text-xs font-medium ${
            orderPriority === "URGENT"
              ? "text-red-400"
              : orderPriority === "HIGH"
              ? "text-orange-400"
              : "text-zinc-500"
          }`}
        >
          {orderPriority.charAt(0) + orderPriority.slice(1).toLowerCase()}
        </span>
      )}

      {/* Expanded indicator */}
      {isExpanded && (
        <ChevronDown className={`mt-1 h-4 w-4 ${config.iconColor}`} />
      )}
    </div>
  );
}
