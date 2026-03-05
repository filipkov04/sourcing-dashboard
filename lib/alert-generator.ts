import { prisma } from "@/lib/db";
import type { Severity } from "@prisma/client";

type AlertInput = {
  organizationId: string;
  projectId?: string | null;
  title: string;
  message: string;
  severity: Severity;
  orderId?: string;
  factoryId?: string;
};

/**
 * Create an alert if a matching unresolved alert doesn't already exist.
 * Deduplicates by title + orderId + factoryId combination.
 */
async function createAlertIfNew(alert: AlertInput) {
  const existing = await prisma.alert.findFirst({
    where: {
      organizationId: alert.organizationId,
      title: alert.title,
      orderId: alert.orderId ?? null,
      factoryId: alert.factoryId ?? null,
      resolved: false,
    },
  });

  if (existing) return null;

  const { projectId, ...rest } = alert;
  return prisma.alert.create({
    data: {
      ...rest,
      ...(projectId ? { projectId } : {}),
    },
  });
}

/**
 * Scan all active orders in an organization and generate alerts for:
 * 1. Overdue orders (expectedDate has passed, order not completed/shipped/delivered/cancelled)
 * 2. Orders due soon (within 3 days) that are behind schedule
 * 3. Disrupted orders (have BLOCKED stages)
 * 4. Delayed stages
 */
export async function generateAlertsForOrganization(organizationId: string) {
  const now = new Date();
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  // Fetch all active orders with stages and factory info
  const activeOrders = await prisma.order.findMany({
    where: {
      organizationId,
      status: { in: ["PENDING", "IN_PROGRESS", "DELAYED", "DISRUPTED"] },
    },
    include: {
      factory: { select: { id: true, name: true } },
      stages: { orderBy: { sequence: "asc" } },
    },
  });

  const alerts: AlertInput[] = [];

  for (const order of activeOrders) {
    const isOverdue = order.expectedDate < now;
    const isDueSoon = !isOverdue && order.expectedDate <= threeDaysFromNow;
    const blockedStages = order.stages.filter((s) => s.status === "BLOCKED");
    const delayedStages = order.stages.filter((s) => s.status === "DELAYED");

    // 1. Overdue order
    if (isOverdue) {
      const daysOverdue = Math.ceil(
        (now.getTime() - order.expectedDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      alerts.push({
        organizationId,
        projectId: order.projectId,
        title: "Order overdue",
        message: `Order ${order.orderNumber} (${order.productName}) is ${daysOverdue} day${daysOverdue !== 1 ? "s" : ""} past its expected delivery date. Factory: ${order.factory.name}. Progress: ${order.overallProgress}%.`,
        severity: daysOverdue > 7 ? "CRITICAL" : "ERROR",
        orderId: order.id,
        factoryId: order.factory.id,
      });
    }

    // 2. Due soon + behind schedule (less than 80% complete with <3 days left)
    if (isDueSoon && order.overallProgress < 80) {
      alerts.push({
        organizationId,
        projectId: order.projectId,
        title: "Order at risk",
        message: `Order ${order.orderNumber} (${order.productName}) is due in less than 3 days but only ${order.overallProgress}% complete. Factory: ${order.factory.name}.`,
        severity: "WARNING",
        orderId: order.id,
        factoryId: order.factory.id,
      });
    }

    // 3. Disrupted — blocked stages
    for (const stage of blockedStages) {
      alerts.push({
        organizationId,
        projectId: order.projectId,
        title: "Stage blocked",
        message: `Stage "${stage.name}" on order ${order.orderNumber} (${order.productName}) is blocked. Factory: ${order.factory.name}.`,
        severity: "CRITICAL",
        orderId: order.id,
        factoryId: order.factory.id,
      });
    }

    // 4. Delayed stages
    for (const stage of delayedStages) {
      alerts.push({
        organizationId,
        projectId: order.projectId,
        title: "Stage delayed",
        message: `Stage "${stage.name}" on order ${order.orderNumber} (${order.productName}) is delayed. Factory: ${order.factory.name}.`,
        severity: "WARNING",
        orderId: order.id,
        factoryId: order.factory.id,
      });
    }
  }

  // Create alerts with deduplication
  const created = await Promise.all(alerts.map(createAlertIfNew));

  // Also generate recurrence alerts
  const recurrenceAlerts = await generateRecurrenceAlerts(organizationId);

  return [...created.filter(Boolean), ...recurrenceAlerts];
}

/**
 * Generate alerts for orders with recurrence enabled that are due for reorder soon.
 * Creates INFO alerts for 3-7 days out, WARNING for 0-2 days or past due.
 * Prevents spam by checking recurrenceLastAlertAt (minimum 3 days between alerts).
 */
async function generateRecurrenceAlerts(organizationId: string) {
  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

  // Find orders with recurrence enabled and next date within 7 days
  const recurringOrders = await prisma.order.findMany({
    where: {
      organizationId,
      recurrenceEnabled: true,
      recurrenceNextDate: { lte: sevenDaysFromNow },
      OR: [
        { recurrenceLastAlertAt: null },
        { recurrenceLastAlertAt: { lt: threeDaysAgo } },
      ],
    },
    include: {
      factory: { select: { id: true, name: true } },
    },
  });

  const results = [];

  for (const order of recurringOrders) {
    if (!order.recurrenceNextDate) continue;

    const daysUntilDue = Math.ceil(
      (order.recurrenceNextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    const isOverdue = daysUntilDue < 0;
    const isDueSoon = daysUntilDue >= 0 && daysUntilDue <= 2;
    const severity: Severity = isOverdue || isDueSoon ? "WARNING" : "INFO";
    const title = isOverdue ? "Recurring order overdue" : "Recurring order due soon";
    const dateStr = order.recurrenceNextDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const message = `Order ${order.orderNumber} (${order.productName}) is scheduled for reorder on ${dateStr}. Click below to start a new order.`;

    const alert = await createAlertIfNew({
      organizationId,
      projectId: order.projectId,
      title,
      message,
      severity,
      orderId: order.id,
      factoryId: order.factory.id,
    });

    if (alert) {
      results.push(alert);
    }

    // Update last alert timestamp regardless (even if deduplicated) to prevent re-querying
    await prisma.order.update({
      where: { id: order.id },
      data: { recurrenceLastAlertAt: now },
    });
  }

  return results;
}

/**
 * Auto-resolve alerts when their condition is no longer true.
 * E.g., if an order is completed, resolve its "overdue" alerts.
 */
export async function autoResolveAlerts(organizationId: string) {
  // Find all completed/shipped/delivered/cancelled order IDs
  const resolvedOrders = await prisma.order.findMany({
    where: {
      organizationId,
      status: { in: ["COMPLETED", "SHIPPED", "DELIVERED", "CANCELLED"] },
    },
    select: { id: true },
  });

  const resolvedOrderIds = resolvedOrders.map((o) => o.id);
  if (resolvedOrderIds.length === 0) return 0;

  // Resolve any unresolved alerts for those orders
  const result = await prisma.alert.updateMany({
    where: {
      organizationId,
      orderId: { in: resolvedOrderIds },
      resolved: false,
    },
    data: {
      resolved: true,
      resolvedAt: new Date(),
      resolvedBy: "system",
    },
  });

  return result.count;
}

/**
 * Generate a single inline alert (called from stage/order update routes).
 * Fire-and-forget — doesn't block the response.
 */
export function fireAlert(alert: AlertInput) {
  createAlertIfNew(alert).catch(console.error);
}
