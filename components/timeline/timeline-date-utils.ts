import { type TimelineStage } from "./timeline-types";

export const PIXELS_PER_DAY = 40;
export const MIN_NODE_GAP = 200;
export const EDGE_PADDING = 80;

/** Convert a Date to days since epoch (integer) */
export function toDayIndex(d: Date): number {
  return Math.floor(d.getTime() / (1000 * 60 * 60 * 24));
}

/** Get the best available date from a stage, or null */
function getStageDate(stage: TimelineStage): Date | null {
  if (stage.startedAt) return new Date(stage.startedAt);
  if (stage.completedAt) return new Date(stage.completedAt);
  if (stage.expectedStartDate) return new Date(stage.expectedStartDate);
  return null;
}

export type StagePosition = {
  stageId: string;
  x: number;
};

/**
 * Compute x-positions for each stage plus the order-info node.
 *
 * - Stages with dates get positioned proportionally on a time axis
 * - Undated stages are interpolated evenly between their nearest dated neighbours
 * - A minimum gap of MIN_NODE_GAP px is enforced between adjacent nodes
 *
 * Returns positions array (index 0 = order-info, 1..N = stages in sequence order)
 * and the total content width.
 */
export function computeStagePositions(
  stages: TimelineStage[],
  expectedStartDate?: string | null,
  expectedDate?: string | null,
): { positions: StagePosition[]; contentWidth: number; minDate: Date; maxDate: Date } {
  const sorted = [...stages].sort((a, b) => a.sequence - b.sequence);

  // Collect all known dates to build the axis range
  const allDates: Date[] = [];
  if (expectedStartDate) allDates.push(new Date(expectedStartDate));
  if (expectedDate) allDates.push(new Date(expectedDate));
  sorted.forEach((s) => {
    const d = getStageDate(s);
    if (d) allDates.push(d);
    if (s.expectedStartDate) allDates.push(new Date(s.expectedStartDate));
    if (s.expectedEndDate) allDates.push(new Date(s.expectedEndDate));
  });

  // Fallback: if no dates at all, use equal spacing
  if (allDates.length === 0) {
    return equalSpacing(sorted);
  }

  const minDate = new Date(Math.min(...allDates.map((d) => d.getTime())));
  const maxDate = new Date(Math.max(...allDates.map((d) => d.getTime())));
  const minDay = toDayIndex(minDate);
  const maxDay = toDayIndex(maxDate);
  const totalDays = Math.max(maxDay - minDay, 1);

  // Raw pixel width of the date range
  const rawWidth = totalDays * PIXELS_PER_DAY;

  // Place order-info node at the order date, or at minDate
  const orderDay = expectedStartDate ? toDayIndex(new Date(expectedStartDate)) : minDay;

  // Build raw x for each stage based on dates; null means undated
  const rawPositions: (number | null)[] = sorted.map((s) => {
    const d = getStageDate(s);
    if (!d) return null;
    return EDGE_PADDING + ((toDayIndex(d) - minDay) / totalDays) * rawWidth;
  });

  // Order-info x
  const orderInfoX = EDGE_PADDING + ((orderDay - minDay) / totalDays) * rawWidth;

  // Interpolate undated stages
  interpolateGaps(rawPositions, EDGE_PADDING, EDGE_PADDING + rawWidth);

  // Now rawPositions has no nulls
  const filledPositions = rawPositions as number[];

  // Build full list: order-info + stages
  const allX: number[] = [orderInfoX, ...filledPositions];
  const allIds: string[] = ["order-info", ...sorted.map((s) => s.id)];

  // Enforce minimum gap (push later nodes forward if too close)
  for (let i = 1; i < allX.length; i++) {
    if (allX[i] - allX[i - 1] < MIN_NODE_GAP) {
      allX[i] = allX[i - 1] + MIN_NODE_GAP;
    }
  }

  const contentWidth = (allX[allX.length - 1] || 0) + EDGE_PADDING + 160; // 160 = card width

  const positions: StagePosition[] = allIds.map((id, i) => ({
    stageId: id,
    x: allX[i],
  }));

  return { positions, contentWidth, minDate, maxDate };
}

/**
 * Fill null entries by linear interpolation between nearest non-null neighbours.
 * Leading nulls use `startX`, trailing nulls use `endX`.
 */
function interpolateGaps(arr: (number | null)[], startX: number, endX: number) {
  const n = arr.length;

  // Find first non-null
  let firstNonNull = -1;
  for (let i = 0; i < n; i++) {
    if (arr[i] !== null) {
      firstNonNull = i;
      break;
    }
  }

  // All null — even spacing
  if (firstNonNull === -1) {
    for (let i = 0; i < n; i++) {
      arr[i] = startX + ((endX - startX) * (i + 1)) / (n + 1);
    }
    return;
  }

  // Fill leading nulls
  for (let i = 0; i < firstNonNull; i++) {
    arr[i] = startX + ((arr[firstNonNull]! - startX) * (i + 1)) / (firstNonNull + 1);
  }

  // Fill internal gaps
  let lastKnown = firstNonNull;
  for (let i = firstNonNull + 1; i < n; i++) {
    if (arr[i] !== null) {
      // Fill between lastKnown and i
      const gap = i - lastKnown;
      for (let j = lastKnown + 1; j < i; j++) {
        const t = (j - lastKnown) / gap;
        arr[j] = arr[lastKnown]! + t * (arr[i]! - arr[lastKnown]!);
      }
      lastKnown = i;
    }
  }

  // Fill trailing nulls
  for (let i = lastKnown + 1; i < n; i++) {
    const remaining = n - lastKnown;
    arr[i] = arr[lastKnown]! + ((endX - arr[lastKnown]!) * (i - lastKnown)) / remaining;
  }
}

/** Fallback: equal spacing when no dates exist */
function equalSpacing(sorted: TimelineStage[]): {
  positions: StagePosition[];
  contentWidth: number;
  minDate: Date;
  maxDate: Date;
} {
  const now = new Date();
  const positions: StagePosition[] = [
    { stageId: "order-info", x: EDGE_PADDING },
  ];

  sorted.forEach((s, i) => {
    positions.push({
      stageId: s.id,
      x: EDGE_PADDING + (i + 1) * MIN_NODE_GAP,
    });
  });

  const contentWidth = EDGE_PADDING + (sorted.length + 1) * MIN_NODE_GAP + 160;

  return { positions, contentWidth, minDate: now, maxDate: now };
}

/**
 * Convert a date to an x-position on the same axis used by computeStagePositions.
 */
export function dateToX(
  date: Date,
  minDate: Date,
  maxDate: Date,
): number {
  const minDay = toDayIndex(minDate);
  const maxDay = toDayIndex(maxDate);
  const totalDays = Math.max(maxDay - minDay, 1);
  const rawWidth = totalDays * PIXELS_PER_DAY;
  const day = toDayIndex(date);
  return EDGE_PADDING + ((day - minDay) / totalDays) * rawWidth;
}
