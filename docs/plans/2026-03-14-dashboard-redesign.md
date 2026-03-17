# Dashboard Homepage Redesign

**Date:** 2026-03-14
**Goal:** Streamline dashboard to show only high-value, actionable information for clients.

## Layout (top to bottom)

1. **Header** — greeting, live clock
2. **KPI Stats Cards** — 5 cards (Total Orders, In Progress, Completed, On-Time Rate, Avg Lead Time)
3. **Action Required + Alerts** — 2-column grid
4. **Activity Feed + Order Progress Snapshot** — 2-column grid
5. **Orders by Status** — single full-width section (donut/bar toggle)
6. **Map + Exchange Rates** — Market & Logistics section

## Removed Sections

- **Quick Actions** → replaced by Action Required (nav links aren't useful when sidebar exists)
- **Upcoming Deliveries** → replaced by Order Progress Snapshot (better version)
- **Product Portfolio** → lives in Analytics
- **Factory Performance** → lives in Analytics

## New Widget A: Action Required

- **Position:** Left column, row 3
- **Tag:** ACT
- **Data:** Orders needing client awareness:
  - **Delayed** — past expected date or with delayed stages
  - **Disrupted** — orders with blocked stages
  - **At Risk** — within 7 days of expected date but <80% progress
- **Each item:** order number, product name, factory, status badge, reason tag (e.g., "2 stages blocked", "5 days overdue", "due in 3 days at 40%")
- **Click:** navigates to order detail page
- **Empty state:** green "all clear" message
- **API:** `GET /api/dashboard/action-required`

## New Widget B: Order Progress Snapshot

- **Position:** Right column, row 4
- **Tag:** TRK
- **Data:** Top 8 active orders sorted by nearest expected delivery date, secondary by highest progress
- **Each item:** order number, product name, factory, mini progress bar, percentage, days until expected delivery (or days overdue in red)
- **Click:** navigates to order detail page
- **API:** `GET /api/dashboard/order-progress`

## Styling

Both widgets use existing HUD classes: `card-hover-glow`, `hud-corners`, data readout tags.
