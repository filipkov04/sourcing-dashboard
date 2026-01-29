# Developer Task Breakdown
## 8-Week Implementation Plan - Divided by Developer

**Purpose:** This document shows exactly what each developer needs to do, week by week.

**Format:** Each task includes:
- 🔧 **Technical:** What the developer actually builds
- 📱 **Non-Technical:** What it means for the product
- ⏱️ **Time Estimate:** How long it should take
- 🔗 **Dependencies:** What must be done first

---

## 📊 Work Distribution Overview

### Developer A (Filip) - Focus Areas:
- Factory Management (CRUD)
- Dashboard & Analytics
- Team Management
- Integration UI (Phase 3)

### Developer B (Cofounder) - Focus Areas:
- Order Management (CRUD)
- Order Detail & Progress Tracking
- Alerts & Notifications
- Integration Backend (Phase 3)

### Shared (Both Together):
- Week 1 Day 1-2: Foundation
- Code reviews
- Weekly planning

---

## WEEK 1: Foundation Setup

### Day 1 (Monday) - BOTH DEVELOPERS TOGETHER (Pair Programming)

#### Task 1.1: Project Setup
**👥 Who:** Both (pair program - one types, one guides)
**⏱️ Time:** 2 hours

**🔧 Technical:**
```bash
# Create Next.js project
npx create-next-app@latest sourcing-dashboard --typescript --tailwind --app
cd sourcing-dashboard

# Install core dependencies
npm install prisma @prisma/client
npm install next-auth@beta bcryptjs
npm install zod react-hook-form @hookform/resolvers
npm install -D @types/bcryptjs

# Initialize Prisma
npx prisma init --datasource-provider postgresql

# Setup git
git init
git add .
git commit -m "Initial project setup"
git remote add origin git@github.com:filipkov04/sourcing-dashboard.git
git push -u origin main
```

**📱 Non-Technical:**
- Sets up the blank project
- Installs necessary tools and libraries
- Connects to database
- Pushes first version to GitHub

**✅ Done When:**
- Project runs locally (`npm run dev` works)
- Can see blank Next.js page at localhost:3000
- Code is on GitHub

---

#### Task 1.2: Database Schema Design
**👥 Who:** Both (pair program - critical shared foundation)
**⏱️ Time:** 3 hours

**🔧 Technical:**
Create `prisma/schema.prisma`:

```prisma
// Core models needed for Phase 1
model User {
  id             String   @id @default(cuid())
  email          String   @unique
  name           String?
  password       String
  role           UserRole @default(MEMBER)
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@index([organizationId])
  @@index([email])
}

enum UserRole {
  OWNER
  ADMIN
  MEMBER
  VIEWER
}

model Organization {
  id        String   @id @default(cuid())
  name      String
  slug      String   @unique
  logo      String?
  users     User[]
  factories Factory[]
  orders    Order[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([slug])
}

model Factory {
  id             String   @id @default(cuid())
  name           String
  location       String
  contactName    String?
  contactEmail   String?
  contactPhone   String?
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  orders         Order[]
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@index([organizationId])
}

model Order {
  id              String      @id @default(cuid())
  orderNumber     String
  productName     String
  quantity        Int
  overallProgress Int         @default(0)
  status          OrderStatus @default(PENDING)
  orderDate       DateTime
  expectedDate    DateTime
  organizationId  String
  organization    Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  factoryId       String
  factory         Factory   @relation(fields: [factoryId], references: [id], onDelete: Cascade)
  stages          OrderStage[]
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@unique([organizationId, orderNumber])
  @@index([organizationId])
  @@index([factoryId])
  @@index([status])
}

enum OrderStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  SHIPPED
  CANCELLED
}

model OrderStage {
  id          String      @id @default(cuid())
  name        String
  sequence    Int
  progress    Int         @default(0)
  status      StageStatus @default(NOT_STARTED)
  orderId     String
  order       Order       @relation(fields: [orderId], references: [id], onDelete: Cascade)
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  @@unique([orderId, sequence])
  @@index([orderId])
}

enum StageStatus {
  NOT_STARTED
  IN_PROGRESS
  COMPLETED
}
```

**📱 Non-Technical:**
- Defines all the data the app will store
- Like creating columns in a spreadsheet
- Organizations (companies using the platform)
- Users (team members)
- Factories (manufacturers)
- Orders (production orders)
- Order Stages (cutting, sewing, QC, etc.)

**✅ Done When:**
- Schema file created
- Both developers agree on structure
- Run `npx prisma generate` successfully
- Run `npx prisma db push` successfully
- Database tables created

---

#### Task 1.3: Shared TypeScript Types
**👥 Who:** Both (pair program)
**⏱️ Time:** 1 hour

**🔧 Technical:**
Create `lib/types.ts`:

```typescript
// Export Prisma types
export type { User, Organization, Factory, Order, OrderStage } from '@prisma/client';
export { UserRole, OrderStatus, StageStatus } from '@prisma/client';

// API response wrapper
export type ApiResponse<T = any> =
  | { success: true; data: T }
  | { success: false; error: ApiError };

export interface ApiError {
  code: string;
  message: string;
  statusCode: number;
  details?: any;
}

// Extended types with relations
export interface OrderWithFactory extends Order {
  factory: Factory;
  stages: OrderStage[];
}

export interface FactoryWithOrders extends Factory {
  orders: Order[];
}

// Form types
export interface CreateFactoryInput {
  name: string;
  location: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
}

export interface CreateOrderInput {
  orderNumber: string;
  productName: string;
  quantity: number;
  factoryId: string;
  orderDate: string;
  expectedDate: string;
  stages?: { name: string; sequence: number }[];
}
```

**📱 Non-Technical:**
- Defines data formats used throughout the app
- Ensures both developers use consistent data structures
- Prevents bugs from mismatched data

**✅ Done When:**
- Types file created
- No TypeScript errors
- Both developers reviewed and approved

---

#### Task 1.4: Authentication Setup
**👥 Who:** Both (pair program)
**⏱️ Time:** 2 hours

**🔧 Technical:**
Create `lib/auth.ts`:

```typescript
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./db";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      credentials: {
        email: { type: "email" },
        password: { type: "password" },
      },
      async authorize(credentials) {
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: { organization: true },
        });

        if (!user?.password) return null;

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          organizationId: user.organizationId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.organizationId = user.organizationId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role;
        session.user.organizationId = token.organizationId;
      }
      return session;
    },
  },
});
```

Create `app/api/auth/[...nextauth]/route.ts`:
```typescript
import { handlers } from "@/lib/auth";
export const { GET, POST } = handlers;
```

**📱 Non-Technical:**
- Sets up login system
- Users can create accounts with email/password
- Secure password storage (encrypted)
- Session management (stays logged in)

**✅ Done When:**
- Can create a user in database
- Can log in with email/password
- Session persists across page refreshes
- Can log out

---

**End of Day 1:**
- ✅ Project setup complete
- ✅ Database structure defined
- ✅ Authentication working
- ✅ Foundation solid for both developers to build on
- ✅ Code committed to GitHub main branch

---

### Day 2 (Tuesday) - BOTH DEVELOPERS TOGETHER

#### Task 1.5: Basic Layout & Navigation
**👥 Who:** Both (pair program)
**⏱️ Time:** 3 hours

**🔧 Technical:**
Create `app/layout.tsx`:

```typescript
import { Providers } from './providers';
import { Sidebar } from '@/components/sidebar';
import { Header } from '@/components/header';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <div className="flex h-screen">
            <Sidebar />
            <div className="flex-1 flex flex-col">
              <Header />
              <main className="flex-1 overflow-auto p-6">
                {children}
              </main>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
```

Create navigation components:
- `components/sidebar.tsx` - Left sidebar with nav links
- `components/header.tsx` - Top header with user menu
- `components/ui/button.tsx` - Reusable button component
- `components/ui/input.tsx` - Reusable input component

**📱 Non-Technical:**
- Creates the app shell (layout)
- Sidebar for navigation
- Header with logout button
- Consistent look across all pages

**✅ Done When:**
- Layout renders correctly
- Sidebar shows links (Dashboard, Factories, Orders)
- Header shows user name and logout
- Mobile responsive

---

#### Task 1.6: API Response Helpers
**👥 Who:** Both (pair program)
**⏱️ Time:** 1 hour

**🔧 Technical:**
Create `lib/api/response.ts`:

```typescript
import { NextResponse } from 'next/server';
import { ApiResponse, ApiError } from '../types';

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function errorResponse(
  code: string,
  message: string,
  statusCode = 400,
  details?: any
) {
  return NextResponse.json(
    {
      success: false,
      error: { code, message, statusCode, details },
    },
    { status: statusCode }
  );
}
```

**📱 Non-Technical:**
- Standardizes how API returns data
- Consistent error messages
- Makes debugging easier

**✅ Done When:**
- Helper functions created
- Both developers understand usage
- Example API route created to test

---

**End of Day 2:**
- ✅ Basic layout complete
- ✅ Navigation working
- ✅ API helpers ready
- ✅ Ready to split up and work in parallel
- ✅ Code committed and pushed

---

### Day 3-5 (Wed-Fri) - SPLIT UP (PARALLEL WORK)

Now developers work independently on different features.

---

## DEVELOPER A (Filip) - Week 1, Day 3-5

### Task 1.7: Factory List Page
**👤 Who:** Developer A only
**⏱️ Time:** 3 hours
**🔗 Dependencies:** Foundation complete

**🔧 Technical:**
Create `app/factories/page.tsx`:

```typescript
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { FactoryList } from '@/components/factories/factory-list';

export default async function FactoriesPage() {
  const session = await auth();

  const factories = await prisma.factory.findMany({
    where: { organizationId: session.user.organizationId },
    include: {
      _count: { select: { orders: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Factories</h1>
        <Link href="/factories/new">
          <Button>Add Factory</Button>
        </Link>
      </div>
      <FactoryList factories={factories} />
    </div>
  );
}
```

Create `components/factories/factory-list.tsx`:
- Table showing all factories
- Columns: Name, Location, Contact, # of Orders
- Click row to view details
- Search bar
- Loading skeleton

**📱 Non-Technical:**
- Page showing all factories
- See factory name, location, contact info
- Shows how many orders each factory has
- Search for factories
- Button to add new factory

**✅ Done When:**
- Page loads and shows factories
- Search works
- No console errors
- Mobile responsive
- Pushed to GitHub branch `feature/factory-list`

---

### Task 1.8: Factory API Endpoints (GET, POST)
**👤 Who:** Developer A only
**⏱️ Time:** 2 hours
**🔗 Dependencies:** Task 1.7

**🔧 Technical:**
Create `app/api/factories/route.ts`:

```typescript
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/api/response';
import { z } from 'zod';

const createFactorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  location: z.string().min(1, 'Location is required'),
  contactName: z.string().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return errorResponse('UNAUTHORIZED', 'Not authenticated', 401);
    }

    const factories = await prisma.factory.findMany({
      where: { organizationId: session.user.organizationId },
      include: {
        _count: { select: { orders: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse(factories);
  } catch (error) {
    return errorResponse('SERVER_ERROR', error.message, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return errorResponse('UNAUTHORIZED', 'Not authenticated', 401);
    }

    const body = await request.json();
    const validated = createFactorySchema.parse(body);

    const factory = await prisma.factory.create({
      data: {
        ...validated,
        organizationId: session.user.organizationId,
      },
    });

    return successResponse(factory, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse('VALIDATION_ERROR', 'Invalid input', 400, error.errors);
    }
    return errorResponse('SERVER_ERROR', error.message, 500);
  }
}
```

**📱 Non-Technical:**
- API to get list of factories
- API to create new factory
- Validates data (ensures required fields are filled)
- Only shows factories for your organization (security)

**✅ Done When:**
- GET /api/factories returns list
- POST /api/factories creates factory
- Validation works (rejects invalid data)
- Only returns user's own org's factories
- Tested with Postman/curl
- Pushed to GitHub

---

### Task 1.9: Factory Create Page
**👤 Who:** Developer A only
**⏱️ Time:** 3 hours
**🔗 Dependencies:** Task 1.8

**🔧 Technical:**
Create `app/factories/new/page.tsx`:

```typescript
import { FactoryForm } from '@/components/factories/factory-form';

export default function NewFactoryPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Add Factory</h1>
      <FactoryForm />
    </div>
  );
}
```

Create `components/factories/factory-form.tsx`:

```typescript
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';

const factorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  location: z.string().min(1, 'Location is required'),
  contactName: z.string().optional(),
  contactEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  contactPhone: z.string().optional(),
});

export function FactoryForm({ factory = null }) {
  const router = useRouter();
  const form = useForm({
    resolver: zodResolver(factorySchema),
    defaultValues: factory || {},
  });

  async function onSubmit(data) {
    const response = await fetch('/api/factories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      router.push('/factories');
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label>Factory Name *</label>
        <input {...form.register('name')} />
        {form.formState.errors.name && <p className="text-red-500">{form.formState.errors.name.message}</p>}
      </div>

      <div>
        <label>Location *</label>
        <input {...form.register('location')} placeholder="e.g., Guangzhou, China" />
        {form.formState.errors.location && <p className="text-red-500">{form.formState.errors.location.message}</p>}
      </div>

      <div>
        <label>Contact Name</label>
        <input {...form.register('contactName')} />
      </div>

      <div>
        <label>Contact Email</label>
        <input {...form.register('contactEmail')} type="email" />
        {form.formState.errors.contactEmail && <p className="text-red-500">{form.formState.errors.contactEmail.message}</p>}
      </div>

      <div>
        <label>Contact Phone</label>
        <input {...form.register('contactPhone')} />
      </div>

      <button type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? 'Creating...' : 'Create Factory'}
      </button>
    </form>
  );
}
```

**📱 Non-Technical:**
- Form to add new factory
- Fields: Name, Location, Contact info
- Validates data before submitting
- Shows error messages if fields invalid
- Redirects to factory list after creation
- Loading state while submitting

**✅ Done When:**
- Form renders correctly
- Can create factory successfully
- Validation works (shows errors)
- Redirects after success
- Mobile responsive
- Pushed to GitHub

---

### Task 1.10: Create Pull Request for Factory List
**👤 Who:** Developer A only
**⏱️ Time:** 30 minutes
**🔗 Dependencies:** Tasks 1.7-1.9 complete

**🔧 Technical:**
```bash
# Ensure all changes committed
git add .
git commit -m "Add factory list page, API, and create form"
git push origin feature/factory-list

# Go to GitHub and create Pull Request
# Title: "Add factory management (list, create)"
# Description: See template below
```

**Pull Request Template:**
```markdown
## What does this PR do?
Adds factory management capabilities:
- Factory list page with search
- Factory creation form with validation
- API endpoints (GET, POST)

## Files Changed
- `app/factories/page.tsx` - Factory list page
- `app/factories/new/page.tsx` - Create factory page
- `app/api/factories/route.ts` - API endpoints
- `components/factories/factory-list.tsx` - List component
- `components/factories/factory-form.tsx` - Form component

## How to Test
1. Go to http://localhost:3000/factories
2. Click "Add Factory"
3. Fill in form and submit
4. Verify factory appears in list
5. Test search functionality

## Screenshots
[Add screenshots of factory list and create form]

## Checklist
- [x] Code works locally
- [x] No console errors
- [x] No TypeScript errors
- [x] Mobile responsive
- [x] Follows project patterns
- [ ] Code reviewed by Developer B
```

**📱 Non-Technical:**
- Packages all factory work into one bundle
- Requests Developer B to review
- Provides testing instructions
- Includes screenshots

**✅ Done When:**
- PR created on GitHub
- Developer B tagged for review
- All changes pushed

---

**Developer A - End of Week 1:**
- ✅ Factory list page complete
- ✅ Factory create page complete
- ✅ Factory API endpoints working
- ✅ Pull request created
- ✅ Waiting for Developer B review
- **Next Week:** Factory edit/delete, factory detail page

---

## DEVELOPER B (Cofounder) - Week 1, Day 3-5

### Task 1.11: Order List Page
**👤 Who:** Developer B only
**⏱️ Time:** 4 hours
**🔗 Dependencies:** Foundation complete

**🔧 Technical:**
Create `app/orders/page.tsx`:

```typescript
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { OrderList } from '@/components/orders/order-list';

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: { status?: string; factoryId?: string; search?: string };
}) {
  const session = await auth();

  const where = {
    organizationId: session.user.organizationId,
    ...(searchParams.status && { status: searchParams.status }),
    ...(searchParams.factoryId && { factoryId: searchParams.factoryId }),
    ...(searchParams.search && {
      OR: [
        { orderNumber: { contains: searchParams.search, mode: 'insensitive' } },
        { productName: { contains: searchParams.search, mode: 'insensitive' } },
      ],
    }),
  };

  const orders = await prisma.order.findMany({
    where,
    include: {
      factory: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const factories = await prisma.factory.findMany({
    where: { organizationId: session.user.organizationId },
    select: { id: true, name: true },
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Orders</h1>
        <Link href="/orders/new">
          <Button>Create Order</Button>
        </Link>
      </div>
      <OrderList orders={orders} factories={factories} />
    </div>
  );
}
```

Create `components/orders/order-list.tsx`:
- Table with columns: Order #, Product, Factory, Quantity, Progress, Status, Due Date
- Filter by status (dropdown)
- Filter by factory (dropdown)
- Search by order number or product name
- Color-coded status badges
- Progress bar for each order
- Click row to view details

**📱 Non-Technical:**
- Page showing all orders
- See order number, product name, which factory
- Shows progress (0-100%)
- Color-coded status (green = complete, yellow = in progress, red = delayed)
- Filter by status (show only "In Progress" orders)
- Filter by factory (show only Factory X orders)
- Search for specific order or product
- Button to create new order

**✅ Done When:**
- Page loads and shows orders
- All filters work
- Search works
- Progress bars display correctly
- Status colors correct
- No console errors
- Mobile responsive
- Pushed to GitHub branch `feature/order-list`

---

### Task 1.12: Order API Endpoints (GET, POST)
**👤 Who:** Developer B only
**⏱️ Time:** 2 hours
**🔗 Dependencies:** Task 1.11

**🔧 Technical:**
Create `app/api/orders/route.ts`:

```typescript
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/api/response';
import { z } from 'zod';

const createOrderSchema = z.object({
  orderNumber: z.string().min(1, 'Order number is required'),
  productName: z.string().min(1, 'Product name is required'),
  quantity: z.number().int().positive('Quantity must be positive'),
  factoryId: z.string().min(1, 'Factory is required'),
  orderDate: z.string().datetime(),
  expectedDate: z.string().datetime(),
  stages: z.array(z.object({
    name: z.string(),
    sequence: z.number().int(),
  })).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return errorResponse('UNAUTHORIZED', 'Not authenticated', 401);
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const factoryId = searchParams.get('factoryId');
    const search = searchParams.get('search');

    const where: any = {
      organizationId: session.user.organizationId,
    };

    if (status) where.status = status;
    if (factoryId) where.factoryId = factoryId;
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { productName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        factory: { select: { name: true, location: true } },
        stages: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse(orders);
  } catch (error) {
    return errorResponse('SERVER_ERROR', error.message, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return errorResponse('UNAUTHORIZED', 'Not authenticated', 401);
    }

    const body = await request.json();
    const validated = createOrderSchema.parse(body);

    // Check for duplicate order number
    const existing = await prisma.order.findUnique({
      where: {
        organizationId_orderNumber: {
          organizationId: session.user.organizationId,
          orderNumber: validated.orderNumber,
        },
      },
    });

    if (existing) {
      return errorResponse(
        'DUPLICATE_ORDER',
        'Order number already exists',
        400
      );
    }

    // Verify factory belongs to org
    const factory = await prisma.factory.findFirst({
      where: {
        id: validated.factoryId,
        organizationId: session.user.organizationId,
      },
    });

    if (!factory) {
      return errorResponse('INVALID_FACTORY', 'Factory not found', 404);
    }

    const order = await prisma.order.create({
      data: {
        orderNumber: validated.orderNumber,
        productName: validated.productName,
        quantity: validated.quantity,
        orderDate: new Date(validated.orderDate),
        expectedDate: new Date(validated.expectedDate),
        organizationId: session.user.organizationId,
        factoryId: validated.factoryId,
        stages: validated.stages ? {
          create: validated.stages.map(stage => ({
            name: stage.name,
            sequence: stage.sequence,
          })),
        } : undefined,
      },
      include: {
        factory: true,
        stages: true,
      },
    });

    return successResponse(order, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse('VALIDATION_ERROR', 'Invalid input', 400, error.errors);
    }
    return errorResponse('SERVER_ERROR', error.message, 500);
  }
}
```

**📱 Non-Technical:**
- API to get list of orders (with filters)
- API to create new order
- Validates all data
- Checks for duplicate order numbers
- Verifies factory exists
- Can create order with stages (cutting, sewing, etc.)
- Only shows/creates orders for your organization

**✅ Done When:**
- GET /api/orders returns list
- Filters work (status, factory, search)
- POST /api/orders creates order
- Duplicate order number rejected
- Invalid factory rejected
- Stages created with order
- Tested with Postman
- Pushed to GitHub

---

### Task 1.13: Order Create Page
**👤 Who:** Developer B only
**⏱️ Time:** 4 hours
**🔗 Dependencies:** Task 1.12

**🔧 Technical:**
Create `app/orders/new/page.tsx`:

```typescript
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { OrderForm } from '@/components/orders/order-form';

export default async function NewOrderPage() {
  const session = await auth();

  const factories = await prisma.factory.findMany({
    where: { organizationId: session.user.organizationId },
    select: { id: true, name: true, location: true },
    orderBy: { name: 'asc' },
  });

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Create Order</h1>
      <OrderForm factories={factories} />
    </div>
  );
}
```

Create `components/orders/order-form.tsx`:

```typescript
'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';

const orderSchema = z.object({
  orderNumber: z.string().min(1, 'Order number is required'),
  productName: z.string().min(1, 'Product name is required'),
  quantity: z.number().int().positive('Quantity must be positive'),
  factoryId: z.string().min(1, 'Please select a factory'),
  orderDate: z.string().min(1, 'Order date is required'),
  expectedDate: z.string().min(1, 'Expected date is required'),
  stages: z.array(z.object({
    name: z.string().min(1, 'Stage name required'),
    sequence: z.number(),
  })).optional(),
});

export function OrderForm({ order = null, factories }) {
  const router = useRouter();
  const form = useForm({
    resolver: zodResolver(orderSchema),
    defaultValues: order || {
      stages: [
        { name: 'Cutting', sequence: 1 },
        { name: 'Sewing', sequence: 2 },
        { name: 'Quality Check', sequence: 3 },
        { name: 'Packaging', sequence: 4 },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'stages',
  });

  async function onSubmit(data) {
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        quantity: parseInt(data.quantity),
      }),
    });

    if (response.ok) {
      const result = await response.json();
      router.push(`/orders/${result.data.id}`);
    } else {
      const error = await response.json();
      alert(error.error.message);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label>Order Number *</label>
          <input {...form.register('orderNumber')} placeholder="PO-2024-001" />
          {form.formState.errors.orderNumber && (
            <p className="text-red-500">{form.formState.errors.orderNumber.message}</p>
          )}
        </div>

        <div>
          <label>Factory *</label>
          <select {...form.register('factoryId')}>
            <option value="">Select factory...</option>
            {factories.map(factory => (
              <option key={factory.id} value={factory.id}>
                {factory.name} - {factory.location}
              </option>
            ))}
          </select>
          {form.formState.errors.factoryId && (
            <p className="text-red-500">{form.formState.errors.factoryId.message}</p>
          )}
        </div>
      </div>

      <div>
        <label>Product Name *</label>
        <input {...form.register('productName')} placeholder="Cotton T-Shirt - Navy" />
        {form.formState.errors.productName && (
          <p className="text-red-500">{form.formState.errors.productName.message}</p>
        )}
      </div>

      <div>
        <label>Quantity *</label>
        <input
          {...form.register('quantity', { valueAsNumber: true })}
          type="number"
          min="1"
          placeholder="5000"
        />
        {form.formState.errors.quantity && (
          <p className="text-red-500">{form.formState.errors.quantity.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label>Order Date *</label>
          <input {...form.register('orderDate')} type="date" />
          {form.formState.errors.orderDate && (
            <p className="text-red-500">{form.formState.errors.orderDate.message}</p>
          )}
        </div>

        <div>
          <label>Expected Completion Date *</label>
          <input {...form.register('expectedDate')} type="date" />
          {form.formState.errors.expectedDate && (
            <p className="text-red-500">{form.formState.errors.expectedDate.message}</p>
          )}
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <label>Production Stages (Optional)</label>
          <button
            type="button"
            onClick={() => append({ name: '', sequence: fields.length + 1 })}
            className="text-sm text-blue-600"
          >
            + Add Stage
          </button>
        </div>

        {fields.map((field, index) => (
          <div key={field.id} className="flex gap-2 mb-2">
            <span className="w-8 text-center">{index + 1}.</span>
            <input
              {...form.register(`stages.${index}.name`)}
              placeholder="e.g., Cutting, Sewing"
              className="flex-1"
            />
            <button
              type="button"
              onClick={() => remove(index)}
              className="text-red-600"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <button type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? 'Creating...' : 'Create Order'}
      </button>
    </form>
  );
}
```

**📱 Non-Technical:**
- Form to create new order
- Fields:
  - Order number (e.g., PO-2024-001)
  - Select factory from dropdown
  - Product name (e.g., "Cotton T-Shirt - Navy")
  - Quantity (number of units)
  - Order date
  - Expected completion date
  - Production stages (cutting, sewing, etc.) - can add/remove
- Validates all fields
- Shows errors if data invalid
- Redirects to order detail page after creation

**✅ Done When:**
- Form renders correctly
- Factory dropdown populated
- Can add/remove stages dynamically
- Validation works
- Successfully creates order
- Redirects to order detail page
- Mobile responsive
- Pushed to GitHub

---

### Task 1.14: Create Pull Request for Order List
**👤 Who:** Developer B only
**⏱️ Time:** 30 minutes
**🔗 Dependencies:** Tasks 1.11-1.13 complete

**🔧 Technical:**
```bash
git add .
git commit -m "Add order list page, API, and create form"
git push origin feature/order-list

# Create PR on GitHub with description
```

**Pull Request Template:**
```markdown
## What does this PR do?
Adds order management capabilities:
- Order list page with filters and search
- Order creation form with stages
- API endpoints (GET, POST)
- Validation and error handling

## Files Changed
- `app/orders/page.tsx` - Order list page
- `app/orders/new/page.tsx` - Create order page
- `app/api/orders/route.ts` - API endpoints
- `components/orders/order-list.tsx` - List component
- `components/orders/order-form.tsx` - Form component

## How to Test
1. Go to http://localhost:3000/orders
2. Click "Create Order"
3. Fill in form (select factory, add product details)
4. Add/remove stages
5. Submit and verify order created
6. Test filters (status, factory)
7. Test search

## Screenshots
[Add screenshots]

## Checklist
- [x] Code works locally
- [x] No console errors
- [x] All filters work
- [x] Mobile responsive
- [ ] Code reviewed by Developer A
```

**📱 Non-Technical:**
- Packages all order work
- Requests Developer A to review
- Provides testing steps

**✅ Done When:**
- PR created
- Developer A tagged
- All changes pushed

---

**Developer B - End of Week 1:**
- ✅ Order list page complete
- ✅ Order create page complete
- ✅ Order API endpoints working
- ✅ Pull request created
- ✅ Waiting for Developer A review
- **Next Week:** Order detail page, progress tracking

---

## CROSS-REVIEW (End of Week 1)

### Task 1.15: Code Review - Factory PR
**👤 Who:** Developer B reviews Developer A's code
**⏱️ Time:** 30 minutes

**🔧 Technical:**
1. Go to Developer A's PR on GitHub
2. Pull the branch locally:
```bash
git fetch origin
git checkout feature/factory-list
npm run dev
```
3. Test all functionality:
   - Factory list loads
   - Can create factory
   - Validation works
   - Search works
4. Review code:
   - Check for bugs
   - Ensure consistent style
   - Verify TypeScript types
5. Leave comments/approval on GitHub
6. Click "Approve" if all good

**📱 Non-Technical:**
- Check that factory features work correctly
- Make sure code quality is good
- Ensure it matches project standards

**✅ Done When:**
- PR approved or feedback given
- Developer A addresses any issues
- PR merged to main

---

### Task 1.16: Code Review - Order PR
**👤 Who:** Developer A reviews Developer B's code
**⏱️ Time:** 30 minutes

**🔧 Technical:**
Same process as Task 1.15, but for order features.

**📱 Non-Technical:**
- Check that order features work correctly
- Ensure quality and standards

**✅ Done When:**
- PR approved
- PR merged to main

---

## WEEK 2: Continue Building Features

### Summary of Week 2 Tasks

**Developer A (Filip):**
- Factory detail page
- Factory edit form
- Factory delete functionality
- Factory search/filter improvements

**Developer B (Cofounder):**
- Order detail page
- Order edit form
- Order progress update
- Order stages management

*(Detailed tasks for Week 2-8 continue in same format...)*

---

## Quick Reference: Who Does What

### Phase 1 (Weeks 1-3) - Foundation

| Feature | Developer A | Developer B |
|---------|-------------|-------------|
| Project Setup | ✅ Together | ✅ Together |
| Database Schema | ✅ Together | ✅ Together |
| Authentication | ✅ Together | ✅ Together |
| Layout/Navigation | ✅ Together | ✅ Together |
| Factory CRUD | ✅ | |
| Factory Detail | ✅ | |
| Order CRUD | | ✅ |
| Order Detail | | ✅ |
| Order Stages | | ✅ |
| Dashboard Page | ✅ | |
| Team Management | ✅ | |

### Phase 2 (Weeks 4-5) - Visualization

| Feature | Developer A | Developer B |
|---------|-------------|-------------|
| Dashboard Charts | ✅ | |
| Factory Analytics | ✅ | |
| Order Timeline | | ✅ |
| Alert System | | ✅ |
| Email Notifications | | ✅ |
| Export to CSV/Excel | ✅ | |

### Phase 3 (Weeks 6-8) - Integrations

| Feature | Developer A | Developer B |
|---------|-------------|-------------|
| Integration UI/Wizard | ✅ | |
| Integration Dashboard | ✅ | |
| REST API Adapter | | ✅ |
| SFTP Adapter | | ✅ |
| Webhook Receiver | | ✅ |
| Job Scheduler | | ✅ |
| Data Transformer | | ✅ |
| Encryption Utils | | ✅ |

---

## Daily Checklist (For Each Developer)

### Morning (9:00 AM):
- [ ] Pull latest code from main (`git checkout main && git pull origin main`)
- [ ] Merge main into your feature branch (`git merge main`)
- [ ] Check notifications (PR reviews, comments)
- [ ] Post in Slack: "Working on [task] today"

### During Day:
- [ ] Commit changes frequently (every 1-2 hours)
- [ ] Push to GitHub 2-3 times per day
- [ ] Test your changes locally
- [ ] Fix any TypeScript/linting errors

### End of Day (5:00 PM):
- [ ] Commit all work
- [ ] Push to GitHub
- [ ] Post progress update: "Finished [X], tomorrow doing [Y]"
- [ ] Review any pending PRs from cofounder

### Every 2-3 Days:
- [ ] Create Pull Request for completed feature
- [ ] Review cofounder's PR
- [ ] Merge approved PRs
- [ ] Start next task

---

## Conclusion

**For Developers:**
This is your detailed roadmap. Follow it task by task. When you complete a task, check it off and move to the next. If blocked, communicate immediately.

**For Founders:**
This shows exactly how the work is divided. Each developer has clear ownership of their features. They work in parallel on different parts, review each other's work, and merge frequently to avoid conflicts.

**Success = Following this plan + Daily communication + Frequent merges**

Questions? Check COLLABORATION.md for git workflow details or TECHNICAL_IMPLEMENTATION_PLAN.md for architecture details.
