# Product Session: Sourcing Dashboard for Client Transparency

**Date:** March 2026
**Context:** Working session between Filip Vrablik (co-founder, Salto) and a coding agent to define the architecture and product logic for a client-facing sourcing dashboard.

---

## Goal

Define what a V1 sourcing dashboard should look like for Salto's clients — brands and DTC companies who outsource manufacturing to factories we manage. The problem: clients have zero visibility into what happens between placing an order and receiving goods. They rely on email threads, WhatsApp messages, and spreadsheets. We want to replace that with a real-time dashboard that gives them structured, honest transparency without exposing our internal operations.

---

## My Initial Prompt

> We run a sourcing agency. Our clients place orders with factories through us. Right now they have no visibility into production status, shipment timelines, or potential delays. I want to build a dashboard where clients can log in and see what's happening with their orders — production stage, estimated delivery, any risks. But I don't want to expose everything. Some data is internal (our margins, factory-level negotiations, supplier scorecards). I need a system that separates what the client sees from what we operate on internally. What should the architecture look like?

---

## Agent Response

### Data Model

The core entities are:

- **Organization** — the client company (e.g., a DTC brand)
- **Factory** — the manufacturing facility fulfilling the order
- **Order** — a specific production order tied to one factory and one client
- **Stage** — a discrete phase in the production lifecycle (fabric sourcing, cutting, sewing, QC, packing, shipment)
- **Shipment** — logistics data once goods leave the factory

Each order moves through a linear sequence of stages. Each stage has:
- `status`: enum — `NOT_STARTED | IN_PROGRESS | COMPLETED | DELAYED | ON_HOLD`
- `startedAt`: timestamp or null
- `estimatedCompletion`: date
- `actualCompletion`: date or null
- `notes`: text (internal-only or client-visible, flagged separately)

### Visibility Layer

Not everything goes to the client. The system needs a visibility flag on most data points:

| Data | Client-Visible | Internal-Only |
|---|---|---|
| Order status + current stage | Yes | — |
| Stage completion % | Yes | — |
| Estimated delivery date | Yes | — |
| Delay flag + reason (simplified) | Yes | — |
| Factory name | Configurable | — |
| Unit cost / margin | — | Yes |
| Supplier scorecard | — | Yes |
| Internal notes / escalations | — | Yes |
| Raw factory communication logs | — | Yes |

This is not a permissions system in the traditional RBAC sense. It is a data projection layer — the client API only returns fields marked as visible. Internal users see the full object. The separation is enforced at the API level, not the frontend.

### Suggested Schema (Postgres)

```
organizations (id, name, domain, created_at)
factories (id, name, location, organization_id, internal_rating, created_at)
orders (id, organization_id, factory_id, sku, quantity, unit_cost, currency, status, created_at, estimated_delivery, actual_delivery)
order_stages (id, order_id, stage_name, status, started_at, estimated_completion, actual_completion, internal_notes, client_notes, position)
shipments (id, order_id, carrier, tracking_number, shipped_at, estimated_arrival, actual_arrival, status)
```

`unit_cost` and `internal_rating` never leave the internal API surface. The client-facing API serializes a reduced DTO:

```typescript
// Client-facing response shape
interface ClientOrderView {
  id: string;
  sku: string;
  quantity: number;
  status: OrderStatus;
  currentStage: string;
  stages: {
    name: string;
    status: StageStatus;
    estimatedCompletion: string | null;
    clientNotes: string | null;
  }[];
  estimatedDelivery: string;
  shipment: {
    carrier: string;
    trackingNumber: string;
    status: ShipmentStatus;
    estimatedArrival: string;
  } | null;
  flags: RiskFlag[];
}
```

### Risk Flags

Risk flags are derived, not manually set. Logic:

- `DELAYED` — current stage's `estimatedCompletion` has passed and `status != COMPLETED`
- `AT_RISK` — current stage is within 48h of `estimatedCompletion` and progress indicators suggest it won't land
- `SHIPMENT_DELAYED` — `shipped_at` is null and order is past final production stage completion
- `ON_HOLD` — any stage explicitly marked `ON_HOLD` (requires a reason)

The client sees the flag and a sanitized reason. Internally, the team sees the full context — which factory contact was escalated to, what the root cause is, what recovery actions are underway.

### V1 Scope vs. Later

**V1 (launch with this):**
- Client login (email + password, org-scoped)
- Order list view with status badges
- Order detail view: stage timeline, current stage highlight, estimated delivery
- Risk flags surfaced on both list and detail
- Shipment tracking (carrier + tracking number, basic status)
- Internal dashboard: full data, ability to update stages, add notes

**Not V1 (defer explicitly):**
- Real-time notifications or email alerts
- Supplier scorecards or factory comparison views
- Document management (PO uploads, invoices)
- Cost breakdowns or financial reporting
- Chat or messaging between client and agency
- Automated stage updates from factory systems (requires integration work)

The reason to defer those: each one adds either a communication channel (complexity), a data integration dependency (factories don't have APIs), or a financial surface area (liability). V1 should prove that structured visibility alone is valuable.

---

## My Follow-Up

> This is solid but I want to pressure-test the stage model. In reality, production stages aren't perfectly linear. Sometimes QC fails and the order goes back to sewing. Sometimes fabric is delayed so cutting can't start. How should the system handle non-linear stage progression? Also — I want the client dashboard to feel simple, not like a project management tool. What's the minimum UI that communicates "your order is on track" or "there's an issue"?

---

## Refined Response

### Non-Linear Stage Handling

The stage model should stay linear in presentation but support exceptions in data:

1. **Stage regression**: If QC fails and production returns to an earlier stage, the system creates a new stage entry rather than resetting the old one. So the order might show: `Cutting → Sewing → QC (Failed) → Sewing (Rework) → QC (Passed)`. The client sees a simplified version: "QC issue identified — rework in progress, revised ETA: +5 days." Internally, both QC entries exist with full notes.

2. **Blocked stages**: If a stage can't start because a predecessor is delayed, its status stays `NOT_STARTED` with a derived flag `BLOCKED_BY: [stage_name]`. This is internal. The client sees the delay reflected in the estimated delivery date, not the internal dependency chain.

3. **Parallel stages**: Some processes overlap (e.g., packing starts before full QC is complete on large orders). The `position` field on `order_stages` allows co-positioned stages. The timeline UI handles this by showing them side-by-side rather than stacked.

Implementation: add a `parent_stage_id` nullable FK on `order_stages` for rework lineage, and a `blocked_by_stage_id` for dependency tracking. Neither is exposed to the client API.

```
order_stages (
  id, order_id, stage_name, status,
  started_at, estimated_completion, actual_completion,
  internal_notes, client_notes, position,
  parent_stage_id,       -- references order_stages(id), null for original stages
  blocked_by_stage_id,   -- references order_stages(id), null if not blocked
  is_rework              -- boolean, false by default
)
```

### Minimum Client UI

The client doesn't need a Gantt chart. They need three things:

**1. Status at a glance (order list)**
Each order shows: SKU, quantity, a single status badge (`On Track`, `Delayed`, `At Risk`, `Delivered`), and the estimated delivery date. That's it. No stage breakdown on the list view. Color-coded: green, red, amber, neutral.

**2. Stage timeline (order detail)**
A horizontal or vertical progress bar with named stages. Completed stages are filled, current stage is highlighted, future stages are dimmed. If there's a delay or rework, a single annotation appears on the affected stage: "Delayed — revised ETA: [date]" or "Rework in progress." No internal jargon, no factory names unless configured.

**3. One summary line per order**
Auto-generated from the data. Examples:
- "Production is on schedule. Currently in sewing. Expected delivery: April 12."
- "QC identified a defect. Rework is underway. Delivery pushed to April 19."
- "Shipment dispatched via DHL. Tracking: 1234567890. Arriving ~April 22."

This summary line is the most important UI element. If the client reads nothing else, this sentence tells them what they need to know. It is generated from stage status, risk flags, and shipment data — not manually written.

### Summary Generation Logic (Pseudocode)

```
if shipment.status == DELIVERED:
  return "Order delivered on {actual_arrival}."

if shipment.status == IN_TRANSIT:
  return "Shipped via {carrier}. Tracking: {tracking_number}. Arriving ~{estimated_arrival}."

if any stage has flag DELAYED:
  delayed_stage = get_delayed_stage(order)
  return "{delayed_stage.name} is delayed. {client_reason}. Revised delivery: {new_eta}."

if any stage is_rework:
  rework_stage = get_rework_stage(order)
  return "Rework in progress at {rework_stage.name}. Delivery adjusted to {new_eta}."

if current_stage:
  return "On schedule. Currently in {current_stage.name}. Expected delivery: {estimated_delivery}."
```

The key is that this is deterministic, not LLM-generated. Clients see consistent, predictable language. No hallucinated status updates.

---

## What I Took From It

This session clarified three things I was conflating:

**1. Visibility is the product, not features.**
The instinct is to keep adding — alerts, messaging, documents, cost views. But the core value proposition is: "log in and know where your order stands." Everything else is a layer on top. V1 proves or disproves whether structured transparency reduces the volume of "where's my order?" emails and WhatsApp messages. If it doesn't, no amount of features will fix it.

**2. The data projection layer is the hard architectural decision.**
The same database serves two fundamentally different views. Getting the separation wrong means either exposing margin data to clients (trust-breaking) or hiding delay information from them (defeats the purpose). This isn't a role-based access control problem — it's a data modeling problem. The API must enforce which fields serialize into which response shape. No shared DTO that "hides" fields on the frontend. The client API endpoint literally returns a different object.

**3. Non-linear production is a data problem, not a UI problem.**
Clients don't need to understand rework loops or blocked dependencies. They need a revised ETA and a one-sentence explanation. The complexity lives in the data model (parent stage references, rework flags, dependency tracking). The client-facing UI stays linear and simple. This is where most sourcing tools get it wrong — they either oversimplify the data (losing accuracy) or expose the complexity (overwhelming the client).

**Next step:** Build the schema in Postgres, wire up the internal stage-update flow, and ship a read-only client view with the summary line. Validate with 2-3 existing clients whether the summary line alone reduces their need to email us for updates.
