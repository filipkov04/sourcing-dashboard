# Sidebar Consolidation Design

**Date:** 2026-03-18
**Authors:** Marco, Filip, Claude

## Goal

Reduce sidebar from 11 to 8 navigation items by consolidating related pages under existing sections.

## Current Sidebar (11 items)

Home | Factories | Orders | Analytics | Timeline | Team | Alerts | Requests | Integrations | Messages | Settings

## Target Sidebar (8 items)

Home | Factories | Orders | Analytics | Team | Requests | Messages | Settings

## Changes

### 1. Remove Alerts from Sidebar

- Delete `Alerts` from sidebar navigation array
- Keep `/alerts` route and page intact (hidden page)
- Already accessible via:
  - Header bell dropdown → "View all alerts" footer link
  - Dashboard Active Alerts widget → "View all" link

### 2. Move Timeline under Analytics

- Add third tab to Analytics: **Overview | Custom Charts | Timeline**
- Extract timeline page content into `analytics/_components/timeline-tab.tsx`
- Delete `app/(dashboard)/timeline/page.tsx` route
- Timeline tab renders the existing Gantt chart with all its filters and stats

### 3. Move Integrations under Settings

- Settings page becomes a vertical nav hub linking to sub-pages:
  - **Notifications** → `/settings/notifications` (current settings content)
  - **Integrations** → `/settings/integrations` (moved from `/integrations`)
  - **User Guide** → `/settings/docs` (existing)
- Move all integration pages:
  - `/integrations` → `/settings/integrations`
  - `/integrations/[id]` → `/settings/integrations/[id]`
  - `/integrations/docs` → `/settings/integrations/docs`
- Update all internal links referencing `/integrations` paths

## Files Affected

### Sidebar & Layout
- `components/layout/sidebar.tsx` — Remove 3 nav items
- `components/layout/breadcrumb-nav.tsx` — Update SECTION_MAP
- `components/layout/header.tsx` — No changes needed (already links to /alerts)

### Settings (new hub + sub-pages)
- `app/(dashboard)/settings/page.tsx` — Rewrite as vertical nav hub
- `app/(dashboard)/settings/notifications/page.tsx` — New (current settings content)
- `app/(dashboard)/settings/integrations/page.tsx` — Moved from integrations
- `app/(dashboard)/settings/integrations/[id]/page.tsx` — Moved from integrations
- `app/(dashboard)/settings/integrations/docs/page.tsx` — Moved from integrations

### Analytics (Timeline tab)
- `app/(dashboard)/analytics/page.tsx` — Add Timeline tab
- `app/(dashboard)/analytics/_components/timeline-tab.tsx` — New (extracted from timeline page)
- `app/(dashboard)/timeline/page.tsx` — Delete

### Cross-references to update
- `app/(dashboard)/integrations/[id]/page.tsx` — Back-nav links → `/settings/integrations`
- `app/(dashboard)/integrations/docs/page.tsx` — Back-nav link → `/settings/integrations`
- `app/(dashboard)/integrations/page.tsx` — Internal link to docs
- `app/(dashboard)/dashboard/_components/dashboard-alerts-widget.tsx` — No change needed (links to /alerts which stays)

## Design Decisions

- **Vertical nav for Settings** (not tabs) — simpler for now, can evolve to Apple-style system preferences later if more sections are added
- **Alerts page stays as hidden route** — full alert list with filters remains accessible via header dropdown and dashboard widget links
- **API routes unchanged** — Only UI routes move; `/api/integrations/*` stays put
- **Factory integration setup unchanged** — `/factories/[id]/integration` pages stay; they call API routes directly
