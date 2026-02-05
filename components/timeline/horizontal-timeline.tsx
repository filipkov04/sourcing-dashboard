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
};

export function HorizontalTimeline({
  orderId,
  stages,
  orderStatus,
  orderPriority,
}: HorizontalTimelineProps) {
  const [expandedNodeIds, setExpandedNodeIds] = useState<Set<string>>(new Set());
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
    <TimelineCanvas>
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
              <div className="ml-14 mt-2">
                <TimelineInlinePanel
                  events={getEventsForNode("order-info")}
                  nodeName="Order"
                  nodeType="order-info"
                  onClose={() => handlePanelClose("order-info")}
                  isLoading={isLoading && !hasFetchedEvents}
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
                <div className="ml-14 mt-2">
                  <TimelineInlinePanel
                    events={getEventsForNode(stage.id)}
                    nodeName={getNodeName(stage.id)}
                    nodeType="stage"
                    onClose={() => handlePanelClose(stage.id)}
                    isLoading={isLoading && !hasFetchedEvents}
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
