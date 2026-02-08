"use client";

import { useMemo } from "react";
import { EDGE_PADDING, PIXELS_PER_DAY } from "./timeline-date-utils";

type TimelineTimeAxisProps = {
  minDate: Date;
  maxDate: Date;
  contentWidth: number;
  /** Current zoom level — controls tick granularity */
  zoom?: number;
};

type Tick = {
  x: number;
  label: string;
  isMajor: boolean;
  /** If true, only render the tick line (no label) */
  tickOnly?: boolean;
};

function toDayIndex(d: Date): number {
  return Math.floor(d.getTime() / (1000 * 60 * 60 * 24));
}

function dateFromDayIndex(dayIndex: number): Date {
  return new Date(dayIndex * 1000 * 60 * 60 * 24);
}

function formatShortDate(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatMonth(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

/**
 * Generate ticks for the time axis.
 * Adapts granularity based on effective zoom:
 * - zoomed in (>1.4): daily ticks (label every other day, tick lines for all)
 * - medium-high (0.8-1.4): every-3-day ticks
 * - medium (0.4-0.8): weekly ticks
 * - zoomed out (<0.4): monthly ticks
 */
function generateTicks(
  minDate: Date,
  maxDate: Date,
  zoom: number,
): Tick[] {
  const minDay = toDayIndex(minDate);
  const maxDay = toDayIndex(maxDate);
  const totalDays = Math.max(maxDay - minDay, 1);
  const rawWidth = totalDays * PIXELS_PER_DAY;
  const ticks: Tick[] = [];

  if (zoom > 1.4) {
    // Daily ticks — label every other day, tick lines for all
    for (let day = minDay; day <= maxDay; day++) {
      const d = dateFromDayIndex(day);
      const x = EDGE_PADDING + ((day - minDay) / totalDays) * rawWidth;
      const dayOffset = day - minDay;
      const isMajor = d.getDay() === 1; // Monday
      const tickOnly = dayOffset % 2 !== 0; // label every other day
      ticks.push({ x, label: formatShortDate(d), isMajor, tickOnly });
    }
  } else if (zoom > 0.8) {
    // Every-3-day ticks
    for (let day = minDay; day <= maxDay; day += 3) {
      const d = dateFromDayIndex(day);
      const x = EDGE_PADDING + ((day - minDay) / totalDays) * rawWidth;
      const isMajor = d.getDay() === 1 || d.getDate() === 1; // Monday or 1st of month
      ticks.push({ x, label: formatShortDate(d), isMajor });
    }
  } else if (zoom > 0.4) {
    // Weekly ticks (every 7 days, snapped to Monday)
    const startDate = dateFromDayIndex(minDay);
    // Find first Monday on or after minDay
    let current = new Date(startDate);
    const dayOfWeek = current.getDay();
    const daysToMonday = dayOfWeek === 0 ? 1 : dayOfWeek === 1 ? 0 : 8 - dayOfWeek;
    current.setDate(current.getDate() + daysToMonday);

    while (toDayIndex(current) <= maxDay) {
      const day = toDayIndex(current);
      const x = EDGE_PADDING + ((day - minDay) / totalDays) * rawWidth;
      const isMajor = current.getDate() <= 7; // First week of month
      ticks.push({ x, label: formatShortDate(current), isMajor });
      current = new Date(current);
      current.setDate(current.getDate() + 7);
    }
  } else {
    // Monthly ticks
    const startDate = dateFromDayIndex(minDay);
    let current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);

    while (toDayIndex(current) <= maxDay + 31) {
      const day = toDayIndex(current);
      if (day >= minDay - 5) {
        const x = EDGE_PADDING + ((day - minDay) / totalDays) * rawWidth;
        ticks.push({ x, label: formatMonth(current), isMajor: true });
      }
      current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
    }
  }

  return ticks;
}

export function TimelineTimeAxis({
  minDate,
  maxDate,
  contentWidth,
  zoom = 1,
}: TimelineTimeAxisProps) {
  const ticks = useMemo(
    () => generateTicks(minDate, maxDate, zoom),
    [minDate, maxDate, zoom],
  );

  if (ticks.length === 0) return null;

  return (
    <div
      className="absolute top-0 left-0 h-full pointer-events-none"
      style={{ width: contentWidth }}
    >
      {ticks.map((tick, i) => (
        <div
          key={i}
          className="absolute top-0 flex flex-col items-center"
          style={{ left: tick.x }}
        >
          {/* Tick line — full height */}
          <div
            className={`w-[1.5px] h-full ${
              tick.isMajor
                ? "bg-gray-300/50 dark:bg-zinc-600/40"
                : "bg-gray-200/40 dark:bg-zinc-700/30"
            }`}
          />
          {/* Label at bottom (skip if tickOnly) */}
          {!tick.tickOnly && (
            <span
              className={`absolute bottom-2 text-xs whitespace-nowrap ${
                tick.isMajor
                  ? "text-gray-500 dark:text-zinc-400 font-medium"
                  : "text-gray-400 dark:text-zinc-500"
              }`}
              style={{ transform: "translateX(-50%)" }}
            >
              {tick.label}
            </span>
          )}
        </div>
      ))}

      {/* Horizontal axis line at the bottom of the node area */}
      <div
        className="absolute bottom-6 left-0 h-px bg-gray-300/40 dark:bg-zinc-600/30"
        style={{ width: contentWidth }}
      />
    </div>
  );
}
