# SourceTrack - Sourcing Dashboard

## Project Overview

Web dashboard for fashion/manufacturing brands to track real-time production status from all their factories. Think Shopify for production tracking.

**Repo:** https://github.com/filipkov04/sourcing-dashboard
**Developers:** Filip & Marco | **Timeline:** 12 weeks (currently Week 9 — week 8 was skipped)

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Language:** TypeScript
- **Database:** PostgreSQL on Supabase | **ORM:** Prisma 7
- **Auth:** NextAuth.js v5
- **Styling:** Tailwind CSS 4 (dark theme default) | **UI:** shadcn/ui (Radix)
- **Charts:** Recharts | **DnD:** @dnd-kit | **Export:** html-to-image, ExcelJS | **Deployment:** Vercel

## Key Conventions

**API Response Format:**
```typescript
{ success: true, data: {...} }  // or { success: false, error: "message" }
```

**Next.js 16 Route Params** — `params` is a Promise:
```typescript
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
}
```

**Theme:** Dark by default (`zinc-900` bg, `zinc-800` cards). Always use `dark:` variants for light mode support. Pattern: `text-gray-900 dark:text-white`, `bg-white dark:bg-zinc-800`.

**Stage metadata:** Stored as ordered array `[{key, value}]` (not object — Postgres jsonb doesn't preserve key order).

**Git:** Include `Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>`

**Prisma:** Always `npx prisma generate` after schema changes, restart dev server.

**Project Scoping:** All data queries must include `projectId` alongside `organizationId`. Use `projectScope(session)` from `lib/api.ts` which returns `{ organizationId, ...(projectId ? { projectId } : {}) }`. Team/invitations/presence are org-level (no projectId). Server components must pass `session.user.projectId` explicitly.

## Status System

**Order Status** (auto-updated from stages): PENDING | IN_PROGRESS | BEHIND_SCHEDULE | DELAYED | DISRUPTED | COMPLETED | SHIPPED | IN_TRANSIT | CUSTOMS | DELIVERED | CANCELLED

**Stage Status:** NOT_STARTED | IN_PROGRESS | BEHIND_SCHEDULE | COMPLETED | SKIPPED | DELAYED | BLOCKED

**Stage-level detection (`lib/check-delays.ts`):**
- IN_PROGRESS stage past `expectedEndDate` → **BEHIND_SCHEDULE** (amber — still progressing but late)
- NOT_STARTED stage past `expectedStartDate` → **DELAYED** (orange — hasn't even begun)
- Auto-reverts: BEHIND_SCHEDULE → IN_PROGRESS when projected completion catches up

**Order-level propagation priority** (highest wins):
1. Any BLOCKED stage → order **DISRUPTED**
2. Any DELAYED stage → order **DELAYED**
3. Any BEHIND_SCHEDULE stage → order **BEHIND_SCHEDULE**
4. All COMPLETED/SKIPPED → order **COMPLETED**

**AT_RISK** is a computed visual indicator (not a DB status) — shown in Action Required widget for IN_PROGRESS orders without stage dates where progress is 20+ percentage points behind time elapsed and >30% time elapsed.

Manual statuses (SHIPPED, DELIVERED, CANCELLED) are never overwritten by auto-rules.

## Current Status (Session 29 — Mar 17, 2026)

**Last completed:** BEHIND_SCHEDULE status + Dashboard redesign + Security fixes

**Session 29 changes (Marco):**
- **BEHIND_SCHEDULE Status (Order + Stage level):**
  - `prisma/schema.prisma`: Added BEHIND_SCHEDULE to both OrderStatus and StageStatus enums. Added IN_TRANSIT, CUSTOMS to OrderStatus.
  - `lib/check-delays.ts`: Rewritten detection logic — IN_PROGRESS stages past expectedEndDate → BEHIND_SCHEDULE, NOT_STARTED past expectedStartDate → DELAYED. `projectCompletion()` function for cumulative slippage. Auto-revert when projection catches up.
  - `app/api/orders/[id]/stages/[stageId]/route.ts`: BEHIND_SCHEDULE in validStatuses, isProblemStatus, timestamp handling, order propagation.
  - 13+ API routes: Added BEHIND_SCHEDULE to active status filter arrays (orders, bulk, stages, factory-stats, forecasting, factory-orders, factory-locations, daily-stats, stats, status-breakdown, upcoming-deliveries, cron/check-delays).
  - 6+ UI files: Added BEHIND_SCHEDULE to status color maps across orders, factories, shipment panel, map drawer, shipment list, activity feed.
  - Timeline/Gantt: BEHIND_SCHEDULE in all color maps (amber), horizontal-timeline summary counter, timeline-node formatting.
  - Lib files: alert-generator, digest, notifications, history-utils, pdf/order-report, integrations/transformer, types.
  - `scripts/test-behind-schedule.ts`: Test script verified detection against real DB.
- **Dashboard Redesign:**
  - `dashboard/page.tsx`: New layout — Header → KPIs → Action Required + Alerts → Activity + Order Progress → Orders by Status → Map + Exchange Rates.
  - Removed 11 unused components: quick-actions, upcoming-deliveries, product-portfolio (3 files), factory-performance-section, best-sellers, orders-over-time (3 files), dashboard-empty-state.
  - `action-required.tsx` (NEW): Action Required widget with severity-coded items (critical/warning/attention), AT_RISK computed indicator, count badge.
  - `order-progress-snapshot.tsx` (NEW): Top 8 active orders sorted by nearest delivery, progress bars, days-remaining badges.
  - `app/api/dashboard/action-required/route.ts` (NEW): Returns DISRUPTED/DELAYED/BEHIND_SCHEDULE orders + AT_RISK computed indicator.
  - `app/api/dashboard/order-progress/route.ts` (NEW): Returns active orders for progress widget.
  - `dashboard-stats-cards.tsx`: Sparklines muted to zinc-500, "In Progress" → "Currently in production", activeOrders counts only IN_PROGRESS.
  - `recent-activity-feed.tsx`: Healthy status badges muted to zinc, icons muted.
- **Security: xlsx → ExcelJS swap:**
  - `app/api/orders/export-xlsx/route.ts`: Complete rewrite using ExcelJS (same 3-sheet structure). Removed vulnerable `xlsx` package.
- **Bug fixes:**
  - `next.config.ts`: Fixed Sentry v10 config — replaced deprecated `disableServerWebpackPlugin`/`disableClientWebpackPlugin` with `sourcemaps: { disable: ... }`.
  - `requests/page.tsx`: Fixed `!!request.data.orderNumber` coercion for ReactNode compatibility.
  - `manufacturer-map/map-canvas.tsx`: Added `if (!map.getStyle()) return;` guard in geolocation callback.
  - `manufacturer-map/vehicle-icons.ts`: Double `hasImage()` check before/after async `svgToImage()` to prevent race condition.

**Session 28 changes (Marco):**
- **Tony Stark HUD Visual Enhancements** — Cohesive JARVIS-style command center aesthetic across dashboard:
  - **Consistent Card Backgrounds:** Standardized all dashboard card containers to `dark:bg-[#0d0f13]` + `dark:border-zinc-800/60` + `rounded-xl` across 8 component files (alerts, activity, deliveries, quick actions, factory performance, orders-by-status, product portfolio, exchange rates, best sellers, reorder suggestions). Removed stray `shadow-sm`.
  - **Enhanced card-hover-glow** (`globals.css`): Added `::before` pseudo-element with orange gradient top-border that fades in on hover. Light mode gets subtle 50% opacity; dark mode full intensity.
  - **HUD Section Dividers** (`globals.css`): New `.hud-section-label` class with `::before` orange gradient dot + `::after` fading orange line. Applied to 4 section labels (Overview, Order Health, Product Intelligence, Market & Logistics).
  - **Data Readout Tags:** Added 3-letter monospace tags to card headers matching stat cards' ORD/WIP/CMP pattern: Alerts→`ALT`, Activity→`LOG`, Deliveries→`DLV`, Quick Actions→`CMD`.
  - **Corner Brackets** (`globals.css`): New `.hud-corners` class — L-shaped orange marks at top-left/bottom-right corners, brighten on hover. Light mode: subtle 20%→45% opacity. Dark mode: 40%→80%. Applied to Alerts, Activity, Deliveries, Factory Performance.
  - **Orange Grid Tint** (`page.tsx`): Changed grid overlay from white lines to `rgba(255,77,21,0.3)` — barely visible warmth at `opacity-[0.02]`.
  - **Light Mode Support:** All HUD effects (glow, corners, section dividers) work in light mode with reduced intensity for professional appearance.
- **Factory Map Fix:** `app/api/dashboard/factory-locations/route.ts` — Factory locations query now includes factories with `projectId: null` (unassigned) alongside project-scoped factories. Previously `projectScope()` exact match excluded factories created before project system.

**Session 27 changes (Marco):**
- **Project Selector & Multi-Project Data Isolation** — Full implementation of Project layer between Organization and data:
  - **Schema:** Added `Project` model (`id`, `name`, `slug`, `description`, `color`, `icon`, `isDefault`, `organizationId`, `createdById`). Added nullable `projectId` + relation + index to: Factory, Order, Alert, Conversation, Request, CustomChart, Integration. Added `activeProjectId`/`activeProject` to User.
  - **Auth/Session:** `projectId` and `projectName` added to JWT/session types (`types/next-auth.d.ts`, `lib/auth.ts`). Middleware redirects to `/projects` when no active project.
  - **Onboarding Flow:** `app/(onboarding)/layout.tsx` + `app/(onboarding)/projects/page.tsx`. State machine (`components/projects/project-flow.tsx`): SPLASH → GREETING → PROJECT_SELECT. Animated splash (`splash-screen.tsx`), welcome greeting with quotes (`greeting-screen.tsx`, `lib/quotes.ts`).
  - **Project Selector UI:** `components/projects/project-selector.tsx` — card grid with edit/delete actions for ADMIN/OWNER. `project-card.tsx` — color stripe, counts, pencil/trash icons. `create-project-dialog.tsx` — dual-mode create/edit with color picker. `delete-project-dialog.tsx` — confirmation with error surfacing.
  - **Sidebar Switcher:** `components/layout/project-switcher.tsx` — dropdown with color dots, loading spinner, "Manage Projects" link. Uses `lib/use-projects.ts` (SWR hook).
  - **API Endpoints:** `app/api/projects/route.ts` (GET/POST), `app/api/projects/[id]/route.ts` (GET/PATCH/DELETE), `app/api/user/active-project/route.ts` (PATCH). Delete prevented on default project or projects with orders.
  - **Data Scoping:** Added `projectScope()` helper to `lib/api.ts`. ~40 API routes updated to filter by `projectId`. Factories page server component (`FactoriesTableContent`) fixed to include `projectId` in where clause.
  - **Login/Register:** Login redirects to `/projects?welcome=1`. Registration auto-creates "Default Project" and sets `activeProjectId`.
  - **Migration Script:** `scripts/migrate-default-projects.ts` — creates default project per org, backfills all existing data.
  - **Package:** Added `swr` dependency.
  - **Key pattern:** Project switching uses `window.location.href` for hard navigation (ensures fresh JWT cookie).
  - **Scoping rules:** Factories, orders, alerts, conversations, requests, custom charts, integrations are **project-scoped**. Team members, invitations, presence are **org-scoped** (no change).

**Session 26 changes (Marco):**
- **Animated Count-Up Numbers:**
  - `components/animated-number.tsx` (NEW): Reusable `<AnimatedNumber>` client component using framer-motion `useSpring`. Animates 0 → value on viewport entry via `useInView` (once). Updates DOM directly via ref (not MotionValue-as-children) to avoid SSR hydration mismatch with Radix `useId()`. Supports custom `formatFn` for decimals. Uses `tabular-nums` to prevent layout shift.
  - `dashboard/_components/dashboard-stats-cards.tsx`: 5 KPI cards (Total, Active, Completed, Delayed, Disrupted) use `<AnimatedNumber>`.
  - `analytics/page.tsx`: `SummaryCard` gained optional `numericValue` + `suffix` props. "Avg Lead Time" and "At Risk" animate; "On Track" (fraction) and "Bottleneck Stage" (text) stay plain.
  - `analytics/_components/stage-duration-chart.tsx`: Per-stage avg duration mini-cards animate.
  - `factories/[id]/page.tsx`: 4 factory detail stat cards (Total Orders, Active, On-Time Rate %, Avg Progress %) animate.
  - `factories/factories-table.tsx`: 4 factory list summary cards (Total Factories, Total Orders, Avg Orders/Factory with decimal formatFn, Idle Factories) animate.
  - `team/page.tsx`: 4 team stat cards (Total Members, Owners, Admins, Members) animate.
  - `orders/[id]/page.tsx`: Order quantity hero card animates.
  - `timeline/page.tsx`: 4 stats strip cards (Total, In Progress, Critical, Done) animate.
- **Exchange Rate Tooltip Fix:**
  - `dashboard/_components/exchange-rate-cards.tsx`: Removed broken `<Tooltip trigger="none" />` from sparkline AreaCharts — was showing raw values on hover despite `trigger="none"` (recharts typing issue). Also removed unused `Tooltip` import.

**Session 25 changes (Filip):**
- **Full Messages Page** — WhatsApp-grade messaging experience at `/messages`:
  - **Schema:** Renamed `manualStatus` → `status` in UserPresence model (APIs already used `status`)
  - **Types:** Added `DIRECT` to ConversationType, `forwardedFromId`/`forwardedFrom`/`pinnedAt` to Message type
  - **Conversations API:** Added DIRECT type support with duplicate DM prevention
  - **Packages:** `@emoji-mart/react`, `@emoji-mart/data`, `wavesurfer.js`, `@tanstack/react-virtual`
  - **5 New API endpoints:**
    - `app/api/conversations/[id]/messages/[messageId]/replies/route.ts` — Thread replies (GET + POST)
    - `app/api/messages/search/route.ts` — Global message search (paginated, org-scoped)
    - `app/api/conversations/[id]/messages/search/route.ts` — In-conversation search
    - `app/api/messages/forward/route.ts` — Forward to multiple conversations
    - `app/api/presence/manual/route.ts` — Manual presence override (PATCH)
  - **3 New hooks:** `lib/use-forward.ts`, `lib/use-voice-recorder.ts`, updated `lib/use-presence.ts`
  - **17 New components in `components/messages/`:**
    - `messages-page.tsx` — Client orchestrator (3-column layout, state management)
    - `conversation-sidebar.tsx` — Filter tabs, presence dots, pinned conversations
    - `chat-header.tsx` — Conversation info, presence, search/settings
    - `message-list.tsx` — Virtualized with @tanstack/react-virtual, auto-scroll, date separators
    - `message-bubble.tsx` — Own/others/system styles, forwarded header, reactions, hover actions
    - `message-input.tsx` — Auto-grow textarea, attachments, emoji, mic, edit mode
    - `date-separator.tsx`, `typing-indicator.tsx`
    - `emoji-picker-popover.tsx` — Lazy-loaded emoji-mart picker
    - `voice-recorder-ui.tsx` — Live waveform, duration timer, cancel/send
    - `voice-message-player.tsx` — wavesurfer.js waveform, play/pause, speed cycle
    - `thread-panel.tsx` — 360px slide-in with replies
    - `search-panel.tsx` — In-conversation + global search
    - `message-context-menu.tsx` — Reply/Edit/Delete/Forward/Pin/Copy
    - `forward-dialog.tsx` — Multi-select target conversations
    - `new-dm-dialog.tsx` — Search team members, create DM
    - `media-lightbox.tsx` — Full-screen image viewer
  - **Navigation:** Added Messages item to sidebar with unread badge
  - **New UI component:** `components/ui/popover.tsx` (Radix Popover)
  - **Stress test:** Updated to 38 endpoints, all passing (100% success rate)
  - Build clean (`npx tsc --noEmit` + `npx next build` pass)

**Session 25 changes (Marco):**
- **Request/Approval Message Cards in Chat:**
  - `app/api/conversations/[id]/route.ts`: Added `request: { select: { id, type, status } }` to Prisma include so conversation detail returns linked request info.
  - `lib/use-conversations.ts`: Added `request: { id: string; type: string; status: string } | null` to `Conversation` type.
  - `components/messages/message-item.tsx`: REQUEST messages render as orange-tinted cards with FileText icon + "View Request" button. APPROVAL messages render as color-coded status cards (green/red/amber for APPROVED/REJECTED/PENDING_INFO) with matching icons + badges. Both link to `/requests?rid=<requestId>` for deep-link.
  - `components/messages/messages-thread.tsx`: Passes `requestId` prop from `conversation.request?.id` to `<MessageItem>`.
- **Request Details Expansion (all statuses):**
  - `app/(dashboard)/requests/page.tsx`: Every request card is now clickable (full header is a `<button>`) to expand/collapse details — not just pending-review requests. Chevron icon always visible. Supports `?rid=` query param to auto-expand + scroll to a specific request on page load.
- **Edit Request Change Filtering:**
  - `app/api/requests/route.ts`: ORDER_EDIT_REQUEST and FACTORY_EDIT_REQUEST creation now compares submitted fields against current entity values. Only actually changed fields are stored in `changes`, and original values are snapshotted in `data._previousValues` for reliable before/after diffs even after approval.
  - `app/(dashboard)/requests/page.tsx` (`EditRequestDetails`): Always fetches live entity to filter unchanged fields from display. Uses `_previousValues` for "Before" column when available. Shows loading placeholder while fetching to prevent layout flash.

**Session 24 changes (Marco):**
- **Task 5.27** — Request-to-Chat Integration:
  - `app/api/requests/route.ts`: POST now auto-creates a SUPPORT conversation after request creation. Participants = requester + all ADMIN/OWNER users. Sends a REQUEST-type message summarising the request. Links `conversationId` back to the request. Non-fatal try/catch so request creation never fails due to chat errors.
  - `app/api/requests/[id]/route.ts`: Added `sendConversationMessage()` helper. Sends messages on three events: (1) requester responds to NEEDS_INFO → TEXT message with response text; (2) admin REJECTS or needs info → APPROVAL message with REJECTED/PENDING_INFO action; (3) admin APPROVES → APPROVAL+APPROVED message inside the same DB transaction.
  - `app/(dashboard)/requests/page.tsx`: Added `conversationId` to `RequestItem` interface. Added "Chat" link button (MessageSquare icon) that appears on any request with a conversationId, linking to `/messages?cid=<id>`.
  - `app/(dashboard)/messages/page.tsx`: Added `useSearchParams` — reads `?cid=` query param and auto-selects that conversation on page load.

**Session 23 changes (Marco):**
- **Task 6.8** — Redis Setup: Upstash Redis connected via ioredis (`lib/redis.ts`, `REDIS_URL` in `.env`)
- **Task 6.9** — BullMQ job queue: `lib/queues/connection.ts`, `lib/queues/integration-queue.ts`, `lib/workers/integration-worker.ts`
- **Task 6.10** — Integration Manager: `Integration` Prisma model added + pushed to DB, `lib/integrations/manager.ts`, `lib/integrations/types.ts`. Also fixed DB connection: `DIRECT_URL` added for Prisma CLI, `DATABASE_URL` uses Transaction mode pooler (port 6543)
- **Task 6.11** — Credential Encryption: AES-256-GCM via Node crypto, `lib/integrations/encryption.ts`, `ENCRYPTION_KEY` in `.env`
- **Task 6.12** — REST Adapter: `lib/integrations/adapters/rest-adapter.ts` with auth (bearer/basic/api_key), field mapping, status mapping, stage sync
- **Task 6.13** — Mock Factory API: `app/api/mock-factory/orders/route.ts` with 5 realistic orders, auth validation, dev-only
- **Task 7.7** — SFTP Adapter: `lib/integrations/adapters/sftp-adapter.ts` with password/private-key auth, CSV/JSON file download
- **Task 7.8** — CSV Parser: `lib/integrations/csv-parser.ts` — RFC 4180 compliant, auto-detects delimiter, handles quoted fields/BOM/Windows line endings, includes `toCsv()` for exports
- **Task 7.9** — Webhook Receiver: `app/api/webhooks/[factoryId]/route.ts` with HMAC-SHA256 signature verification, `lib/integrations/adapters/webhook-adapter.ts`
- **Task 7.10** — Data Transformer: `lib/integrations/transformer.ts` — centralised field mapping, status mapping lookup tables, `transformRecords()` + `applyToDb()`. Removed all duplicated mapping code from adapters.
- **Task 7.11** — Sync Scheduler: `app/api/cron/sync-integrations/route.ts` — Vercel Cron every 15 min, per-integration frequency check, enqueues BullMQ jobs

**Next task:** Week 7 PR or Week 8

**Session 22 changes (Marco):**
- **Scroll-Reveal Animations** — Replaced Tailwind `animate-in` classes on dashboard with scroll-triggered framer-motion animations. New reusable `components/scroll-reveal.tsx` client component using `whileInView` + `onViewportEnter`. Adapts animation duration/delay to scroll velocity (fast scroll = near-instant). Staggered child animations for grid sections (cards wave in individually). Viewport trigger at 5% visibility, animates once.

**Session 21 changes (Marco):**
- **Task 5.23** — Request Database Models: `Request` model with `RequestType` and `RequestStatus` enums, relations to User (requester/reviewer), Order, Factory, Conversation. Prisma schema updated.
- **Task 5.24** — Order Request Form: `app/(dashboard)/orders/request/page.tsx` for clients to submit new order requests, `app/(dashboard)/orders/[id]/request-edit/page.tsx` for edit requests with change reasons.
- **Task 5.25** — Factory Request Form: `app/(dashboard)/factories/request/page.tsx` for new factory requests, `app/(dashboard)/factories/[id]/request-edit/page.tsx` for edit requests.
- **Task 5.26** — Request Review UI: Dual-purpose `/requests` page — admins see all requests with approve/reject/request-info controls, non-admins see their own requests with respond panel. Edit request review shows before→after diff table (changed fields only). Full request-info loop: admin requests info → requester responds → back to PENDING. `app/api/requests/[id]/route.ts` (GET/PATCH) with transactional approval execution and error handling for unique constraints/missing records.
- **Task 5.28** — Role-Based Create Buttons: Conditional "Add Order"/"Add Factory" vs "Request Order"/"Request Factory" buttons based on user role across factory and order list/detail pages. Delete request dialog component.
- **Order Deletion** — Added `DELETE /api/orders/[id]` for ADMIN/OWNER with confirmation dialog on order detail page.
- **Auth Resilience** — JWT callback now refreshes `organizationId` and `organizationName` from DB (not just role), wrapped in try/catch for graceful degradation when DB is unavailable.
- **Sidebar** — Added "Requests" nav item (ClipboardList icon) between Team and Settings.

**Previous sessions:**
- Session 20 (Marco): Tasks 5.8–5.13 (Email notifications, weekly digest, notification settings)
- Session 20 (Filip): Tasks 5.18–5.22 (Chat system: DB models, API backend, UI, messages page, unread badge)
- Session 18: Tasks 5.1-5.6 (Full alert system, pushed). Stress test: 25/25 endpoints.

**Next task:** Week 7 PR or Week 8

## Plugins

Installed (user-level, available across all projects):
- **frontend-design** — Production-grade frontend interface generation
- **code-review** — PR code review
- **feature-dev** — Guided feature development
- **superpowers** — Parallel agents, TDD, systematic debugging, planning, brainstorming, verification
- **MCP: db** — PostgreSQL database access (Supabase) via `mcp__db__execute_sql` and `mcp__db__search_objects`

## Reference Files

| File | Contents |
|------|----------|
| `docs/SESSION_HISTORY.md` | Detailed session-by-session work log (Sessions 1-16) |
| `docs/plans/PENDING_IMPLEMENTATIONS.md` | Ready-to-implement plans (timeline redesign, card enlargement) |
| `docs/tasks/TASK_LIST.md` | Complete task breakdown by week (Weeks 1-12) |
| `docs/plans/TECHNICAL_IMPLEMENTATION_PLAN.md` | Full technical architecture + Phase 4 specs |
| `prisma/schema.prisma` | Database schema |
| `components/gantt/` | Gantt chart components (gantt-chart.tsx, gantt-utils.ts) |

## Commands

```bash
npm run dev                  # Start dev server
npx prisma generate          # Regenerate Prisma client
npx prisma db push           # Push schema to database
npx prisma studio            # View database in browser
pkill -f "next dev"          # Kill stuck dev server
node scripts/stress-test.js  # Run stress tests (38 endpoints)
```

## How to Resume

Say "start where we left off" — check Current Status above, then `docs/tasks/TASK_LIST.md` for next task.
