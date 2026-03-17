# BEHIND_SCHEDULE Status Design

**Date:** 2026-03-14
**Goal:** Add a new order status that detects orders still in progress but projected to finish late, based on stage timeline slippage.

## New Status: BEHIND_SCHEDULE

**Position in severity:** IN_PROGRESS < BEHIND_SCHEDULE < DELAYED < DISRUPTED

**Definition:** An order is BEHIND_SCHEDULE when:
- It is currently IN_PROGRESS (no stages blocked or delayed right now)
- Stages have expected start/end dates populated
- Cumulative slippage from completed/in-progress stages projects the final stage finishing after the order's expected delivery date

**Auto-revert:** If later stages finish early and the projected completion comes back within the expected delivery date, the status reverts to IN_PROGRESS.

**Manual statuses (SHIPPED, DELIVERED, CANCELLED) are never overwritten.**

## Detection Logic (Stage Timeline Comparison)

For each IN_PROGRESS order with stage expected dates:
1. Calculate cumulative slippage: sum of (actual end - expected end) for completed stages + (now - expected end) for in-progress stages past their expected end
2. Project the final stage completion: last stage's expected end date + cumulative slippage
3. If projected completion > order expected delivery date → BEHIND_SCHEDULE

## Soft Warning: AT_RISK

For IN_PROGRESS orders where stages lack expected dates:
- Compare overall progress % against time elapsed % toward the expected delivery date
- If progress is significantly behind time (e.g., 40% progress with 70% of time elapsed) → flag as AT_RISK
- AT_RISK is NOT a database status — it's a computed visual indicator shown only in dashboard widgets (Action Required, Order Progress Snapshot)

## Schema Change

```prisma
enum OrderStatus {
  PENDING
  IN_PROGRESS
  BEHIND_SCHEDULE  // NEW — projected to finish late based on stage timelines
  DELAYED
  DISRUPTED
  COMPLETED
  SHIPPED
  IN_TRANSIT
  CUSTOMS
  DELIVERED
  CANCELLED
}
```

## Color: Amber/yellow — distinct from orange (delayed) and red (disrupted)

## Files to Change

1. `prisma/schema.prisma` — add BEHIND_SCHEDULE to enum
2. `lib/check-delays.ts` — add behind-schedule detection logic
3. Status color maps across UI components
4. `app/api/dashboard/action-required/route.ts` — include BEHIND_SCHEDULE + AT_RISK
5. `app/api/dashboard/order-progress/route.ts` — compute AT_RISK flag
6. Dashboard components — render new status + AT_RISK indicator
7. `CLAUDE.md` — update status system docs
