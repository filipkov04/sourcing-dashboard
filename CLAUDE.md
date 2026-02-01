# SourceTrack - Sourcing Dashboard

## Project Overview

A web dashboard for fashion/manufacturing brands to track real-time production status from all their factories without sending emails. Think Shopify for production tracking.

**Repository:** https://github.com/filipkov04/sourcing-dashboard
**Developers:** Filip & Marco
**Timeline:** 8 weeks (currently in Week 2)

---

## Tech Stack

- **Framework:** Next.js 16 with App Router and Turbopack
- **Language:** TypeScript
- **Database:** PostgreSQL on Supabase
- **ORM:** Prisma 7
- **Auth:** NextAuth.js v5
- **Styling:** Tailwind CSS 4 with dark theme
- **UI Components:** shadcn/ui (Radix primitives)
- **Charts:** Recharts
- **Deployment:** Vercel

---

## Project Structure

```
app/
├── (dashboard)/           # Protected dashboard routes
│   ├── dashboard/         # Main dashboard with stats & charts
│   ├── factories/         # Factory management (CRUD)
│   ├── orders/            # Order management (CRUD)
│   │   ├── [id]/          # Order detail & edit
│   │   └── new/           # Create order
│   ├── team/              # Team management (future)
│   └── settings/          # User settings (future)
├── api/                   # API routes
│   ├── auth/              # NextAuth endpoints
│   ├── factories/         # Factory CRUD API
│   └── orders/            # Order CRUD API
│       └── [id]/stages/   # Stage progress API
├── login/                 # Auth pages
└── register/

components/
├── layout/                # AppLayout, Sidebar, Header
├── ui/                    # shadcn/ui components
└── providers/             # Session provider

lib/
├── auth.ts                # NextAuth config
├── db.ts                  # Prisma client
├── api.ts                 # API response helpers
└── types.ts               # TypeScript types

prisma/
└── schema.prisma          # Database schema
```

---

## Database Schema (Key Models)

### Organization
Multi-tenant: each org has its own factories, orders, users.

### User
- Roles: OWNER, ADMIN, MEMBER, VIEWER
- Belongs to one Organization

### Factory
- name, location, address
- Contact info (name, email, phone)
- Has many Orders

### Order
- orderNumber, productName, productSKU
- quantity, unit (pieces, meters, kg)
- status: PENDING | IN_PROGRESS | DELAYED | DISRUPTED | COMPLETED | SHIPPED | DELIVERED | CANCELLED
- priority: LOW | NORMAL | HIGH | URGENT
- orderDate, expectedDate, actualDate
- overallProgress (0-100, auto-calculated from stages)
- Has many OrderStages

### OrderStage
- name (e.g., "Cutting", "Sewing", "QC")
- sequence (1, 2, 3...)
- progress (0-100)
- status: NOT_STARTED | IN_PROGRESS | COMPLETED | SKIPPED | DELAYED | BLOCKED
- startedAt, completedAt
- notes (for explaining delays/blocks)

---

## Status System

### Order Status (Auto-Updated)
Order status automatically updates based on stage statuses:
1. **DISRUPTED** - Any stage is BLOCKED (red)
2. **DELAYED** - Any stage is DELAYED (orange)
3. **COMPLETED** - All stages COMPLETED or SKIPPED
4. **PENDING** - All stages NOT_STARTED with 0% progress
5. **IN_PROGRESS** - Any stage has progress

Only active orders (PENDING, IN_PROGRESS, DELAYED, DISRUPTED) get auto-updated.
Manual statuses (SHIPPED, DELIVERED, CANCELLED) are not overwritten.

### Stage Status
- **NOT_STARTED** (gray) - 0% progress
- **IN_PROGRESS** (blue) - 1-99% progress
- **COMPLETED** (green) - 100% progress
- **SKIPPED** (gray) - Stage skipped
- **DELAYED** (orange) - Behind schedule but still working
- **BLOCKED** (red) - Production completely stopped

When status changes to NOT_STARTED → progress auto-sets to 0%
When status changes to COMPLETED → progress auto-sets to 100%

---

## UI Theme

**Dark theme by default:**
- Main background: `zinc-900`
- Sidebar/Header: `zinc-800` with `zinc-700` borders
- Cards/Tables: `zinc-800` with `zinc-700` borders
- Text: white for headings, `zinc-300/400` for body
- Inputs: `zinc-800` background, `zinc-100` text

**Status Colors:**
- PENDING: yellow-100/yellow-800
- IN_PROGRESS: blue-100/blue-800
- DELAYED: orange-100/orange-800
- DISRUPTED: red-100/red-800
- COMPLETED: green-100/green-800

---

## Completed Tasks (Week 1-2)

### Week 1 - Foundation
- [x] 1.1 Project Setup (Next.js, dependencies)
- [x] 1.2 Database Design (Prisma schema)
- [x] 1.3 Shared Types
- [x] 1.4 Authentication (NextAuth)
- [x] 1.5 Layout & Navigation (Sidebar, Header)
- [x] 1.6 API Helpers
- [x] 1.7-1.10 Factory Management (list, API, create form)
- [x] 1.11-1.14 Order Management (list, API, create form)

### Week 2 - Detail Pages & Editing
- [x] 2.6 Order Detail Page (full info, stage progress)
- [x] 2.7 Order Edit Form
- [x] 2.8 Stage Progress Update (slider, status, notes - admin only)
- [ ] 2.9 Order Timeline (showing history of changes)
- [ ] 2.1-2.5 Factory detail/edit/delete (Filip's tasks)

### Additional Implementations
- [x] Dark theme throughout the app
- [x] DISRUPTED order status for blocked stages
- [x] Auto-update order status from stages
- [x] Clickable order rows in list
- [x] Order summary bar chart on dashboard (Total, Pending, In Progress, Delayed, Disrupted)
- [x] DELAYED color changed from yellow to orange for distinction

---

## Current Sprint Focus

**Marco's Tasks:**
- Order detail page enhancements
- Stage progress tracking with delayed/blocked states
- Order timeline view

**Filip's Tasks:**
- Factory detail page
- Factory edit/delete
- Dashboard improvements

---

## API Patterns

### Response Format
```typescript
// Success
{ success: true, data: {...}, message?: "..." }

// Error
{ success: false, error: "Error message" }
```

### Route Handler Pattern (Next.js 16)
```typescript
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params; // params is a Promise in Next.js 16
  // ...
}
```

---

## Important Conventions

1. **Prisma Client:** Always regenerate after schema changes
   ```bash
   npx prisma generate
   ```

2. **Dev Server:** Restart after Prisma changes
   ```bash
   npm run dev
   ```

3. **Stage Updates:** Admin-only feature (Week 5 will add role checks)
   - Clients can view but not edit stage progress
   - Role-based access control planned for Task 5.28

4. **Git Commits:** Include Co-Authored-By for Claude

---

## Known Issues / TODOs

- [ ] Table text needs explicit colors for dark theme visibility
- [ ] Production stages styling was changed - may need review
- [ ] Role-based access control (Week 5)
- [ ] Email notifications (Week 5)
- [ ] Factory integrations (Weeks 6-8)

---

## Documentation Files

- `docs/plans/TECHNICAL_IMPLEMENTATION_PLAN.md` - Full technical architecture
- `docs/tasks/TASK_LIST.md` - Complete task breakdown by week
- `prisma/schema.prisma` - Database schema

---

## Session History

### Session 1 (Current)
- Completed Task 2.6, 2.7, 2.8
- Added DELAYED/BLOCKED stage statuses with color indicators
- Added DISRUPTED order status
- Made order rows clickable in list
- Implemented auto-update of order status based on stages
- Changed dashboard line chart to bar chart (Order Summary)
- Changed DELAYED color from yellow to orange
- Implemented full dark theme
- Fixed text visibility issues in tables

---

## Commands Reference

```bash
# Start dev server
npm run dev

# Regenerate Prisma client
npx prisma generate

# Push schema changes to database
npx prisma db push

# View database in browser
npx prisma studio

# Kill stuck dev server
pkill -f "next dev"
```

---

## Contact

For questions about this project, refer to the technical implementation plan or ask the development team (Filip & Marco).
