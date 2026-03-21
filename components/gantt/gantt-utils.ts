// Gantt chart layout constants
export const DEFAULT_PIXELS_PER_DAY = 32;
export const ROW_HEIGHT = 54;
export const HEADER_HEIGHT = 48;
export const LEFT_LABEL_WIDTH = 280;
export const BAR_HEIGHT = 24;
export const BAR_Y_OFFSET = (ROW_HEIGHT - BAR_HEIGHT) / 2;

// Zoom presets: label → pixels per day
export const ZOOM_PRESETS = [
  { label: "Month", ppd: 4 },
  { label: "2 Weeks", ppd: 10 },
  { label: "Week", ppd: 20 },
  { label: "Day", ppd: 32 },
  { label: "Detail", ppd: 52 },
] as const;

export const MIN_PIXELS_PER_DAY = 2;
export const MAX_PIXELS_PER_DAY = 64;

/** Convert a Date to days since epoch (integer) */
export function toDayIndex(d: Date): number {
  return Math.floor(d.getTime() / (1000 * 60 * 60 * 24));
}

/** Convert a date to pixel x-position relative to minDate */
export function dateToPixel(date: Date, minDate: Date, pixelsPerDay: number = DEFAULT_PIXELS_PER_DAY): number {
  return (toDayIndex(date) - toDayIndex(minDate)) * pixelsPerDay;
}

export type GanttRange = {
  minDate: Date;
  maxDate: Date;
  totalDays: number;
  totalWidth: number;
};

/** Compute the overall date range across all orders, with padding */
export function computeGanttRange(
  orders: Array<{ expectedStartDate: string; expectedDate: string }>,
  pixelsPerDay: number = DEFAULT_PIXELS_PER_DAY,
): GanttRange {
  if (orders.length === 0) {
    const now = new Date();
    const min = new Date(now);
    min.setDate(min.getDate() - 7);
    const max = new Date(now);
    max.setDate(max.getDate() + 30);
    return {
      minDate: min,
      maxDate: max,
      totalDays: 37,
      totalWidth: 37 * pixelsPerDay,
    };
  }

  let minTime = Infinity;
  let maxTime = -Infinity;

  for (const order of orders) {
    const orderTime = new Date(order.expectedStartDate).getTime();
    const expectedTime = new Date(order.expectedDate).getTime();
    if (orderTime < minTime) minTime = orderTime;
    if (expectedTime > maxTime) maxTime = expectedTime;
    // Also consider expectedStartDate could be after expectedDate
    if (expectedTime < minTime) minTime = expectedTime;
    if (orderTime > maxTime) maxTime = orderTime;
  }

  // Add 7-day padding on each side
  const minDate = new Date(minTime);
  minDate.setDate(minDate.getDate() - 7);
  const maxDate = new Date(maxTime);
  maxDate.setDate(maxDate.getDate() + 7);

  const totalDays = toDayIndex(maxDate) - toDayIndex(minDate);
  const totalWidth = totalDays * pixelsPerDay;

  return { minDate, maxDate, totalDays, totalWidth };
}

/** Generate month labels for the header */
export function generateMonthLabels(
  range: GanttRange,
  pixelsPerDay: number = DEFAULT_PIXELS_PER_DAY,
): Array<{ label: string; x: number; width: number }> {
  const labels: Array<{ label: string; x: number; width: number }> = [];
  const current = new Date(range.minDate);
  current.setDate(1); // Start at 1st of the month

  while (current <= range.maxDate) {
    const monthStart = new Date(current);
    if (monthStart < range.minDate) {
      // Clamp to minDate
      monthStart.setTime(range.minDate.getTime());
    }

    const nextMonth = new Date(current);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const monthEnd = nextMonth > range.maxDate ? range.maxDate : nextMonth;

    const x = dateToPixel(monthStart, range.minDate, pixelsPerDay);
    const width = dateToPixel(monthEnd, range.minDate, pixelsPerDay) - x;

    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];
    const label = `${monthNames[current.getMonth()]} ${current.getFullYear()}`;

    if (width > 0) {
      labels.push({ label, x, width });
    }

    current.setMonth(current.getMonth() + 1);
    current.setDate(1);
  }

  return labels;
}

/** Generate day grid lines (every Monday) */
export function generateWeekLines(
  range: GanttRange,
  pixelsPerDay: number = DEFAULT_PIXELS_PER_DAY,
): Array<{ x: number; date: Date }> {
  const lines: Array<{ x: number; date: Date }> = [];
  const current = new Date(range.minDate);
  // Advance to next Monday
  const day = current.getDay();
  const daysUntilMonday = day === 0 ? 1 : day === 1 ? 0 : 8 - day;
  current.setDate(current.getDate() + daysUntilMonday);

  while (current <= range.maxDate) {
    lines.push({
      x: dateToPixel(current, range.minDate, pixelsPerDay),
      date: new Date(current),
    });
    current.setDate(current.getDate() + 7);
  }

  return lines;
}

/** Check if a date falls on a weekend */
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

const DAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];

/** Generate day-level labels for the header (only at close zoom) */
export function generateDayLabels(
  range: GanttRange,
  pixelsPerDay: number,
): Array<{ x: number; date: Date; label: string; dayLetter: string; isWeekend: boolean }> {
  if (pixelsPerDay < 16) return [];
  const labels: Array<{ x: number; date: Date; label: string; dayLetter: string; isWeekend: boolean }> = [];
  const current = new Date(range.minDate);
  while (current <= range.maxDate) {
    labels.push({
      x: dateToPixel(current, range.minDate, pixelsPerDay),
      date: new Date(current),
      label: String(current.getDate()),
      dayLetter: DAY_LETTERS[current.getDay()],
      isWeekend: isWeekend(current),
    });
    current.setDate(current.getDate() + 1);
  }
  return labels;
}

/** Generate daily vertical grid lines (only at close zoom) */
export function generateDayLines(
  range: GanttRange,
  pixelsPerDay: number,
): Array<{ x: number; isWeekend: boolean }> {
  if (pixelsPerDay < 16) return [];
  const lines: Array<{ x: number; isWeekend: boolean }> = [];
  const current = new Date(range.minDate);
  while (current <= range.maxDate) {
    lines.push({
      x: dateToPixel(current, range.minDate, pixelsPerDay),
      isWeekend: isWeekend(current),
    });
    current.setDate(current.getDate() + 1);
  }
  return lines;
}

// Status → bar fill colors (solid colors for SVG)
export const statusBarColors: Record<string, string> = {
  PENDING: "#f59e0b",     // amber-500
  IN_PROGRESS: "#3b82f6", // blue-500
  BEHIND_SCHEDULE: "#f59e0b", // amber-500
  DELAYED: "#F97316",     // brand orange
  DISRUPTED: "#ef4444",   // red-500
  COMPLETED: "#22c55e",   // green-500
  SHIPPED: "#a855f7",     // purple-500
  IN_TRANSIT: "#8b5cf6",  // violet-500
  CUSTOMS: "#6366f1",     // indigo-500
  DELIVERED: "#71717a",   // zinc-500
  CANCELLED: "#a1a1aa",   // zinc-400
};

// Status → bar background (lighter, for the track behind progress)
export const statusTrackColors: Record<string, string> = {
  PENDING: "#fef3c7",
  IN_PROGRESS: "#dbeafe",
  BEHIND_SCHEDULE: "#fef3c7",
  DELAYED: "#fed7aa",
  DISRUPTED: "#fecaca",
  COMPLETED: "#dcfce7",
  SHIPPED: "#f3e8ff",
  IN_TRANSIT: "#ede9fe",
  CUSTOMS: "#e0e7ff",
  DELIVERED: "#e4e4e7",
  CANCELLED: "#e4e4e7",
};

// Dark mode variants
export const statusBarColorsDark: Record<string, string> = {
  PENDING: "#d97706",
  IN_PROGRESS: "#2563eb",
  BEHIND_SCHEDULE: "#d97706",
  DELAYED: "#F97316",
  DISRUPTED: "#dc2626",
  COMPLETED: "#16a34a",
  SHIPPED: "#9333ea",
  IN_TRANSIT: "#7c3aed",
  CUSTOMS: "#4f46e5",
  DELIVERED: "#52525b",
  CANCELLED: "#71717a",
};

export const statusTrackColorsDark: Record<string, string> = {
  PENDING: "#451a03",
  IN_PROGRESS: "#172554",
  BEHIND_SCHEDULE: "#78350f",
  DELAYED: "#431407",
  DISRUPTED: "#450a0a",
  COMPLETED: "#052e16",
  SHIPPED: "#3b0764",
  IN_TRANSIT: "#2e1065",
  CUSTOMS: "#1e1b4b",
  DELIVERED: "#27272a",
  CANCELLED: "#27272a",
};
