"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { TimelineNode } from "./timeline-node";
import { TimelineConnector } from "./timeline-connector";
import { TimelineInlinePanel } from "./timeline-inline-panel";
import { TimelineCanvas } from "./timeline-canvas";
import { type StageStatus, type TimelineStage } from "./timeline-types";
import { type OrderEvent } from "@/lib/history-utils";

type HorizontalTimelineProps = {
  orderId: string;
  stages: TimelineStage[];
  orderStatus: string;
  orderPriority: string;
  expectedDate?: string | null;
  isAdmin?: boolean;
  currentUserId?: string;
  refreshTrigger?: number;
};

// --- Summary bar ---
function TimelineSummary({ stages, orderStatus, expectedDate }: { stages: TimelineStage[]; orderStatus: string; expectedDate?: string | null }) {
  const completed = stages.filter((s) => s.status === "COMPLETED").length;
  const blocked = stages.filter((s) => s.status === "BLOCKED").length;
  const delayed = stages.filter((s) => s.status === "DELAYED").length;
  const total = stages.length;
  const overallProgress = total > 0
    ? Math.round(stages.reduce((sum, s) => sum + s.progress, 0) / total)
    : 0;

  // Days until expected date
  let deadlineText = "";
  let deadlineColor = "text-gray-500 dark:text-zinc-400";
  if (expectedDate && completed < total) {
    const daysLeft = Math.ceil(
      (new Date(expectedDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysLeft < 0) {
      deadlineText = `${Math.abs(daysLeft)} days overdue`;
      deadlineColor = "text-red-400 font-medium";
    } else if (daysLeft === 0) {
      deadlineText = "Due today";
      deadlineColor = "text-orange-400 font-medium";
    } else if (daysLeft === 1) {
      deadlineText = "1 day left";
      deadlineColor = "text-orange-400 font-medium";
    } else if (daysLeft <= 7) {
      deadlineText = `${daysLeft} days left`;
      deadlineColor = "text-yellow-400 font-medium";
    } else {
      deadlineText = `${daysLeft} days left`;
    }
  }

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-gray-100 dark:bg-zinc-800/60 border border-gray-200 dark:border-zinc-700 rounded-lg text-xs text-gray-500 dark:text-zinc-400 flex-wrap">
      <span className={completed === total ? "text-green-600 dark:text-green-400 font-medium" : ""}>
        <span className="text-gray-900 dark:text-zinc-200 font-medium">{completed}</span>/{total} complete
      </span>
      <span className="text-gray-300 dark:text-zinc-600">|</span>
      <span>
        <span className="text-gray-900 dark:text-zinc-200 font-medium">{overallProgress}%</span> overall
      </span>
      {blocked > 0 && (
        <>
          <span className="text-gray-300 dark:text-zinc-600">|</span>
          <span className="text-red-400 font-medium">{blocked} blocked</span>
        </>
      )}
      {delayed > 0 && (
        <>
          <span className="text-gray-300 dark:text-zinc-600">|</span>
          <span className="text-orange-400 font-medium">{delayed} delayed</span>
        </>
      )}
      {deadlineText && (
        <>
          <span className="text-gray-300 dark:text-zinc-600">|</span>
          <span className={deadlineColor}>{deadlineText}</span>
        </>
      )}
      {completed === total && total > 0 && (
        <>
          <span className="text-gray-300 dark:text-zinc-600">|</span>
          <span className="text-green-400 font-medium">All stages complete</span>
        </>
      )}
    </div>
  );
}

export function HorizontalTimeline({
  orderId,
  stages,
  orderStatus,
  orderPriority,
  expectedDate,
  isAdmin,
  currentUserId,
  refreshTrigger,
}: HorizontalTimelineProps) {
  const [expandedNodeIds, setExpandedNodeIds] = useState<Set<string>>(new Set());
  const [events, setEvents] = useState<OrderEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasFetchedEvents, setHasFetchedEvents] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1); // -1 = order-info, 0+ = stage index
  const timelineRef = useRef<HTMLDivElement>(null);

  // Fetch all events + admin notes on mount, merge into single timeline
  useEffect(() => {
    async function fetchAllEvents() {
      setIsLoading(true);
      try {
        const [eventsRes, notesRes] = await Promise.all([
          fetch(`/api/orders/${orderId}/timeline?limit=100`),
          fetch(`/api/orders/${orderId}/admin-notes`),
        ]);

        const eventsData = await eventsRes.json();
        const notesData = await notesRes.json();

        let allEvents: OrderEvent[] = [];

        if (eventsData.success) {
          allEvents = eventsData.data.events || [];
        }

        // Merge admin notes as synthetic OrderEvent entries
        if (notesData.success && Array.isArray(notesData.data)) {
          const noteEvents: OrderEvent[] = notesData.data.map(
            (note: {
              id: string;
              orderId: string;
              stageId: string;
              type: string;
              content: string;
              authorName: string | null;
              createdAt: string;
            }) => ({
              id: `note-${note.id}`,
              orderId: note.orderId,
              stageId: note.stageId,
              eventType: "ADMIN_NOTE",
              field: note.type,
              oldValue: null,
              newValue: note.content,
              stageName: note.authorName,
              createdAt: note.createdAt,
            })
          );
          allEvents = [...allEvents, ...noteEvents];
        }

        // Sort all events by date descending (newest first)
        allEvents.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        setEvents(allEvents);
      } catch (err) {
        console.error("Failed to fetch timeline events:", err);
      } finally {
        setIsLoading(false);
        setHasFetchedEvents(true);
      }
    }

    fetchAllEvents();
  }, [orderId, refreshTrigger]);

  // Get events for a specific node
  const getEventsForNode = useCallback(
    (nodeId: string) => {
      if (nodeId === "order-info") {
        return events.filter((e) => e.stageId === null || e.stageId === "order-info");
      }
      return events.filter((e) => e.stageId === nodeId);
    },
    [events]
  );

  // Count events per node for badges
  const eventCounts = useMemo(() => {
    const counts: Record<string, number> = {
      "order-info": 0,
    };

    stages.forEach((stage) => {
      counts[stage.id] = 0;
    });

    events.forEach((event) => {
      if (event.stageId === null || event.stageId === "order-info") {
        counts["order-info"]++;
      } else if (counts[event.stageId] !== undefined) {
        counts[event.stageId]++;
      }
    });

    return counts;
  }, [events, stages]);

  // Get the name of a node
  const getNodeName = useCallback(
    (nodeId: string) => {
      if (nodeId === "order-info") return "Order Information Changes";
      const stage = stages.find((s) => s.id === nodeId);
      return stage?.name || "Stage";
    },
    [stages]
  );

  const handleNodeClick = useCallback((nodeId: string) => {
    setExpandedNodeIds((current) => {
      const newSet = new Set(current);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  }, []);

  // When an admin note is updated in the timeline panel, update the synthetic event
  const handleNoteUpdated = useCallback(
    (noteEventId: string, newContent: string) => {
      setEvents((prev) =>
        prev.map((e) =>
          e.id === noteEventId ? { ...e, newValue: newContent } : e
        )
      );
    },
    []
  );

  // When an admin note is deleted in the timeline panel, remove the synthetic event
  const handleNoteDeleted = useCallback(
    (noteEventId: string) => {
      setEvents((prev) => prev.filter((e) => e.id !== noteEventId));
    },
    []
  );

  const handlePanelClose = useCallback((nodeId: string) => {
    setExpandedNodeIds((current) => {
      const newSet = new Set(current);
      newSet.delete(nodeId);
      return newSet;
    });
  }, []);

  // Sort stages by sequence
  const sortedStages = useMemo(
    () => [...stages].sort((a, b) => a.sequence - b.sequence),
    [stages]
  );

  // All node IDs in order for keyboard navigation
  const allNodeIds = useMemo(
    () => ["order-info", ...sortedStages.map((s) => s.id)],
    [sortedStages]
  );

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      hasInteracted.current = true;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        setFocusedIndex((prev) => Math.min(prev + 1, allNodeIds.length - 1));
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        setFocusedIndex((prev) => Math.max(prev - 1, -1));
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        const nodeId = focusedIndex === -1 ? "order-info" : allNodeIds[focusedIndex];
        if (nodeId) handleNodeClick(nodeId);
      } else if (e.key === "Escape") {
        setExpandedNodeIds(new Set());
        setFocusedIndex(-1);
      }
    },
    [allNodeIds, focusedIndex, handleNodeClick]
  );

  // Focus the right button when focusedIndex changes (only after user interaction)
  const hasInteracted = useRef(false);
  useEffect(() => {
    if (!hasInteracted.current || focusedIndex < -1 || !timelineRef.current) return;
    const buttons = timelineRef.current.querySelectorAll<HTMLButtonElement>("[data-timeline-node]");
    const idx = focusedIndex + 1; // +1 because order-info is at index 0
    if (buttons[idx]) {
      buttons[idx].focus({ preventScroll: true });
    }
  }, [focusedIndex]);

  return (
    <div className="space-y-3">
      {/* Summary bar */}
      {sortedStages.length > 0 && (
        <TimelineSummary stages={sortedStages} orderStatus={orderStatus} expectedDate={expectedDate} />
      )}

      <TimelineCanvas stageCount={sortedStages.length}>
          <div
            className="flex flex-col items-start gap-4 p-4"
            ref={timelineRef}
            onKeyDown={handleKeyDown}
          >
            {/* Timeline nodes row */}
            <div className="flex items-start">
              {/* Order Info Node (standalone, no connector) */}
              <div className="flex flex-col mr-6">
                <TimelineNode
                  type="order-info"
                  orderStatus={orderStatus}
                  orderPriority={orderPriority}
                  isExpanded={expandedNodeIds.has("order-info")}
                  onClick={() => handleNodeClick("order-info")}
                  eventCount={eventCounts["order-info"]}
                  isFocused={focusedIndex === -1}
                  data-timeline-node
                />

                {/* Order Info expansion panel */}
                {expandedNodeIds.has("order-info") && (
                  <div className="mt-2">
                    <TimelineInlinePanel
                      events={getEventsForNode("order-info")}
                      nodeName="Order Information Changes"
                      nodeType="order-info"
                      onClose={() => handlePanelClose("order-info")}
                      isLoading={isLoading && !hasFetchedEvents}
                      orderId={orderId}
                      isAdmin={isAdmin}
                      onNoteUpdated={handleNoteUpdated}
                      onNoteDeleted={handleNoteDeleted}
                    />
                  </div>
                )}
              </div>

              {/* Separator between Order Info and stages */}
              {sortedStages.length > 0 && (
                <div className="flex items-center self-center mx-2">
                  <div className="w-px h-12 bg-gray-300 dark:bg-zinc-700" />
                </div>
              )}

              {/* Stage Nodes with Connectors */}
              {sortedStages.map((stage, index) => (
                <div key={stage.id} className="flex flex-col">
                  <div className="flex items-start">
                    <TimelineNode
                      type="stage"
                      stage={stage}
                      isExpanded={expandedNodeIds.has(stage.id)}
                      onClick={() => handleNodeClick(stage.id)}
                      eventCount={eventCounts[stage.id]}
                      isFocused={focusedIndex === index}
                      data-timeline-node
                    />

                    {/* Connector to next stage */}
                    {index < sortedStages.length - 1 && (
                      <TimelineConnector
                        sourceStatus={(stage.status || "NOT_STARTED") as StageStatus}
                        targetStatus={
                          (sortedStages[index + 1].status ||
                            "NOT_STARTED") as StageStatus
                        }
                        sourceProgress={stage.progress}
                        isActive={stage.status === "IN_PROGRESS"}
                        sourceStartedAt={stage.startedAt}
                        sourceCompletedAt={stage.completedAt}
                        sourceStatusSince={stage.startedAt}
                        sourceStatusLabel={stage.status}
                      />
                    )}
                  </div>

                  {/* Stage expansion panel - below connector */}
                  {expandedNodeIds.has(stage.id) && index < sortedStages.length - 1 && (
                    <div className="ml-[110px] mt-2">
                      <TimelineInlinePanel
                        events={getEventsForNode(stage.id)}
                        nodeName={getNodeName(stage.id)}
                        nodeType="stage"
                        onClose={() => handlePanelClose(stage.id)}
                        isLoading={isLoading && !hasFetchedEvents}
                        orderId={orderId}
                        isAdmin={isAdmin}
                        onNoteUpdated={handleNoteUpdated}
                        onNoteDeleted={handleNoteDeleted}
                      />
                    </div>
                  )}

                  {/* Last stage panel - below the node itself */}
                  {expandedNodeIds.has(stage.id) && index === sortedStages.length - 1 && (
                    <div className="mt-2">
                      <TimelineInlinePanel
                        events={getEventsForNode(stage.id)}
                        nodeName={getNodeName(stage.id)}
                        nodeType="stage"
                        onClose={() => handlePanelClose(stage.id)}
                        isLoading={isLoading && !hasFetchedEvents}
                        orderId={orderId}
                        isAdmin={isAdmin}
                        onNoteUpdated={handleNoteUpdated}
                        onNoteDeleted={handleNoteDeleted}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
      </TimelineCanvas>
    </div>
  );
}
