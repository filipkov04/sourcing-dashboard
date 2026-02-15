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

## Current Status (Session 20 — Feb 15, 2026)

**Last completed:** Tasks 5.8–5.13 (Email notifications, weekly digest, notification settings)

**Session 20 changes (Marco):**
- **Tasks 5.8–5.11** — Email infrastructure (Resend), order status/delay/disruption notification emails with styled HTML templates. `lib/email.ts` (Resend client + EmailLog), `lib/notifications.ts` (status change emails to OWNER/ADMIN users)
- **Task 5.12** — Weekly digest email: `lib/digest.ts` aggregates 7-day stats (orders created/completed/delayed/disrupted, active count, recent events), sends styled HTML summary. Cron endpoint at `app/api/cron/weekly-digest/route.ts` protected by `CRON_SECRET`. `vercel.json` configured for Mondays 9am UTC.
- **Task 5.13** — Notification settings: `NotificationPreference` Prisma model (4 boolean toggles per user), `app/api/settings/notifications/route.ts` (GET/PATCH), Settings page at `/settings` with toggle switches. Notifications respect user preferences before sending.
- **Middleware update**: Added `/api/cron/` to public routes in `middleware.ts`

**Session 20 changes (Filip):**
- **Task 5.20** — Chat API Backend: 6 API routes for conversations (list, create, get detail, send message, mark read, unread count). Full org scoping, VIEWER role checks, Zod validation, transactional unread count tracking.
- **Task 5.19** — Chat UI Component: Split-panel /messages page (conversation list + chat panel), new conversation dialog with order/factory linking, participant search, polling (5s chat, 10s list, 30s badge).
- **Sidebar** — Added "Messages" nav item with unread badge between Team and Settings.
- **Hooks** — lib/use-conversations.ts with useConversations, useConversationDetail, useMessageUnreadCount, sendMessage, createConversation.

**Previous sessions:**
- Session 19: Task 5.18 (Chat Database Models)
- Session 18: Tasks 5.1-5.6 (Full alert system, pushed). Stress test: 25/25 endpoints.

**Next task:** Task 5.21 (Chat List Page — already covered by /messages) OR Task 5.22 (Unread Message Badge — already covered by sidebar) OR Week 5 PR OR BL-1 (Project Selector)

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
