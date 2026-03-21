# Task List - Sourcing Dashboard
## 8-Week Development Plan

**Developers:** Filip & Marco

**How to use this:**
- Each task shows WHO does it, WHAT they're building, and WHAT gets created
- ✅ = Done
- 🔄 = In Progress
- ⏳ = Not Started

---

## WEEK 1: Foundation Setup

### Day 1-2: Setup & Foundation (BOTH TOGETHER)

| Task # | Task Name | Developer | What You're Doing | What Gets Created | Time | Status |
|--------|-----------|-----------|-------------------|-------------------|------|--------|
| 1.1 | Project Setup | Filip & Marco | Install Next.js and all the tools we need to build the app | Working project folder with all dependencies installed | 2h | ✅ |
| 1.2 | Database Design | Filip & Marco | Design how data will be stored (organizations, users, factories, orders) | Database structure with all tables created | 3h | ✅ |
| 1.3 | Shared Types | Filip & Marco | Create data formats that both developers will use | TypeScript types file that ensures consistent data | 1h | ✅ |
| 1.4 | Authentication | Filip & Marco | Build login/logout system so users can sign in securely | Working login page with email/password | 2h | ✅ |
| 1.5 | Layout & Navigation | Filip & Marco | Create the app shell (sidebar, header, navigation menu) | App layout with sidebar and header that works on all pages | 3h | ✅ |
| 1.6 | API Helpers | Filip & Marco | Create tools to make API responses consistent | Helper functions for API success/error responses | 1h | ✅ |

**End of Day 2:** Foundation is solid, ready to split up work

---

### Day 3-5: Factory Management (Filip) & Order Management (Marco)

#### Filip's Tasks - Factory Management

| Task # | Task Name | Developer | What You're Doing | What Gets Created | Time | Status |
|--------|-----------|-----------|-------------------|-------------------|------|--------|
| 1.7 | Factory List Page | Filip | Build page showing all factories with search bar | Page at /factories showing factory list, search works | 3h | ✅ |
| 1.8 | Factory API | Filip | Create backend endpoints to get and create factories | API that returns factory data (GET) and creates new factories (POST) | 2h | ✅ |
| 1.9 | Factory Create Form | Filip | Build form to add new factory with all details | Page at /factories/new with form to add factory | 3h | ✅ |
| 1.10 | Factory Pull Request | Filip | Package all factory work and request code review | Pull request on GitHub ready for Marco to review | 30min | ✅ |

**What Filip Creates This Week:** Complete factory management - users can view all factories, add new ones, and search for them.

---

#### Marco's Tasks - Order Management

| Task # | Task Name | Developer | What You're Doing | What Gets Created | Time | Status |
|--------|-----------|-----------|-------------------|-------------------|------|--------|
| 1.11 | Order List Page | Marco | Build page showing all orders with filters (status, factory) and search | Page at /orders showing order list with filters and search | 4h | ✅ |
| 1.12 | Order API | Marco | Create backend endpoints to get and create orders | API that returns order data (GET) and creates new orders (POST) | 2h | ✅ |
| 1.13 | Order Create Form | Marco | Build form to create order with product details and stages | Page at /orders/new with form to create order, select factory, add stages | 4h | ✅ |
| 1.14 | Order Pull Request | Marco | Package all order work and request code review | Pull request on GitHub ready for Filip to review | 30min | ⏳ |

**What Marco Creates This Week:** Complete order management - users can view all orders, create new ones, filter by status/factory, and search.

---

### End of Week 1: Code Review

| Task # | Task Name | Developer | What You're Doing | What Gets Created | Time | Status |
|--------|-----------|-----------|-------------------|-------------------|------|--------|
| 1.15 | Review Factory Code | Marco | Test Filip's factory features and review code quality | Feedback on factory PR, approve or request changes | 30min | ✅ |
| 1.16 | Review Order Code | Filip | Test Marco's order features and review code quality | Feedback on order PR, approve or request changes | 30min | ✅ |

**End of Week 1 Result:**
- ✅ Users can log in
- ✅ Users can add and view factories
- ✅ Users can create and view orders
- ✅ Basic platform is working

---

## WEEK 2: Detail Pages & Editing

### Filip's Tasks - Factory Details & Editing

| Task # | Task Name | Developer | What You're Doing | What Gets Created | Time | Status |
|--------|-----------|-----------|-------------------|-------------------|------|--------|
| 2.1 | Factory Detail Page | Filip | Build page showing one factory's full information and all its orders | Page at /factories/[id] showing factory details and order list | 3h | ✅ |
| 2.2 | Factory Edit Form | Filip | Build form to edit existing factory information | Page at /factories/[id]/edit with pre-filled form | 2h | ✅ |
| 2.3 | Factory Delete | Filip | Add ability to delete factory with confirmation dialog | Delete button with "Are you sure?" confirmation | 1h | ✅ |
| 2.4 | Factory Search/Filter | Filip | Improve factory list with better search and filters | Enhanced search that works on name, location, contact | 2h | ✅ |
| 2.5 | Factory PR Week 2 | Filip | Package week 2 factory work for review | Pull request with all factory improvements | 30min | ⏳ |

**What Filip Creates This Week:** Complete factory management - can view details, edit, delete, and advanced search.

---

### Marco's Tasks - Order Details & Progress

| Task # | Task Name | Developer | What You're Doing | What Gets Created | Time | Status |
|--------|-----------|-----------|-------------------|-------------------|------|--------|
| 2.6 | Order Detail Page | Marco | Build page showing one order's complete details, stages, progress | Page at /orders/[id] showing all order info, stage progress bars | 4h | ✅ |
| 2.7 | Order Edit Form | Marco | Build form to edit existing order | Page at /orders/[id]/edit with pre-filled form | 2h | ✅ |
| 2.8 | Stage Progress Update | Marco | Add ability to update each stage's progress (0-100%) and set status (delayed/blocked) - Admin only | UI to update stage progress with slider, status selector (delayed=yellow, blocked=red), and notes for explaining issues. Clients can view but not edit. | 2h | ✅ |
| 2.9 | Order Timeline | Marco | Create timeline showing all updates and changes to order | Timeline component showing history of changes | 3h | ✅ |
| 2.10 | Order PR Week 2 | Marco | Package week 2 order work for review | Pull request with all order improvements | 30min | ⏳ |

**What Marco Creates This Week:** Complete order detail view with progress tracking, timeline, and editing.

---

### End of Week 2: Code Review

| Task # | Task Name | Developer | What You're Doing | What Gets Created | Time | Status |
|--------|-----------|-----------|-------------------|-------------------|------|--------|
| 2.11 | Review Factory Code | Marco | Test and review Filip's factory detail/edit features | Approved PR or feedback | 30min | ⏳ |
| 2.12 | Review Order Code | Filip | Test and review Marco's order detail/progress features | Approved PR or feedback | 30min | ⏳ |

**End of Week 2 Result:**
- ✅ Can view detailed information for any factory or order
- ✅ Can edit factories and orders
- ✅ Can track progress for each order stage
- ✅ See timeline of all order changes

---

## WEEK 3: Dashboard & Team Management

### Filip's Tasks - Dashboard & Team

| Task # | Task Name | Developer | What You're Doing | What Gets Created | Time | Status |
|--------|-----------|-----------|-------------------|-------------------|------|--------|
| 3.1 | Dashboard Homepage | Filip | Build main dashboard with key statistics and metrics | Page at /dashboard showing order counts, status breakdown, recent activity | 4h | ✅ |
| 3.2 | Dashboard Stats | Filip | Create API to calculate dashboard statistics | API endpoint returning total orders, by status, by factory, etc. | 2h | ✅ |
| 3.3 | Recent Activity Feed | Filip | Show recent updates (new orders, progress changes) | Activity feed component showing last 10 updates | 2h | ✅ |
| 3.4a | Email Whitelist Access Control | Filip | Create email whitelist system to restrict registration to internal team (3-5 Gmail accounts) | lib/access-control.ts utility + updated registration route with whitelist check | 1h | ✅ |
| 3.4b | Team Members Page | Filip | Build page to manage team (view members, invite, remove, change roles) | Page at /team showing all users with role badges, invite/remove buttons | 3h | ✅ |
| 3.5a | Invitation Database Model | Filip | Add UserInvitation model to Prisma schema for invitation-based access | Prisma schema updated with UserInvitation table, migration created and run | 1h | ✅ |
| 3.5b | Invitation API Endpoints | Filip | Create API routes to create, list, validate, and revoke team invitations | /api/invitations with POST (create), GET (list), /api/invitations/[token] with GET (validate), DELETE (revoke) | 2h | ✅ |
| 3.5c | Invitation Accept Page | Filip | Build page for new users to accept invitation link and complete registration | Page at /invite/[token] showing org name, role, pre-filled email, registration form | 2h | ✅ |
| 3.5d | Update Registration Flow | Filip | Modify registration to support both whitelist and invitation token flows | Updated /register API and page to handle invitationToken parameter, join existing org | 1h | ✅ |
| 3.6 | Week 3 PR | Filip | Package dashboard, access control, and team management features | Pull request for review | 30min | ⏳ |

**What Filip Creates This Week:** Dashboard homepage + access control system (Phase 1: email whitelist, Phase 2: invitation-based team management with role assignment).

---

### Marco's Tasks - Order Enhancements

| Task # | Task Name | Developer | What You're Doing | What Gets Created | Time | Status |
|--------|-----------|-----------|-------------------|-------------------|------|--------|
| 3.7 | File Attachments | Marco | Add ability to upload files to orders (photos, documents) | Upload button and file list on order detail page | 3h | ✅ |
| 3.8 | Order Notes/Comments | Marco | Add comment system for team to discuss orders | Comments section on order detail page | 2h | ✅ |
| 3.9 | Order Status Update | Marco | Make it easy to change order status (pending → in progress → completed) | Status dropdown with one-click updates | 2h | ✅ |
| 3.10 | Bulk Actions | Marco | Select multiple orders and update status at once | Checkboxes on order list, bulk update button | 3h | ✅ |
| 3.11 | Export to CSV | Marco | Export order list to Excel/CSV file | Export button that downloads CSV with all order data | 2h | ✅ |
| 3.11b | Stage Metadata System | Marco | Build editable key-value metadata per production stage with inline Key:Value display, ordered array storage (preserves insertion order), drag-and-drop reordering in 2-column grid display, stage-type presets, backward-compatible with legacy object format | Admin-editable metadata section per stage card, PATCH endpoint for metadata, stage-type presets, drag-and-drop reorder in display, ordered array storage | 4h | ✅ |
| 3.12 | Week 3 PR | Marco | Package order enhancements | Pull request for review | 30min | ⏳ |

**What Marco Creates This Week:** Order enhancements - attachments, comments, status updates, bulk actions, export, stage metadata.

---

### End of Week 3: Code Review & Testing

| Task # | Task Name | Developer | What You're Doing | What Gets Created | Time | Status |
|--------|-----------|-----------|-------------------|-------------------|------|--------|
| 3.13 | Review Dashboard/Team | Marco | Test and review Filip's dashboard and team features | Approved PR or feedback | 30min | ⏳ |
| 3.14 | Review Order Features | Filip | Test and review Marco's order enhancements | Approved PR or feedback | 30min | ⏳ |
| 3.15 | End-to-End Testing | Filip & Marco | Test entire platform together, fix bugs | Bug-free working platform | 3h | ⏳ |
| 3.16 | Deploy to Vercel | Filip & Marco | Deploy platform to internet for testing | Live URL that anyone can access | 1h | ⏳ |

**End of Week 3 / Phase 1 Result:**
- ✅ Complete factory and order management
- ✅ Dashboard with statistics
- ✅ Team management system
- ✅ File attachments and comments
- ✅ Export functionality
- ✅ Platform deployed and ready for real use
- **MILESTONE: Platform is usable for manual tracking!**

---

## WEEK 4: Charts & Analytics

### Filip's Tasks - Dashboard Analytics

| Task # | Task Name | Developer | What You're Doing | What Gets Created | Time | Status |
|--------|-----------|-----------|-------------------|-------------------|------|--------|
| 4.1 | Chart Library Setup | Filip | Install and configure chart library (Recharts) | Chart components ready to use | 1h | ✅ |
| 4.2 | Orders by Status Chart | Filip | Create pie chart showing order breakdown by status | Pie chart showing pending/in progress/completed orders | 2h | ✅ |
| 4.3 | Orders Over Time Chart | Filip | Create line chart showing order trends over time | Line chart showing orders created per month | 3h | ✅ |
| 4.4 | Factory Performance Chart | Filip | Create bar chart comparing factory performance | Bar chart showing on-time delivery rate per factory | 3h | ✅ |
| 4.5 | Date Range Filter | Filip | Add date picker to filter charts by date range | Date range selector that updates all charts | 2h | ✅ |
| 4.6 | Analytics API | Filip | Create API endpoints to provide chart data | APIs returning aggregated data for charts | 2h | ✅ |
| 4.7 | Week 4 PR | Filip | Package analytics features | Pull request for review | 30min | ✅ |
| 4.20 | Factory Globe Card | Filip | Add 3D globe dashboard card showing factory/manufacturer locations with glowing markers. Uses `cobe` (5KB, zero-dep). Static geocoding lookup for city→lat/lng. Auto-rotates, user-draggable, dark/light mode aware. | `lib/geo.ts` (static geocode map + fuzzy match), `/api/dashboard/factory-locations` (auth-protected, returns factories with lat/lng + orderCount), `dashboard/_components/factory-globe.tsx` (client component with cobe canvas, markers, card styling, loading skeleton). Update `dashboard/page.tsx` to include globe + add endpoint to `stress-test.js`. Dep: `npm install cobe` | 3h | ✅ |

**What Filip Creates This Week:** Beautiful dashboard with charts showing order trends, factory performance, analytics, and a 3D globe showing factory locations.

---

### Marco's Tasks - Order Timeline & Gantt Chart

| Task # | Task Name | Developer | What You're Doing | What Gets Created | Time | Status |
|--------|-----------|-----------|-------------------|-------------------|------|--------|
| 4.8 | Timeline View Page | Marco | Create visual timeline showing all orders on calendar | Page at /timeline showing Gantt-chart style view | 4h | ✅ |
| 4.9 | Timeline Filters | Marco | Add filters for timeline (factory, status, date range) | Filter controls that update timeline | 2h | ✅ |
| 4.10 | Critical Path Highlighting | Marco | Highlight orders that are at risk or delayed | Red highlighting for delayed orders, yellow for at-risk | 2h | ✅ |
| 4.11 | Timeline Zoom Controls | Marco | Add zoom in/out to see more or less detail | Zoom buttons to change timeline scale (day/week/month view) | 2h | ✅ |
| 4.12 | Export Timeline Image | Marco | Allow exporting timeline as image | Export button that downloads timeline as PNG | 2h | ✅ |
| 4.13 | Week 4 PR | Marco | Package timeline features | Pull request for review | 30min | ⏳ |

**What Marco Creates This Week:** Visual timeline showing all orders in calendar/Gantt format with filters and export.

---

### End of Week 4: Code Review

| Task # | Task Name | Developer | What You're Doing | What Gets Created | Time | Status |
|--------|-----------|-----------|-------------------|-------------------|------|--------|
| 4.14 | Review Analytics | Marco | Test and review Filip's charts and analytics | Approved PR or feedback | 30min | ⏳ |
| 4.15 | Review Timeline | Filip | Test and review Marco's timeline view | Approved PR or feedback | 30min | ⏳ |

**End of Week 4 Result:**
- ✅ Dashboard has beautiful charts
- ✅ Visual analytics for order trends
- ✅ Factory performance comparison
- ✅ Timeline/Gantt view of all orders
- ✅ Can spot delays and problems visually

---

### Filip's Tasks - Live Sourcing News Ticker

| Task # | Task Name | Developer | What You're Doing | What Gets Created | Time | Status |
|--------|-----------|-----------|-------------------|-------------------|------|--------|
| 4.16 | News Feed Data Layer | Filip | Create RSS parser utility, commodity price fetcher, and shared types for the live news system | `/lib/news/rss-parser.ts`, `/lib/news/commodity-prices.ts`, `/lib/news/types.ts` | 2h | ✅ |
| 4.17 | News Feed API Endpoint | Filip | Create API that fetches RSS feeds (Supply Chain Dive, FreightWaves, Supply Chain Brain) + commodity prices (API Ninjas), merges and caches results for 15 min | `/app/api/news/feed/route.ts` | 2h | ✅ |
| 4.18 | News Ticker UI Component | Filip | Build rotating headline bar with 6s auto-rotation, fade transitions, pause on hover, category badges, brand orange theme, hover-to-reveal | `/components/layout/news-ticker.tsx` | 3h | ✅ |
| 4.19 | Integrate News Ticker into Layout | Filip | Add ticker above header in AppLayout, install fast-xml-parser, add /api/news/ to middleware public routes | Modified: `app-layout.tsx`, `middleware.ts`, `package.json` | 1h | ✅ |

**What Filip Creates:** A live sourcing news ticker bar at the top of every page showing rotating headlines about tariffs, raw material prices, supply chain disruptions, and trade policy — sourced from free RSS feeds and commodity price APIs.

**Data Sources (All Free):**
- **Supply Chain Dive RSS** — tariffs, logistics, trade policy
- **FreightWaves RSS** — shipping, supply chain disruptions
- **Commodity-TV RSS** — raw material news
- **API Ninjas Commodity Price API** — cotton, steel, crude oil, copper prices (10k req/month free)

---

## WEEK 5: Alerts & Notifications

### Filip's Tasks - Alert System

| Task # | Task Name | Developer | What You're Doing | What Gets Created | Time | Status |
|--------|-----------|-----------|-------------------|-------------------|------|--------|
| 5.1 | Alert Database Models | Filip | Add database tables for alerts | Alert table in database | 1h | ✅ |
| 5.2 | Alert Generation Logic | Filip | Create system to automatically generate alerts for delayed orders | Background process that checks for delays and creates alerts | 3h | ✅ |
| 5.3 | Alert Bell Icon | Filip | Add bell icon to header showing unread alert count | Bell icon with red badge showing number of unread alerts | 2h | ✅ |
| 5.4 | Alert Dropdown | Filip | Create dropdown showing recent alerts | Dropdown menu showing last 5 alerts when clicking bell | 2h | ✅ |
| 5.5 | Alert List Page | Filip | Build page showing all alerts with filters | Page at /alerts showing all alerts, filterable by type | 2h | ✅ |
| 5.6 | Alert Actions | Filip | Add ability to mark alerts as read or resolved | Buttons to mark as read, resolve, or dismiss alerts | 2h | ✅ |
| 5.7 | Week 5 PR | Filip | Package alert system | Pull request for review | 30min | ⏳ |

**What Filip Creates This Week:** Alert system that notifies users about delayed orders and problems.

---

### Marco's Tasks - Email Notifications

| Task # | Task Name | Developer | What You're Doing | What Gets Created | Time | Status |
|--------|-----------|-----------|-------------------|-------------------|------|--------|
| 5.8 | Email Service Setup | Marco | Setup email provider (Resend) for sending emails | Email service configured and working | 1h | ✅ |
| 5.9 | Email Templates | Marco | Design email templates for different notification types | HTML email templates that look professional | 3h | ✅ |
| 5.10 | Order Delayed Email | Marco | Send email when order becomes delayed | Automated email sent to team when order is late | 2h | ✅ |
| 5.11 | Order Completed Email | Marco | Send email when order is completed | Automated email sent when order finishes | 1h | ✅ |
| 5.12 | Weekly Digest Email | Marco | Create weekly summary email of all activity | Email sent every Monday with week's summary | 3h | ✅ |
| 5.13 | Notification Settings | Marco | Let users choose which emails they want to receive | Settings page where users enable/disable email types | 2h | ✅ |
| 5.14 | Week 5 PR | Marco | Package email notification system | Pull request for review | 30min | ⏳ |

**What Marco Creates This Week:** Email notification system that keeps team informed automatically.

---

### Filip's Tasks - Real-Time Chat & Messaging

| Task # | Task Name | Developer | What You're Doing | What Gets Created | Time | Status |
|--------|-----------|-----------|-------------------|-------------------|------|--------|
| 5.18 | Chat Database Models | Filip | Add database tables for conversations and messages | Conversation and Message tables in database | 1h | ✅ |
| 5.19 | Chat UI Component | Filip | Build real-time chat interface for admin-client conversations | Chat component with message list, input, send button | 4h | ✅ |
| 5.20 | Chat API Backend | Filip | Create API endpoints for conversations and messages | API for creating conversations, sending/receiving messages | 3h | ✅ |
| 5.21 | Chat List Page | Filip | Build page showing all conversations for the organization | Page at /messages showing all active chats | 2h | ✅ |
| 5.22 | Unread Message Badge | Filip | Show unread message count in navigation | Badge on Messages nav item showing unread count | 1h | ✅ |

**What Filip Creates This Week (Additional):** Real-time chat system for admin-client communication.

---

### Marco's Tasks - Order/Factory Request System

| Task # | Task Name | Developer | What You're Doing | What Gets Created | Time | Status |
|--------|-----------|-----------|-------------------|-------------------|------|--------|
| 5.23 | Request Database Models | Marco | Add database tables for order/factory requests | Request table with status, type, and details | 1h | ✅ |
| 5.24 | Order Request Form | Marco | Build form for clients to request new orders | Page at /orders/request for clients to submit order requests | 3h | ✅ |
| 5.25 | Factory Request Form | Marco | Build form for clients to request new factories | Page at /factories/request for clients to submit factory requests | 2h | ✅ |
| 5.26 | Request Review UI | Marco | Build interface for admins to review and approve/reject requests | Requests page showing pending requests with approve/reject buttons | 3h | ✅ |
| 5.27 | Request-to-Chat Integration | Marco | Link requests to chat so admins can discuss with clients | Request approval creates chat thread, notifications sent | 2h | ✅ |
| 5.28 | Role-Based Create Buttons | Marco | Hide "Add Order"/"Add Factory" for non-admin users, show "Request" instead | Conditional UI based on user role | 2h | ✅ |

**What Marco Creates This Week (Additional):** Request workflow where clients request orders/factories, admins approve via chat.

---

### End of Week 5: Code Review & Testing

| Task # | Task Name | Developer | What You're Doing | What Gets Created | Time | Status |
|--------|-----------|-----------|-------------------|-------------------|------|--------|
| 5.29 | Review Alerts | Marco | Test and review Filip's alert system | Approved PR or feedback | 30min | ⏳ |
| 5.30 | Review Emails | Filip | Test and review Marco's email notifications | Approved PR or feedback | 30min | ⏳ |
| 5.31 | Review Chat System | Marco | Test and review Filip's chat features | Approved PR or feedback | 30min | ⏳ |
| 5.32 | Review Request System | Filip | Test and review Marco's request workflow | Approved PR or feedback | 30min | ⏳ |
| 5.33 | Integration Testing | Filip & Marco | Test alerts, emails, chat, and requests work together | Verified all communication flows work | 3h | ⏳ |

**End of Week 5 / Phase 2 Result:**
- ✅ Alert system catches problems automatically
- ✅ Email notifications keep team informed
- ✅ Users can customize notification preferences
- ✅ Weekly digest emails
- ✅ Real-time chat between admins and clients
- ✅ Clients can request new orders/factories
- ✅ Admins approve requests through chat workflow
- ✅ Role-based access controls (admin vs client)
- **MILESTONE: Platform is proactive, collaborative, and secure!**

---

## WEEK 6: Integration Framework

### Filip's Tasks - Integration UI

| Task # | Task Name | Developer | What You're Doing | What Gets Created | Time | Status |
|--------|-----------|-----------|-------------------|-------------------|------|--------|
| 6.1 | Integration Setup Wizard | Filip | Create step-by-step wizard to setup factory integration | Multi-step wizard at /factories/[id]/integration | 4h | ✅ |
| 6.2 | Connection Type Selection | Filip | Let user choose integration type (API, SFTP, Webhook, Manual) | Step 1 of wizard: radio buttons to select connection type | 2h | ✅ |
| 6.3 | Credentials Form | Filip | Build form to enter factory system credentials | Step 2 of wizard: form for API URL, username, password, etc. | 3h | ✅ |
| 6.4 | Test Connection Button | Filip | Add button to test if connection works before saving | Test button that verifies credentials work | 2h | ✅ |
| 6.5 | Data Field Mapping | Filip | Let user map factory fields to our fields | Step 3 of wizard: drag-and-drop field mapping UI | 3h | ✅ |
| 6.6 | Integration Dashboard | Filip | Create page showing all integrations and their status | Page at /integrations showing health of all connections | 3h | ✅ |
| 6.7 | Week 6 PR | Filip | Package integration UI | Pull request for review | 30min | ⏳ |

**What Filip Creates This Week:** User interface for setting up factory integrations - wizard and dashboard.

---

### Marco's Tasks - Integration Backend

| Task # | Task Name | Developer | What You're Doing | What Gets Created | Time | Status |
|--------|-----------|-----------|-------------------|-------------------|------|--------|
| 6.8 | Redis Setup | Marco | Install and configure Redis for background jobs | Redis connected and working | 1h | ✅ |
| 6.9 | Job Queue Setup | Marco | Setup BullMQ for running background jobs | Job queue system configured | 2h | ✅ |
| 6.10 | Integration Manager | Marco | Create core system that handles all integrations | Integration manager that routes to correct adapter | 3h | ✅ |
| 6.11 | Credential Encryption | Marco | Build system to encrypt factory credentials securely | Encryption utilities that protect sensitive data | 2h | ✅ |
| 6.12 | REST API Adapter | Marco | Build adapter to connect to factory REST APIs | Working adapter that can call factory APIs | 4h | ✅ |
| 6.13 | Test Mock API | Marco | Create fake factory API for testing | Mock API that simulates factory responses | 2h | ✅ |
| 6.14 | Week 6 PR | Marco | Package integration backend | Pull request for review | 30min | ⏳ |

**What Marco Creates This Week:** Backend infrastructure for integrations - job queue, encryption, API adapter.

---

### End of Week 6: Code Review

| Task # | Task Name | Developer | What You're Doing | What Gets Created | Time | Status |
|--------|-----------|-----------|-------------------|-------------------|------|--------|
| 6.15 | Review Integration UI | Marco | Test and review Filip's integration setup wizard | Approved PR or feedback | 30min | ⏳ |
| 6.16 | Review Integration Backend | Filip | Test and review Marco's integration infrastructure | Approved PR or feedback | 30min | ⏳ |

**End of Week 6 Result:**
- ✅ Integration wizard ready
- ✅ Backend infrastructure working
- ✅ Can test connections
- ✅ Credentials encrypted securely
- ✅ Mock API for testing

---

## WEEK 7: Integration Adapters

### Filip's Tasks - Integration UI Improvements

| Task # | Task Name | Developer | What You're Doing | What Gets Created | Time | Status |
|--------|-----------|-----------|-------------------|-------------------|------|--------|
| 7.1 | Integration Detail Page | Filip | Build page showing one integration's details and logs | Page at /integrations/[id] with sync history | 3h | ✅ |
| 7.2 | Sync Logs Viewer | Filip | Create table showing all sync attempts (success/failure) | Log table with date, status, error messages | 3h | ✅ |
| 7.3 | Manual Sync Button | Filip | Add button to trigger sync immediately (not wait 15 min) | "Sync Now" button that starts immediate sync | 2h | ✅ |
| 7.4 | Integration Settings | Filip | Let user change sync frequency, enable/disable integration | Settings form to edit integration config | 2h | ✅ |
| 7.5 | Integration Docs | Filip | Write setup guides for different factory systems | Documentation pages for SAP, Oracle, SFTP setup | 3h | ✅ |
| 7.6 | Week 7 PR | Filip | Package integration UI improvements | Pull request for review | 30min | ⏳ |

**What Filip Creates This Week:** Integration monitoring and management UI - see logs, trigger sync, change settings.

---

### Marco's Tasks - More Adapters

| Task # | Task Name | Developer | What You're Doing | What Gets Created | Time | Status |
|--------|-----------|-----------|-------------------|-------------------|------|--------|
| 7.7 | SFTP Adapter | Marco | Build adapter to download files from SFTP servers | Adapter that connects to SFTP and downloads CSV/JSON files | 4h | ✅ |
| 7.8 | CSV Parser | Marco | Create parser to read CSV files from factories | Parser that converts CSV data to our format | 2h | ✅ |
| 7.9 | Webhook Receiver | Marco | Build endpoint to receive data pushed from factories | API endpoint at /api/webhooks/[factoryId] | 2h | ✅ |
| 7.10 | Data Transformer | Marco | Create system to map factory data to our data format | Transformer that handles different field names | 3h | ✅ |
| 7.11 | Sync Scheduler | Marco | Build scheduler that runs sync jobs every 15 minutes | Scheduler that automatically syncs all integrations | 3h | ✅ |
| 7.12 | Week 7 PR | Marco | Package new adapters | Pull request for review | 30min | ⏳ |

**What Marco Creates This Week:** Multiple integration methods - SFTP, webhooks, data transformation, auto-scheduler.

---

### End of Week 7: Code Review

| Task # | Task Name | Developer | What You're Doing | What Gets Created | Time | Status |
|--------|-----------|-----------|-------------------|-------------------|------|--------|
| 7.13 | Review Integration UI | Marco | Test and review Filip's integration monitoring | Approved PR or feedback | 30min | ⏳ |
| 7.14 | Review Adapters | Filip | Test and review Marco's SFTP, webhook, scheduler | Approved PR or feedback | 30min | ⏳ |

**End of Week 7 Result:**
- ✅ Multiple integration methods working (API, SFTP, Webhook)
- ✅ Auto-sync scheduler running
- ✅ Integration monitoring dashboard
- ✅ Can view sync logs and errors
- ✅ Manual sync button

---

## WEEK 8: Testing & Production Launch

### Both Developers - Testing & Polish

| Task # | Task Name | Developer | What You're Doing | What Gets Created | Time | Status |
|--------|-----------|-----------|-------------------|-------------------|------|--------|
| 8.1 | Pilot Factory Setup #1 | Filip & Marco | Work with first pilot factory to setup integration | Working integration with Factory #1 | 4h | ⏳ |
| 8.2 | Pilot Factory Setup #2 | Filip & Marco | Work with second pilot factory to setup integration | Working integration with Factory #2 | 4h | ⏳ |
| 8.3 | Bug Fixing | Filip & Marco | Fix any bugs found during pilot testing | Bug-free integrations | 4h | ⏳ |
| 8.4 | Performance Testing | Filip & Marco | Test with lots of data to ensure it's fast | Optimized queries, fast page loads | 3h | ⏳ |
| 8.5 | Error Monitoring Setup | Filip | Setup Sentry for error tracking | Error monitoring system configured | 1h | ✅ |
| 8.6 | Security Audit | Marco | Review security: encryption, auth, permissions | Security checklist completed | 2h | ⏳ |
| 8.7 | Mobile Testing | Filip & Marco | Test entire platform on mobile devices | Mobile-responsive design verified | 2h | ⏳ |
| 8.8 | User Documentation | Filip | Write user guide for brands using platform | Documentation website or PDF guide | 3h | ✅ |
| 8.9 | Factory Setup Guide | Marco | Write guide for factories to setup integration | Step-by-step factory IT guide | 3h | ⏳ |
| 8.10 | Production Deploy | Filip & Marco | Deploy final version to production | Live production URL | 2h | ⏳ |
| 8.11 | Load Testing | Filip & Marco | Test with 50+ factories and 1000+ orders | Performance verified at scale | 2h | ⏳ |
| 8.12 | Final Demo | Filip & Marco | Record video demo of platform | Demo video for marketing/sales | 2h | ⏳ |

**What Gets Created This Week:** Production-ready platform with pilot factories connected and working.

---

**End of Week 8 / Phase 3 Result:**
- ✅ 2+ pilot factories auto-syncing successfully
- ✅ All integration methods working
- ✅ Platform tested and bug-free
- ✅ Documentation complete
- ✅ Production deployed
- ✅ Error monitoring active
- **MILESTONE: Ready for launch! 🚀**

---

## Summary: Total Work Division

### Filip's Responsibilities (Total Tasks: ~60)

**Phase 1 (Weeks 1-3):**
- Factory Management (CRUD)
- Dashboard Homepage
- Team Management
- User Invitations

**Phase 2 (Weeks 4-5):**
- Charts & Analytics
- Dashboard Visualizations
- Alert System
- Alert UI

**Phase 3 (Weeks 6-8):**
- Integration Setup Wizard
- Integration Dashboard
- Integration Monitoring
- Documentation

---

### Marco's Responsibilities (Total Tasks: ~60)

**Phase 1 (Weeks 1-3):**
- Order Management (CRUD)
- Order Detail Pages
- Order Progress Tracking
- File Attachments
- Export Features

**Phase 2 (Weeks 4-5):**
- Timeline/Gantt View
- Email Notifications
- Notification Settings

**Phase 3 (Weeks 6-8):**
- Integration Backend
- Job Queue System
- API/SFTP/Webhook Adapters
- Data Transformation
- Auto Sync Scheduler

---

## How to Use This Document

### For Filip & Marco:
1. **Start each day:** Find your next ⏳ task
2. **Work on task:** Follow technical plan for details
3. **Mark done:** Change ⏳ to ✅ when complete
4. **Create PR:** Package completed tasks
5. **Review partner:** Review each other's PRs
6. **Repeat:** Move to next task

### For Founders:
1. **Track progress:** See which tasks are ✅ done vs ⏳ pending
2. **Daily check-in:** "What task are you working on?"
3. **Weekly review:** Count completed tasks, see if on schedule
4. **Demo features:** Test completed features from week

### Weekly Goals:
- **Week 1:** Tasks 1.1 - 1.16 ✅
- **Week 2:** Tasks 2.1 - 2.12 ✅
- **Week 3:** Tasks 3.1 - 3.16 ✅
- **Week 4:** Tasks 4.1 - 4.15 ✅
- **Week 5:** Tasks 5.1 - 5.17 ✅
- **Week 6:** Tasks 6.1 - 6.16 ✅
- **Week 7:** Tasks 7.1 - 7.14 ✅
- **Week 8:** Tasks 8.1 - 8.12 ✅

**Total: ~120 tasks over 8 weeks = Success! 🎉**

---

## PHASE 4: PROCUREMENT & INVENTORY MANAGEMENT (WEEKS 9-12)

**New Scope:** Transform from production tracking to full procurement platform

**What Changes:**
- Add inventory management and SKU catalog
- Implement reorder forecasting and runway calculations  
- Build landed cost calculator with freight/customs
- Create supplier payment and invoice tracking
- Add inbound pipeline visibility
- Implement procurement alerts and workflow automation

---

## WEEK 9: Inventory Foundation & Product Catalog

### Filip's Tasks - Inventory Core & SKU Management

| Task # | Task Name | Developer | What You're Doing | What Gets Created | Time | Status |
|--------|-----------|-----------|-------------------|-------------------|------|--------|
| 9.1 | Inventory Database Models | Filip | Design inventory schema: Product, SKU, Stock, InventoryTransaction, InventoryLocation | Prisma schema with inventory tables, unique constraints, indexes | 3h | ✅ |
| 9.2 | Product Catalog Model | Filip | Create Product model with COGS, weight, dimensions, HS code, origin country, tags | Product table with all sourcing metadata fields | 2h | ✅ |
| 9.3 | Stock Level Tracking | Filip | Build stock tracking: on-hand, reserved, available, backorder quantities per location | Real-time inventory balance calculations | 3h | ✅ |
| 9.4 | Product Catalog Page | Filip | Build product catalog UI with table, search, filters, bulk selection | Page at /products showing SKU catalog with inventory levels | 4h | ✅ |
| 9.5 | Product Create Form | Filip | Build form to add new product with SKU, COGS, weight, dimensions, tags | Page at /products/new with comprehensive product form | 3h | ✅ |
| 9.6 | Product Bulk Edit | Filip | Add bulk-edit capability for COGS, tags, lead times across multiple SKUs | Checkbox selection + bulk update modal | 3h | ✅ |
| 9.7 | SKU Tagging System | Filip | Implement tag management: create tags, assign to products, filter by tags | Tag CRUD + filter UI (supplier, origin, material, season, status) | 2h | ✅ |
| 9.8 | Product API Endpoints | Filip | Create Product APIs: GET list, GET by ID, POST create, PATCH update, DELETE | Complete product CRUD API with pagination, search, filters | 2h | ✅ |

**What Filip Creates This Week:** Complete product catalog with inventory tracking foundation.

---

### Marco's Tasks - Inbound Pipeline & Stock Visibility

| Task # | Task Name | Developer | What You're Doing | What Gets Created | Time | Status |
|--------|-----------|-----------|-------------------|-------------------|------|--------|
| 9.9 | Inbound Shipment Model | Marco | Create InboundShipment model linking POs to inventory: expected qty, ETA, supplier | Shipment tracking schema with inventory linkage | 2h | ⏳ |
| 9.10 | Inbound Pipeline View | Marco | Build live inbound pipeline showing all open POs, quantities expected, ETAs | Page at /inbound showing pipeline grouped by status/supplier | 4h | ⏳ |
| 9.11 | Shipment Receiving Flow | Marco | Create workflow to receive shipment and update inventory: inspection, accept/reject, stock allocation | Receiving page with inspection checklist and stock update | 4h | ⏳ |
| 9.12 | Stock Adjustment UI | Marco | Build interface for manual stock adjustments with reason codes (damaged, lost, found, correction) | Stock adjustment form with audit trail | 2h | ⏳ |
| 9.13 | Inventory Transaction Log | Marco | Implement full audit trail for all inventory movements (receipts, adjustments, reservations) | Transaction history with before/after snapshots | 2h | ⏳ |
| 9.14 | Low Stock Alerts | Marco | Create alert system for products below minimum stock level | Automated low-stock email/in-app notifications | 2h | ⏳ |
| 9.15 | Inventory Dashboard Cards | Marco | Add inventory KPIs to dashboard: total SKUs, inventory value, low-stock count, inbound value | 4 new stat cards on main dashboard | 2h | ⏳ |
| 9.16 | Inbound API Endpoints | Marco | Create APIs for inbound shipments: list, create, update status, receive | Complete inbound pipeline API | 2h | ⏳ |

**What Marco Creates This Week:** Inbound pipeline visibility and inventory receiving system.

---

## WEEK 10: Procurement Planning & Landed Costs

### Filip's Tasks - Reorder Forecasting & Runway

| Task # | Task Name | Developer | What You're Doing | What Gets Created | Time | Status |
|--------|-----------|-----------|-------------------|-------------------|------|--------|
| 10.1 | Sales Velocity Tracking | Filip | Implement sales velocity calculation per SKU (7/30/90 day averages, weighted) | Background job calculating daily sales rates | 3h | ⏳ |
| 10.2 | Runway Calculation Engine | Filip | Build runway formula: (current stock - reserved) / daily sales velocity | Real-time days-of-stock-remaining per SKU | 2h | ⏳ |
| 10.3 | MOQ & Lead Time Config | Filip | Add MOQ, production lead time, shipping lead time fields to Product-Supplier relationship | Supplier-specific procurement constraints | 2h | ⏳ |
| 10.4 | Reorder Point Calculator | Filip | Calculate when to reorder: lead time + safety stock + runway threshold | Automated reorder recommendations | 3h | ⏳ |
| 10.5 | Procurement Dashboard | Filip | Build procurement planning view with runway status (Healthy/Warning/Critical), suggested orders | Page at /procurement showing reorder priorities | 4h | ⏳ |
| 10.6 | Runway Status Indicators | Filip | Add color-coded runway badges throughout app (green >30d, yellow 15-30d, red <15d) | Visual runway indicators on product catalog | 2h | ⏳ |
| 10.7 | Reorder Forecasting API | Filip | Create API returning reorder recommendations with quantities, urgency, supplier suggestions | GET /api/procurement/reorder-forecast endpoint | 2h | ⏳ |
| 10.8 | Safety Stock Configuration | Filip | Allow setting safety stock levels per SKU (min/max inventory, lead time buffer) | Safety stock settings in product edit form | 2h | ⏳ |

**What Filip Creates This Week:** Complete procurement planning and runway forecasting system.

---

### Marco's Tasks - Landed Cost Calculator

| Task # | Task Name | Developer | What You're Doing | What Gets Created | Time | Status |
|--------|-----------|-----------|-------------------|-------------------|------|--------|
| 10.9 | Product Weight & Dimensions | Marco | Add fields for product weight (kg), dimensions (L/W/H cm), bulk vs non-bulk flag | Weight/dimension inputs in product form | 1h | ⏳ |
| 10.10 | Carrier Configuration | Marco | Create Carrier model with volumetric weight formulas (DHL: /5000, FedEx: /5000, Sea: /1000000) | Carrier database with calculation rules | 2h | ⏳ |
| 10.11 | Freight Cost Model | Marco | Build freight cost model: base rate per kg/CBM, fuel surcharge, handling fees by carrier | Freight pricing tables and calculation engine | 3h | ⏳ |
| 10.12 | Customs Duty Calculator | Marco | Implement duty calculation: HS code lookup, origin country, duty rate %, value threshold | Customs duty formula with country-specific rules | 3h | ⏳ |
| 10.13 | Landed Cost UI | Marco | Build landed cost breakdown interface showing: product cost, freight, duties, insurance, total | Calculator page at /products/[id]/landed-cost | 4h | ⏳ |
| 10.14 | Bulk Shipment Logic | Marco | Add bulk cargo detection (>1 CBM) and apply bulk rates instead of per-kg rates | Bulk vs express rate switching logic | 2h | ⏳ |
| 10.15 | Cost Comparison Tool | Marco | Create tool to compare landed costs across carriers and shipping methods | Side-by-side cost comparison with recommendations | 3h | ⏳ |
| 10.16 | Landed Cost API | Marco | Build API for landed cost calculation with all parameters | POST /api/products/calculate-landed-cost endpoint | 2h | ⏳ |

**What Marco Creates This Week:** Complete landed cost calculator with freight, duties, and carrier logic.

---

## WEEK 11: Enhanced PO System & Supplier Payments

### Filip's Tasks - Purchase Order Enhancement & Supplier Management

| Task # | Task Name | Developer | What You're Doing | What Gets Created | Time | Status |
|--------|-----------|-----------|-------------------|-------------------|------|--------|
| 11.1 | Supplier Model Extension | Filip | Create Supplier model separate from Factory: payment terms, currency, bank details, tax ID | Dedicated supplier database table | 2h | ⏳ |
| 11.2 | Multi-Supplier PO Support | Filip | Allow splitting PO across multiple suppliers with quantity/cost allocation per supplier | Order-Supplier junction table with line items | 3h | ⏳ |
| 11.3 | PO Pricing Fields | Filip | Add unit price, total cost, currency, exchange rate to order line items | Cost tracking on every PO line | 2h | ⏳ |
| 11.4 | Shipping Terms Config | Filip | Add incoterms dropdown (FOB, CIF, EXW, DDP) with cost responsibility matrix | Shipping terms selector with definitions | 2h | ⏳ |
| 11.5 | PO Cost Summary | Filip | Build cost breakdown view: subtotal, shipping, duties, insurance, total landed cost | Cost summary card on PO detail page | 2h | ⏳ |
| 11.6 | PO Hold/Freeze Status | Filip | Add HELD status to OrderStatus enum with hold reason, hold timestamp, release capability | Manual hold functionality with one-click release | 3h | ⏳ |
| 11.7 | Multi-Stage Hold | Filip | Implement hold at different stages: before production, before shipment, at customs | Stage-specific hold controls | 2h | ⏳ |
| 11.8 | PO Templates | Filip | Allow saving PO configurations as templates for quick reuse | Template CRUD with copy-to-new-order function | 2h | ⏳ |

**What Filip Creates This Week:** Enhanced PO system with multi-supplier, costing, and hold capabilities.

---

### Marco's Tasks - Supplier Payment & Invoice Management

| Task # | Task Name | Developer | What You're Doing | What Gets Created | Time | Status |
|--------|-----------|-----------|-------------------|-------------------|------|--------|
| 11.9 | Invoice Model | Marco | Create SupplierInvoice model: PO link, invoice number, amount, currency, due date, status | Invoice tracking database | 2h | ⏳ |
| 11.10 | Payment Schedule Tracking | Marco | Implement payment milestones: deposit %, balance %, payment triggers (PO placed, pre-shipment, on-delivery) | Payment schedule configuration per supplier | 3h | ⏳ |
| 11.11 | Invoice List Page | Marco | Build page showing all supplier invoices with filters (paid, unpaid, overdue), payment status | Page at /invoices with full invoice management | 4h | ⏳ |
| 11.12 | Invoice Payment Recording | Marco | Create payment recording form: amount, date, method, reference number, bank confirmation | Payment form with attachment upload | 2h | ⏳ |
| 11.13 | Outstanding Invoices Widget | Marco | Add dashboard card showing total outstanding invoices and amount due | Financial dashboard widget | 2h | ⏳ |
| 11.14 | Payment Terms Per Supplier | Marco | Allow setting default payment terms per supplier (Net 30, Net 60, 30/70 deposit/balance) | Payment terms configuration in supplier profile | 1h | ⏳ |
| 11.15 | Currency Conversion | Marco | Implement multi-currency support with exchange rates and conversion tracking | Currency selector + rate API integration | 3h | ⏳ |
| 11.16 | Invoice API Endpoints | Marco | Create invoice APIs: create, list, update status, record payment | Complete invoice management API | 2h | ⏳ |

**What Marco Creates This Week:** Complete supplier payment and invoice tracking system.

---

## WEEK 12: Communication Hub & Procurement Automation

### Filip's Tasks - Supplier Communication & Notifications

| Task # | Task Name | Developer | What You're Doing | What Gets Created | Time | Status |
|--------|-----------|-----------|-------------------|-------------------|------|--------|
| 12.1 | Message Model | Filip | Create Conversation and Message models: PO/shipment context, participants, attachments | Real-time messaging database schema | 2h | ⏳ |
| 12.2 | In-App Messaging UI | Filip | Build messaging interface embedded in PO/shipment view | Chat component with message history | 4h | ⏳ |
| 12.3 | Supplier Ticket System | Filip | Create ticket model for quality disputes, delays, compliance issues with status workflow | Support ticket system with categories | 3h | ⏳ |
| 12.4 | Email Integration | Filip | Add email-to-ticket conversion: suppliers can reply via email, creates ticket/message | Email parser and ticket creation automation | 3h | ⏳ |
| 12.5 | File Attachment System | Filip | Implement file upload/download for POs, invoices, QC photos, shipping docs | File storage with Vercel Blob or S3 integration | 2h | ⏳ |
| 12.6 | Notification Preferences | Filip | Build notification settings: choose channels (in-app, email, both, none) per alert type | Notification preferences page | 2h | ⏳ |
| 12.7 | Procurement Alert Rules | Filip | Create alert rules: PO confirmation, shipment dispatched, delayed, customs hold, inspection failed, price change | Alert rule engine with conditions | 3h | ⏳ |
| 12.8 | Role-Based Alert Scoping | Filip | Filter alerts by user role: sourcing sees reorder alerts, finance sees payment due, QC sees inspection | Role-based alert targeting | 1h | ⏳ |

**What Filip Creates This Week:** Complete supplier communication hub with messaging, tickets, and alerts.

---

### Marco's Tasks - Workflow Automation & Advanced Procurement

| Task # | Task Name | Developer | What You're Doing | What Gets Created | Time | Status |
|--------|-----------|-----------|-------------------|-------------------|------|--------|
| 12.9 | Auto-Reorder Workflow | Marco | Build automated PO creation when runway hits critical threshold (requires approval) | Background job suggesting/creating draft POs | 4h | ⏳ |
| 12.10 | Shipment Status Pipeline | Filip | Extend order status with: CONFIRMED, IN_TRANSIT, CUSTOMS, INSPECTED intermediate states | Enhanced shipment tracking workflow | 2h | ⏳ |
| 12.11 | Tracking Number Integration (17Track) | Filip | Add tracking number field, 17Track API integration for live shipment tracking from all carriers | Real-time shipment location updates via 17Track | 3h | ⏳ |
| 12.12 | PO Approval Workflow | Marco | Implement approval chain for POs above threshold: draft → pending approval → approved → sent | Multi-level approval system | 3h | ⏳ |
| 12.13 | Geographic Map View | Marco | Add supplier origin map on dashboard showing order distribution by country | Interactive world map with order pins | 3h | ⏳ |
| 12.14 | Pie Chart Analytics | Marco | Add pie charts for: orders by category, inventory by supplier, costs by factory | Pie chart components for dashboard | 2h | ⏳ |
| 12.15 | Period Comparison Charts | Marco | Add WoW, MoM, YoY comparison views for all KPIs with variance indicators | Comparison mode toggle on dashboard | 2h | ⏳ |
| 12.16 | Procurement Export | Marco | Build comprehensive export: procurement report, inventory valuation, supplier performance | CSV/Excel export for all procurement data | 1h | ⏳ |

**What Marco Creates This Week:** Procurement automation, enhanced tracking, and advanced analytics.

---

**End of Week 12 / Phase 4 Result:**
- ✅ Complete inventory management with real-time stock tracking
- ✅ Product catalog with SKU master data
- ✅ Reorder forecasting with runway calculations
- ✅ Landed cost calculator with freight and customs
- ✅ Supplier payment and invoice tracking
- ✅ Inbound pipeline visibility
- ✅ Supplier communication hub with messaging and tickets
- ✅ Procurement alerts and workflow automation
- ✅ Enhanced PO system with multi-supplier, costing, and holds
- ✅ Geographic maps and advanced analytics
- **MILESTONE: Full-featured procurement platform! 🎯**

---

## Updated Summary: Total Work Division

### Phase 4 (Weeks 9-12) Additions:

**Filip's New Responsibilities (+32 tasks):**
- Inventory & product catalog (8 tasks)
- Reorder forecasting & runway (8 tasks)
- Enhanced PO & supplier management (8 tasks)
- Communication hub & notifications (8 tasks)

**Marco's New Responsibilities (+32 tasks):**
- Inbound pipeline & stock visibility (8 tasks)
- Landed cost calculator (8 tasks)
- Supplier payments & invoices (8 tasks)
- Workflow automation & analytics (8 tasks)

### Updated Weekly Goals:
- **Week 9:** Tasks 9.1 - 9.16 (Inventory Foundation)
- **Week 10:** Tasks 10.1 - 10.16 (Procurement Planning & Costs)
- **Week 11:** Tasks 11.1 - 11.16 (Enhanced PO & Payments)
- **Week 12:** Tasks 12.1 - 12.16 (Communication & Automation)

**New Total: ~184 tasks over 12 weeks = Complete Procurement Platform! 🎉**

---

## Backlog — Planned Features (Not Yet Scheduled)

### BL-1: Project Selector for Dashboard ⏳
**Priority:** High | **Estimated Effort:** Medium | **Developer:** TBD

**Summary:** Add a "Project" concept so the client can group orders by project (e.g. "Lense", "Summer Collection") and filter the entire dashboard by project via a dropdown.

**Subtasks:**
- [ ] BL-1.1 — Add `Project` model to Prisma schema (`id`, `name`, `organizationId`) + optional `projectId` on Order
- [ ] BL-1.2 — Create Project CRUD API (`GET /api/projects`, `POST /api/projects`)
- [ ] BL-1.3 — Create `ProjectProvider` React context (shared `projectId` state for dashboard)
- [ ] BL-1.4 — Create `ProjectSelector` dropdown component (icon + name + chevron, "All Projects" default, inline create)
- [ ] BL-1.5 — Wire `ProjectProvider` + `ProjectSelector` into dashboard page (above period selector)
- [ ] BL-1.6 — Update 8 dashboard API endpoints to accept `?projectId=` filter (stats, best-sellers, reorder, status-breakdown, product-portfolio, factory-stats, trends, recent-activity)
- [ ] BL-1.7 — Update 8 dashboard client components to read `projectId` from context and pass to fetch URLs
- [ ] BL-1.8 — Add project dropdown to order create/edit forms + update order API to accept `projectId`

**Notes:**
- Exchange rates endpoint does NOT need project filtering (not order-scoped)
- `projectId` is nullable — existing orders remain valid with no project
- Full plan documented at `.claude/plans/reactive-scribbling-island.md`

