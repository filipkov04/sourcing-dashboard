"use client";

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

type TimelineInlinePanelProps = {
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
  },
  blue: {
    bg: "bg-blue-900/40",
    border: "border-blue-700",
    icon: "text-blue-400",
  },
  orange: {
    bg: "bg-orange-900/40",
    border: "border-orange-700",
    icon: "text-orange-400",
  },
  red: {
    bg: "bg-red-900/40",
    border: "border-red-700",
    icon: "text-red-400",
  },
  gray: {
    bg: "bg-zinc-800",
    border: "border-zinc-700",
    icon: "text-zinc-400",
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
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return eventDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function TimelineInlinePanel({
  events,
  nodeName,
  nodeType,
  onClose,
  isLoading = false,
}: TimelineInlinePanelProps) {
  const title = nodeType === "order-info" ? "Order History" : `${nodeName} History`;

  return (
    <div className="w-[220px]">
      <div className="bg-zinc-800/90 border border-zinc-700 rounded-lg backdrop-blur-sm shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-700">
          <h3 className="font-medium text-xs text-zinc-200 truncate">{title}</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-5 w-5 p-0 text-zinc-400 hover:text-zinc-200 flex-shrink-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-2 max-h-[180px] overflow-y-auto timeline-scroll">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" />
            </div>
          ) : events.length === 0 ? (
            <p className="text-center text-zinc-500 text-xs py-4">
              No changes recorded
            </p>
          ) : (
            <div className="space-y-2">
              {events.map((event) => {
                const iconType = getEventIconType(event);
                const color = getEventColor(event);
                const Icon = iconMap[iconType];
                const colors = colorClasses[color];

                return (
                  <div key={event.id} className="flex items-start gap-2">
                    {/* Icon */}
                    <div
                      className={`flex-shrink-0 w-5 h-5 rounded-full ${colors.bg} border ${colors.border} flex items-center justify-center`}
                    >
                      <Icon className={`h-2.5 w-2.5 ${colors.icon}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-zinc-300 leading-tight">
                        {formatEventMessage(event)}
                      </p>
                      <p className="text-[10px] text-zinc-500">
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
