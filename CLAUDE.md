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
- **Charts:** Recharts | **DnD:** @dnd-kit | **Deployment:** Vercel

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

## Current Status (Session 16 — Feb 13, 2026)

**Last completed:** Tasks 4.8–4.11 (Timeline/Gantt chart page with filters, critical path highlighting, zoom controls)

**Session 16 changes:**
- **Task 4.8** — Timeline View Page: `/timeline` route with SVG Gantt chart (`components/gantt/`), sidebar nav item, API `include=stages` param
- **Task 4.9** — Timeline Filters: status, factory, priority dropdowns + date range (month pickers), active filter count badge
- **Task 4.10** — Critical Path Highlighting: risk detection (critical/at-risk), red/amber row tinting, overdue striped extensions, legend
- **Task 4.11** — Timeline Zoom Controls: 5 presets (Month→Detail), +/− buttons, scroll-position-preserving zoom, `pixelsPerDay` parameterized throughout utils
- **Sound notification hook** added to `~/.claude/settings.json` (Glass.aiff on all notifications)

**Next task:** Task 4.12 (Export Timeline Image) OR Task 3.6 (Week 3 PR) OR BL-1 (Project Selector)

**Pending implementations** (ready but not started):
- Timeline redesign plan → `docs/plans/PENDING_IMPLEMENTATIONS.md`
- Card enlargement plan → `docs/plans/PENDING_IMPLEMENTATIONS.md`
- Project Selector (BL-1) → `.claude/plans/reactive-scribbling-island.md`

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
