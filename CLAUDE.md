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

## Current Status (Session 17 — Feb 13, 2026)

**Last completed:** Task 4.12 (Export Timeline Image), dashboard design polish (on `dashboard-redesign` branch)

**Session 17 changes:**
- **Task 4.12** — Export Timeline PNG: `html-to-image` library, export button next to zoom controls, full-timeline capture at 2x resolution. **Known issue:** exports full timeline instead of visible viewport — fix planned for next session.
- **Dashboard redesign** (on `dashboard-redesign` branch, not merged): stats card value enlargement + icon pills, disrupted card accent glow, hover float + orange glow on all cards, frosted glass tooltips, light/dark/system mode support, portfolio chart tooltip z-index fix
- **Plugin cleanup**: removed `serena` and `typescript-lsp` plugins (missing dependencies)

**Next task:** Fix timeline export to capture visible viewport only, then Task 3.6 (Week 3 PR) OR BL-1 (Project Selector)

**Pending implementations** (ready but not started):
- Timeline export viewport-only capture (replace full-timeline export)
- Timeline redesign plan → `docs/plans/PENDING_IMPLEMENTATIONS.md`
- Card enlargement plan → `docs/plans/PENDING_IMPLEMENTATIONS.md`
- Project Selector (BL-1) → `.claude/plans/reactive-scribbling-island.md`
- Dashboard redesign merge (on `dashboard-redesign` branch)

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
