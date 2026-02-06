"use client";

import { useState, useMemo } from "react";
import {
  X,
  Clock,
  Circle,
  FileText,
  Layers,
  PlusCircle,
  Shield,
  Pencil,
  Trash2,
  Loader2,
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
  orderId?: string;
  isAdmin?: boolean;
  onNoteUpdated?: (noteId: string, newContent: string) => void;
  onNoteDeleted?: (noteId: string) => void;
};

type FilterCategory = "all" | "events" | "progress" | "notes";

const iconMap = {
  status: Clock,
  progress: Circle,
  note: FileText,
  field: Layers,
  stage: Layers,
  created: PlusCircle,
  admin: Shield,
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
  purple: {
    bg: "bg-purple-900/40",
    border: "border-purple-700",
    icon: "text-purple-400",
  },
  gray: {
    bg: "bg-zinc-800",
    border: "border-zinc-700",
    icon: "text-zinc-400",
  },
};

const categoryEventTypes: Record<Exclude<FilterCategory, "all">, string[]> = {
  events: ["ORDER_CREATED", "STAGE_ADDED", "STAGE_REMOVED"],
  progress: ["STATUS_CHANGE", "PROGRESS_CHANGE", "NOTE_CHANGE"],
  notes: ["ADMIN_NOTE"],
};

function eventMatchesCategory(event: OrderEvent, category: "events" | "progress" | "notes"): boolean {
  if (event.eventType === "ADMIN_NOTE") {
    // Admin-authored notes with "CHANGE_LOG" type go to Stage Progress
    if (category === "progress") return event.field === "CHANGE_LOG";
    // STATUS_DETAIL admin notes go to Events
    if (category === "events") return event.field === "STATUS_DETAIL";
    // Everything else (NOTE, COMMENT) goes to Notes
    if (category === "notes") return event.field === "NOTE" || event.field === "COMMENT" || !event.field;
    return false;
  }
  return categoryEventTypes[category].includes(event.eventType);
}

const pillStyles: Record<FilterCategory, { inactive: string; active: string; dot: string }> = {
  all: {
    inactive: "bg-zinc-800 text-zinc-500 border-zinc-700",
    active: "bg-zinc-700 text-zinc-200 border-zinc-500",
    dot: "bg-zinc-400",
  },
  events: {
    inactive: "bg-green-900/20 text-green-600 border-green-800/50",
    active: "bg-green-900/40 text-green-300 border-green-600",
    dot: "bg-green-400",
  },
  progress: {
    inactive: "bg-blue-900/20 text-blue-600 border-blue-800/50",
    active: "bg-blue-900/40 text-blue-300 border-blue-600",
    dot: "bg-blue-400",
  },
  notes: {
    inactive: "bg-purple-900/20 text-purple-600 border-purple-800/50",
    active: "bg-purple-900/40 text-purple-300 border-purple-600",
    dot: "bg-purple-400",
  },
};

function isMinorProgressChange(event: OrderEvent): boolean {
  if (event.eventType !== "PROGRESS_CHANGE") return false;
  const oldVal = parseInt(event.oldValue || "0");
  const newVal = parseInt(event.newValue || "0");
  if (oldVal === 0 || newVal === 0 || newVal === 100) return false;
  return Math.abs(newVal - oldVal) <= 10;
}

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
  orderId,
  isAdmin = false,
  onNoteUpdated,
  onNoteDeleted,
}: TimelineInlinePanelProps) {
  const [activeFilter, setActiveFilter] = useState<FilterCategory>("all");
  const [showOlder, setShowOlder] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleNoteEdit = async (eventId: string) => {
    if (!orderId || !editingContent.trim()) return;
    const realNoteId = eventId.replace("note-", "");
    setIsSaving(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/admin-notes/${realNoteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editingContent.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        onNoteUpdated?.(eventId, editingContent.trim());
        setEditingNoteId(null);
        setEditingContent("");
      }
    } catch (err) {
      console.error("Failed to update admin note:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleNoteDelete = async (eventId: string) => {
    if (!orderId) return;
    const realNoteId = eventId.replace("note-", "");
    try {
      const res = await fetch(`/api/orders/${orderId}/admin-notes/${realNoteId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        onNoteDeleted?.(eventId);
      }
    } catch (err) {
      console.error("Failed to delete admin note:", err);
    }
  };

  const title = nodeType === "order-info" ? "Order History" : `${nodeName} History`;

  const sevenDaysAgo = useMemo(() => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), []);

  // Category-filtered events (before time filtering)
  const categoryFiltered = useMemo(() => {
    if (activeFilter === "all") return events;
    return events.filter((e) => eventMatchesCategory(e, activeFilter));
  }, [events, activeFilter]);

  // Split into recent and older
  const { recentEvents, olderEvents } = useMemo(() => {
    const recent = categoryFiltered.filter((e) => new Date(e.createdAt) >= sevenDaysAgo);
    const older = categoryFiltered.filter((e) => new Date(e.createdAt) < sevenDaysAgo);
    return { recentEvents: recent, olderEvents: older };
  }, [categoryFiltered, sevenDaysAgo]);

  const displayedEvents = showOlder ? categoryFiltered : recentEvents;

  // Smart filtering: hide minor progress changes in "all" view
  const { filteredEvents, hiddenMinorCount } = useMemo(() => {
    if (activeFilter !== "all") return { filteredEvents: displayedEvents, hiddenMinorCount: 0 };
    const visible = displayedEvents.filter((e) => !isMinorProgressChange(e));
    const hidden = displayedEvents.length - visible.length;
    return { filteredEvents: visible, hiddenMinorCount: hidden };
  }, [displayedEvents, activeFilter]);

  // Merge related events: combine STATUS_CHANGE/PROGRESS_CHANGE with their NOTE_CHANGE
  // Two-pass approach:
  //   Pass 1: For DELAYED/BLOCKED status changes, gather all NOTE_CHANGE events up to the
  //           next STATUS_CHANGE on the same stage, taking the newest note as the reason.
  //   Pass 2: For other STATUS_CHANGE/PROGRESS_CHANGE, use the existing 5-second merge.
  type DisplayEvent = OrderEvent & { attachedNote?: string };
  const visibleEvents: DisplayEvent[] = useMemo(() => {
    const consumed = new Set<string>();

    // --- Pass 1: DELAYED/BLOCKED reason gathering ---
    // Map from STATUS_CHANGE event id → latest reason text
    const delayedBlockedReasons = new Map<string, string>();

    for (let i = 0; i < filteredEvents.length; i++) {
      const ev = filteredEvents[i];
      if (
        ev.eventType === "STATUS_CHANGE" &&
        ev.stageId &&
        (ev.newValue === "DELAYED" || ev.newValue === "BLOCKED")
      ) {
        const evTime = new Date(ev.createdAt).getTime();
        let latestNote: string | null = null;
        let latestNoteTime = 0;

        // Look at NEWER events (lower indices, since list is sorted newest-first)
        for (let j = i - 1; j >= 0; j--) {
          const other = filteredEvents[j];
          if (other.stageId !== ev.stageId) continue;
          // Stop at the next STATUS_CHANGE for the same stage (different status period)
          if (other.eventType === "STATUS_CHANGE") break;
          if (other.eventType === "NOTE_CHANGE" && other.newValue) {
            const otherTime = new Date(other.createdAt).getTime();
            if (otherTime > latestNoteTime) {
              latestNote = other.newValue;
              latestNoteTime = otherTime;
            }
            consumed.add(other.id);
          }
        }

        // Also check within 5 seconds OLDER (higher indices) for the initial simultaneous NOTE_CHANGE
        for (let j = i + 1; j < filteredEvents.length; j++) {
          const other = filteredEvents[j];
          if (other.stageId !== ev.stageId) continue;
          if (other.eventType !== "NOTE_CHANGE") break;
          const timeDiff = Math.abs(new Date(other.createdAt).getTime() - evTime);
          if (timeDiff >= 5000) break;
          if (other.newValue) {
            const otherTime = new Date(other.createdAt).getTime();
            if (otherTime > latestNoteTime) {
              latestNote = other.newValue;
              latestNoteTime = otherTime;
            }
            consumed.add(other.id);
          }
        }

        if (latestNote) {
          delayedBlockedReasons.set(ev.id, latestNote);
        }
      }
    }

    // --- Pass 2: Build merged list ---
    const merged: DisplayEvent[] = [];

    for (let i = 0; i < filteredEvents.length; i++) {
      if (consumed.has(filteredEvents[i].id)) continue;
      const ev = filteredEvents[i];

      // DELAYED/BLOCKED status changes — attach the reason gathered in Pass 1
      if (
        ev.eventType === "STATUS_CHANGE" &&
        (ev.newValue === "DELAYED" || ev.newValue === "BLOCKED") &&
        delayedBlockedReasons.has(ev.id)
      ) {
        merged.push({ ...ev, attachedNote: delayedBlockedReasons.get(ev.id) });
        continue;
      }

      // Other STATUS_CHANGE or PROGRESS_CHANGE — existing 5-second merge with nearby NOTE_CHANGE
      if (
        (ev.eventType === "STATUS_CHANGE" || ev.eventType === "PROGRESS_CHANGE") &&
        ev.stageId
      ) {
        const evTime = new Date(ev.createdAt).getTime();
        let found = false;
        for (let j = Math.max(0, i - 5); j < Math.min(filteredEvents.length, i + 6); j++) {
          if (j === i || consumed.has(filteredEvents[j].id)) continue;
          const other = filteredEvents[j];
          if (
            other.eventType === "NOTE_CHANGE" &&
            other.stageId === ev.stageId &&
            Math.abs(new Date(other.createdAt).getTime() - evTime) < 5000
          ) {
            consumed.add(other.id);
            merged.push({ ...ev, attachedNote: other.newValue || undefined });
            found = true;
            break;
          }
        }
        if (!found) {
          merged.push(ev);
        }
      } else {
        merged.push(ev);
      }
    }
    return merged;
  }, [filteredEvents]);

  // Counts for pills — based on the current time window (recent vs all)
  const pillCounts = useMemo(() => {
    const base = showOlder ? events : events.filter((e) => new Date(e.createdAt) >= sevenDaysAgo);
    const counts: Record<FilterCategory, number> = {
      all: base.length,
      events: 0,
      progress: 0,
      notes: 0,
    };
    for (const e of base) {
      for (const cat of ["events", "progress", "notes"] as const) {
        if (eventMatchesCategory(e, cat)) {
          counts[cat]++;
        }
      }
    }
    return counts;
  }, [events, showOlder, sevenDaysAgo]);

  const filterPills: { key: FilterCategory; label: string }[] = [
    { key: "all", label: "All" },
    { key: "events", label: "Events" },
    { key: "progress", label: "Stage Progress" },
    { key: "notes", label: "Notes" },
  ];

  return (
    <div className="w-[340px]">
      <div className="bg-zinc-800/90 border border-zinc-700 rounded-lg backdrop-blur-sm shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-700">
          <h3 className="font-medium text-sm text-zinc-200 truncate">{title}</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0 text-zinc-400 hover:text-zinc-200 flex-shrink-0"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Filter Pills */}
        {!isLoading && events.length > 0 && (
          <div className="px-3 pt-2.5 pb-1 flex flex-wrap gap-1.5">
            {filterPills.map(({ key, label }) => {
              const isActive = activeFilter === key;
              const style = pillStyles[key];
              const count = pillCounts[key];
              return (
                <button
                  key={key}
                  onClick={() => setActiveFilter(key)}
                  className={`inline-flex items-center gap-1.5 text-xs border rounded-full px-2 py-0.5 transition-colors ${
                    isActive ? style.active : style.inactive
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                  {label} ({count})
                </button>
              );
            })}
          </div>
        )}

        {/* Content */}
        <div
          className="p-3 max-h-[320px] overflow-y-auto timeline-scroll"
          onWheel={(e) => e.stopPropagation()}
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" />
            </div>
          ) : events.length === 0 ? (
            <p className="text-center text-zinc-500 text-sm py-4">
              No changes recorded
            </p>
          ) : visibleEvents.length === 0 ? (
            <p className="text-center text-zinc-500 text-sm py-4">
              No recent changes in this category
            </p>
          ) : (
            <div className="space-y-3">
              {visibleEvents.map((event) => {
                const iconType = getEventIconType(event);
                const color = getEventColor(event);
                const Icon = iconMap[iconType];
                const colors = colorClasses[color];

                const isAdminNote = event.eventType === "ADMIN_NOTE";
                const adminName = isAdminNote ? (event.stageName || "Admin") : null;
                const adminNoteLabel = isAdminNote
                  ? event.field === "STATUS_DETAIL" ? "Event" : event.field === "CHANGE_LOG" ? "Stage Progress" : "Note"
                  : null;

                return (
                  <div key={event.id} className="flex items-start gap-2.5">
                    {/* Icon */}
                    <div
                      className={`flex-shrink-0 w-6 h-6 rounded-full ${colors.bg} border ${colors.border} flex items-center justify-center`}
                    >
                      <Icon className={`h-3 w-3 ${colors.icon}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {isAdminNote && (
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[10px] font-medium text-purple-400">
                            {adminName}
                          </span>
                          <span className="text-[10px] text-zinc-600">&middot;</span>
                          <span className="text-[10px] text-purple-400/70">
                            {adminNoteLabel}
                          </span>
                          {isAdmin && editingNoteId !== event.id && (
                            <div className="flex items-center gap-1 ml-auto">
                              <button
                                onClick={() => {
                                  setEditingNoteId(event.id);
                                  setEditingContent(event.newValue || "");
                                }}
                                className="text-zinc-500 hover:text-zinc-300"
                              >
                                <Pencil className="h-2.5 w-2.5" />
                              </button>
                              <button
                                onClick={() => handleNoteDelete(event.id)}
                                className="text-zinc-500 hover:text-red-400"
                              >
                                <Trash2 className="h-2.5 w-2.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                      {isAdminNote && editingNoteId === event.id ? (
                        <div className="space-y-1.5">
                          <textarea
                            value={editingContent}
                            onChange={(e) => setEditingContent(e.target.value)}
                            rows={2}
                            className="w-full text-xs bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-zinc-200 focus:outline-none focus:border-purple-600 resize-none"
                          />
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleNoteEdit(event.id)}
                              disabled={isSaving || !editingContent.trim()}
                              className="text-[10px] px-2 py-0.5 rounded bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"
                            >
                              {isSaving ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : "Save"}
                            </button>
                            <button
                              onClick={() => {
                                setEditingNoteId(null);
                                setEditingContent("");
                              }}
                              className="text-[10px] px-2 py-0.5 rounded text-zinc-400 hover:text-zinc-200"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm text-zinc-300 leading-snug">
                            {formatEventMessage(event)}
                          </p>
                          {event.attachedNote && (
                            <p className="text-sm text-zinc-300 mt-1 leading-snug">
                              {event.eventType === "STATUS_CHANGE" &&
                               (event.newValue === "DELAYED" || event.newValue === "BLOCKED") && (
                                <><span className="font-medium">Reason:</span>{" "}</>
                              )}
                              {event.attachedNote.length > 120 ? event.attachedNote.slice(0, 120) + "…" : event.attachedNote}
                            </p>
                          )}
                        </>
                      )}
                      <p className="text-xs text-zinc-500 mt-0.5" suppressHydrationWarning>
                        {formatTimestamp(event.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Minor updates hidden note */}
          {hiddenMinorCount > 0 && (
            <p className="text-xs text-zinc-600 text-center mt-3">
              {hiddenMinorCount} minor update{hiddenMinorCount !== 1 ? "s" : ""} hidden
            </p>
          )}

          {/* Show older / Hide older toggle */}
          {!isLoading && olderEvents.length > 0 && (
            <div className="text-center mt-3">
              <button
                onClick={() => setShowOlder(!showOlder)}
                className="text-xs text-zinc-500 hover:underline hover:text-zinc-400 transition-colors"
              >
                {showOlder
                  ? "Hide older changes"
                  : `Show ${olderEvents.length} older change${olderEvents.length !== 1 ? "s" : ""}`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
