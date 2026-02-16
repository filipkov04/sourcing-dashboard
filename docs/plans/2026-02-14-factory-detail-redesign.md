# Factory Detail Page Redesign

## Date: 2026-02-14
## Approach: Stats Banner + Condensed Info (Approach A)

## Problem
The factory detail page has sparse information cards, no at-a-glance KPIs, and a basic orders table without visual summary.

## Changes

### 1. Stats Row (new section, after header)
Four stat cards in a `grid-cols-2 lg:grid-cols-4` grid:
- **Total Orders** — `factory.orders.length`, Package icon
- **Active Orders** — count of IN_PROGRESS/PENDING/DELAYED/DISRUPTED, "in production" subtitle
- **On-Time Rate** — % of completed orders that weren't delayed, green/red tint
- **Avg Progress** — average `overallProgress` of active orders, mini progress bar

Styled to match dashboard stat cards: `rounded-lg border p-5 shadow-sm`.

### 2. Condensed Factory + Contact Card
Merge the two separate cards (Factory Info 2/3 + Contact 1/3) into one full-width card:
- Left half: factory name, location (MapPin), address
- Right half: contact name (User), email (Mail, clickable), phone (Phone, clickable)
- Vertical divider between halves
- Falls back to "No contact information" if empty

### 3. Orders Section Enhancement
- Add a **status distribution bar** above the orders table — thin horizontal stacked bar showing proportion of each status, color-coded
- Table remains as-is

## File Modified
- `app/(dashboard)/factories/[id]/page.tsx`
