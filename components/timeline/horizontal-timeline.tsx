"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { TimelineNode } from "./timeline-node";
import { TimelineConnector } from "./timeline-connector";
import { TimelineExpansionPanel } from "./timeline-expansion-panel";
import { TimelineCanvas } from "./timeline-canvas";
import { type StageStatus, type TimelineStage } from "./timeline-types";
import { type OrderEvent } from "@/lib/history-utils";

type HorizontalTimelineProps = {
  orderId: string;
  stages: TimelineStage[];
  orderStatus: string;
  orderPriority: string;
};

export function HorizontalTimeline({
  orderId,
  stages,
  orderStatus,
  orderPriority,
}: HorizontalTimelineProps) {
  const [expandedNodeId, setExpandedNodeId] = useState<string | null>(null);
  const [events, setEvents] = useState<OrderEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasFetchedEvents, setHasFetchedEvents] = useState(false);

  // Fetch all events on mount
  useEffect(() => {
    async function fetchEvents() {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/orders/${orderId}/timeline?limit=100`
        );
        const data = await response.json();
        if (data.success) {
          setEvents(data.data.events || []);
        }
      } catch (err) {
        console.error("Failed to fetch timeline events:", err);
      } finally {
        setIsLoading(false);
        setHasFetchedEvents(true);
      }
    }

    fetchEvents();
  }, [orderId]);

  // Filter events for the expanded node
  const filteredEvents = useMemo(() => {
    if (!expandedNodeId) return [];

    if (expandedNodeId === "order-info") {
      // Order-level events (stageId is null)
      return events.filter((e) => e.stageId === null);
    }

    // Stage-specific events
    return events.filter((e) => e.stageId === expandedNodeId);
  }, [expandedNodeId, events]);

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

  // Get the name of the expanded node
  const expandedNodeName = useMemo(() => {
    if (!expandedNodeId) return "";
    if (expandedNodeId === "order-info") return "Order";
    const stage = stages.find((s) => s.id === expandedNodeId);
    return stage?.name || "Stage";
  }, [expandedNodeId, stages]);

  const handleNodeClick = useCallback((nodeId: string) => {
    setExpandedNodeId((current) => (current === nodeId ? null : nodeId));
  }, []);

  // Sort stages by sequence
  const sortedStages = useMemo(
    () => [...stages].sort((a, b) => a.sequence - b.sequence),
    [stages]
  );

  return (
    <TimelineCanvas>
      <div className="flex flex-col items-center gap-8 p-4">
        {/* Timeline nodes row */}
        <div className="flex items-start gap-2">
          {/* Order Info Node */}
          <TimelineNode
            type="order-info"
            orderStatus={orderStatus}
            orderPriority={orderPriority}
            isExpanded={expandedNodeId === "order-info"}
            onClick={() => handleNodeClick("order-info")}
            eventCount={eventCounts["order-info"]}
          />

          {/* Connector from Order Info to first stage */}
          {sortedStages.length > 0 && (
            <TimelineConnector
              sourceStatus="ORDER"
              targetStatus={(sortedStages[0].status || "NOT_STARTED") as StageStatus}
              sourceProgress={100} // Order info is always "complete"
              isActive={false}
            />
          )}

          {/* Stage Nodes with Connectors */}
          {sortedStages.map((stage, index) => (
            <div key={stage.id} className="flex items-start">
              <TimelineNode
                type="stage"
                stage={stage}
                isExpanded={expandedNodeId === stage.id}
                onClick={() => handleNodeClick(stage.id)}
                eventCount={eventCounts[stage.id]}
              />

              {/* Connector to next stage */}
              {index < sortedStages.length - 1 && (
                <TimelineConnector
                  sourceStatus={(stage.status || "NOT_STARTED") as StageStatus}
                  targetStatus={
                    (sortedStages[index + 1].status || "NOT_STARTED") as StageStatus
                  }
                  sourceProgress={stage.progress}
                  isActive={stage.status === "IN_PROGRESS"}
                />
              )}
            </div>
          ))}
        </div>

        {/* Expansion panel appears below nodes, inside canvas */}
        <TimelineExpansionPanel
          isExpanded={!!expandedNodeId}
          events={filteredEvents}
          nodeName={expandedNodeName}
          nodeType={expandedNodeId === "order-info" ? "order-info" : "stage"}
          onClose={() => setExpandedNodeId(null)}
          isLoading={isLoading && !hasFetchedEvents}
        />
      </div>
    </TimelineCanvas>
  );
}
