"use client";

import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import type { PresenceStatus } from "@/lib/use-presence";

interface StatusDotProps {
  status: PresenceStatus;
  /** Size variant: sm (2.5), md (3), lg (3.5) */
  size?: "sm" | "md" | "lg";
  /** Ring color to match parent background */
  ringClass?: string;
}

const sizeMap = {
  sm: { dot: "h-2.5 w-2.5", x: "h-1.5 w-1.5", ring: "ring-2" },
  md: { dot: "h-3 w-3", x: "h-2 w-2", ring: "ring-2" },
  lg: { dot: "h-3.5 w-3.5", x: "h-2 w-2", ring: "ring-2" },
};

export function StatusDot({ status, size = "sm", ringClass = "ring-white dark:ring-zinc-900" }: StatusDotProps) {
  const s = sizeMap[size];

  if (status === "offline") {
    // Transparent circle with X
    return (
      <div
        className={cn(
          "absolute -bottom-0.5 -right-0.5 flex items-center justify-center rounded-full bg-gray-200 dark:bg-zinc-600",
          s.dot,
          s.ring,
          ringClass
        )}
      >
        <X className={cn(s.x, "text-gray-500 dark:text-zinc-400")} strokeWidth={3} />
      </div>
    );
  }

  const colorClass =
    status === "online"
      ? "bg-green-500"
      : status === "away"
        ? "bg-yellow-400"
        : "bg-red-500"; // busy

  return (
    <div
      className={cn(
        "absolute -bottom-0.5 -right-0.5 rounded-full",
        s.dot,
        s.ring,
        ringClass,
        colorClass
      )}
    />
  );
}

/** Returns the best single status for a conversation (from multiple participants). */
export function getBestStatus(
  participantIds: string[],
  statusMap: Record<string, PresenceStatus>,
  isSupport?: boolean
): PresenceStatus {
  if (isSupport) return "online";
  if (participantIds.length === 0) return "offline";

  let best: PresenceStatus = "offline";
  for (const uid of participantIds) {
    const s = statusMap[uid] ?? "offline";
    if (s === "online") return "online"; // best possible, short-circuit
    if (s === "busy" && (best === "away" || best === "offline")) best = "busy";
    if (s === "away" && best === "offline") best = "away";
  }
  return best;
}
