"use client";

import { useMemo } from "react";
import {
  X,
  Clock,
  Circle,
  FileText,
  Layers,
  PlusCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  formatEventMessage,
  getEventColor,
  getEventIconType,
  type OrderEvent,
} from "@/lib/history-utils";

type TimelineExpansionPanelProps = {
  isExpanded: boolean;
  events: OrderEvent[];
  nodeName: string;
  nodeType: "order-info" | "stage";
  onClose: () => void;
  isLoading?: boolean;
};

const iconMap = {
  status: Clock,
  progress: Circle,
  note: FileText,
  field: Layers,
  stage: Layers,
  created: PlusCircle,
};

const colorClasses = {
  green: {
    bg: "bg-green-900/40",
    border: "border-green-700",
    icon: "text-green-400",
    line: "bg-green-700",
  },
  blue: {
    bg: "bg-blue-900/40",
    border: "border-blue-700",
    icon: "text-blue-400",
    line: "bg-blue-700",
  },
  orange: {
    bg: "bg-orange-900/40",
    border: "border-orange-700",
    icon: "text-orange-400",
    line: "bg-orange-700",
  },
  red: {
    bg: "bg-red-900/40",
    border: "border-red-700",
    icon: "text-red-400",
    line: "bg-red-700",
  },
  gray: {
    bg: "bg-zinc-800",
    border: "border-zinc-700",
    icon: "text-zinc-400",
    line: "bg-zinc-700",
  },
};

function formatTimestamp(date: Date | string): string {
  const eventDate = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - eventDate.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? "" : "s"} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;

  return eventDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: eventDate.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

export function TimelineExpansionPanel({
  isExpanded,
  events,
  nodeName,
  nodeType,
  onClose,
  isLoading = false,
}: TimelineExpansionPanelProps) {
  const title = nodeType === "order-info" ? "Order History" : `${nodeName} History`;

  if (!isExpanded) return null;

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-zinc-800/80 border border-zinc-700 rounded-lg backdrop-blur-sm">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700">
          <h3 className="font-medium text-zinc-200">{title}</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-7 w-7 p-0 text-zinc-400 hover:text-zinc-200"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 max-h-[250px] overflow-y-auto timeline-scroll">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
            </div>
          ) : events.length === 0 ? (
            <p className="text-center text-zinc-500 py-8">
              No changes recorded yet
            </p>
          ) : (
            <div className="space-y-3">
              {events.map((event, index) => {
                const iconType = getEventIconType(event);
                const color = getEventColor(event);
                const Icon = iconMap[iconType];
                const colors = colorClasses[color];

                return (
                  <div key={event.id} className="flex items-start gap-3">
                    {/* Icon */}
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-full ${colors.bg} border ${colors.border} flex items-center justify-center`}
                    >
                      <Icon className={`h-4 w-4 ${colors.icon}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-300">
                        {formatEventMessage(event)}
                      </p>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {formatTimestamp(event.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

