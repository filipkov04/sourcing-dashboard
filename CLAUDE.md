# SourceTrack - Sourcing Dashboard

## Project Overview

Web dashboard for fashion/manufacturing brands to track real-time production status from all their factories. Think Shopify for production tracking.

**Repo:** https://github.com/filipkov04/sourcing-dashboard
**Developers:** Filip & Marco | **Timeline:** 12 weeks (currently Week 3 of 8 core + 4 planned)

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Language:** TypeScript
- **Database:** PostgreSQL on Supabase | **ORM:** Prisma 7
- **Auth:** NextAuth.js v5
- **Styling:** Tailwind CSS 4 (dark theme default) | **UI:** shadcn/ui (Radix)
- **Charts:** Recharts | **DnD:** @dnd-kit | **Export:** html-to-image | **Deployment:** Vercel

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

## Status System

**Order Status** (auto-updated from stages): PENDING | IN_PROGRESS | DELAYED | DISRUPTED | COMPLETED | SHIPPED | DELIVERED | CANCELLED

**Stage Status:** NOT_STARTED | IN_PROGRESS | COMPLETED | SKIPPED | DELAYED | BLOCKED

Auto-rules: Any BLOCKED stage → order DISRUPTED. Any DELAYED stage → order DELAYED. All COMPLETED/SKIPPED → order COMPLETED. Manual statuses (SHIPPED, DELIVERED, CANCELLED) are never overwritten.

## Current Status (Session 23 — Feb 21, 2026)

**Last completed:** Tasks 6.8–6.13 + 7.7–7.11 (Full integration backend)

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

**Next task:** 7.12 (Week 7 PR) or Week 8

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

**Next task:** Task 5.27 (Request-to-Chat Integration) OR Week 5 PR OR BL-1 (Project Selector)

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
node scripts/stress-test.js  # Run stress tests (17 endpoints)
```

## How to Resume

Say "start where we left off" — check Current Status above, then `docs/tasks/TASK_LIST.md` for next task.
