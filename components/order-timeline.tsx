"use client";

import { useState, useEffect } from "react";
import {
  formatEventMessage,
  getEventIconType,
  getEventColor,
  OrderEvent,
} from "@/lib/history-utils";
import {
  CheckCircle2,
  Circle,
  Clock,
  FileText,
  Layers,
  PlusCircle,
  MinusCircle,
  AlertTriangle,
  XCircle,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type TimelineProps = {
  orderId: string;
  initialLimit?: number;
};

type TimelineEvent = OrderEvent & {
  id: string;
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
    bg: "bg-green-900/30",
    border: "border-green-700",
    icon: "text-green-500",
    line: "bg-green-700",
  },
  blue: {
    bg: "bg-blue-900/30",
    border: "border-blue-700",
    icon: "text-blue-500",
    line: "bg-blue-700",
  },
  orange: {
    bg: "bg-orange-900/30",
    border: "border-orange-700",
    icon: "text-orange-500",
    line: "bg-orange-700",
  },
  red: {
    bg: "bg-red-900/30",
    border: "border-red-700",
    icon: "text-red-500",
    line: "bg-red-700",
  },
  gray: {
    bg: "bg-zinc-800",
    border: "border-zinc-700",
    icon: "text-zinc-500",
    line: "bg-zinc-700",
  },
};

function getStatusIcon(event: TimelineEvent) {
  const newValue = event.newValue;

  // Special icons for specific status values
  if (event.eventType === "STATUS_CHANGE") {
    if (newValue === "COMPLETED" || newValue === "DELIVERED") {
      return CheckCircle2;
    }
    if (newValue === "DELAYED") {
      return AlertTriangle;
    }
    if (newValue === "DISRUPTED" || newValue === "BLOCKED") {
      return XCircle;
    }
  }

  // Stage icons
  if (event.eventType === "STAGE_ADDED") {
    return PlusCircle;
  }
  if (event.eventType === "STAGE_REMOVED") {
    return MinusCircle;
  }

  // Default icon based on event type
  const iconType = getEventIconType(event);
  return iconMap[iconType] || Circle;
}

function formatTimestamp(dateString: string | Date) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // Less than 1 minute
  if (diffMins < 1) {
    return "Just now";
  }

  // Less than 1 hour
  if (diffMins < 60) {
    return `${diffMins} minute${diffMins === 1 ? "" : "s"} ago`;
  }

  // Less than 24 hours
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  }

  // Less than 7 days
  if (diffDays < 7) {
    return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  }

  // Format as date
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    hour: "numeric",
    minute: "2-digit",
  });
}

export function OrderTimeline({ orderId, initialLimit = 10 }: TimelineProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchInitialEvents = async () => {
      try {
        const response = await fetch(
          `/api/orders/${orderId}/timeline?limit=${initialLimit}&offset=0`
        );
        const data = await response.json();

        if (!isMounted) return;

        if (!response.ok) {
          setError(data.error || "Failed to load timeline");
          return;
        }

        if (data.success) {
          setEvents(data.data.events);
          setHasMore(data.data.pagination.hasMore);
          setTotal(data.data.pagination.total);
        }
      } catch {
        if (isMounted) {
          setError("Failed to load timeline");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchInitialEvents();

    return () => {
      isMounted = false;
    };
  }, [orderId, initialLimit]);

  const loadMore = async () => {
    const newOffset = offset + initialLimit;
    setIsLoadingMore(true);
    setOffset(newOffset);

    try {
      const response = await fetch(
        `/api/orders/${orderId}/timeline?limit=${initialLimit}&offset=${newOffset}`
      );
      const data = await response.json();

      if (response.ok && data.success) {
        setEvents((prev) => [...prev, ...data.data.events]);
        setHasMore(data.data.pagination.hasMore);
        setTotal(data.data.pagination.total);
      }
    } catch {
      // Silently fail on load more
    } finally {
      setIsLoadingMore(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-zinc-500">
        <p>{error}</p>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-zinc-500">
        <Clock className="h-8 w-8 mx-auto mb-2 text-zinc-600" />
        <p>No activity recorded yet</p>
        <p className="text-xs mt-1">Updates to this order will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {events.map((event, index) => {
        const Icon = getStatusIcon(event);
        const color = getEventColor(event);
        const classes = colorClasses[color];
        const message = formatEventMessage(event);
        const isLast = index === events.length - 1;

        return (
          <div key={event.id} className="flex gap-3">
            {/* Timeline connector */}
            <div className="flex flex-col items-center">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full ${classes.bg} border ${classes.border}`}
              >
                <Icon className={`h-4 w-4 ${classes.icon}`} />
              </div>
              {!isLast && (
                <div className={`w-0.5 flex-1 min-h-[24px] ${classes.line}`} />
              )}
            </div>

            {/* Event content */}
            <div className="flex-1 pb-4">
              <p className="text-sm text-zinc-200">{message}</p>
              <p className="text-xs text-zinc-500 mt-0.5">
                {formatTimestamp(event.createdAt)}
              </p>
            </div>
          </div>
        );
      })}

      {/* Load more button */}
      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={loadMore}
            disabled={isLoadingMore}
            className="text-zinc-400 hover:text-zinc-300"
          >
            {isLoadingMore ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <ChevronDown className="h-4 w-4 mr-2" />
            )}
            View more ({total - events.length} remaining)
          </Button>
        </div>
      )}
    </div>
  );
}
