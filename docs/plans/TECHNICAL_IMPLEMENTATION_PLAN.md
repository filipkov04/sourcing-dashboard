# Sourcing Dashboard - Technical Implementation Plan
## Ex-FAANG Engineering Approach

**Author Perspective:** Senior Software Engineer (10+ years at Meta/Google scale)
**Last Updated:** 2026-01-29
**Estimated Timeline:** 8 weeks (2 developers)
**Risk Level:** Medium (manageable with proper planning)

---

## Table of Contents

### 📱 FOR NON-TECHNICAL FOUNDERS (READ THIS FIRST!)
0. [Guide for Non-Technical Founders](#guide-for-non-technical-founders)

### 🔧 FOR TECHNICAL TEAM
1. [Executive Summary](#executive-summary)
2. [Technical Architecture](#technical-architecture)
3. [Database Design](#database-design)
4. [API Architecture](#api-architecture)
5. [Authentication & Authorization](#authentication--authorization)
6. [Integration Framework](#integration-framework)
7. [Phase-by-Phase Implementation](#phase-by-phase-implementation)
8. [Testing Strategy](#testing-strategy)
9. [Deployment & Infrastructure](#deployment--infrastructure)
10. [Performance & Scalability](#performance--scalability)
11. [Security Considerations](#security-considerations)
12. [Monitoring & Observability](#monitoring--observability)
13. [Risk Mitigation](#risk-mitigation)

---

## Guide for Non-Technical Founders

**👋 Hi! If you're not a developer, this section is for you.**

This document is 200+ pages of technical details for the engineering team. You don't need to read all of it. This section explains everything you need to know in plain English.

---

### What Are We Building?

**In One Sentence:**
A web dashboard where brands can see real-time production status from all their factories, without sending a single email.

**The Problem We're Solving:**
Right now, brands email factories constantly asking "What's the status?" It takes days to get responses, information is often outdated, and it's impossible to track 50+ orders across 10+ factories.

**Our Solution:**
- Brands log into our dashboard
- See all orders from all factories in one place
- Progress updates automatically (no manual work)
- Alerts when orders are delayed
- Everything organized and visual

**Think of it like:**
- Shopify for production tracking (instead of e-commerce)
- Mint.com for factory orders (instead of bank accounts)
- Trello for manufacturing (instead of project management)

---

### What Can You Actually DO With This?

#### Week 3 (Phase 1 Complete):
✅ **Create factories** - Add all your manufacturing partners
✅ **Create orders** - Track every PO you place
✅ **Update progress** - Manually update production status
✅ **View dashboard** - See all orders at a glance
✅ **Invite team** - Add your colleagues
✅ **Track stages** - See cutting, sewing, QC, packaging progress

**What it looks like:**
- Login page (email + password)
- Dashboard homepage (shows key numbers)
- Factories page (list of all your factories)
- Orders page (list of all orders with filters)
- Order detail page (see progress, add notes, upload files)

**Use case:** You can start using the platform immediately to track orders manually (like a smart spreadsheet).

---

#### Week 5 (Phase 2 Complete):
Everything from Phase 1, PLUS:

✅ **Beautiful charts** - Visual analytics (pie charts, line graphs, timelines)
✅ **Automatic alerts** - Get notified when orders are delayed
✅ **Email notifications** - Weekly digests and urgent alerts
✅ **Timeline view** - See all orders on a Gantt chart
✅ **Performance tracking** - Which factories deliver on time?

**What changes:**
- Dashboard has colorful charts showing trends
- Email notifications when important things happen
- Better visibility into factory performance
- Easier to spot problems early

**Use case:** Platform becomes proactive - it tells YOU about problems instead of you discovering them.

---

#### Week 8 (Phase 3 Complete):
Everything from Phases 1-2, PLUS:

✅ **Automatic factory connections** - No more manual updates!
✅ **Real-time sync** - Data updates every 15 minutes
✅ **Multiple connection methods** - Works with SAP, Oracle, SFTP, webhooks
✅ **Integration dashboard** - Monitor connection health
✅ **Audit logs** - See every data sync

**What changes:**
- You stop manually updating order progress
- Factory systems automatically send updates
- Data is always fresh (15-minute max delay)
- Zero email exchanges for status updates

**Use case:** This is the game-changer. Your team saves 10+ hours/week, data is 100% accurate, and you have real-time visibility.

---

### Timeline & Milestones

```
Week 1-2: Building Foundation
├─ Database setup
├─ Basic pages (login, factories, orders)
└─ You can start testing by Week 2

Week 3: Polish & Team Features
├─ Invite team members
├─ Better design
└─ ✅ MILESTONE: Platform usable for manual tracking

Week 4-5: Analytics & Alerts
├─ Charts and graphs
├─ Alert system
└─ ✅ MILESTONE: Platform is helpful and proactive

Week 6-7: Integration Framework
├─ Connect to factory systems
├─ Build adapters for different systems
└─ Testing with pilot factories

Week 8: Testing & Launch
├─ Test with 2-3 real factories
├─ Fix bugs
└─ ✅ MILESTONE: Ready for production launch
```

**Key Dates:**
- **End of Week 3:** Start using platform for real work
- **End of Week 5:** Platform becomes your daily tool
- **End of Week 8:** Factory integrations live

---

### What Do YOU Need to Do?

As a non-technical founder, here's your role:

#### Week 0 (Before Development Starts):
- [ ] **Read plan.md** - Understand the business strategy
- [ ] **Identify pilot factories** - Which 2-3 factories will test integrations?
- [ ] **Talk to factories** - Would they share production data?
- [ ] **Gather factory info** - What systems do they use? (SAP, Oracle, custom, Excel?)
- [ ] **List requirements** - What data fields do you need?
- [ ] **Setup accounts** - Email provider, hosting, domain name

#### Week 1-2 (During Foundation Building):
- [ ] **Review progress daily** - Developers will show you working features
- [ ] **Test the platform** - Try creating factories and orders
- [ ] **Give feedback** - "This button should be here", "Can we add X field?"
- [ ] **Prepare test data** - Real factory names, real orders (for testing)

#### Week 3-5 (During Analytics Building):
- [ ] **Use the platform daily** - Track real orders
- [ ] **Report bugs** - "This page is slow", "This button doesn't work"
- [ ] **Request features** - "Can we add a search?", "Can we export to Excel?"
- [ ] **Invite teammates** - Get your team using it

#### Week 6-8 (During Integration Building):
- [ ] **Coordinate with pilot factories** - Introduce dev team to factory IT
- [ ] **Facilitate meetings** - Join calls between dev team and factory
- [ ] **Validate data** - Check that synced data looks correct
- [ ] **Document lessons** - What worked? What didn't?

#### Post-Launch:
- [ ] **Onboard factories** - Roll out to all your factories
- [ ] **Onboard brands** - If you sell to other brands, sign them up
- [ ] **Gather feedback** - What do users love? What's missing?
- [ ] **Prioritize features** - What to build next?

---

### How to Track Progress

#### Daily Check-ins (5 minutes):
Ask developers:
1. "What did you finish yesterday?"
2. "What are you working on today?"
3. "Any blockers I can help with?"

#### Weekly Demos (30 minutes):
Every Friday:
- Developers show working features
- You test live
- Give feedback
- Plan next week

#### Use GitHub:
- Check https://github.com/filipkov04/sourcing-dashboard
- Look at "Issues" tab - see what's being worked on
- Look at "Commits" tab - see daily progress
- Don't worry about understanding the code!

---

### Budget & Costs

#### Development Costs:
- **Your developers:** Whatever you're paying them (8 weeks of work)
- **This plan:** Free (open source tools)

#### Operational Costs (Monthly):

**Phase 1-2 (Weeks 1-5): ~$25/month**
- Database (PostgreSQL): $0 (free tier) or $5/month
- Hosting (Vercel): $0 (free tier)
- Email (Resend): $0 (free tier for 3,000 emails/month)
- Domain: $10/year

**Phase 3+ (Week 6+): ~$75/month**
- Everything from Phase 1-2: $25
- Redis (for background jobs): $10/month
- Database (upgraded): $20/month
- Hosting (more users): $20/month
- Monitoring (Sentry): $0 (free tier)

**At Scale (100+ users, 50+ factories): ~$200-500/month**
- Database: $50-100/month
- Hosting: $100-300/month
- Redis: $20/month
- Email: $20-50/month
- Monitoring: $10-30/month

**Good News:**
- Costs scale with usage (no big upfront costs)
- Free tiers are generous (can use for months)
- Can upgrade gradually as you grow

---

### When Can You Start Using It?

**Week 2:** Developers will give you a test URL (like https://sourcing-dashboard-preview.vercel.app)
- You can log in
- Create test factories and orders
- Give feedback
- Not ready for real customers yet

**Week 3:** Platform is stable enough for real use
- Add your real factories
- Track real orders
- Invite your team
- Still improving daily

**Week 5:** Platform is polished
- All features working smoothly
- Good design and UX
- Can show to customers (if applicable)

**Week 8:** Production-ready
- Fast and reliable
- Integrations working
- Ready to onboard everyone

---

### How to Give Feedback

#### During Development (Weeks 1-8):

**Good Feedback:**
- ✅ "Can you add a search bar to the orders page?"
- ✅ "This button is confusing, can we rename it to 'Add Factory'?"
- ✅ "The order list is slow when I have 50+ orders"
- ✅ "I need to export this data to Excel for my boss"

**Not Helpful:**
- ❌ "Can you make it look like Apple's website?" (too vague)
- ❌ "Add AI" (what AI? for what?)
- ❌ "Make it faster" (faster how? what's slow?)

**How to Report Bugs:**
1. Take a screenshot
2. Describe what you did ("I clicked 'Create Order'")
3. Describe what happened ("Got an error message")
4. Describe what you expected ("Should create the order")

#### Prioritizing Features:

**Must Have (Week 1-8):**
- Login/logout
- Create factories
- Create orders
- Track progress
- View dashboard
- Basic charts
- Alerts
- Factory integrations

**Nice to Have (Post-Launch):**
- Mobile app
- Advanced analytics
- Custom reports
- PDF exports
- Multiple languages

**Future (Maybe):**
- AI predictions
- Chatbot
- IoT integrations
- Blockchain (probably not needed!)

---

### Common Questions

#### "How do I know it's working?"
- You can log in and use it
- No error messages
- Data saves correctly
- Developers say it's working

#### "What if we need to change something?"
- Before Week 3: Easy to change anything
- Weeks 3-6: Medium difficulty, might take a few days
- After Week 8: Harder, requires planning

**Tip:** Give feedback early! Week 1 changes take 1 hour. Week 7 changes take 1 day.

#### "What if a factory refuses to integrate?"
- They can still use it manually (they log in and update)
- Try with other factories first
- Show them how much time they save
- Make it a requirement for doing business

#### "What if we run out of time?"
- Phase 1 (manual tracking) is still valuable
- Launch with manual entry, add integrations later
- Most important: Launch something, improve iteratively

#### "How secure is this?"
- Industry-standard security (same as banks use)
- Encrypted passwords
- HTTPS everywhere
- Regular security audits
- Factory credentials encrypted at rest

#### "Can we add more features later?"
- Yes! That's the whole point of software
- But launch MVP first (8 weeks)
- Then add features based on real usage
- Don't try to build everything at once

#### "What if developers get stuck?"
- They have this detailed plan to follow
- Most problems are googleable
- Worst case: Takes an extra week
- Buffer time built into timeline

---

### Red Flags to Watch For

#### Technical Red Flags:
- 🚩 Developers working on same files → conflicts
- 🚩 No demos for 2+ weeks → something wrong
- 🚩 "We need to rewrite everything" → poor planning
- 🚩 Adding features not in the plan → scope creep
- 🚩 No tests → will break in production

**What to do:** Ask developers to explain. Reference this plan.

#### Process Red Flags:
- 🚩 Developers not communicating daily
- 🚩 No code pushed to GitHub for days
- 🚩 Constantly changing direction
- 🚩 Making it "perfect" before launching

**What to do:** Weekly check-ins, hold team accountable, stick to timeline.

---

### Success Looks Like

#### Week 3:
- ✅ You can track 10 orders across 3 factories
- ✅ Your team logs in daily
- ✅ No major bugs
- ✅ Saves you 2 hours/week vs spreadsheets

#### Week 5:
- ✅ Platform is your go-to tool
- ✅ Charts help you spot delays early
- ✅ Alerts catch problems before customers complain
- ✅ Saves you 5 hours/week

#### Week 8:
- ✅ 2 factories auto-syncing successfully
- ✅ Data updates every 15 minutes
- ✅ Zero manual status emails to those factories
- ✅ Saves you 10+ hours/week

#### 6 Months:
- ✅ 10+ factories on platform
- ✅ 5+ with automatic integrations
- ✅ 100+ orders tracked
- ✅ Team can't imagine going back to old way

---

### Your Role as Founder

**You are NOT expected to:**
- ❌ Understand the code
- ❌ Know what Prisma, Next.js, or Redis means
- ❌ Debug technical issues
- ❌ Write any code

**You ARE expected to:**
- ✅ Define what success looks like
- ✅ Make business decisions (which features matter?)
- ✅ Connect dev team with factories
- ✅ Test the platform and give feedback
- ✅ Prioritize features
- ✅ Remove blockers (get access, make intros, etc.)
- ✅ Celebrate wins with the team

**Your job:** Be the bridge between developers and customers (factories/brands).

---

### Final Thoughts

**This is ambitious but achievable.**

The plan is detailed, the team has a clear roadmap, and the technology is proven (we're not inventing anything new, just combining existing tools smartly).

**Keys to success:**
1. **Trust the process** - Plan is detailed, follow it
2. **Test early, test often** - Don't wait until Week 8 to try it
3. **Give clear feedback** - Specific is better than general
4. **Don't change scope** - Build what's in the plan, add more later
5. **Celebrate milestones** - Week 3, 5, 8 are achievements!

**You've got this!** 🚀

Questions? Ask your dev team to explain any part of this document in plain English.

---

## Executive Summary

### Business Context
Per `plan.md`, we're building a sourcing dashboard that connects to factory ERP systems (SAP, Oracle, custom) to automatically pull production data, eliminating manual status updates.

### Technical Approach
- **Phase 1 (Weeks 1-3):** Foundation - Manual CRUD operations
- **Phase 2 (Weeks 4-5):** Visualization - Charts, alerts, real-time updates
- **Phase 3 (Weeks 6-8):** Integration - Automatic factory system connections
- **Phase 4+:** Shipping integrations, advanced features

### Success Metrics
- 95%+ uptime
- <200ms p95 API response time
- Support 100+ concurrent users
- Handle 1000+ orders across 50+ factories
- 99.9% data sync accuracy
- <5 minute integration setup time (after pilot)

---

## Technical Architecture

### High-Level System Design

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
├─────────────────────────────────────────────────────────────┤
│  Next.js 14+ App Router                                     │
│  - React Server Components (default)                         │
│  - Client Components (interactive UI)                        │
│  - Server Actions (mutations)                                │
│  - Parallel Routes (dashboard views)                         │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                       │
├─────────────────────────────────────────────────────────────┤
│  API Routes (app/api/*)                                      │
│  - RESTful endpoints                                         │
│  - NextAuth.js authentication                                │
│  - Middleware (rate limiting, auth checks)                   │
│                                                               │
│  Server Actions (lib/actions/*)                              │
│  - Direct database mutations                                 │
│  - Type-safe with Zod validation                             │
│  - Automatic revalidation                                    │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                       DATA LAYER                             │
├─────────────────────────────────────────────────────────────┤
│  Prisma ORM → PostgreSQL                                     │
│  - Type-safe queries                                         │
│  - Migrations                                                │
│  - Connection pooling                                        │
│                                                               │
│  Redis (Phase 3+)                                            │
│  - Job queue (BullMQ)                                        │
│  - Caching layer                                             │
│  - Rate limiting                                             │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   INTEGRATION LAYER (Phase 3)                │
├─────────────────────────────────────────────────────────────┤
│  Factory Connectors                                          │
│  - SAP adapter                                               │
│  - Oracle adapter                                            │
│  - Generic REST/SOAP adapter                                 │
│  - SFTP/File watcher                                         │
│  - Webhook receiver                                          │
│                                                               │
│  Background Jobs (BullMQ + Redis)                            │
│  - Polling scheduler (every 15 min)                          │
│  - Retry logic with exponential backoff                      │
│  - Dead letter queue                                         │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack Decisions

#### Frontend
- **Next.js 14+ with App Router** (TypeScript)
  - Why: RSC for performance, built-in routing, API routes
  - Server Components by default = less JS shipped
  - Parallel routes for dashboard layout

- **Tailwind CSS v4**
  - Why: Utility-first, fast development, small bundle
  - Consistent design system

- **shadcn/ui components**
  - Why: Accessible, customizable, tree-shakeable
  - Copy-paste approach = no dependency bloat

- **React Hook Form + Zod**
  - Why: Performance (uncontrolled), type-safe validation
  - Server + client validation with shared schemas

#### Backend
- **Next.js API Routes + Server Actions**
  - Why: Unified codebase, easy deployment
  - Server Actions for mutations (fewer API calls)
  - API routes for third-party integrations

- **Prisma ORM**
  - Why: Type-safe, great DX, migrations
  - Supports multiple databases

- **PostgreSQL**
  - Why: Reliable, ACID, JSON support, full-text search
  - Better than MySQL for complex queries
  - Free tier on Vercel/Railway/Neon

#### Authentication
- **NextAuth.js v5 (Auth.js)**
  - Why: Built for Next.js, supports multiple providers
  - Session management, JWT, database sessions
  - Email + OAuth ready

#### Background Jobs (Phase 3)
- **BullMQ + Redis**
  - Why: Reliable job queue, retries, scheduling
  - Better than cron jobs (distributed, fault-tolerant)
  - Redis also used for caching

#### Deployment
- **Vercel** (Primary)
  - Why: Zero-config Next.js deployment
  - Edge functions, automatic scaling
  - Preview deployments per PR

- **Alternative: Railway/Render** (if Vercel limits hit)

---

## Database Design

### Entity-Relationship Model

```
User (brands login here)
  ├─ has many → Organizations
  └─ has many → Sessions

Organization (the brand company)
  ├─ has many → Users (team members)
  ├─ has many → Factories
  └─ has many → Orders

Factory (manufacturer)
  ├─ belongs to → Organization
  ├─ has one → FactoryIntegration (optional)
  ├─ has many → Orders
  └─ has many → AuditLogs

Order (production order)
  ├─ belongs to → Factory
  ├─ belongs to → Organization
  ├─ has many → OrderStages
  ├─ has many → OrderUpdates (timeline)
  └─ has many → Attachments

OrderStage (cutting, sewing, finishing, etc.)
  ├─ belongs to → Order
  └─ tracks progress (0-100%)

FactoryIntegration (Phase 3)
  ├─ belongs to → Factory
  ├─ stores encrypted credentials
  ├─ has many → IntegrationLogs
  └─ has one → SyncSchedule

IntegrationLog (audit trail)
  ├─ belongs to → FactoryIntegration
  └─ tracks sync success/failures

Alert (Phase 2)
  ├─ belongs to → Organization
  ├─ relates to → Order (optional)
  └─ has many → AlertDeliveries
```

### Prisma Schema (Complete)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// AUTHENTICATION & USERS
// ============================================

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  emailVerified DateTime?
  name          String?
  password      String?   // hashed with bcrypt
  image         String?
  role          UserRole  @default(USER)

  // Relations
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  accounts       Account[]
  sessions       Session[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([organizationId])
  @@index([email])
}

enum UserRole {
  OWNER       // Can manage billing, delete org
  ADMIN       // Can manage users, factories
  MEMBER      // Can view and edit orders
  VIEWER      // Read-only access
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@index([userId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

// ============================================
// CORE ENTITIES
// ============================================

model Organization {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique  // for URLs: /org/acme-fashion
  logo        String?

  // Subscription (future)
  plan        Plan     @default(FREE)
  stripeCustomerId String?

  // Relations
  users       User[]
  factories   Factory[]
  orders      Order[]
  alerts      Alert[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([slug])
}

enum Plan {
  FREE
  STARTER
  PROFESSIONAL
  ENTERPRISE
}

model Factory {
  id              String   @id @default(cuid())
  name            String
  location        String   // "Guangzhou, China"
  address         String?  @db.Text

  // Contact info
  contactName     String?
  contactEmail    String?
  contactPhone    String?

  // Metadata
  specialties     String[] // ["Apparel", "Footwear"]
  certifications  String[] // ["ISO 9001", "BSCI"]
  notes           String?  @db.Text

  // Integration status
  integrationStatus IntegrationStatus @default(MANUAL)

  // Relations
  organizationId  String
  organization    Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  integration     FactoryIntegration?
  orders          Order[]

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([organizationId])
  @@index([integrationStatus])
}

enum IntegrationStatus {
  MANUAL         // No integration, manual entry
  CONFIGURED     // Integration set up, not tested
  CONNECTED      // Integration working
  ERROR          // Integration failing
  DISABLED       // Integration paused by user
}

model Order {
  id              String   @id @default(cuid())
  orderNumber     String   // Brand's PO number

  // Product info
  productName     String
  productSKU      String?
  quantity        Int
  unit            String   @default("pieces") // pieces, meters, kg

  // Progress
  overallProgress Int      @default(0) // 0-100
  status          OrderStatus @default(PENDING)

  // Dates
  orderDate       DateTime
  expectedDate    DateTime
  actualDate      DateTime?

  // Additional info
  notes           String?  @db.Text
  priority        Priority @default(NORMAL)
  tags            String[] // ["urgent", "sample", "production"]

  // Relations
  organizationId  String
  organization    Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  factoryId       String
  factory         Factory  @relation(fields: [factoryId], references: [id], onDelete: Cascade)
  stages          OrderStage[]
  updates         OrderUpdate[]
  attachments     Attachment[]

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([organizationId, orderNumber]) // PO numbers unique per org
  @@index([organizationId])
  @@index([factoryId])
  @@index([status])
  @@index([expectedDate])
}

enum OrderStatus {
  PENDING        // Order placed, not started
  IN_PROGRESS    // Production started
  DELAYED        // Behind schedule
  COMPLETED      // Production complete
  SHIPPED        // Shipped to brand
  DELIVERED      // Received by brand
  CANCELLED      // Order cancelled
}

enum Priority {
  LOW
  NORMAL
  HIGH
  URGENT
}

model OrderStage {
  id          String   @id @default(cuid())
  orderId     String
  order       Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)

  // Stage info
  name        String   // "Cutting", "Sewing", "Quality Check"
  sequence    Int      // Order of stages: 1, 2, 3
  progress    Int      @default(0) // 0-100
  status      StageStatus @default(NOT_STARTED)

  // Dates
  startedAt   DateTime?
  completedAt DateTime?

  notes       String?  @db.Text

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([orderId, sequence])
  @@index([orderId])
}

enum StageStatus {
  NOT_STARTED
  IN_PROGRESS
  COMPLETED
  SKIPPED
}

model OrderUpdate {
  id          String   @id @default(cuid())
  orderId     String
  order       Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)

  // Update info
  message     String   @db.Text
  type        UpdateType @default(STATUS)

  // Metadata
  source      String   @default("manual") // "manual", "integration", "webhook"
  createdBy   String?  // User ID or "system"

  createdAt   DateTime @default(now())

  @@index([orderId])
  @@index([createdAt])
}

enum UpdateType {
  STATUS      // Status changed
  PROGRESS    // Progress updated
  NOTE        // General note added
  ISSUE       // Problem reported
  RESOLVED    // Issue resolved
}

model Attachment {
  id          String   @id @default(cuid())
  orderId     String
  order       Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)

  fileName    String
  fileUrl     String   // S3/Vercel Blob URL
  fileSize    Int      // bytes
  mimeType    String

  uploadedBy  String?  // User ID
  createdAt   DateTime @default(now())

  @@index([orderId])
}

// ============================================
// INTEGRATION SYSTEM (Phase 3)
// ============================================

model FactoryIntegration {
  id          String   @id @default(cuid())
  factoryId   String   @unique
  factory     Factory  @relation(fields: [factoryId], references: [id], onDelete: Cascade)

  // Integration type
  type        IntegrationType

  // Connection details (encrypted)
  config      Json     // Stores connection credentials, URLs, etc.
  // Example config for API:
  // {
  //   "apiUrl": "https://factory-erp.com/api",
  //   "username": "dashboard_readonly",
  //   "password": "encrypted_password",
  //   "apiKey": "encrypted_api_key"
  // }

  // Sync settings
  syncFrequency Int    @default(15) // minutes
  lastSyncAt    DateTime?
  nextSyncAt    DateTime?

  // Status
  enabled       Boolean @default(true)
  healthStatus  HealthStatus @default(UNKNOWN)
  lastError     String? @db.Text

  // Metadata
  dataMapping   Json?    // Maps factory fields to our fields
  // Example:
  // {
  //   "orderNumber": "PO_NUM",
  //   "progress": "PCT_COMPLETE",
  //   "status": "ORDER_STATUS"
  // }

  logs          IntegrationLog[]

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([enabled])
  @@index([nextSyncAt])
}

enum IntegrationType {
  API_REST       // Direct REST API connection
  API_SOAP       // SOAP API connection
  SFTP_CSV       // SFTP file transfer (CSV)
  SFTP_JSON      // SFTP file transfer (JSON)
  WEBHOOK        // Factory pushes to us
  OAUTH2         // OAuth-based connection
  CUSTOM         // Custom integration
}

enum HealthStatus {
  UNKNOWN        // Not tested yet
  HEALTHY        // Working normally
  DEGRADED       // Working but slow/issues
  UNHEALTHY      // Failing
}

model IntegrationLog {
  id            String   @id @default(cuid())
  integrationId String
  integration   FactoryIntegration @relation(fields: [integrationId], references: [id], onDelete: Cascade)

  // Log details
  type          LogType
  message       String   @db.Text
  success       Boolean
  duration      Int?     // milliseconds

  // Data
  requestData   Json?    // What we sent (sanitized)
  responseData  Json?    // What we received (sanitized)
  errorDetails  Json?    // Error stack/details

  createdAt     DateTime @default(now())

  @@index([integrationId])
  @@index([createdAt])
  @@index([success])
}

enum LogType {
  SYNC_START
  SYNC_SUCCESS
  SYNC_ERROR
  TEST_CONNECTION
  CONFIGURATION_CHANGE
}

// ============================================
// ALERTS & NOTIFICATIONS (Phase 2)
// ============================================

model Alert {
  id              String   @id @default(cuid())
  organizationId  String
  organization    Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  // Alert details
  title           String
  message         String   @db.Text
  severity        Severity @default(INFO)

  // Related entity
  orderId         String?
  factoryId       String?

  // Status
  read            Boolean  @default(false)
  resolved        Boolean  @default(false)
  resolvedAt      DateTime?
  resolvedBy      String?  // User ID

  createdAt       DateTime @default(now())

  @@index([organizationId])
  @@index([read])
  @@index([createdAt])
}

enum Severity {
  INFO
  WARNING
  ERROR
  CRITICAL
}
```

### Database Indexing Strategy

**Why indexes matter:** Queries on 1000+ orders without indexes = 500ms+. With indexes = <50ms.

```sql
-- Orders: Most common queries
CREATE INDEX idx_orders_org_status ON "Order"(organizationId, status);
CREATE INDEX idx_orders_org_date ON "Order"(organizationId, expectedDate DESC);
CREATE INDEX idx_orders_factory_status ON "Order"(factoryId, status);

-- Full-text search on orders (PostgreSQL)
CREATE INDEX idx_orders_search ON "Order" USING gin(to_tsvector('english', productName || ' ' || orderNumber));

-- Integration logs: Time-series data
CREATE INDEX idx_integration_logs_time ON "IntegrationLog"(integrationId, createdAt DESC);

-- Partial index for failed syncs (smaller, faster)
CREATE INDEX idx_integration_logs_errors ON "IntegrationLog"(integrationId) WHERE success = false;
```

### Data Migration Strategy

**Phase 1 → Phase 2:** Add Alert tables (non-breaking)
**Phase 2 → Phase 3:** Add Integration tables (non-breaking)

```bash
# Generate migration
npx prisma migrate dev --name add_alerts

# Review SQL before applying to production
cat prisma/migrations/*/migration.sql

# Apply to production (zero downtime)
npx prisma migrate deploy
```

---

## API Architecture

### REST API Design Principles

1. **RESTful URLs** - Resource-oriented
2. **HTTP Methods** - GET (read), POST (create), PATCH (update), DELETE (delete)
3. **Status Codes** - 200 (OK), 201 (Created), 400 (Bad Request), 401 (Unauthorized), 404 (Not Found), 500 (Server Error)
4. **Consistent Response Format**
5. **Versioning** - `/api/v1/` (future-proof)

### API Response Format (Standardized)

```typescript
// lib/api/response.ts

export type ApiResponse<T = any> =
  | { success: true; data: T }
  | { success: false; error: ApiError };

export interface ApiError {
  code: string;           // "ORDER_NOT_FOUND"
  message: string;        // "Order with ID xyz not found"
  details?: any;          // Additional context
  statusCode: number;     // 400, 404, 500, etc.
}

// Helper functions
export function successResponse<T>(data: T): ApiResponse<T> {
  return { success: true, data };
}

export function errorResponse(
  code: string,
  message: string,
  statusCode: number = 400,
  details?: any
): ApiResponse {
  return {
    success: false,
    error: { code, message, statusCode, details }
  };
}
```

### API Endpoints Specification

#### Authentication

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
GET    /api/auth/session
```

#### Organizations

```
GET    /api/organizations                 # List user's orgs
POST   /api/organizations                 # Create new org
GET    /api/organizations/[id]            # Get org details
PATCH  /api/organizations/[id]            # Update org
DELETE /api/organizations/[id]            # Delete org

# Team management
GET    /api/organizations/[id]/members    # List team
POST   /api/organizations/[id]/members    # Invite member
DELETE /api/organizations/[id]/members/[userId]  # Remove member
PATCH  /api/organizations/[id]/members/[userId]  # Update role
```

#### Factories

```
GET    /api/factories                     # List all factories
POST   /api/factories                     # Create factory
GET    /api/factories/[id]                # Get factory details
PATCH  /api/factories/[id]                # Update factory
DELETE /api/factories/[id]                # Delete factory

# Factory statistics
GET    /api/factories/[id]/stats          # Order stats, performance
GET    /api/factories/[id]/orders         # Orders for this factory
```

#### Orders

```
GET    /api/orders                        # List orders (with filters)
POST   /api/orders                        # Create order
GET    /api/orders/[id]                   # Get order details
PATCH  /api/orders/[id]                   # Update order
DELETE /api/orders/[id]                   # Delete order

# Order stages
POST   /api/orders/[id]/stages            # Add stage
PATCH  /api/orders/[id]/stages/[stageId] # Update stage progress
DELETE /api/orders/[id]/stages/[stageId] # Remove stage

# Order updates/timeline
GET    /api/orders/[id]/updates           # Get timeline
POST   /api/orders/[id]/updates           # Add update

# Attachments
POST   /api/orders/[id]/attachments       # Upload file
DELETE /api/orders/[id]/attachments/[fileId]  # Delete file
```

#### Integration (Phase 3)

```
# Integration setup
POST   /api/factories/[id]/integration    # Create integration
GET    /api/factories/[id]/integration    # Get integration details
PATCH  /api/factories/[id]/integration    # Update integration
DELETE /api/factories/[id]/integration    # Remove integration

# Integration testing
POST   /api/factories/[id]/integration/test      # Test connection
POST   /api/factories/[id]/integration/sync      # Trigger manual sync
GET    /api/factories/[id]/integration/logs      # Get sync logs

# Webhook receiver (factory pushes to us)
POST   /api/webhooks/[factoryId]          # Receive factory updates
```

#### Alerts (Phase 2)

```
GET    /api/alerts                        # Get alerts (unread count)
PATCH  /api/alerts/[id]/read              # Mark as read
PATCH  /api/alerts/[id]/resolve           # Resolve alert
DELETE /api/alerts/[id]                   # Dismiss alert
```

#### Analytics/Dashboard

```
GET    /api/dashboard/stats               # Overview stats
GET    /api/dashboard/chart/orders        # Order trends data
GET    /api/dashboard/chart/factories     # Factory performance
GET    /api/dashboard/recent-activity     # Recent updates
```

### API Request/Response Examples

#### Create Order

```typescript
// POST /api/orders
// Request body:
{
  "factoryId": "clx1234567890",
  "orderNumber": "PO-2024-001",
  "productName": "Cotton T-Shirt - Navy",
  "productSKU": "TS-NAV-001",
  "quantity": 5000,
  "unit": "pieces",
  "orderDate": "2024-02-01T00:00:00Z",
  "expectedDate": "2024-03-15T00:00:00Z",
  "priority": "HIGH",
  "stages": [
    { "name": "Fabric Cutting", "sequence": 1 },
    { "name": "Sewing", "sequence": 2 },
    { "name": "Quality Check", "sequence": 3 },
    { "name": "Packaging", "sequence": 4 }
  ]
}

// Response: 201 Created
{
  "success": true,
  "data": {
    "id": "clx9876543210",
    "orderNumber": "PO-2024-001",
    "productName": "Cotton T-Shirt - Navy",
    // ... full order object
    "stages": [
      { "id": "stage1", "name": "Fabric Cutting", "progress": 0, "status": "NOT_STARTED" },
      // ... other stages
    ]
  }
}
```

#### List Orders with Filters

```typescript
// GET /api/orders?status=IN_PROGRESS&factoryId=clx123&page=1&limit=20&sortBy=expectedDate&sortOrder=asc

// Response: 200 OK
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": "clx9876543210",
        "orderNumber": "PO-2024-001",
        "productName": "Cotton T-Shirt - Navy",
        "overallProgress": 45,
        "status": "IN_PROGRESS",
        "factory": {
          "id": "clx123",
          "name": "Guangzhou Textile Co."
        },
        "expectedDate": "2024-03-15T00:00:00Z",
        "daysUntilDue": 23
      },
      // ... more orders
    ],
    "pagination": {
      "total": 156,
      "page": 1,
      "limit": 20,
      "totalPages": 8,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

#### Update Order Progress

```typescript
// PATCH /api/orders/[id]/stages/[stageId]
// Request body:
{
  "progress": 75,
  "status": "IN_PROGRESS",
  "notes": "Sewing 75% complete, on track"
}

// Response: 200 OK
{
  "success": true,
  "data": {
    "id": "stage2",
    "name": "Sewing",
    "progress": 75,
    "status": "IN_PROGRESS",
    "updatedAt": "2024-02-20T10:30:00Z"
  }
}

// Side effect: Order's overallProgress auto-calculated
// Alert created if progress behind schedule
```

### API Performance Targets

| Endpoint Type | p50 | p95 | p99 |
|--------------|-----|-----|-----|
| Simple GET (single record) | <50ms | <100ms | <200ms |
| List GET (paginated) | <100ms | <200ms | <500ms |
| POST/PATCH | <150ms | <300ms | <600ms |
| Integration sync | <5s | <10s | <20s |

### API Rate Limiting

```typescript
// middleware.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, "1 m"), // 100 requests per minute
  analytics: true,
});

export async function middleware(request: NextRequest) {
  // Rate limit API routes
  if (request.nextUrl.pathname.startsWith("/api/")) {
    const ip = request.ip ?? "127.0.0.1";
    const { success, limit, reset, remaining } = await ratelimit.limit(ip);

    if (!success) {
      return new NextResponse("Rate limit exceeded", {
        status: 429,
        headers: {
          "X-RateLimit-Limit": limit.toString(),
          "X-RateLimit-Remaining": remaining.toString(),
          "X-RateLimit-Reset": reset.toString(),
        }
      });
    }
  }

  return NextResponse.next();
}
```

---

## Authentication & Authorization

### Authentication Flow (NextAuth.js v5)

```typescript
// lib/auth.ts
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./db";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" }, // JWT for serverless
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password required");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: { organization: true },
        });

        if (!user || !user.password) {
          throw new Error("Invalid credentials");
        }

        const passwordMatch = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!passwordMatch) {
          throw new Error("Invalid credentials");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          organizationId: user.organizationId,
        };
      },
    }),
    // Add Google OAuth later
    // GoogleProvider({
    //   clientId: process.env.GOOGLE_CLIENT_ID,
    //   clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    // }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.organizationId = user.organizationId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.organizationId = token.organizationId as string;
      }
      return session;
    },
  },
});
```

### Authorization Middleware

```typescript
// lib/auth/authorization.ts
import { auth } from "./auth";
import { UserRole } from "@prisma/client";

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function requireRole(allowedRoles: UserRole[]) {
  const session = await requireAuth();
  if (!allowedRoles.includes(session.user.role as UserRole)) {
    throw new Error("Forbidden");
  }
  return session;
}

// Usage in API route:
// app/api/factories/route.ts
export async function GET() {
  const session = await requireAuth();

  const factories = await prisma.factory.findMany({
    where: { organizationId: session.user.organizationId },
  });

  return Response.json({ success: true, data: factories });
}
```

### Row-Level Security (RLS) Pattern

**Problem:** User A shouldn't see User B's data.

**Solution:** Filter all queries by organizationId.

```typescript
// lib/db/factory-service.ts
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export class FactoryService {
  // All methods automatically scope to user's org

  static async list() {
    const session = await auth();
    return prisma.factory.findMany({
      where: { organizationId: session.user.organizationId },
    });
  }

  static async get(id: string) {
    const session = await auth();
    const factory = await prisma.factory.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId // Security check
      },
    });

    if (!factory) {
      throw new Error("Factory not found");
    }

    return factory;
  }

  // Same pattern for create, update, delete
}
```

**Critical:** NEVER trust client-provided organizationId. Always use session.

### Access Control & Team Management

**Two-Phase Implementation:**
- **Phase 1:** Email Whitelist (Immediate - 2-4 hours)
- **Phase 2:** Invitation System (Later - 1-2 days)

#### Phase 1: Email Whitelist Implementation

Restrict registration to approved internal Gmail accounts (3-5 team members).

**Access Control Utility:**
```typescript
// lib/access-control.ts
export function getWhitelistedEmails(): string[] {
  const emails = process.env.ALLOWED_EMAILS || '';
  return emails.split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
}

export function isWhitelistEnabled(): boolean {
  return process.env.REQUIRE_EMAIL_WHITELIST === 'true';
}

export function isEmailWhitelisted(email: string): boolean {
  if (!isWhitelistEnabled()) return true;
  const whitelisted = getWhitelistedEmails();
  return whitelisted.includes(email.trim().toLowerCase());
}
```

**Registration Route Update:**
```typescript
// app/api/auth/register/route.ts
import { isEmailWhitelisted } from '@/lib/access-control';

export async function POST(request: Request) {
  const { email, password, name } = await request.json();

  // Check email whitelist
  if (!isEmailWhitelisted(email)) {
    return NextResponse.json(
      { error: 'Registration restricted to authorized team members.' },
      { status: 403 }
    );
  }
  // ... continue registration
}
```

**Environment Configuration:**
```env
ALLOWED_EMAILS="user1@gmail.com,user2@gmail.com,user3@gmail.com"
REQUIRE_EMAIL_WHITELIST="true"
```

#### Phase 2: Invitation System

Professional team management with invitation-based onboarding.

**Database Schema:**
```prisma
model UserInvitation {
  id             String   @id @default(cuid())
  email          String
  token          String   @unique
  role           UserRole @default(MEMBER)
  invitedById    String
  invitedBy      User     @relation("InvitedBy", fields: [invitedById], references: [id])
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id])
  expiresAt      DateTime
  acceptedAt     DateTime?
  createdAt      DateTime @default(now())

  @@unique([organizationId, email])
}
```

**Key API Routes:**
- `POST /api/invitations` - Create invitation (ADMIN/OWNER only)
- `GET /api/invitations` - List pending invitations
- `GET /api/invitations/[token]` - Validate invitation token
- `DELETE /api/invitations/[token]` - Revoke invitation

**Security Features:**
- UUID v4 tokens (cryptographically secure)
- 7-day expiration
- One-time use (marked accepted)
- Role-based permissions (cannot invite OWNER)
- Organization isolation

**See detailed implementation in Week 3 tasks: 3.4a-3.5d**

---

## Integration Framework (Phase 3)

This is the core technical challenge. Here's the detailed design.

### Integration Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    SCHEDULER                                 │
│  (BullMQ + Redis)                                            │
│  - Every factory with integration has a scheduled job        │
│  - Runs every 15 minutes (configurable)                      │
│  - Retry: 3 attempts with exponential backoff                │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                 INTEGRATION MANAGER                          │
│  (lib/integrations/manager.ts)                               │
│  - Routes to correct adapter based on type                   │
│  - Handles encryption/decryption of credentials              │
│  - Logs all operations                                       │
│  - Error handling & retries                                  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    ADAPTERS                                  │
│  (lib/integrations/adapters/*)                               │
│  - SAPAdapter                                                │
│  - OracleAdapter                                             │
│  - RestApiAdapter (generic)                                  │
│  - SftpAdapter                                               │
│  - WebhookAdapter                                            │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                 DATA TRANSFORMER                             │
│  (lib/integrations/transformer.ts)                           │
│  - Maps factory data format to our schema                    │
│  - Validates data                                            │
│  - Handles missing/invalid data gracefully                   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                  DATABASE SYNC                               │
│  - Upsert orders (create if new, update if exists)           │
│  - Update stages                                             │
│  - Create OrderUpdate entries (audit trail)                  │
│  - Trigger alerts if needed                                  │
└─────────────────────────────────────────────────────────────┘
```

### Integration Adapter Interface

```typescript
// lib/integrations/adapter-interface.ts

export interface IntegrationAdapter {
  /**
   * Test connection to factory system
   * @returns true if connection successful, throws error otherwise
   */
  testConnection(config: IntegrationConfig): Promise<boolean>;

  /**
   * Fetch all orders from factory system
   * @returns array of raw factory data
   */
  fetchOrders(config: IntegrationConfig): Promise<FactoryOrderData[]>;

  /**
   * Fetch single order by factory's order ID
   */
  fetchOrder(config: IntegrationConfig, factoryOrderId: string): Promise<FactoryOrderData>;

  /**
   * Validate config before saving
   */
  validateConfig(config: IntegrationConfig): Promise<ValidationResult>;
}

export interface IntegrationConfig {
  type: IntegrationType;
  credentials: {
    apiUrl?: string;
    username?: string;
    password?: string;
    apiKey?: string;
    clientId?: string;
    clientSecret?: string;
    sftpHost?: string;
    sftpPort?: number;
    privateKey?: string;
    // ... other fields depending on type
  };
  options?: {
    timeout?: number;
    retryAttempts?: number;
    pollInterval?: number;
  };
}

export interface FactoryOrderData {
  factoryOrderId: string;      // Factory's internal ID
  orderNumber: string;          // PO number
  productName: string;
  quantity: number;
  progress: number;             // 0-100
  status: string;               // Factory's status (we'll map it)
  stages?: FactoryStageData[];
  lastUpdated: Date;
  // ... other fields
}

export interface FactoryStageData {
  name: string;
  progress: number;
  status: string;
  completedAt?: Date;
}
```

### REST API Adapter Implementation

```typescript
// lib/integrations/adapters/rest-api-adapter.ts

import axios, { AxiosInstance } from "axios";
import { IntegrationAdapter, IntegrationConfig, FactoryOrderData } from "../adapter-interface";

export class RestApiAdapter implements IntegrationAdapter {
  private client: AxiosInstance;

  constructor(config: IntegrationConfig) {
    this.client = axios.create({
      baseURL: config.credentials.apiUrl,
      timeout: config.options?.timeout || 30000,
      headers: {
        "Content-Type": "application/json",
        // Add auth headers based on config
        ...(config.credentials.apiKey && {
          "X-API-Key": config.credentials.apiKey,
        }),
        ...(config.credentials.username && config.credentials.password && {
          "Authorization": `Basic ${Buffer.from(
            `${config.credentials.username}:${config.credentials.password}`
          ).toString("base64")}`,
        }),
      },
    });
  }

  async testConnection(config: IntegrationConfig): Promise<boolean> {
    try {
      // Try to hit health/status endpoint
      const response = await this.client.get("/health");
      return response.status === 200;
    } catch (error) {
      throw new Error(`Connection test failed: ${error.message}`);
    }
  }

  async fetchOrders(config: IntegrationConfig): Promise<FactoryOrderData[]> {
    try {
      // Endpoint might be /api/orders or /production/orders
      // This should be configurable per factory
      const endpoint = config.options?.ordersEndpoint || "/orders";

      const response = await this.client.get(endpoint, {
        params: {
          // Only fetch active orders
          status: "active",
          // Limit to recent orders (last 6 months)
          from: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
        },
      });

      // Response format varies by factory
      // They might return { orders: [...] } or just [...]
      const orders = Array.isArray(response.data)
        ? response.data
        : response.data.orders || response.data.data || [];

      // Transform to our format
      return orders.map(this.transformOrder);
    } catch (error) {
      throw new Error(`Failed to fetch orders: ${error.message}`);
    }
  }

  async fetchOrder(config: IntegrationConfig, factoryOrderId: string): Promise<FactoryOrderData> {
    try {
      const endpoint = config.options?.ordersEndpoint || "/orders";
      const response = await this.client.get(`${endpoint}/${factoryOrderId}`);
      return this.transformOrder(response.data);
    } catch (error) {
      throw new Error(`Failed to fetch order ${factoryOrderId}: ${error.message}`);
    }
  }

  async validateConfig(config: IntegrationConfig): Promise<ValidationResult> {
    const errors: string[] = [];

    if (!config.credentials.apiUrl) {
      errors.push("API URL is required");
    }

    if (!config.credentials.apiKey &&
        (!config.credentials.username || !config.credentials.password)) {
      errors.push("Either API Key or Username/Password is required");
    }

    // Test connection if config looks valid
    if (errors.length === 0) {
      try {
        await this.testConnection(config);
      } catch (error) {
        errors.push(`Connection test failed: ${error.message}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  private transformOrder(rawOrder: any): FactoryOrderData {
    // Map factory's field names to our standard format
    // This mapping should be configurable per factory (dataMapping in DB)
    return {
      factoryOrderId: rawOrder.id || rawOrder.orderId,
      orderNumber: rawOrder.poNumber || rawOrder.orderNumber || rawOrder.po,
      productName: rawOrder.productName || rawOrder.product || rawOrder.item,
      quantity: parseInt(rawOrder.quantity || rawOrder.qty || "0"),
      progress: this.normalizeProgress(rawOrder.progress || rawOrder.completion || 0),
      status: this.normalizeStatus(rawOrder.status || "unknown"),
      stages: this.transformStages(rawOrder.stages || rawOrder.steps || []),
      lastUpdated: new Date(rawOrder.updatedAt || rawOrder.lastUpdate || Date.now()),
    };
  }

  private normalizeProgress(progress: number | string): number {
    // Handle different formats: 75, "75", "75%", 0.75
    if (typeof progress === "string") {
      progress = parseFloat(progress.replace("%", ""));
    }
    if (progress > 1 && progress <= 100) {
      return progress; // Already 0-100
    }
    if (progress >= 0 && progress <= 1) {
      return progress * 100; // Convert 0-1 to 0-100
    }
    return 0;
  }

  private normalizeStatus(status: string): OrderStatus {
    // Map factory status to our enum
    const statusMap: Record<string, OrderStatus> = {
      "pending": "PENDING",
      "not_started": "PENDING",
      "in_progress": "IN_PROGRESS",
      "active": "IN_PROGRESS",
      "completed": "COMPLETED",
      "finished": "COMPLETED",
      "shipped": "SHIPPED",
      "cancelled": "CANCELLED",
      "canceled": "CANCELLED",
    };

    const normalized = status.toLowerCase().replace(/\s+/g, "_");
    return statusMap[normalized] || "IN_PROGRESS";
  }

  private transformStages(rawStages: any[]): FactoryStageData[] {
    return rawStages.map((stage, index) => ({
      name: stage.name || stage.step || `Stage ${index + 1}`,
      progress: this.normalizeProgress(stage.progress || stage.completion || 0),
      status: stage.status || (stage.completed ? "COMPLETED" : "IN_PROGRESS"),
      completedAt: stage.completedAt ? new Date(stage.completedAt) : undefined,
    }));
  }
}
```

### Integration Manager (Orchestrator)

```typescript
// lib/integrations/manager.ts

import { prisma } from "@/lib/db";
import { encrypt, decrypt } from "@/lib/crypto";
import { RestApiAdapter } from "./adapters/rest-api-adapter";
import { SftpAdapter } from "./adapters/sftp-adapter";
import { IntegrationAdapter, IntegrationConfig } from "./adapter-interface";

export class IntegrationManager {
  /**
   * Get the appropriate adapter for a factory integration
   */
  private static getAdapter(type: IntegrationType, config: IntegrationConfig): IntegrationAdapter {
    switch (type) {
      case "API_REST":
        return new RestApiAdapter(config);
      case "SFTP_CSV":
      case "SFTP_JSON":
        return new SftpAdapter(config);
      // Add more adapters as needed
      default:
        throw new Error(`Unsupported integration type: ${type}`);
    }
  }

  /**
   * Test connection to factory system
   */
  static async testConnection(factoryId: string): Promise<boolean> {
    const integration = await prisma.factoryIntegration.findUnique({
      where: { factoryId },
    });

    if (!integration) {
      throw new Error("Integration not found");
    }

    // Decrypt credentials
    const config = this.decryptConfig(integration.config);

    // Get adapter and test
    const adapter = this.getAdapter(integration.type, config);

    try {
      await adapter.testConnection(config);

      // Update health status
      await prisma.factoryIntegration.update({
        where: { id: integration.id },
        data: { healthStatus: "HEALTHY", lastError: null },
      });

      return true;
    } catch (error) {
      // Update health status
      await prisma.factoryIntegration.update({
        where: { id: integration.id },
        data: {
          healthStatus: "UNHEALTHY",
          lastError: error.message,
        },
      });

      throw error;
    }
  }

  /**
   * Sync orders from factory system
   * This is called by the background job scheduler
   */
  static async syncFactory(factoryId: string): Promise<SyncResult> {
    const startTime = Date.now();

    const integration = await prisma.factoryIntegration.findUnique({
      where: { factoryId },
      include: { factory: { include: { organization: true } } },
    });

    if (!integration || !integration.enabled) {
      throw new Error("Integration not found or disabled");
    }

    // Log sync start
    const logId = await this.createLog(integration.id, "SYNC_START", "Starting sync", true);

    try {
      // Decrypt credentials
      const config = this.decryptConfig(integration.config);

      // Get adapter
      const adapter = this.getAdapter(integration.type, config);

      // Fetch orders from factory
      const factoryOrders = await adapter.fetchOrders(config);

      // Transform and sync to database
      const result = await this.syncOrdersToDatabase(
        factoryId,
        integration.factory.organizationId,
        factoryOrders,
        integration.dataMapping
      );

      const duration = Date.now() - startTime;

      // Log success
      await this.updateLog(logId, {
        type: "SYNC_SUCCESS",
        message: `Synced ${result.created + result.updated} orders`,
        success: true,
        duration,
        responseData: {
          created: result.created,
          updated: result.updated,
          skipped: result.skipped,
        },
      });

      // Update integration status
      await prisma.factoryIntegration.update({
        where: { id: integration.id },
        data: {
          lastSyncAt: new Date(),
          nextSyncAt: new Date(Date.now() + integration.syncFrequency * 60 * 1000),
          healthStatus: "HEALTHY",
          lastError: null,
        },
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      // Log error
      await this.updateLog(logId, {
        type: "SYNC_ERROR",
        message: `Sync failed: ${error.message}`,
        success: false,
        duration,
        errorDetails: {
          message: error.message,
          stack: error.stack,
        },
      });

      // Update integration status
      await prisma.factoryIntegration.update({
        where: { id: integration.id },
        data: {
          healthStatus: "UNHEALTHY",
          lastError: error.message,
        },
      });

      throw error;
    }
  }

  /**
   * Sync factory data to our database
   */
  private static async syncOrdersToDatabase(
    factoryId: string,
    organizationId: string,
    factoryOrders: FactoryOrderData[],
    dataMapping: any
  ): Promise<SyncResult> {
    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const factoryOrder of factoryOrders) {
      try {
        // Check if order exists
        const existingOrder = await prisma.order.findFirst({
          where: {
            organizationId,
            factoryId,
            orderNumber: factoryOrder.orderNumber,
          },
          include: { stages: true },
        });

        if (existingOrder) {
          // Update existing order
          const hasChanges = this.hasOrderChanged(existingOrder, factoryOrder);

          if (hasChanges) {
            await prisma.order.update({
              where: { id: existingOrder.id },
              data: {
                overallProgress: factoryOrder.progress,
                status: factoryOrder.status,
                updatedAt: new Date(),
              },
            });

            // Update stages
            if (factoryOrder.stages) {
              for (let i = 0; i < factoryOrder.stages.length; i++) {
                const factoryStage = factoryOrder.stages[i];
                const existingStage = existingOrder.stages.find(s => s.sequence === i + 1);

                if (existingStage) {
                  await prisma.orderStage.update({
                    where: { id: existingStage.id },
                    data: {
                      progress: factoryStage.progress,
                      status: factoryStage.status as any,
                      completedAt: factoryStage.completedAt,
                    },
                  });
                }
              }
            }

            // Create update entry (audit trail)
            await prisma.orderUpdate.create({
              data: {
                orderId: existingOrder.id,
                message: `Progress updated to ${factoryOrder.progress}% via integration`,
                type: "PROGRESS",
                source: "integration",
                createdBy: "system",
              },
            });

            updated++;
          } else {
            skipped++;
          }
        } else {
          // Create new order
          await prisma.order.create({
            data: {
              orderNumber: factoryOrder.orderNumber,
              productName: factoryOrder.productName,
              quantity: factoryOrder.quantity,
              overallProgress: factoryOrder.progress,
              status: factoryOrder.status,
              organizationId,
              factoryId,
              orderDate: new Date(),
              expectedDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 days default
              stages: factoryOrder.stages ? {
                create: factoryOrder.stages.map((stage, index) => ({
                  name: stage.name,
                  sequence: index + 1,
                  progress: stage.progress,
                  status: stage.status as any,
                  completedAt: stage.completedAt,
                })),
              } : undefined,
            },
          });

          created++;
        }
      } catch (error) {
        console.error(`Failed to sync order ${factoryOrder.orderNumber}:`, error);
        // Continue with other orders
        skipped++;
      }
    }

    return { created, updated, skipped };
  }

  private static hasOrderChanged(existing: any, factory: FactoryOrderData): boolean {
    return (
      existing.overallProgress !== factory.progress ||
      existing.status !== factory.status
    );
  }

  private static decryptConfig(encryptedConfig: any): IntegrationConfig {
    // Decrypt sensitive fields
    const config = { ...encryptedConfig };
    if (config.credentials) {
      if (config.credentials.password) {
        config.credentials.password = decrypt(config.credentials.password);
      }
      if (config.credentials.apiKey) {
        config.credentials.apiKey = decrypt(config.credentials.apiKey);
      }
      // ... decrypt other sensitive fields
    }
    return config;
  }

  private static async createLog(integrationId: string, type: string, message: string, success: boolean) {
    const log = await prisma.integrationLog.create({
      data: {
        integrationId,
        type: type as any,
        message,
        success,
      },
    });
    return log.id;
  }

  private static async updateLog(logId: string, data: any) {
    await prisma.integrationLog.update({
      where: { id: logId },
      data,
    });
  }
}

interface SyncResult {
  created: number;
  updated: number;
  skipped: number;
}
```

### Background Job Scheduler (BullMQ)

```typescript
// lib/integrations/scheduler.ts

import { Queue, Worker } from "bullmq";
import Redis from "ioredis";
import { IntegrationManager } from "./manager";
import { prisma } from "@/lib/db";

const redis = new Redis(process.env.REDIS_URL!);

// Create queue
export const integrationQueue = new Queue("factory-integration", {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000, // Start with 5 seconds
    },
    removeOnComplete: {
      age: 24 * 3600, // Keep completed jobs for 24 hours
      count: 1000,
    },
    removeOnFail: {
      age: 7 * 24 * 3600, // Keep failed jobs for 7 days
    },
  },
});

// Worker to process jobs
export const integrationWorker = new Worker(
  "factory-integration",
  async (job) => {
    const { factoryId } = job.data;

    console.log(`[Worker] Syncing factory ${factoryId}`);

    try {
      const result = await IntegrationManager.syncFactory(factoryId);
      return result;
    } catch (error) {
      console.error(`[Worker] Sync failed for factory ${factoryId}:`, error);
      throw error;
    }
  },
  {
    connection: redis,
    concurrency: 5, // Process 5 factories in parallel
  }
);

// Event listeners
integrationWorker.on("completed", (job) => {
  console.log(`[Worker] Job ${job.id} completed:`, job.returnvalue);
});

integrationWorker.on("failed", (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed:`, err);
});

/**
 * Schedule sync job for a factory
 */
export async function scheduleFactorySync(factoryId: string, syncFrequency: number) {
  // Remove existing jobs for this factory
  const existingJobs = await integrationQueue.getRepeatableJobs();
  for (const job of existingJobs) {
    if (job.name === `sync-${factoryId}`) {
      await integrationQueue.removeRepeatableByKey(job.key);
    }
  }

  // Schedule new job (every syncFrequency minutes)
  await integrationQueue.add(
    `sync-${factoryId}`,
    { factoryId },
    {
      repeat: {
        every: syncFrequency * 60 * 1000, // Convert minutes to milliseconds
      },
      jobId: `sync-${factoryId}`,
    }
  );

  console.log(`[Scheduler] Scheduled factory ${factoryId} to sync every ${syncFrequency} minutes`);
}

/**
 * Trigger immediate sync (manual sync button)
 */
export async function triggerImmediateSync(factoryId: string) {
  await integrationQueue.add(
    `sync-${factoryId}-manual`,
    { factoryId },
    {
      priority: 1, // High priority
    }
  );
}

/**
 * Initialize scheduler - call this on app startup
 */
export async function initializeScheduler() {
  // Load all enabled integrations and schedule them
  const integrations = await prisma.factoryIntegration.findMany({
    where: { enabled: true },
  });

  for (const integration of integrations) {
    await scheduleFactorySync(integration.factoryId, integration.syncFrequency);
  }

  console.log(`[Scheduler] Initialized with ${integrations.length} integrations`);
}
```

### Credential Encryption

```typescript
// lib/crypto.ts

import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY!, "hex"); // 32 bytes
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  // Combine iv + authTag + encrypted
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

export function decrypt(text: string): string {
  const [ivHex, authTagHex, encrypted] = text.split(":");

  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");

  const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

// Generate encryption key (run once, store in .env)
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString("hex");
}
```

---

## Phase-by-Phase Implementation

### Phase 1: Foundation (Weeks 1-3)

**Goal:** Manual CRUD operations working, team can start using platform.

#### Week 1: Core Setup

**Day 1-2: Project Setup (PAIR PROGRAM - Both people together)**

```bash
# Initialize project
npx create-next-app@latest sourcing-dashboard --typescript --tailwind --app
cd sourcing-dashboard

# Install dependencies
npm install prisma @prisma/client
npm install next-auth@beta bcryptjs zod react-hook-form @hookform/resolvers
npm install -D @types/bcryptjs

# Initialize Prisma
npx prisma init --datasource-provider postgresql

# Setup environment variables
```

**Tasks:**
- [ ] Create Next.js project with App Router
- [ ] Setup Prisma with PostgreSQL
- [ ] Create `.env.local` with database URL
- [ ] Design initial database schema (together!)
- [ ] Run first migration: `npx prisma migrate dev --name init`
- [ ] Setup authentication with NextAuth.js
- [ ] Create shared TypeScript types
- [ ] Setup Tailwind CSS configuration
- [ ] Create basic layout components

**Commit strategy:** Each task = 1 commit to main (since working together)

---

**Day 3-5: Split Work**

**Person A: Organization & Factory Management**
- [ ] Create organization registration flow
- [ ] Create factory CRUD pages
  - `/factories` - List view
  - `/factories/new` - Create form
  - `/factories/[id]` - Detail view
  - `/factories/[id]/edit` - Edit form
- [ ] Create factory API routes
  - `POST /api/factories` - Create
  - `GET /api/factories` - List
  - `GET /api/factories/[id]` - Get one
  - `PATCH /api/factories/[id]` - Update
  - `DELETE /api/factories/[id]` - Delete
- [ ] Add form validation with Zod
- [ ] Add loading states

**Person B: Order Management**
- [ ] Create order CRUD pages
  - `/orders` - List view with filters
  - `/orders/new` - Create form
  - `/orders/[id]` - Detail view
  - `/orders/[id]/edit` - Edit form
- [ ] Create order API routes
  - `POST /api/orders` - Create
  - `GET /api/orders` - List (with filters)
  - `GET /api/orders/[id]` - Get one
  - `PATCH /api/orders/[id]` - Update
  - `DELETE /api/orders/[id]` - Delete
- [ ] Add order stages CRUD
- [ ] Add form validation with Zod
- [ ] Add loading states

**End of Week 1 Review:**
- Both features merged and tested
- Can create factories and orders manually
- Authentication working

---

#### Week 2: Polish & Dashboard

**Person A: Dashboard Homepage**
- [ ] Create `/dashboard` page
- [ ] Show key metrics:
  - Total orders
  - Orders by status (chart)
  - Average progress
  - Delayed orders count
- [ ] Recent activity feed
- [ ] Quick actions (Create order, Add factory)
- [ ] Responsive design

**Person B: Order Detail Enhancements**
- [ ] Add order stages with progress bars
- [ ] Add order timeline (updates history)
- [ ] Add file attachments
  - Upload to Vercel Blob or S3
  - Show previews
  - Delete attachments
- [ ] Add manual progress updates
- [ ] Add notes/comments

**Both: Integration**
- [ ] Connect orders to factories (dropdown)
- [ ] Show factory info on order detail page
- [ ] Show orders list on factory detail page
- [ ] Add search/filter on order list
  - Filter by factory
  - Filter by status
  - Search by order number/product name

**End of Week 2 Review:**
- Dashboard looks good
- Order detail page is complete
- Can track progress manually

---

#### Week 3: Team & Polish

**Person A: Team Management**
- [ ] Add user invitation flow
- [ ] Email invitation with NextAuth
- [ ] User roles (Owner, Admin, Member, Viewer)
- [ ] Role-based permissions
  - Viewers: Read-only
  - Members: Edit orders
  - Admins: Manage factories, users
  - Owners: Billing, delete org
- [ ] Team page UI
- [ ] Invite/remove members

**Person B: Advanced Filters & Export**
- [ ] Advanced order filters:
  - Date range picker
  - Multiple status selection
  - Multiple factory selection
  - Priority filter
  - Progress range (e.g., 0-25%, 26-50%)
- [ ] Export orders to CSV
- [ ] Export orders to Excel
- [ ] Print-friendly order view

**Both: Testing & Bug Fixes**
- [ ] Manual testing of all features
- [ ] Fix any bugs found
- [ ] Mobile responsiveness check
- [ ] Add loading skeletons
- [ ] Error handling improvements

**End of Week 3 / Phase 1 Review:**
- ✅ Complete CRUD operations
- ✅ Team management
- ✅ Dashboard homepage
- ✅ Manual order tracking working
- **Deploy to Vercel for testing**

---

### Phase 2: Visualization & Alerts (Weeks 4-5)

**Goal:** Beautiful charts, real-time updates, automated alerts.

#### Week 4: Charts & Analytics

**Person A: Order Analytics**
- [ ] Install chart library (recharts or Chart.js)
- [ ] Create analytics API endpoints:
  - `GET /api/analytics/orders-by-status`
  - `GET /api/analytics/orders-by-factory`
  - `GET /api/analytics/progress-over-time`
  - `GET /api/analytics/on-time-performance`
- [ ] Create charts component:
  - Orders by status (pie chart)
  - Progress over time (line chart)
  - Factory performance (bar chart)
  - On-time vs delayed (comparison)
- [ ] Add date range selector
- [ ] Add to dashboard homepage

**Person B: Order Timeline Visualization**
- [ ] Create Gantt-chart-style timeline
  - Show all orders on timeline
  - Color by status
  - Hover to see details
- [ ] Add filters to timeline view
- [ ] Add zoom controls
- [ ] Export timeline as image
- [ ] Add critical path highlighting (orders at risk)

**End of Week 4:**
- Dashboard has beautiful charts
- Timeline view helps visualize all orders

---

#### Week 5: Alerts & Notifications

**Person A: Alert System**
- [ ] Create Alert model (already in schema)
- [ ] Create alert generation logic:
  - Order delayed (expected date passed, <100% progress)
  - Order stuck (no progress in X days)
  - Factory integration failing
  - New order created
- [ ] Create alert API:
  - `GET /api/alerts` - List alerts
  - `PATCH /api/alerts/[id]/read` - Mark as read
  - `PATCH /api/alerts/[id]/resolve` - Resolve
- [ ] Alert UI component (bell icon with badge)
- [ ] Alert list page
- [ ] In-app notifications

**Person B: Email Notifications**
- [ ] Setup email provider (Resend or SendGrid)
- [ ] Create email templates:
  - Order delayed notification
  - Order completed notification
  - Weekly digest
- [ ] Add user notification preferences
  - Enable/disable email notifications
  - Choose which alerts to receive
- [ ] Send emails on alert creation
- [ ] Create digest job (weekly summary)

**Both: Real-time Updates (Optional)**
- [ ] Add WebSocket support (Pusher or Ably)
- [ ] Push live updates when orders change
- [ ] Update UI without refresh

**End of Week 5 / Phase 2 Review:**
- ✅ Charts and analytics
- ✅ Alert system working
- ✅ Email notifications
- **Platform is useful without integrations**

---

### Phase 3: Automatic Integrations (Weeks 6-8)

**Goal:** Connect to factory ERP systems, automatic data sync.

#### Week 6: Integration Framework

**Person A: Integration Infrastructure**
- [ ] Setup Redis (Upstash or self-hosted)
- [ ] Setup BullMQ job queue
- [ ] Create integration manager
- [ ] Create adapter interface
- [ ] Implement REST API adapter
- [ ] Create encryption utilities
- [ ] Create integration scheduler
- [ ] Test with mock API

**Person B: Integration UI**
- [ ] Create factory integration setup wizard
  - Step 1: Choose integration type
  - Step 2: Enter credentials
  - Step 3: Test connection
  - Step 4: Map data fields
  - Step 5: Review and enable
- [ ] Create integration detail page
  - Show connection status
  - Show last sync time
  - Show sync logs
  - Manual sync button
  - Edit/disable buttons
- [ ] Create integration logs viewer
  - Filterable by success/failure
  - Show request/response data
  - Show error details

**End of Week 6:**
- Integration framework code complete
- UI for setup complete
- Ready to test with real factories

---

#### Week 7: Adapters & Data Mapping

**Person A: More Adapters**
- [ ] Implement SFTP adapter
  - Connect to SFTP server
  - Download CSV/JSON files
  - Parse files
  - Delete processed files
- [ ] Implement webhook receiver
  - `POST /api/webhooks/[factoryId]`
  - Validate webhook signature
  - Process incoming data
  - Return success response
- [ ] Create adapter for SAP (if available for testing)
- [ ] Create adapter for Oracle (if available for testing)

**Person B: Data Transformer & Validation**
- [ ] Create configurable field mapper
  - UI to map factory fields to our fields
  - Save mapping in integration config
  - Apply mapping during sync
- [ ] Create data validator
  - Validate required fields present
  - Validate data types
  - Handle missing data gracefully
- [ ] Create conflict resolution
  - What if factory data conflicts with manual edits?
  - Strategy: Factory data wins by default, with flag
- [ ] Add "Last synced from integration" indicator on orders

**End of Week 7:**
- Multiple adapters implemented
- Data mapping working
- Validation robust

---

#### Week 8: Testing & Polish

**Both: Integration Testing**
- [ ] Test with pilot factory #1
  - Setup integration together
  - Run sync
  - Verify data correct
  - Fix any issues
- [ ] Test with pilot factory #2
  - Different system type
  - Document any issues
  - Iterate on adapter
- [ ] Load testing
  - Simulate 50 factories syncing simultaneously
  - Ensure no performance issues
  - Optimize slow queries

**Person A: Monitoring & Observability**
- [ ] Setup error tracking (Sentry)
- [ ] Add logging to all integration operations
- [ ] Create integration health dashboard (admin only)
  - Show all integrations
  - Show success/failure rate
  - Show sync duration trends
- [ ] Add alerting for integration failures
  - Email admin if integration fails 3 times

**Person B: Documentation**
- [ ] Write integration setup guide for factories
  - How to create read-only account in SAP
  - How to create API credentials in Oracle
  - How to setup SFTP export
- [ ] Create video tutorials
  - Setting up integration
  - Testing connection
  - Troubleshooting common issues
- [ ] Write internal docs
  - How to add new adapter
  - How to debug integration issues

**End of Week 8 / Phase 3 Review:**
- ✅ Integrations working with pilot factories
- ✅ Multiple adapter types supported
- ✅ Monitoring and logging in place
- ✅ Documentation complete
- **Ready for production launch**

---

## Testing Strategy

### Unit Tests

**Tools:** Vitest (faster than Jest for Vite/Next.js)

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

**What to test:**
- Utility functions (encryption, data transformation)
- API response helpers
- Data validators
- Adapters (with mocked HTTP calls)

**Example:**

```typescript
// lib/integrations/__tests__/rest-api-adapter.test.ts

import { describe, it, expect, vi } from "vitest";
import { RestApiAdapter } from "../adapters/rest-api-adapter";

describe("RestApiAdapter", () => {
  it("should transform factory order data correctly", () => {
    const adapter = new RestApiAdapter(mockConfig);

    const rawOrder = {
      id: "123",
      poNumber: "PO-001",
      product: "T-Shirt",
      qty: 1000,
      completion: "75%",
      status: "in_progress",
    };

    const transformed = adapter["transformOrder"](rawOrder);

    expect(transformed).toEqual({
      factoryOrderId: "123",
      orderNumber: "PO-001",
      productName: "T-Shirt",
      quantity: 1000,
      progress: 75,
      status: "IN_PROGRESS",
      // ...
    });
  });

  it("should normalize progress from different formats", () => {
    const adapter = new RestApiAdapter(mockConfig);

    expect(adapter["normalizeProgress"](75)).toBe(75);
    expect(adapter["normalizeProgress"]("75")).toBe(75);
    expect(adapter["normalizeProgress"]("75%")).toBe(75);
    expect(adapter["normalizeProgress"](0.75)).toBe(75);
  });
});
```

**Goal:** 80%+ code coverage on critical paths (adapters, transformers, validators).

---

### Integration Tests

**Tools:** Playwright or Cypress

**What to test:**
- Full user flows (login → create order → view dashboard)
- API endpoints with real database (test database)
- Integration sync with mock factory API

**Example:**

```typescript
// e2e/order-creation.spec.ts

import { test, expect } from "@playwright/test";

test("create order flow", async ({ page }) => {
  // Login
  await page.goto("/login");
  await page.fill('[name="email"]', "test@example.com");
  await page.fill('[name="password"]', "password");
  await page.click('button[type="submit"]');

  // Navigate to create order
  await page.goto("/orders/new");

  // Fill form
  await page.selectOption('[name="factoryId"]', { label: "Test Factory" });
  await page.fill('[name="orderNumber"]', "PO-2024-001");
  await page.fill('[name="productName"]', "Cotton T-Shirt");
  await page.fill('[name="quantity"]', "5000");

  // Submit
  await page.click('button[type="submit"]');

  // Verify redirect and success
  await expect(page).toHaveURL(/\/orders\/clx.*/);
  await expect(page.locator("h1")).toContainText("PO-2024-001");
});
```

**Goal:** Cover all critical user journeys.

---

### Manual Testing Checklist

Before each merge/deployment:

**Functionality:**
- [ ] Can create/edit/delete factories
- [ ] Can create/edit/delete orders
- [ ] Can update order progress
- [ ] Can add stages to orders
- [ ] Can upload attachments
- [ ] Dashboard shows correct data
- [ ] Filters work correctly
- [ ] Search works
- [ ] Alerts generated correctly
- [ ] Email notifications sent
- [ ] Integration setup wizard works
- [ ] Integration sync works
- [ ] Integration logs visible

**UI/UX:**
- [ ] All pages mobile responsive
- [ ] Loading states shown
- [ ] Error messages clear
- [ ] Forms validate correctly
- [ ] No console errors
- [ ] No broken images
- [ ] All buttons work
- [ ] Tooltips helpful

**Performance:**
- [ ] Pages load <2 seconds
- [ ] No long loading spinners
- [ ] Smooth scrolling
- [ ] Pagination works

---

## Deployment & Infrastructure

### Deployment Platform: Vercel

**Why Vercel:**
- Zero-config Next.js deployment
- Automatic HTTPS
- Preview deployments per PR
- Edge functions (fast globally)
- Built-in analytics

**Setup:**

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Production
vercel --prod
```

### Environment Variables

```bash
# .env.local (local development)
DATABASE_URL="postgresql://user:password@localhost:5432/sourcing_dev"
NEXTAUTH_SECRET="generate-with: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"
ENCRYPTION_KEY="generate-with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""

# Phase 3+
REDIS_URL="redis://localhost:6379"
REDIS_TOKEN="" # For Upstash

# Email
RESEND_API_KEY="re_..."
EMAIL_FROM="noreply@sourcingdashboard.com"

# File upload
BLOB_READ_WRITE_TOKEN="vercel_blob_..." # Vercel Blob
# or
AWS_S3_BUCKET="..."
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
```

**Vercel Setup:**
- Add all environment variables in Vercel dashboard
- Use different values for Preview vs Production
- Never commit `.env.local` to git

### Database: PostgreSQL

**Options:**

1. **Vercel Postgres** (Easiest)
   - Free tier: 256 MB, good for MVP
   - Pay as you grow
   - Built-in connection pooling

2. **Neon** (Recommended)
   - Serverless Postgres
   - Free tier: 0.5 GB, generous
   - Auto-scaling
   - Branch databases for dev

3. **Railway**
   - $5/month
   - More control
   - Good for production

4. **Supabase**
   - Free tier: 500 MB
   - Includes auth (if not using NextAuth)
   - Real-time subscriptions built-in

**Recommendation:** Start with Neon, move to Railway/Supabase for production.

### Redis: Upstash (Phase 3)

**For job queue and caching:**

- Serverless Redis
- Free tier: 10,000 commands/day
- HTTP-based (works with serverless)
- No connection limits

```bash
# Add to .env
REDIS_URL="redis://default:password@host:port"
```

### File Storage: Vercel Blob

**For order attachments:**

```bash
npm install @vercel/blob
```

```typescript
// Upload file
import { put } from "@vercel/blob";

const blob = await put("order-attachments/file.pdf", file, {
  access: "public",
});

console.log(blob.url); // https://blob.vercel-storage.com/...
```

**Alternative: AWS S3** (if need more control)

### CI/CD Pipeline

**GitHub Actions:**

```yaml
# .github/workflows/ci.yml

name: CI

on:
  pull_request:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v3

      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'npm'

      - run: npm ci

      - name: Run tests
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
        run: |
          npx prisma migrate deploy
          npm run test

      - name: Lint
        run: npm run lint

      - name: Type check
        run: npm run type-check

  deploy-preview:
    runs-on: ubuntu-latest
    needs: test
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

**What this does:**
- Run tests on every PR
- Run linter and type checker
- Deploy preview to Vercel
- Block merge if tests fail

---

## Performance & Scalability

### Performance Targets

| Metric | Target |
|--------|--------|
| First Contentful Paint (FCP) | <1.5s |
| Largest Contentful Paint (LCP) | <2.5s |
| Time to Interactive (TTI) | <3.5s |
| API Response Time (p95) | <200ms |
| Database Query Time (p95) | <50ms |

### Optimization Strategies

#### 1. Database Query Optimization

**Problem:** N+1 queries

```typescript
// ❌ BAD: N+1 query problem
const orders = await prisma.order.findMany();
for (const order of orders) {
  order.factory = await prisma.factory.findUnique({ where: { id: order.factoryId } });
}
// Results in 1 + N queries

// ✅ GOOD: Use include
const orders = await prisma.order.findMany({
  include: { factory: true }
});
// Results in 1 query with JOIN
```

**Use indexes:**

```prisma
model Order {
  organizationId String
  status         OrderStatus
  expectedDate   DateTime

  @@index([organizationId, status])
  @@index([organizationId, expectedDate])
}
```

**Use pagination:**

```typescript
const orders = await prisma.order.findMany({
  skip: (page - 1) * limit,
  take: limit,
  orderBy: { createdAt: "desc" },
});
```

#### 2. Caching Strategy

**Redis cache for:**
- Dashboard stats (TTL: 5 minutes)
- Factory list (TTL: 10 minutes)
- Order counts (TTL: 5 minutes)

```typescript
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.REDIS_URL!,
  token: process.env.REDIS_TOKEN!,
});

export async function getCachedOrFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 300 // 5 minutes
): Promise<T> {
  // Try cache first
  const cached = await redis.get(key);
  if (cached) {
    return cached as T;
  }

  // Fetch fresh data
  const data = await fetcher();

  // Store in cache
  await redis.set(key, data, { ex: ttl });

  return data;
}

// Usage
const stats = await getCachedOrFetch(
  `stats:org:${orgId}`,
  () => calculateDashboardStats(orgId),
  300
);
```

#### 3. Server Components (React 18+)

**Use Server Components by default:**

```typescript
// app/orders/page.tsx (Server Component)
import { prisma } from "@/lib/db";

export default async function OrdersPage() {
  // Fetch on server, no client JS needed
  const orders = await prisma.order.findMany();

  return <OrderList orders={orders} />;
}
```

**Only use Client Components when needed:**

```typescript
// components/order-list.tsx (Client Component)
"use client"; // Only because we need interactivity

export function OrderList({ orders }) {
  const [filter, setFilter] = useState("all");

  // Client-side filtering
  const filtered = orders.filter(o =>
    filter === "all" || o.status === filter
  );

  return <div>...</div>;
}
```

#### 4. Image Optimization

**Use Next.js Image component:**

```typescript
import Image from "next/image";

<Image
  src="/factory-logo.png"
  alt="Factory logo"
  width={200}
  height={100}
  priority // For above-fold images
/>
```

#### 5. Bundle Size

**Analyze bundle:**

```bash
npm install -D @next/bundle-analyzer
```

```javascript
// next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({
  // ... other config
});
```

```bash
ANALYZE=true npm run build
```

**Keep bundle small:**
- Use dynamic imports for heavy components
- Tree-shake unused code
- Avoid large dependencies (e.g., moment.js → use date-fns or native)

---

## Security Considerations

### Authentication & Sessions

**Use secure session settings:**

```typescript
// lib/auth.ts
export const authOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
};
```

### Password Security

**Use bcrypt with salt rounds >= 10:**

```typescript
import bcrypt from "bcryptjs";

// Hash password
const hashedPassword = await bcrypt.hash(password, 12);

// Verify password
const isValid = await bcrypt.compare(password, hashedPassword);
```

### SQL Injection Prevention

**Prisma is safe by default:**

```typescript
// ✅ SAFE: Prisma parameterizes queries
const user = await prisma.user.findUnique({
  where: { email: userInput },
});

// ❌ UNSAFE: Raw SQL with user input (avoid!)
// const user = await prisma.$queryRaw`SELECT * FROM User WHERE email = ${userInput}`;
// Use $queryRaw only with Prisma.sql template
```

### XSS Prevention

**React escapes by default:**

```typescript
// ✅ SAFE: React escapes HTML
<div>{userInput}</div>

// ❌ UNSAFE: dangerouslySetInnerHTML
<div dangerouslySetInnerHTML={{ __html: userInput }} />
// Only use if you sanitize first with DOMPurify
```

### CSRF Protection

**NextAuth.js provides CSRF tokens automatically.**

For custom forms:

```typescript
// app/api/orders/route.ts
import { headers } from "next/headers";

export async function POST(request: Request) {
  const headersList = headers();
  const csrfToken = headersList.get("x-csrf-token");

  // Validate CSRF token
  if (!csrfToken || !validateCsrfToken(csrfToken)) {
    return new Response("Invalid CSRF token", { status: 403 });
  }

  // ... process request
}
```

### Environment Variables

**Never expose secrets to client:**

```typescript
// ❌ BAD: Available in browser
const apiKey = process.env.NEXT_PUBLIC_API_KEY;

// ✅ GOOD: Server-only
const apiKey = process.env.API_KEY; // Not prefixed with NEXT_PUBLIC_
```

### Rate Limiting

**Protect API endpoints:**

```typescript
// middleware.ts
import { Ratelimit } from "@upstash/ratelimit";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, "1 m"),
});

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/")) {
    const { success } = await ratelimit.limit(request.ip ?? "anonymous");

    if (!success) {
      return new Response("Rate limit exceeded", { status: 429 });
    }
  }
}
```

### Content Security Policy

```typescript
// next.config.js
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data: https:;
  font-src 'self';
  connect-src 'self' https:;
  frame-ancestors 'none';
`;

module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: cspHeader.replace(/\n/g, ''),
          },
        ],
      },
    ];
  },
};
```

---

## Monitoring & Observability

### Error Tracking: Sentry

```bash
npm install @sentry/nextjs
```

```typescript
// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV,
});
```

**Capture errors manually:**

```typescript
try {
  await dangerousOperation();
} catch (error) {
  Sentry.captureException(error, {
    extra: {
      userId: session.user.id,
      operation: "factory_sync",
    },
  });
  throw error;
}
```

### Logging

**Use structured logging:**

```typescript
// lib/logger.ts
import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
    },
  },
});

// Usage
logger.info({ userId: "123", action: "order_created" }, "Order created");
logger.error({ error, orderId: "456" }, "Failed to sync order");
```

### Analytics

**Vercel Analytics:**

```bash
npm install @vercel/analytics
```

```typescript
// app/layout.tsx
import { Analytics } from "@vercel/analytics/react";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

**Custom events:**

```typescript
import { track } from "@vercel/analytics";

track("order_created", {
  factoryId: "123",
  quantity: 5000,
});
```

### Health Checks

```typescript
// app/api/health/route.ts

import { prisma } from "@/lib/db";

export async function GET() {
  try {
    // Check database
    await prisma.$queryRaw`SELECT 1`;

    // Check Redis (Phase 3)
    // await redis.ping();

    return Response.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json(
      {
        status: "unhealthy",
        error: error.message,
      },
      { status: 503 }
    );
  }
}
```

---

## Risk Mitigation

### Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Database performance degrades with scale | High | Medium | Use indexes, connection pooling, caching |
| Integration adapters fail frequently | High | Medium | Retry logic, circuit breakers, alerting |
| Vercel cost exceeds budget | Medium | Low | Monitor usage, set spending limits, have backup plan |
| Data sync conflicts (manual vs integration) | Medium | High | Clear conflict resolution strategy, audit logs |
| Security breach | Critical | Low | Follow OWASP guidelines, regular audits, encryption |

### Business Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Factories refuse to integrate | High | Medium | Start with manual entry, offer value first, pilot program |
| Users don't adopt platform | High | Low | Focus on UX, onboarding, support |
| Competitor launches similar product | Medium | Medium | Move fast, build relationships, add unique features |

### Timeline Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Phase 3 takes longer than 3 weeks | Medium | High | Start with 1-2 adapters, add more later |
| Bugs delay launch | Medium | Medium | Test early, test often, have buffer time |
| Scope creep | High | High | Stick to plan, defer non-critical features |

---

## Success Criteria

### Phase 1 Success (Week 3)
- [ ] 2+ team members using platform daily
- [ ] 10+ factories created
- [ ] 50+ orders tracked
- [ ] Zero critical bugs
- [ ] Mobile responsive

### Phase 2 Success (Week 5)
- [ ] Dashboard loads <2 seconds
- [ ] Alerts generating correctly
- [ ] Email notifications working
- [ ] Charts rendering with real data
- [ ] Users report satisfaction

### Phase 3 Success (Week 8)
- [ ] 2+ pilot factories integrated successfully
- [ ] Syncs running every 15 minutes
- [ ] 95%+ sync success rate
- [ ] Integration setup <30 minutes
- [ ] Zero data loss

### Production Launch
- [ ] 10+ factories on platform
- [ ] 5+ with automatic integration
- [ ] 100+ orders tracked
- [ ] 95%+ uptime
- [ ] <5 support tickets per week
- [ ] Positive user feedback

---

## Conclusion

This plan provides FAANG-level detail for building the sourcing dashboard systematically over 8 weeks. Key principles:

1. **Start Simple:** Phase 1 delivers value without integrations
2. **Iterate Fast:** Merge small features daily, not big features weekly
3. **Test Early:** Don't wait until end to test
4. **Communicate:** Daily status updates prevent conflicts
5. **Measure:** Track performance, errors, usage from day 1
6. **Scale Gradually:** Don't over-engineer for scale you don't have yet

**Most Important:** Follow the collaboration workflow in COLLABORATION.md. Technical debt is easier to fix than git conflicts and duplicate work.

**Next Steps:**
1. Both cofounders read this document
2. Schedule Day 0 kickoff meeting
3. Create GitHub Issues for all Phase 1 tasks
4. Start Week 1 Day 1 together (foundation setup)
5. Execute the plan!

Good luck! 🚀
