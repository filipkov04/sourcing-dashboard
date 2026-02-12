# Pending Implementation Plans

## 1. Timeline Redesign Plan

**Status:** READY TO IMPLEMENT
**Trigger:** Say "implement the timeline redesign"
**Transcript:** `/Users/marcokrakovsky/.claude/projects/-Users-marcokrakovsky/5b90fd5d-8ad8-4d3c-8b37-6fced8603305.jsonl`

### Context

The current timeline canvas has a plain empty background and uses equal-spaced 110px circle nodes. This redesign adds spatial texture, date-aware positioning, richer node visuals, and animated interactions.

### Features (in order)

1. **Dotted Grid Background** — CSS radial-gradient dots on viewport div (fixed during pan)
2. **Time Axis / Gantt-Style Layout** — Date-to-pixel positioning, adaptive tick granularity, absolute-positioned nodes
3. **"Today" Marker** — Vertical dashed red line at today's date
4. **Status Zone Backgrounds** — Translucent colored rectangles behind stage groups by status
5. **Richer Node Cards** — 160×110 rectangular cards with name, progress bar, status badge
6. **Animated Panel Transitions** — framer-motion slide-down for expansion panels

### Files

| Action | File |
|--------|------|
| Create | `components/timeline/timeline-date-utils.ts` |
| Create | `components/timeline/timeline-time-axis.tsx` |
| Create | `components/timeline/timeline-today-marker.tsx` |
| Create | `components/timeline/timeline-status-zones.tsx` |
| Modify | `components/timeline/horizontal-timeline.tsx` (major refactor) |
| Modify | `components/timeline/timeline-canvas.tsx` (dot grid + contentWidth prop) |
| Modify | `components/timeline/timeline-node.tsx` (circle → card redesign) |
| Modify | `components/timeline/timeline-connector.tsx` (explicit width, absolute pos) |
| Modify | `components/timeline/timeline-types.ts` (zone colors, constants) |
| Modify | `app/globals.css` (dot grid class) |
| Modify | `app/(dashboard)/orders/[id]/page.tsx` (pass orderDate prop) |

---

## 2. Enlarge Timeline Node Cards

**Status:** READY TO IMPLEMENT
**Trigger:** Say "implement the card enlargement plan"
**Transcript:** `/Users/marcokrakovsky/.claude/projects/-Users-marcokrakovsky/228f1c0c-7eda-4a11-9a34-37cd182995c5.jsonl`

### Changes

1. `NODE_CARD_WIDTH`: 160 → 180, `NODE_CARD_HEIGHT`: 110 → 134
2. Fix 3 hardcoded values (2× `160` in date-utils, 1× `110` in canvas)
3. Card padding: `p-3` → `p-3.5`, vertical gaps: `mb-1` → `mb-1.5`, `mt-1` → `mt-1.5`

### Files

| File | Change |
|------|--------|
| `components/timeline/timeline-types.ts` | Bump constants |
| `components/timeline/timeline-node.tsx` | Increase padding/spacing |
| `components/timeline/timeline-date-utils.ts` | Import constant, replace hardcoded 160 |
| `components/timeline/timeline-canvas.tsx` | Import constant, replace hardcoded 110 |
