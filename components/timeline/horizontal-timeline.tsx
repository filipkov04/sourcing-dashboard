"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TimelineNode } from "./timeline-node";
import { TimelineConnector } from "./timeline-connector";
import { TimelineInlinePanel } from "./timeline-inline-panel";
import { TimelineCanvas } from "./timeline-canvas";
import { TimelineTimeAxis } from "./timeline-time-axis";
import { TimelineTodayMarker } from "./timeline-today-marker";
import { TimelineStatusZones } from "./timeline-status-zones";
import { computeStagePositions } from "./timeline-date-utils";
import { NODE_CARD_WIDTH, NODE_CARD_HEIGHT, type StageStatus, type TimelineStage } from "./timeline-types";
import { type OrderEvent } from "@/lib/history-utils";

type HorizontalTimelineProps = {
  orderId: string;
  stages: TimelineStage[];
  orderStatus: string;
  orderPriority: string;
  orderDate?: string | null;
  expectedDate?: string | null;
  isAdmin?: boolean;
  currentUserId?: string;
  refreshTrigger?: number;
};

// Animation config for panel entry/exit only (no drag)
const panelMotion = {
  initial: { opacity: 0, scale: 0.95, y: -8 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: -8 },
  transition: {
    scale: { type: "spring" as const, stiffness: 300, damping: 25 },
    y: { type: "spring" as const, stiffness: 300, damping: 25 },
    opacity: { duration: 0.2, ease: "easeOut" as const },
  },
};

// Fixed height for the node row — never changes regardless of panel state
const NODE_ROW_HEIGHT = NODE_CARD_HEIGHT + 40;
const NODE_TOP = (NODE_ROW_HEIGHT - NODE_CARD_HEIGHT) / 2; // constant: 20px
const PANEL_HEIGHT_ESTIMATE = 400;
const PANEL_WIDTH = 340;

// --- Summary bar ---
function TimelineSummary({ stages, orderStatus, expectedDate }: { stages: TimelineStage[]; orderStatus: string; expectedDate?: string | null }) {
  const completed = stages.filter((s) => s.status === "COMPLETED").length;
  const behindSchedule = stages.filter((s) => s.status === "BEHIND_SCHEDULE").length;
  const blocked = stages.filter((s) => s.status === "BLOCKED").length;
  const delayed = stages.filter((s) => s.status === "DELAYED").length;
  const total = stages.length;
  const overallProgress = total > 0
    ? Math.round(stages.reduce((sum, s) => sum + s.progress, 0) / total)
    : 0;

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
      {behindSchedule > 0 && (
        <>
          <span className="text-gray-300 dark:text-zinc-600">|</span>
          <span className="text-amber-400 font-medium">{behindSchedule} behind schedule</span>
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
  orderDate,
  expectedDate,
  isAdmin,
  currentUserId,
  refreshTrigger,
}: HorizontalTimelineProps) {
  const [expandedNodeIds, setExpandedNodeIds] = useState<Set<string>>(new Set());
  const [events, setEvents] = useState<OrderEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasFetchedEvents, setHasFetchedEvents] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [currentZoom, setCurrentZoom] = useState(1);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Draggable panel state
  const [panelPositions, setPanelPositions] = useState<Record<string, { x: number; y: number }>>({});
  const svgRef = useRef<SVGSVGElement>(null);
  const currentZoomRef = useRef(currentZoom);
  currentZoomRef.current = currentZoom;

  // Active drag tracking (only one panel dragged at a time)
  const activeDragRef = useRef<{
    nodeId: string;
    startMouseX: number;
    startMouseY: number;
    startPosX: number;
    startPosY: number;
  } | null>(null);

  // Fetch all events + admin notes on mount
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

  const getEventsForNode = useCallback(
    (nodeId: string) => {
      if (nodeId === "order-info") {
        return events.filter((e) => e.stageId === null || e.stageId === "order-info");
      }
      return events.filter((e) => e.stageId === nodeId);
    },
    [events]
  );

  const eventCounts = useMemo(() => {
    const counts: Record<string, number> = { "order-info": 0 };
    stages.forEach((stage) => { counts[stage.id] = 0; });
    events.forEach((event) => {
      if (event.stageId === null || event.stageId === "order-info") {
        counts["order-info"]++;
      } else if (counts[event.stageId] !== undefined) {
        counts[event.stageId]++;
      }
    });
    return counts;
  }, [events, stages]);

  const getNodeName = useCallback(
    (nodeId: string) => {
      if (nodeId === "order-info") return "Order Information Changes";
      const stage = stages.find((s) => s.id === nodeId);
      return stage?.name || "Stage";
    },
    [stages]
  );

  // Sort stages by sequence
  const sortedStages = useMemo(
    () => [...stages].sort((a, b) => a.sequence - b.sequence),
    [stages]
  );

  // Compute date-aware positions
  const { positions, contentWidth, minDate, maxDate } = useMemo(
    () => computeStagePositions(sortedStages, orderDate, expectedDate),
    [sortedStages, orderDate, expectedDate]
  );

  // Build position map for quick lookup
  const posMap = useMemo(
    () => new Map(positions.map((p) => [p.stageId, p.x])),
    [positions]
  );

  // Default panel position: centered under the node
  const getDefaultPanelPosition = useCallback((nodeId: string) => {
    const nodeX = posMap.get(nodeId) ?? 0;
    return {
      x: nodeX + (NODE_CARD_WIDTH / 2) - (PANEL_WIDTH / 2),
      y: NODE_TOP + NODE_CARD_HEIGHT + 20,
    };
  }, [posMap]);

  const handleNodeClick = useCallback((nodeId: string) => {
    setExpandedNodeIds((current) => {
      const newSet = new Set(current);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
        // Reset position so next open spawns at default
        setPanelPositions((prev) => {
          const next = { ...prev };
          delete next[nodeId];
          return next;
        });
      } else {
        newSet.add(nodeId);
        // Always set default position on open
        setPanelPositions((prev) => ({
          ...prev,
          [nodeId]: getDefaultPanelPosition(nodeId),
        }));
      }
      return newSet;
    });
  }, [getDefaultPanelPosition]);

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
    // Reset position so next open spawns at default location
    setPanelPositions((prev) => {
      const next = { ...prev };
      delete next[nodeId];
      return next;
    });
  }, []);

  // ---- Custom drag system (bypasses framer-motion drag entirely) ----
  const handlePanelDragStart = useCallback((nodeId: string, e: React.MouseEvent) => {
    e.preventDefault(); // prevent text selection

    const pos = panelPositions[nodeId] ?? getDefaultPanelPosition(nodeId);
    activeDragRef.current = {
      nodeId,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startPosX: pos.x,
      startPosY: pos.y,
    };
    document.body.style.cursor = "grabbing";
    document.body.style.userSelect = "none";

    const handleMouseMove = (ev: MouseEvent) => {
      const drag = activeDragRef.current;
      if (!drag) return;

      // Convert screen-space delta to canvas-space delta (account for zoom)
      const zoom = currentZoomRef.current;
      const dx = (ev.clientX - drag.startMouseX) / zoom;
      const dy = (ev.clientY - drag.startMouseY) / zoom;
      const newX = drag.startPosX + dx;
      const newY = drag.startPosY + dy;

      // Direct DOM update — panel element
      const panelEl = document.querySelector(`[data-panel="${drag.nodeId}"]`) as HTMLElement;
      if (panelEl) {
        panelEl.style.left = `${newX}px`;
        panelEl.style.top = `${newY}px`;
      }

      // Direct DOM update — SVG connector line
      const svg = svgRef.current;
      if (svg) {
        const line = svg.querySelector(`[data-line="${drag.nodeId}"]`);
        if (line) {
          line.setAttribute("x2", String(newX + PANEL_WIDTH / 2));
          line.setAttribute("y2", String(newY));
        }
      }
    };

    const handleMouseUp = (ev: MouseEvent) => {
      const drag = activeDragRef.current;
      if (!drag) return;

      const zoom = currentZoomRef.current;
      const dx = (ev.clientX - drag.startMouseX) / zoom;
      const dy = (ev.clientY - drag.startMouseY) / zoom;

      // Commit final position to React state
      setPanelPositions((prev) => ({
        ...prev,
        [drag.nodeId]: {
          x: drag.startPosX + dx,
          y: drag.startPosY + dy,
        },
      }));

      activeDragRef.current = null;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }, [panelPositions, getDefaultPanelPosition]);

  // All node IDs in order for keyboard navigation
  const allNodeIds = useMemo(
    () => ["order-info", ...sortedStages.map((s) => s.id)],
    [sortedStages]
  );

  // Keyboard navigation (Enter/Space to toggle, Escape to close)
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        const nodeId = allNodeIds[focusedIndex];
        if (nodeId) handleNodeClick(nodeId);
      } else if (e.key === "Escape") {
        setExpandedNodeIds(new Set());
        setFocusedIndex(0);
      }
    },
    [allNodeIds, focusedIndex, handleNodeClick]
  );

  // Container min-height grows when panels are open, but nodes stay at fixed positions
  const containerMinHeight = expandedNodeIds.size > 0
    ? NODE_ROW_HEIGHT + PANEL_HEIGHT_ESTIMATE + 20
    : NODE_ROW_HEIGHT;

  // Collect all expanded node IDs as array for rendering
  const expandedArray = useMemo(() => Array.from(expandedNodeIds), [expandedNodeIds]);

  return (
    <div className="space-y-3">
      {/* Summary bar */}
      {sortedStages.length > 0 && (
        <TimelineSummary stages={sortedStages} orderStatus={orderStatus} expectedDate={expectedDate} />
      )}

      <TimelineCanvas
        stageCount={sortedStages.length}
        contentWidth={contentWidth}
        onZoomChange={setCurrentZoom}
      >
        <div
          className="flex flex-col gap-4 p-4"
          ref={timelineRef}
          onKeyDown={handleKeyDown}
        >
          {/* Node area — overflow visible so panels can extend below */}
          <div
            className="relative"
            style={{ width: contentWidth, minHeight: containerMinHeight, overflow: "visible" }}
          >
            {/* Time axis (behind everything) */}
            <TimelineTimeAxis
              minDate={minDate}
              maxDate={maxDate}
              contentWidth={contentWidth}
              zoom={currentZoom}
            />

            {/* Status zone backgrounds */}
            <TimelineStatusZones
              stages={sortedStages}
              positions={positions.filter((p) => p.stageId !== "order-info")}
              height={NODE_ROW_HEIGHT}
            />

            {/* Today marker */}
            <TimelineTodayMarker
              minDate={minDate}
              maxDate={maxDate}
              height={NODE_ROW_HEIGHT}
            />

            {/* Order Info Node */}
            <div
              className="absolute"
              style={{ left: posMap.get("order-info") ?? 0, top: NODE_TOP }}
            >
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
            </div>

            {/* Stage Nodes */}
            {sortedStages.map((stage, index) => {
              const x = posMap.get(stage.id) ?? 0;
              return (
                <div
                  key={stage.id}
                  className="absolute"
                  style={{ left: x, top: NODE_TOP }}
                >
                  <TimelineNode
                    type="stage"
                    stage={stage}
                    sequence={stage.sequence}
                    isExpanded={expandedNodeIds.has(stage.id)}
                    onClick={() => handleNodeClick(stage.id)}
                    eventCount={eventCounts[stage.id]}
                    isFocused={focusedIndex === index}
                    data-timeline-node
                  />
                </div>
              );
            })}

            {/* Connectors between stages */}
            {sortedStages.map((stage, index) => {
              if (index >= sortedStages.length - 1) return null;

              const sourceX = posMap.get(stage.id) ?? 0;
              const targetX = posMap.get(sortedStages[index + 1].id) ?? 0;
              const connectorWidth = targetX - sourceX - NODE_CARD_WIDTH;

              if (connectorWidth <= 0) return null;

              return (
                <div
                  key={`conn-${stage.id}`}
                  className="absolute"
                  style={{
                    left: sourceX + NODE_CARD_WIDTH,
                    top: NODE_TOP + NODE_CARD_HEIGHT / 2 - 10,
                  }}
                >
                  <TimelineConnector
                    sourceStatus={(stage.status || "NOT_STARTED") as StageStatus}
                    targetStatus={(sortedStages[index + 1].status || "NOT_STARTED") as StageStatus}
                    sourceProgress={stage.progress}
                    isActive={stage.status === "IN_PROGRESS"}
                    sourceStartedAt={stage.startedAt}
                    sourceCompletedAt={stage.completedAt}
                    sourceStatusSince={stage.startedAt}
                    sourceStatusLabel={stage.status}
                    width={connectorWidth}
                  />
                </div>
              );
            })}

            {/* SVG overlay for dashed connector lines from nodes to panels */}
            {expandedArray.length > 0 && (
              <svg
                ref={svgRef}
                className="absolute inset-0 z-20 pointer-events-none"
                style={{ width: contentWidth, height: containerMinHeight, overflow: "visible" }}
              >
                {expandedArray.map((nodeId) => {
                  const nodeX = posMap.get(nodeId) ?? 0;
                  const nodeBottomCenterX = nodeX + NODE_CARD_WIDTH / 2;
                  const nodeBottomCenterY = NODE_TOP + NODE_CARD_HEIGHT;

                  const panelPos = panelPositions[nodeId] ?? getDefaultPanelPosition(nodeId);
                  const panelTopCenterX = panelPos.x + PANEL_WIDTH / 2;
                  const panelTopCenterY = panelPos.y;

                  return (
                    <line
                      key={`line-${nodeId}`}
                      data-line={nodeId}
                      x1={nodeBottomCenterX}
                      y1={nodeBottomCenterY}
                      x2={panelTopCenterX}
                      y2={panelTopCenterY}
                      strokeDasharray="6 4"
                      strokeWidth={1.5}
                      strokeLinecap="round"
                      className="text-gray-300 dark:text-zinc-600"
                      stroke="currentColor"
                    />
                  );
                })}
              </svg>
            )}

            {/* Draggable panels inside the node area */}
            <AnimatePresence>
              {expandedArray.map((nodeId) => {
                const pos = panelPositions[nodeId] ?? getDefaultPanelPosition(nodeId);
                const isOrderInfo = nodeId === "order-info";
                return (
                  <motion.div
                    key={`panel-${nodeId}`}
                    data-panel={nodeId}
                    className="absolute z-30"
                    style={{ left: pos.x, top: pos.y }}
                    onMouseDown={(e) => e.stopPropagation()} // prevent canvas pan from any click on panel
                    {...panelMotion}
                  >
                    <TimelineInlinePanel
                      events={getEventsForNode(nodeId)}
                      nodeName={isOrderInfo ? "Order Information Changes" : getNodeName(nodeId)}
                      nodeType={isOrderInfo ? "order-info" : "stage"}
                      onClose={() => handlePanelClose(nodeId)}
                      isLoading={isLoading && !hasFetchedEvents}
                      orderId={orderId}
                      isAdmin={isAdmin}
                      onNoteUpdated={handleNoteUpdated}
                      onNoteDeleted={handleNoteDeleted}
                      onHeaderMouseDown={(e) => handlePanelDragStart(nodeId, e)}
                    />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </TimelineCanvas>
    </div>
  );
}
