"use client";

import { useMemo } from "react";
import {
  Scissors,
  CheckCircle2,
  Package,
  Droplet,
  Printer,
  Sparkles,
  Search,
  Wrench,
  Star,
  Droplets,
  Flame,
  Tag,
  Beaker,
  ClipboardList,
  Circle,
  ChevronDown,
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
};

// Map stage names to icons
function getStageIcon(stageName: string) {
  const name = stageName.toLowerCase();

  if (name.includes("cut")) return Scissors;
  if (name.includes("sew") || name.includes("stitch")) return Circle; // Using Circle as needle placeholder
  if (name.includes("qc") || name.includes("quality") || name.includes("inspection"))
    return CheckCircle2;
  if (name.includes("ship") || name.includes("pack")) return Package;
  if (name.includes("dye")) return Droplet;
  if (name.includes("print")) return Printer;
  if (name.includes("embroid")) return Sparkles;
  if (name.includes("search") || name.includes("inspect")) return Search;
  if (name.includes("assembl")) return Wrench;
  if (name.includes("finish")) return Star;
  if (name.includes("wash")) return Droplets;
  if (name.includes("iron")) return Flame;
  if (name.includes("label")) return Tag;
  if (name.includes("sampl")) return Beaker;

  // Default icon
  return Circle;
}

export function TimelineNode({
  type,
  stage,
  orderStatus,
  orderPriority,
  isExpanded,
  onClick,
  eventCount = 0,
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
  const isInProgress = stage?.status === "IN_PROGRESS";
  const label = type === "order-info" ? "Order Info" : stage?.name || "Stage";

  // Calculate the stroke-dasharray for progress ring
  const circumference = 2 * Math.PI * 38; // radius = 38
  const progressOffset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center flex-shrink-0">
      {/* Node */}
      <button
        onClick={onClick}
        className={`
          relative w-[88px] h-[88px] rounded-full border-2 flex items-center justify-center
          transition-all duration-200 cursor-pointer
          ${config.bgColor} ${config.borderColor}
          ${isExpanded ? `shadow-lg ${config.glowColor}` : ""}
          ${isInProgress ? "animate-pulse-glow" : ""}
          hover:shadow-lg hover:${config.glowColor} hover:scale-105
        `}
        aria-expanded={isExpanded}
        aria-label={`${label}${type === "stage" ? `, ${progress}% complete` : ""}`}
      >
        {/* Progress ring for stages */}
        {type === "stage" && progress > 0 && progress < 100 && (
          <svg
            className="absolute inset-0 w-full h-full -rotate-90"
            viewBox="0 0 88 88"
          >
            <circle
              cx="44"
              cy="44"
              r="38"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              className={config.iconColor}
              strokeDasharray={circumference}
              strokeDashoffset={progressOffset}
              strokeLinecap="round"
              style={{ opacity: 0.5 }}
            />
          </svg>
        )}

        {/* Icon */}
        <Icon className={`h-10 w-10 ${config.iconColor} relative z-10`} />

        {/* Event count badge */}
        {eventCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-zinc-700 text-zinc-300 text-xs font-medium rounded-full w-7 h-7 flex items-center justify-center border border-zinc-600">
            {eventCount > 9 ? "9+" : eventCount}
          </span>
        )}
      </button>

      {/* Label */}
      <span className="mt-2 text-sm text-zinc-400 text-center max-w-24 truncate">
        {label}
      </span>

      {/* Progress badge for stages */}
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
