"use client";

import { useRef, useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/theme-provider";
import { toPng } from "html-to-image";
import { Download, Loader2 } from "lucide-react";
import {
  computeGanttRange,
  dateToPixel,
  generateMonthLabels,
  generateWeekLines,
  generateDayLabels,
  generateDayLines,
  statusBarColors,
  statusTrackColors,
  statusBarColorsDark,
  statusTrackColorsDark,
  DEFAULT_PIXELS_PER_DAY,
  ZOOM_PRESETS,
  MIN_PIXELS_PER_DAY,
  MAX_PIXELS_PER_DAY,
  ROW_HEIGHT,
  HEADER_HEIGHT,
  LEFT_LABEL_WIDTH,
  BAR_HEIGHT,
  BAR_Y_OFFSET,
  toDayIndex,
} from "./gantt-utils";

type GanttOrder = {
  id: string;
  orderNumber: string;
  productName: string;
  status: string;
  overallProgress: number;
  orderDate: string;
  expectedDate: string;
  factory: {
    id: string;
    name: string;
  };
};

type RiskLevel = "critical" | "at-risk" | "none";

/** Determine risk level for an order */
function getRiskLevel(order: GanttOrder): RiskLevel {
  // Completed/shipped/delivered/cancelled are not at risk
  const doneStatuses = ["COMPLETED", "SHIPPED", "DELIVERED", "CANCELLED"];
  if (doneStatuses.includes(order.status)) return "none";

  // Explicitly delayed or disrupted → critical
  if (order.status === "DELAYED" || order.status === "DISRUPTED") return "critical";

  const today = new Date();
  const expected = new Date(order.expectedDate);
  const daysUntilDue = Math.ceil((expected.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  // Past due and not complete → critical
  if (daysUntilDue < 0) return "critical";

  // Check if progress is behind where it should be based on elapsed time
  const orderStart = new Date(order.orderDate);
  const totalDuration = Math.max(expected.getTime() - orderStart.getTime(), 1);
  const elapsed = today.getTime() - orderStart.getTime();
  const expectedProgress = Math.min(100, Math.round((elapsed / totalDuration) * 100));

  // Due within 7 days
  if (daysUntilDue <= 7) {
    // If actual progress is more than 15% behind expected, it's at risk
    if (order.overallProgress < expectedProgress - 15) return "at-risk";
    // If due in ≤3 days and not at 90%+, at risk
    if (daysUntilDue <= 3 && order.overallProgress < 90) return "at-risk";
  }

  // Even if >7 days out: 0% progress when >30% of time has elapsed → at-risk
  if (order.overallProgress === 0 && expectedProgress >= 30) return "at-risk";

  return "none";
}

interface GanttChartProps {
  orders: GanttOrder[];
  highlightCritical?: boolean;
}

export function GanttChart({ orders, highlightCritical = true }: GanttChartProps) {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [isExporting, setIsExporting] = useState(false);
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    order: GanttOrder;
  } | null>(null);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [hoveredBar, setHoveredBar] = useState<string | null>(null);
  const [pixelsPerDay, setPixelsPerDay] = useState(DEFAULT_PIXELS_PER_DAY);

  const range = useMemo(() => computeGanttRange(orders, pixelsPerDay), [orders, pixelsPerDay]);
  const monthLabels = useMemo(() => generateMonthLabels(range, pixelsPerDay), [range, pixelsPerDay]);
  const weekLines = useMemo(() => generateWeekLines(range, pixelsPerDay), [range, pixelsPerDay]);
  const dayLabels = useMemo(() => generateDayLabels(range, pixelsPerDay), [range, pixelsPerDay]);
  const dayLines = useMemo(() => generateDayLines(range, pixelsPerDay), [range, pixelsPerDay]);

  // Whether we're at close zoom (show day-level detail)
  const showDayDetail = pixelsPerDay >= 16;
  // Whether to show day-of-week letters (Detail zoom)
  const showDayLetters = pixelsPerDay >= 40;
  // Header row heights when split
  const monthRowHeight = showDayDetail ? 24 : HEADER_HEIGHT;
  const dayRowHeight = showDayDetail ? 24 : 0;

  // Compute risk levels for all orders
  const riskLevels = useMemo(() => {
    const map = new Map<string, RiskLevel>();
    for (const order of orders) {
      map.set(order.id, highlightCritical ? getRiskLevel(order) : "none");
    }
    return map;
  }, [orders, highlightCritical]);

  const criticalCount = useMemo(
    () => Array.from(riskLevels.values()).filter((r) => r === "critical").length,
    [riskLevels],
  );
  const atRiskCount = useMemo(
    () => Array.from(riskLevels.values()).filter((r) => r === "at-risk").length,
    [riskLevels],
  );

  const barColors = isDark ? statusBarColorsDark : statusBarColors;
  const trackColors = isDark ? statusTrackColorsDark : statusTrackColors;

  const totalHeight = HEADER_HEIGHT + orders.length * ROW_HEIGHT;
  const totalWidth = range.totalWidth;

  // Today line
  const today = new Date();
  const todayX = dateToPixel(today, range.minDate, pixelsPerDay);
  const todayInRange =
    toDayIndex(today) >= toDayIndex(range.minDate) &&
    toDayIndex(today) <= toDayIndex(range.maxDate);

  // Scroll to today on mount
  useEffect(() => {
    if (scrollRef.current && todayInRange) {
      const scrollTo = todayX - scrollRef.current.clientWidth / 3;
      scrollRef.current.scrollLeft = Math.max(0, scrollTo);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Zoom handler: preserve the center date when zooming
  const handleZoom = (newPpd: number) => {
    const clamped = Math.max(MIN_PIXELS_PER_DAY, Math.min(MAX_PIXELS_PER_DAY, newPpd));
    if (clamped === pixelsPerDay) return;

    const el = scrollRef.current;
    if (el) {
      // Find the date at the center of the viewport
      const centerX = el.scrollLeft + el.clientWidth / 2;
      const centerDayOffset = centerX / pixelsPerDay;
      setPixelsPerDay(clamped);
      // After state update, restore scroll so the same date stays centered
      requestAnimationFrame(() => {
        const newCenterX = centerDayOffset * clamped;
        el.scrollLeft = newCenterX - el.clientWidth / 2;
      });
    } else {
      setPixelsPerDay(clamped);
    }
  };

  // Find the closest zoom preset index
  const currentPresetIndex = useMemo(() => {
    let closest = 0;
    let minDiff = Infinity;
    for (let i = 0; i < ZOOM_PRESETS.length; i++) {
      const diff = Math.abs(ZOOM_PRESETS[i].ppd - pixelsPerDay);
      if (diff < minDiff) {
        minDiff = diff;
        closest = i;
      }
    }
    return closest;
  }, [pixelsPerDay]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const handleBarClick = (orderId: string) => {
    router.push(`/orders/${orderId}`);
  };

  const handleMouseEnter = (
    e: React.MouseEvent,
    order: GanttOrder,
  ) => {
    const rect = scrollRef.current?.getBoundingClientRect();
    if (rect) {
      setTooltip({
        x: e.clientX - rect.left + (scrollRef.current?.scrollLeft || 0),
        y: e.clientY - rect.top + (scrollRef.current?.scrollTop || 0),
        order,
      });
    }
  };

  const handleMouseLeave = () => {
    setTooltip(null);
  };

  const handleExport = useCallback(async () => {
    const container = chartContainerRef.current;
    const scrollEl = scrollRef.current;
    if (!container || !scrollEl) return;

    setIsExporting(true);

    // Save current scroll position and styles
    const origScrollLeft = scrollEl.scrollLeft;
    const origOverflow = scrollEl.style.overflow;
    const origMaxWidth = scrollEl.style.maxWidth;
    const visibleWidth = scrollEl.clientWidth;

    try {
      // Clip the scroll container to only show the visible viewport
      scrollEl.style.overflow = "hidden";
      scrollEl.style.maxWidth = `${visibleWidth}px`;

      // Shift the SVG left so the currently scrolled-to area is visible
      const svg = scrollEl.querySelector("svg");
      const origTransform = svg?.style.transform || "";
      if (svg) {
        svg.style.transform = `translateX(-${origScrollLeft}px)`;
      }

      // Wait for layout to settle
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

      const dataUrl = await toPng(container, {
        backgroundColor: isDark ? "#18181b" : "#ffffff",
        pixelRatio: 2,
      });

      // Trigger download
      const date = new Date().toISOString().slice(0, 10);
      const link = document.createElement("a");
      link.download = `timeline-${date}.png`;
      link.href = dataUrl;
      link.click();

      // Restore SVG transform
      if (svg) {
        svg.style.transform = origTransform;
      }
    } catch (err) {
      console.error("Failed to export timeline:", err);
    } finally {
      // Restore original state
      scrollEl.style.overflow = origOverflow;
      scrollEl.style.maxWidth = origMaxWidth;
      scrollEl.scrollLeft = origScrollLeft;
      setIsExporting(false);
    }
  }, [isDark]);

  return (
    <div className="space-y-3">
    {/* Zoom controls */}
    <div className="flex items-center justify-between">
      {/* Preset buttons in pill container */}
      <div className="flex items-center bg-gray-100/80 dark:bg-zinc-800/80 rounded-lg p-1">
        {ZOOM_PRESETS.map((preset, i) => (
          <button
            key={preset.label}
            onClick={() => handleZoom(preset.ppd)}
            className={`relative px-3 py-1 text-xs font-medium rounded-md transition-all ${
              currentPresetIndex === i
                ? "bg-white dark:bg-zinc-700 shadow-sm text-[#F97316]"
                : "text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200"
            }`}
          >
            {preset.label}
            {currentPresetIndex === i && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/5 h-0.5 bg-gradient-to-b from-[#FF0F0F] via-[#FF6B15] to-[#FFB21A] rounded-full" />
            )}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-3">
        {/* Export button — outline style */}
        <button
          onClick={handleExport}
          disabled={isExporting || orders.length === 0}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-300 hover:border-[#FF8C1A]/30 hover:bg-[#FF8C1A]/5 hover:text-[#F97316] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Download timeline as PNG"
        >
          {isExporting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Download className="h-3.5 w-3.5" />
          )}
          {isExporting ? "Exporting…" : "Export PNG"}
        </button>
        {/* +/- zoom in pill container */}
        <div className="flex items-center bg-gray-100/80 dark:bg-zinc-800/80 rounded-lg p-1 gap-0.5">
          <button
            onClick={() => handleZoom(pixelsPerDay - 4)}
            disabled={pixelsPerDay <= MIN_PIXELS_PER_DAY}
            className="flex items-center justify-center w-7 h-7 rounded-md text-gray-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-700 hover:shadow-sm disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm font-bold"
            title="Zoom out"
          >
            −
          </button>
          <span className="text-xs text-gray-500 dark:text-zinc-400 w-8 text-center tabular-nums">
            {Math.round((pixelsPerDay / DEFAULT_PIXELS_PER_DAY) * 100)}%
          </span>
          <button
            onClick={() => handleZoom(pixelsPerDay + 4)}
            disabled={pixelsPerDay >= MAX_PIXELS_PER_DAY}
            className="flex items-center justify-center w-7 h-7 rounded-md text-gray-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-700 hover:shadow-sm disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm font-bold"
            title="Zoom in"
          >
            +
          </button>
        </div>
      </div>
    </div>

    <div ref={chartContainerRef} className="flex border border-gray-100 dark:border-zinc-800 rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      {/* Fixed left labels */}
      <div
        className="flex-shrink-0 bg-white dark:bg-zinc-900 border-r border-gray-200 dark:border-zinc-700 z-10 shadow-[2px_0_8px_rgba(0,0,0,0.03)]"
        style={{ width: LEFT_LABEL_WIDTH }}
      >
        {/* Header spacer */}
        <div
          className="border-b border-gray-200 dark:border-zinc-700 px-3 flex items-center text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider"
          style={{ height: HEADER_HEIGHT }}
        >
          Order
        </div>
        {/* Row labels */}
        {orders.map((order) => {
          const risk = riskLevels.get(order.id) || "none";
          return (
            <div
              key={order.id}
              className={`flex items-center px-3 border-b border-gray-100 dark:border-zinc-800 cursor-pointer transition-colors ${
                hoveredRow === order.id
                  ? "bg-gray-50 dark:bg-zinc-800"
                  : risk === "critical"
                  ? "bg-red-50/50 dark:bg-red-950/20"
                  : risk === "at-risk"
                  ? "bg-amber-50/50 dark:bg-amber-950/20"
                  : ""
              }`}
              style={{ height: ROW_HEIGHT }}
              onClick={() => handleBarClick(order.id)}
              onMouseEnter={() => setHoveredRow(order.id)}
              onMouseLeave={() => setHoveredRow(null)}
            >
              {/* Risk indicator dot */}
              {risk !== "none" && (
                <div
                  className={`w-2 h-2 rounded-full mr-2 flex-shrink-0 ${
                    risk === "critical" ? "bg-red-500" : "bg-amber-500"
                  }`}
                  title={risk === "critical" ? "Delayed / Overdue" : "At risk"}
                />
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[#F97316] truncate">
                    {order.orderNumber}
                  </span>
                </div>
                <div className="text-xs text-gray-500 dark:text-zinc-400 truncate">
                  {order.productName} — {order.factory.name}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Scrollable chart area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-x-auto relative"
      >
        <svg
          width={totalWidth}
          height={totalHeight}
          className="block"
        >
          {/* Background */}
          <rect
            width={totalWidth}
            height={totalHeight}
            fill={isDark ? "#18181b" : "#ffffff"}
          />

          {/* Weekend columns */}
          {Array.from({ length: range.totalDays }, (_, i) => {
            const date = new Date(range.minDate);
            date.setDate(date.getDate() + i);
            const day = date.getDay();
            if (day === 0 || day === 6) {
              return (
                <rect
                  key={i}
                  x={i * pixelsPerDay}
                  y={HEADER_HEIGHT}
                  width={pixelsPerDay}
                  height={totalHeight - HEADER_HEIGHT}
                  fill={isDark ? "#1f1f23" : "#f9fafb"}
                />
              );
            }
            return null;
          })}

          {/* Grid lines: daily when zoomed in, weekly when zoomed out */}
          {showDayDetail
            ? dayLines.map((line, i) => (
                <line
                  key={i}
                  x1={line.x}
                  y1={HEADER_HEIGHT}
                  x2={line.x}
                  y2={totalHeight}
                  stroke={isDark ? "#2a2a2e" : "#f0f0f0"}
                  strokeWidth={1}
                />
              ))
            : weekLines.map((line, i) => (
                <line
                  key={i}
                  x1={line.x}
                  y1={HEADER_HEIGHT}
                  x2={line.x}
                  y2={totalHeight}
                  stroke={isDark ? "#3f3f46" : "#e5e7eb"}
                  strokeWidth={1}
                />
              ))}

          {/* Row dividers */}
          {orders.map((_, i) => (
            <line
              key={i}
              x1={0}
              y1={HEADER_HEIGHT + (i + 1) * ROW_HEIGHT}
              x2={totalWidth}
              y2={HEADER_HEIGHT + (i + 1) * ROW_HEIGHT}
              stroke={isDark ? "#27272a" : "#f3f4f6"}
              strokeWidth={1}
            />
          ))}

          {/* Critical/at-risk row backgrounds */}
          {orders.map((order, i) => {
            const risk = riskLevels.get(order.id) || "none";
            if (risk === "none") return null;
            return (
              <rect
                key={`risk-${order.id}`}
                x={0}
                y={HEADER_HEIGHT + i * ROW_HEIGHT}
                width={totalWidth}
                height={ROW_HEIGHT}
                fill={
                  risk === "critical"
                    ? isDark ? "rgba(220,38,38,0.06)" : "rgba(239,68,68,0.05)"
                    : isDark ? "rgba(217,119,6,0.06)" : "rgba(245,158,11,0.05)"
                }
              />
            );
          })}

          {/* Row hover highlight */}
          {hoveredRow && (
            <rect
              x={0}
              y={
                HEADER_HEIGHT +
                orders.findIndex((o) => o.id === hoveredRow) * ROW_HEIGHT
              }
              width={totalWidth}
              height={ROW_HEIGHT}
              fill={isDark ? "rgba(63,63,70,0.3)" : "rgba(243,244,246,0.6)"}
            />
          )}

          {/* Header background */}
          <rect
            width={totalWidth}
            height={HEADER_HEIGHT}
            fill={isDark ? "#18181b" : "#ffffff"}
          />
          {/* Divider between header rows (when split) */}
          {showDayDetail && (
            <line
              x1={0}
              y1={monthRowHeight}
              x2={totalWidth}
              y2={monthRowHeight}
              stroke={isDark ? "#2a2a2e" : "#e5e7eb"}
              strokeWidth={1}
            />
          )}
          <line
            x1={0}
            y1={HEADER_HEIGHT}
            x2={totalWidth}
            y2={HEADER_HEIGHT}
            stroke={isDark ? "#3f3f46" : "#d1d5db"}
            strokeWidth={1}
          />

          {/* Month labels (top row when split, full height when not) */}
          {monthLabels.map((month, i) => (
            <g key={i}>
              {/* Month divider */}
              <line
                x1={month.x}
                y1={0}
                x2={month.x}
                y2={totalHeight}
                stroke={isDark ? "#3f3f46" : "#d1d5db"}
                strokeWidth={1}
              />
              <text
                x={month.x + 8}
                y={monthRowHeight / 2 + 1}
                dominantBaseline="middle"
                className="text-xs font-medium"
                fill={isDark ? "#a1a1aa" : "#6b7280"}
              >
                {month.label}
              </text>
            </g>
          ))}

          {/* Day labels (bottom row, only at close zoom) */}
          {showDayDetail && dayLabels.map((day, i) => (
            <g key={i}>
              {/* Weekend tint in day header cells */}
              {day.isWeekend && (
                <rect
                  x={day.x}
                  y={monthRowHeight}
                  width={pixelsPerDay}
                  height={dayRowHeight}
                  fill={isDark ? "#1f1f23" : "#f5f5f5"}
                />
              )}
              {/* Day cell border */}
              <line
                x1={day.x}
                y1={monthRowHeight}
                x2={day.x}
                y2={HEADER_HEIGHT}
                stroke={isDark ? "#2a2a2e" : "#e5e7eb"}
                strokeWidth={1}
              />
              {/* Day number + optional day letter */}
              <text
                x={day.x + pixelsPerDay / 2}
                y={showDayLetters
                  ? monthRowHeight + dayRowHeight * 0.38
                  : monthRowHeight + dayRowHeight / 2 + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                className="font-medium"
                style={{ fontSize: showDayLetters ? 9 : 10 }}
                fill={day.isWeekend
                  ? (isDark ? "#52525b" : "#9ca3af")
                  : (isDark ? "#a1a1aa" : "#6b7280")}
              >
                {day.label}
              </text>
              {showDayLetters && (
                <text
                  x={day.x + pixelsPerDay / 2}
                  y={monthRowHeight + dayRowHeight * 0.75}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  style={{ fontSize: 8 }}
                  fill={day.isWeekend
                    ? (isDark ? "#3f3f46" : "#d1d5db")
                    : (isDark ? "#71717a" : "#9ca3af")}
                >
                  {day.dayLetter}
                </text>
              )}
            </g>
          ))}

          {/* Overdue stripe pattern & bar filters */}
          <defs>
            <pattern
              id="overdue-stripes"
              width="6"
              height="6"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <line
                x1="0" y1="0" x2="0" y2="6"
                stroke={isDark ? "rgba(239,68,68,0.3)" : "rgba(239,68,68,0.2)"}
                strokeWidth="3"
              />
            </pattern>
            {/* Subtle drop shadow for normal bars */}
            <filter id="bar-shadow" x="-10%" y="-10%" width="120%" height="140%">
              <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.15" />
            </filter>
            {/* Red glow for delayed/overdue bars */}
            <filter id="critical-glow" x="-20%" y="-20%" width="140%" height="160%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#ef4444" floodOpacity="0.6" />
            </filter>
            {/* Amber glow for at-risk bars */}
            <filter id="at-risk-glow" x="-20%" y="-20%" width="140%" height="160%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#f59e0b" floodOpacity="0.5" />
            </filter>
          </defs>

          {/* Order bars */}
          {orders.map((order, i) => {
            const risk = riskLevels.get(order.id) || "none";
            const barX = dateToPixel(
              new Date(order.orderDate),
              range.minDate,
              pixelsPerDay,
            );
            const barEnd = dateToPixel(
              new Date(order.expectedDate),
              range.minDate,
              pixelsPerDay,
            );
            const barWidth = Math.max(barEnd - barX, pixelsPerDay);
            const barY = HEADER_HEIGHT + i * ROW_HEIGHT + BAR_Y_OFFSET;
            const progressWidth =
              (barWidth * order.overallProgress) / 100;

            // Overdue extension: if today is past expectedDate and order not done
            const doneStatuses = ["COMPLETED", "SHIPPED", "DELIVERED", "CANCELLED"];
            const isOverdue = !doneStatuses.includes(order.status) && todayInRange && todayX > barX + barWidth;
            const overdueWidth = isOverdue ? todayX - (barX + barWidth) : 0;

            const isHovered = hoveredBar === order.id;
            const isAnyBarHovered = hoveredBar !== null;
            const filterUrl =
              risk === "critical"
                ? "url(#critical-glow)"
                : risk === "at-risk"
                ? "url(#at-risk-glow)"
                : "url(#bar-shadow)";

            return (
              <g
                key={order.id}
                className="cursor-pointer"
                style={{
                  filter: filterUrl,
                  transform: isHovered ? "translate(0, -1px)" : undefined,
                  opacity: isAnyBarHovered && !isHovered ? 0.7 : 1,
                  transition: "transform 0.15s ease, opacity 0.15s ease",
                }}
                onClick={() => handleBarClick(order.id)}
                onMouseEnter={(e) => {
                  setHoveredBar(order.id);
                  handleMouseEnter(e, order);
                }}
                onMouseLeave={() => {
                  setHoveredBar(null);
                  handleMouseLeave();
                }}
                onMouseOver={() => setHoveredRow(order.id)}
                onMouseOut={() => setHoveredRow(null)}
              >
                {/* Overdue extension (striped) */}
                {isOverdue && overdueWidth > 0 && (
                  <rect
                    x={barX + barWidth}
                    y={barY}
                    width={overdueWidth}
                    height={BAR_HEIGHT}
                    rx={0}
                    fill="url(#overdue-stripes)"
                  />
                )}
                {/* Track (background) */}
                <rect
                  x={barX}
                  y={barY}
                  width={barWidth}
                  height={BAR_HEIGHT}
                  rx={4}
                  ry={4}
                  fill={trackColors[order.status] || trackColors.PENDING}
                />
                {/* Progress fill */}
                {progressWidth > 0 && (
                  <rect
                    x={barX}
                    y={barY}
                    width={progressWidth}
                    height={BAR_HEIGHT}
                    rx={4}
                    ry={4}
                    fill={barColors[order.status] || barColors.PENDING}
                    opacity={0.9}
                  />
                )}
                {/* Bar outline — thicker + colored for critical/at-risk */}
                <rect
                  x={barX}
                  y={barY}
                  width={barWidth}
                  height={BAR_HEIGHT}
                  rx={4}
                  ry={4}
                  fill="none"
                  stroke={
                    risk === "critical"
                      ? "#ef4444"
                      : risk === "at-risk"
                      ? "#f59e0b"
                      : barColors[order.status] || barColors.PENDING
                  }
                  strokeWidth={risk !== "none" ? 2 : 1}
                  opacity={risk !== "none" ? 0.9 : 0.5}
                />
                {/* Bar text (if wide enough) */}
                {barWidth > 80 && (
                  <text
                    x={barX + 8}
                    y={barY + BAR_HEIGHT / 2 + 1}
                    dominantBaseline="middle"
                    className="text-[10px] font-medium pointer-events-none"
                    fill={isDark ? "#ffffff" : "#1f2937"}
                  >
                    {order.overallProgress}%
                  </text>
                )}
                {/* Overdue marker triangle at expected date */}
                {isOverdue && (
                  <polygon
                    points={`${barX + barWidth},${barY - 3} ${barX + barWidth - 4},${barY - 8} ${barX + barWidth + 4},${barY - 8}`}
                    fill="#ef4444"
                  />
                )}
              </g>
            );
          })}

          {/* Today line */}
          {todayInRange && (
            <g>
              <line
                x1={todayX}
                y1={0}
                x2={todayX}
                y2={totalHeight}
                stroke="#ef4444"
                strokeWidth={2}
                strokeDasharray="6,4"
              />
              <rect
                x={todayX - 22}
                y={2}
                width={44}
                height={18}
                rx={4}
                fill="#ef4444"
              />
              <text
                x={todayX}
                y={13}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-[10px] font-bold"
                fill="white"
              >
                Today
              </text>
            </g>
          )}
        </svg>

        {/* Tooltip */}
        {tooltip && (
          <div
            className="absolute z-50 pointer-events-none backdrop-blur-xl bg-white/90 dark:bg-zinc-800/90 border border-white/20 dark:border-zinc-600/50 rounded-lg shadow-xl px-4 py-2.5 text-sm whitespace-nowrap"
            style={{
              left: Math.min(tooltip.x + 12, totalWidth - 360),
              top: tooltip.y - 50,
            }}
          >
            <div className="flex items-center gap-3">
              <span className="font-semibold text-gray-900 dark:text-white">
                {tooltip.order.orderNumber}
              </span>
              <span className="text-gray-400 dark:text-zinc-500">·</span>
              <span className="text-gray-500 dark:text-zinc-400 text-xs">
                {tooltip.order.productName}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs">
              <span className="text-gray-500 dark:text-zinc-400">
                {formatDate(tooltip.order.orderDate)} → {formatDate(tooltip.order.expectedDate)}
              </span>
              <span className="text-gray-300 dark:text-zinc-600">|</span>
              <span className="flex items-center gap-1.5">
                <span
                  className="inline-block w-2 h-2 rounded-full"
                  style={{
                    backgroundColor:
                      barColors[tooltip.order.status] || barColors.PENDING,
                  }}
                />
                <span className="text-gray-600 dark:text-zinc-300">
                  {tooltip.order.status.replaceAll("_", " ")} — {tooltip.order.overallProgress}%
                </span>
              </span>
              {(() => {
                const risk = riskLevels.get(tooltip.order.id);
                if (!risk || risk === "none") return null;
                return (
                  <>
                    <span className="text-gray-300 dark:text-zinc-600">|</span>
                    <span className={`flex items-center gap-1.5 font-medium ${
                      risk === "critical" ? "text-red-500" : "text-amber-500"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        risk === "critical" ? "bg-red-500" : "bg-amber-500"
                      }`} />
                      {risk === "critical" ? "Delayed / Overdue" : "At risk"}
                    </span>
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </div>

    {/* Legend */}
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1 bg-gray-50/50 dark:bg-zinc-800/30 rounded-lg px-4 py-3 border border-gray-100 dark:border-zinc-800 text-xs text-gray-500 dark:text-zinc-400">
      <div className="flex items-center gap-1.5 font-medium">
        <span className="inline-block w-2 h-2 rounded-full bg-red-500" />
        Delayed / Overdue{criticalCount > 0 && ` (${criticalCount})`}
      </div>
      <div className="flex items-center gap-1.5 font-medium">
        <span className="inline-block w-2 h-2 rounded-full bg-amber-500" />
        At risk{atRiskCount > 0 && ` (${atRiskCount})`}
      </div>
      <div className="flex items-center gap-1.5 font-medium">
        <svg width="16" height="8"><line x1="0" y1="4" x2="16" y2="4" stroke="#ef4444" strokeWidth="2" strokeDasharray="4,3" /></svg>
        Today
      </div>
      <div className="flex items-center gap-1.5 font-medium">
        <svg width="16" height="8"><rect x="0" y="0" width="16" height="8" rx="2" fill={isDark ? "#172554" : "#dbeafe"} stroke={isDark ? "#2563eb" : "#3b82f6"} strokeWidth="1" /></svg>
        On track
      </div>
      <div className="flex items-center gap-1.5 font-medium">
        <svg width="16" height="8"><rect x="0" y="0" width="16" height="8" rx="2" fill={isDark ? "#2a2a2f" : "#f0f1f3"} stroke={isDark ? "#3f3f46" : "#d1d5db"} strokeWidth="1" /></svg>
        Weekend
      </div>
    </div>
    </div>
  );
}
