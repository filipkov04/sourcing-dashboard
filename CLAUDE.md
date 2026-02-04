# SourceTrack - Sourcing Dashboard

## 🎯 Current Status & Next Steps

**Last Updated:** February 4, 2026 - Session 4

**Current Week:** Week 2 of 8

**Completed Today (Session 4):**
- ✅ Task 2.1: Factory Detail Page
- ✅ Task 2.2: Factory Edit Form (completed in parallel window)
- ✅ Task 2.3: Factory Delete with confirmation
- ✅ Task 2.4: Factory Search/Filter with advanced options
- ✅ Added page transition animations (slide effect)
- ✅ Added smart loading screen (logo + progress bar)

**Next Task:** Task 2.5 - Create Pull Request for Week 2 Factory Work

**How to Continue:**
When starting next session, say: "Continue with Task 2.5" or "Start where we left off"

**Week 2 Progress:**
- Filip's Tasks: 4/5 complete (2.1, 2.2, 2.3, 2.4 ✅ | 2.5 ⏳)
- Marco's Tasks: 3/4 complete (2.6, 2.7, 2.8 ✅ | 2.9 ⏳)

---

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
- **Drag & Drop:** @dnd-kit (core, sortable, utilities)
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
├── providers/             # Session provider
├── sortable-stage-item.tsx    # Draggable stage row component
└── sortable-stage-list.tsx    # DnD container for stage reordering

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
- [x] 2.1 Factory Detail Page (full info, orders list, clickable rows)
- [x] 2.2 Factory Edit Form (pre-filled form, validation, dark theme)
- [x] 2.3 Factory Delete (confirmation dialog, prevents deletion with orders)
- [x] 2.4 Factory Search/Filter (advanced filters, sorting, clear button)
- [ ] 2.5 Factory PR Week 2 (Filip's remaining task)

### Additional Implementations
- [x] Dark theme throughout the app
- [x] DISRUPTED order status for blocked stages
- [x] Auto-update order status from stages
- [x] Clickable order rows in list
- [x] Order summary bar chart on dashboard (Total, Pending, In Progress, Delayed, Disrupted)
- [x] DELAYED color changed from yellow to orange for distinction
- [x] Drag-and-drop stage reordering in order forms (new & edit)

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

### Session 1
- Completed Task 2.6, 2.7, 2.8
- Added DELAYED/BLOCKED stage statuses with color indicators
- Added DISRUPTED order status
- Made order rows clickable in list
- Implemented auto-update of order status based on stages
- Changed dashboard line chart to bar chart (Order Summary)
- Changed DELAYED color from yellow to orange
- Implemented full dark theme
- Fixed text visibility issues in tables

### Session 2 (Continuation)
- Fixed text visibility across all pages:
  - Updated factory form inputs with bg-zinc-800, text-zinc-100, placeholder-zinc-500
  - Updated factories table skeleton to dark theme
  - Fixed remaining bg-gray colors in orders page progress bar
  - Updated error messages in orders/new, orders/[id]/edit, and factories/new to dark theme
  - Fixed expandable notes section in order detail for delayed/blocked stages
  - Fixed quick set button colors in order detail page
  - Updated factory table icon backgrounds from bg-blue-50 to bg-blue-900/30
  - Updated dashboard empty state icon background
  - Fixed chart tooltip text visibility (added itemStyle with white text color to both bar chart and pie chart tooltips)

### Session 3
- Implemented drag-and-drop stage reordering using @dnd-kit:
  - Created `SortableStageItem` component with drag handle (GripVertical icon)
  - Created `SortableStageList` container with DndContext and sensors
  - Updated order edit page (`/orders/[id]/edit`) to use sortable stages
  - Updated new order page (`/orders/new`) to use sortable stages
  - Supports mouse, touch, and keyboard navigation (Tab, Space, Arrow keys)
  - Sequence numbers auto-update when stages are reordered

### Session 4
- Completed Task 2.1: Factory Detail Page
  - Created API endpoint `/api/factories/[id]/route.ts` (GET factory with orders)
  - Created factory detail page at `/app/(dashboard)/factories/[id]/page.tsx`
  - Displays factory information (name, location, address, contact details)
  - Shows all orders from the factory in a table with status, priority, and progress
  - Clickable order rows navigate to order detail page
  - Added edit button linking to factory edit form (Task 2.2)
  - Updated factories list table to make entire rows clickable
  - Removed redundant "View" button from factories table actions
  - Updated factory icon background to dark theme (`bg-blue-900/30`)

- Completed Task 2.2: Factory Edit Form
  - Added PATCH endpoint to `/api/factories/[id]/route.ts` for updating factories
  - Created factory edit page at `/app/(dashboard)/factories/[id]/edit/page.tsx`
  - Form pre-fills with existing factory data
  - Updates all factory fields (name, location, address, contact info)
  - Includes validation and error handling
  - Full dark theme styling consistent with app design
  - Redirects to factory detail page after successful update
  - DELETE endpoint automatically added by linter (will be used for Task 2.3)

- Completed Task 2.3: Factory Delete
  - Added DELETE endpoint to `/api/factories/[id]/route.ts`
  - Prevents deletion if factory has existing orders (shows helpful error message)
  - Added delete confirmation dialog in factories table
  - Added delete button with confirmation dialog in factory detail page
  - Shows loading state during deletion
  - Error handling with user-friendly messages
  - Redirects to factories list after successful deletion from detail page
  - Refreshes list after deletion from table

- Completed Task 2.4: Factory Search/Filter
  - Enhanced search to include email in search queries
  - Added order count filter (All, No Orders, Has Orders, 5+ Orders)
  - Added sorting options (Name A-Z/Z-A, Most/Least Orders, Newest/Oldest)
  - Clear search button (X icon) in search input
  - "Clear All" button when filters are active
  - Active filters indicator showing applied filters as badges
  - Improved UX with visual feedback for active filters
  - Responsive design with proper mobile layout

- Added Page Transition Animations
  - Installed framer-motion for smooth animations
  - Created PageTransition component with slide effect
  - Created PageLoader component with logo and progress bar
  - Smart loading: Only shows loader if page takes > 200ms to load
  - Fast navigation shows slide transition only
  - Slow navigation shows loading screen with logo
  - Improved overall user experience with smooth animations

### Session 5 (Current)
- Redesigned Dashboard Charts (Modern Analytics Style)
  - Updated stats cards to clean white background with dark mode support
  - Created stacked area chart for order trends (last 12 weeks)
  - Created horizontal bar chart for orders by status breakdown
  - Applied Stripe/Shopify-inspired clean design system
  - All charts use mock data initially (later connected to real data)

- Implemented Complete Dark/Light Mode System
  - Created `ThemeProvider` with React Context for theme management
  - Supports 3 modes: Light, Dark, System (follows device preference)
  - Theme persists to localStorage
  - System mode updates live when device theme changes
  - Created `ThemeToggle` dropdown component (Sun/Moon/Monitor icons)
  - Added to header for easy access
  - Updated `app/layout.tsx` with suppressHydrationWarning for proper SSR

- Fixed Light Mode Visibility Issues
  - **Root cause**: `app/globals.css` :root selector had dark theme colors
  - Fixed CSS variables for light mode:
    - --background: dark → white `oklch(1 0 0)`
    - --foreground: white → dark `oklch(0.09 0 0)`
    - --popover: dark → white
    - --popover-foreground: white → dark
    - --muted-foreground: adjusted for better contrast
  - Fixed white text on white background in Select dropdowns
  - Updated 160+ color classes across factories and orders pages
  - Applied pattern: `text-gray-900 dark:text-white`, `bg-white dark:bg-zinc-800`
  - Used sed commands for batch replacements across 4 page files
  - Fixed `factories-table.tsx` component individually
  - All components now support both themes properly

- Connected Dashboard to Real Database Data
  - **Created 3 new API endpoints:**
    - `/api/dashboard/stats` - Returns aggregated statistics
      - Total orders, active orders, completed orders
      - Delayed orders, disrupted orders
      - Average progress across all orders
      - Trend calculations (last 30 days vs previous 30 days)
    - `/api/dashboard/trends` - Returns order trends over time
      - Groups orders by week for last 12 weeks
      - Breaks down by status (Pending, In Progress, Completed, Delayed, Disrupted)
      - Formats data for area chart visualization
    - `/api/dashboard/status-breakdown` - Returns orders by status
      - Uses Prisma groupBy for efficient aggregation
      - Calculates count and percentage for each status
      - Includes color mapping for chart visualization

  - **Updated Frontend Components:**
    - `dashboard-stats-cards.tsx`: Fetches real stats, shows loading skeleton, displays trends
    - `orders-trend-section.tsx`: Fetches 12-week trend data with loading state
    - `orders-by-status-section.tsx`: Fetches status breakdown with loading state
    - Updated `OrderTrendData` type to include delayed/disrupted fields
    - All components handle loading and error states gracefully

  - **Data Architecture:**
    - Organization-scoped: Each org only sees their own data
    - Real-time calculations from database
    - Supports current manual data entry system
    - Prepared for future factory system API integrations
    - Auto-updates when orders/stages change

- Fixed Technical Issues
  - Fixed hydration mismatch error from Radix UI ID generation
  - Added `suppressHydrationWarning` to body element in layout
  - Fixed sidebar JSX fragment closing tag
  - Fixed API import pattern: changed from `apiResponse` object to `* as api`
  - Cleared Next.js cache and restarted dev server for clean build

- **Commit:** `92492b2` - "Implement dark/light mode system and connect dashboard to real data"
  - 34 files changed, 1,510 insertions(+), 400 deletions(-)
  - Pushed to GitHub successfully

**Key Technical Decisions:**
- Theme: React Context + localStorage + window.matchMedia for system detection
- Charts: Recharts library with theme-aware colors via useTheme hook
- API: Standard REST endpoints with organization-based filtering
- Data Flow: Frontend fetches from API → API queries Prisma → Real-time aggregation
- Future-ready: Architecture supports both manual entry and automated integrations

**Current State:**
- Dashboard fully functional with real data
- Dark/light/system mode working across entire app
- All visibility issues resolved
- Loading states and error handling implemented
- Dev server running on http://localhost:3000

**Next Steps (for tomorrow):**
- Consider adding refresh button to dashboard
- Add date range filter for trend chart
- Implement caching strategy for dashboard data
- Continue with Week 2 tasks (Order Timeline 2.9)

---

## 📋 Quick Start Guide for New Sessions

### Starting a New Session:
1. Say: **"Start where we left off"** or **"Continue from CLAUDE.md"**
2. Claude will check the "Current Status" section (top of this file)
3. Claude will continue with the next pending task or suggested improvements

### Checking Progress:
- **Current Status** section (top of file) shows latest work and next steps
- **Session History** section (below) has detailed work log
- **Completed Tasks** section shows all finished features
- `docs/tasks/TASK_LIST.md` has full task breakdown by week

### Common Resumption Phrases:
- "Start where we left off" → Continue from Current Status
- "What's next?" → Show next pending task
- "Show progress" → Display completed vs pending tasks
- "Work on Task X.X" → Start specific task
- "Push to git" → Commit and push changes

### Important Files to Reference:
- **CLAUDE.md** (this file) - Session context, progress, decisions
- **docs/tasks/TASK_LIST.md** - Week-by-week task breakdown
- **docs/plans/TECHNICAL_IMPLEMENTATION_PLAN.md** - Architecture details

### Task Status Symbols:
- ✅ = Completed
- 🔄 = In Progress
- ⏳ = Not Started

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

### Session 6 - UI Responsiveness & Spacing Fixes
- **Comprehensive UI Responsiveness Overhaul:**
  - Mobile Navigation: Hamburger menu, slide-in sidebar with overlay
  - Responsive Padding: Added p-4 sm:p-6 lg:p-8 to main content area
  - Page Headers: Stack vertically on mobile, horizontal on desktop
  - Tables: Horizontal scroll on mobile devices
  - All pages fully responsive (mobile/tablet/desktop)

- **Cosmetic Fixes:**
  - Fixed hover states: dark:bg → dark:hover:bg (3 locations)
  - Fixed badge colors for better contrast
  - Fixed empty state icons for dark mode
  - Fixed text cut-off and alignment issues

- **Files Modified:** 8 files (layouts, pages, components)
- **Git Commit:** 5faab96 - "Fix content padding and spacing issues"
- **Status:** All responsive and cosmetic issues resolved ✅

**To Continue Next Session:**
Say "start where we ended last time" and I will:
1. Review completed tasks (2.1-2.4 + responsive fixes)
2. Suggest next task (2.5 PR or 2.9 Timeline)
3. Continue from current state

