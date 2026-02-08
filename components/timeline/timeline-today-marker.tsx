"use client";

import { dateToX } from "./timeline-date-utils";

type TimelineTodayMarkerProps = {
  minDate: Date;
  maxDate: Date;
  height: number;
};

export function TimelineTodayMarker({ minDate, maxDate, height }: TimelineTodayMarkerProps) {
  const today = new Date();

  // Only render if today falls within (or very near) the date range
  if (today < minDate || today > maxDate) return null;

  const x = dateToX(today, minDate, maxDate);

  return (
    <div
      className="absolute top-0 z-0 pointer-events-none"
      style={{ left: x, height }}
    >
      {/* "Today" pill at top */}
      <div
        className="absolute -top-0.5 bg-red-500 text-white text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap"
        style={{ transform: "translateX(-50%)" }}
      >
        Today
      </div>
    </div>
  );
}
