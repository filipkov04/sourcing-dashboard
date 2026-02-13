# Export Timeline Image — Design

**Date:** 2026-02-13
**Task:** 4.12

## Summary

Add an export button to the Gantt chart that downloads the full timeline as a PNG image.

## Approach

Use `html-to-image` library to capture the chart DOM node (mixed HTML labels + SVG chart).

## Implementation

1. Install `html-to-image`
2. Add export button in Gantt toolbar next to zoom controls
3. On click: temporarily expand scroll container to full width, capture with `toPng()`, restore, trigger download
4. Filename: `timeline-YYYY-MM-DD.png`

## Files

- `package.json` — add `html-to-image`
- `components/gantt/gantt-chart.tsx` — export button + logic + container ref
