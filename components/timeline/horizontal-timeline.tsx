"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
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
  isAdmin?: boolean;
  currentUserId?: string;
  refreshTrigger?: number;
};

export function HorizontalTimeline({
  orderId,
  stages,
  orderStatus,
  orderPriority,
  isAdmin,
  currentUserId,
  refreshTrigger,
}: HorizontalTimelineProps) {
  const [expandedNodeIds, setExpandedNodeIds] = useState<Set<string>>(new Set());
  const [events, setEvents] = useState<OrderEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasFetchedEvents, setHasFetchedEvents] = useState(false);

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
        return events.filter((e) => e.stageId === null);
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
      if (event.stageId === null) {
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
      if (nodeId === "order-info") return "Order";
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

  return (
    <TimelineCanvas stageCount={sortedStages.length}>
      <div className="flex flex-col items-start gap-4 p-4">
        {/* Timeline nodes row */}
        <div className="flex items-start">
          {/* Order Info Node + Connector */}
          <div className="flex flex-col">
            <div className="flex items-start">
              <TimelineNode
                type="order-info"
                orderStatus={orderStatus}
                orderPriority={orderPriority}
                isExpanded={expandedNodeIds.has("order-info")}
                onClick={() => handleNodeClick("order-info")}
                eventCount={eventCounts["order-info"]}
              />

              {/* Connector from Order Info to first stage */}
              {sortedStages.length > 0 && (
                <TimelineConnector
                  sourceStatus="ORDER"
                  targetStatus={
                    (sortedStages[0].status || "NOT_STARTED") as StageStatus
                  }
                  sourceProgress={100}
                  isActive={false}
                />
              )}
            </div>

            {/* Order Info expansion panel - below connector */}
            {expandedNodeIds.has("order-info") && sortedStages.length > 0 && (
              <div className="ml-[88px] mt-2">
                <TimelineInlinePanel
                  events={getEventsForNode("order-info")}
                  nodeName="Order"
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
                  />
                )}
              </div>

              {/* Stage expansion panel - below connector */}
              {expandedNodeIds.has(stage.id) && index < sortedStages.length - 1 && (
                <div className="ml-[88px] mt-2">
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
  );
}
