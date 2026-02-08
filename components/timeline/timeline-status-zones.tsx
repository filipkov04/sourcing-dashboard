"use client";

import { useMemo } from "react";
import { statusZoneColors, NODE_CARD_WIDTH, type TimelineStage } from "./timeline-types";
import { type StagePosition } from "./timeline-date-utils";

type TimelineStatusZonesProps = {
  stages: TimelineStage[];
  positions: StagePosition[];
  height: number;
};

type Zone = {
  status: string;
  startX: number;
  endX: number;
};

export function TimelineStatusZones({ stages, positions, height }: TimelineStatusZonesProps) {
  const zones = useMemo(() => {
    const sorted = [...stages].sort((a, b) => a.sequence - b.sequence);
    if (sorted.length === 0) return [];

    // Build a map of stageId -> x position
    const posMap = new Map(positions.map((p) => [p.stageId, p.x]));

    const result: Zone[] = [];
    let currentStatus = sorted[0].status;
    let startX = posMap.get(sorted[0].id) ?? 0;
    let endX = startX;

    for (let i = 1; i < sorted.length; i++) {
      const s = sorted[i];
      const x = posMap.get(s.id) ?? 0;

      if (s.status === currentStatus) {
        endX = x;
      } else {
        result.push({ status: currentStatus, startX, endX });
        currentStatus = s.status;
        startX = x;
        endX = x;
      }
    }
    result.push({ status: currentStatus, startX, endX });

    return result;
  }, [stages, positions]);

  return (
    <>
      {zones.map((zone, i) => {
        const colors = statusZoneColors[zone.status];
        if (!colors) return null;

        const padding = 8;
        const left = zone.startX - padding;
        const width = zone.endX - zone.startX + NODE_CARD_WIDTH + padding * 2;

        return (
          <div
            key={`${zone.status}-${i}`}
            className={`absolute rounded-lg ${colors.light} ${colors.dark}`}
            style={{
              left,
              top: 0,
              width,
              height,
            }}
          />
        );
      })}
    </>
  );
}
