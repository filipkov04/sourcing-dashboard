/**
 * Data Transformer — task 7.10
 *
 * Centralises all field mapping and type coercion so adapters don't
 * duplicate the same logic. Adapters call transformRecords() to get
 * normalised data, then applyToDb() to persist it.
 */

import { prisma } from "@/lib/db";
import { OrderStatus, StageStatus } from "@prisma/client";

export type FactoryRecord = Record<string, unknown>;

export type FieldMap = {
  orderNumber: string;
  status?: string;
  progress?: string;
  stages?: string;
  stageNameField?: string;
  stageProgressField?: string;
  stageStatusField?: string;
  trackingNumber?: string;
};

export type TransformedStage = {
  index: number;
  progress?: number;
  status?: StageStatus;
};

export type TransformedOrder = {
  orderNumber: string;
  status?: OrderStatus;
  progress?: number;
  stages?: TransformedStage[];
  trackingNumber?: string;
};

// ─── Status mappers ───────────────────────────────────────────────────────────

const ORDER_STATUS_MAP: Record<string, OrderStatus> = {
  pending: OrderStatus.PENDING,
  new: OrderStatus.PENDING,
  placed: OrderStatus.PENDING,
  notstarted: OrderStatus.PENDING,
  inprogress: OrderStatus.IN_PROGRESS,
  production: OrderStatus.IN_PROGRESS,
  active: OrderStatus.IN_PROGRESS,
  manufacturing: OrderStatus.IN_PROGRESS,
  delayed: OrderStatus.DELAYED,
  late: OrderStatus.DELAYED,
  behind: OrderStatus.DELAYED,
  disrupted: OrderStatus.DISRUPTED,
  blocked: OrderStatus.DISRUPTED,
  stopped: OrderStatus.DISRUPTED,
  onhold: OrderStatus.DISRUPTED,
  completed: OrderStatus.COMPLETED,
  done: OrderStatus.COMPLETED,
  finished: OrderStatus.COMPLETED,
  complete: OrderStatus.COMPLETED,
  shipped: OrderStatus.SHIPPED,
  dispatched: OrderStatus.SHIPPED,
  intransit: OrderStatus.IN_TRANSIT,
  in_transit: OrderStatus.IN_TRANSIT,
  customs: OrderStatus.CUSTOMS,
  clearance: OrderStatus.CUSTOMS,
  held: OrderStatus.CUSTOMS,
  delivered: OrderStatus.DELIVERED,
  received: OrderStatus.DELIVERED,
  cancelled: OrderStatus.CANCELLED,
  canceled: OrderStatus.CANCELLED,
  void: OrderStatus.CANCELLED,
};

const STAGE_STATUS_MAP: Record<string, StageStatus> = {
  notstarted: StageStatus.NOT_STARTED,
  pending: StageStatus.NOT_STARTED,
  new: StageStatus.NOT_STARTED,
  inprogress: StageStatus.IN_PROGRESS,
  active: StageStatus.IN_PROGRESS,
  started: StageStatus.IN_PROGRESS,
  completed: StageStatus.COMPLETED,
  done: StageStatus.COMPLETED,
  finished: StageStatus.COMPLETED,
  skipped: StageStatus.SKIPPED,
  skip: StageStatus.SKIPPED,
  bypassed: StageStatus.SKIPPED,
  behindschedule: StageStatus.BEHIND_SCHEDULE,
  behind: StageStatus.BEHIND_SCHEDULE,
  late: StageStatus.BEHIND_SCHEDULE,
  delayed: StageStatus.DELAYED,
  overdue: StageStatus.DELAYED,
  blocked: StageStatus.BLOCKED,
  stopped: StageStatus.BLOCKED,
  disrupted: StageStatus.BLOCKED,
};

export function mapOrderStatus(raw: unknown): OrderStatus | null {
  if (typeof raw !== "string") return null;
  return ORDER_STATUS_MAP[raw.toLowerCase().replace(/[\s_-]/g, "")] ?? null;
}

export function mapStageStatus(raw: unknown): StageStatus | null {
  if (typeof raw !== "string") return null;
  return STAGE_STATUS_MAP[raw.toLowerCase().replace(/[\s_-]/g, "")] ?? null;
}

// ─── Record transformer ───────────────────────────────────────────────────────

/** Transforms a single raw factory record into our normalised shape. */
export function transformRecord(
  record: FactoryRecord,
  fieldMap: FieldMap
): TransformedOrder | null {
  const orderNumber = String(record[fieldMap.orderNumber] ?? "").trim();
  if (!orderNumber) return null;

  const result: TransformedOrder = { orderNumber };

  if (fieldMap.status) {
    const mapped = mapOrderStatus(record[fieldMap.status]);
    if (mapped) result.status = mapped;
  }

  if (fieldMap.progress) {
    const p = Number(record[fieldMap.progress]);
    if (!isNaN(p) && p >= 0 && p <= 100) result.progress = Math.round(p);
  }

  if (fieldMap.trackingNumber) {
    const tn = String(record[fieldMap.trackingNumber] ?? "").trim();
    if (tn) result.trackingNumber = tn;
  }

  if (fieldMap.stages && Array.isArray(record[fieldMap.stages])) {
    const rawStages = record[fieldMap.stages] as FactoryRecord[];
    result.stages = rawStages.map((s, i) => {
      const stage: TransformedStage = { index: i };
      if (fieldMap.stageProgressField) {
        const p = Number(s[fieldMap.stageProgressField]);
        if (!isNaN(p)) stage.progress = Math.round(Math.min(100, Math.max(0, p)));
      }
      if (fieldMap.stageStatusField) {
        const mapped = mapStageStatus(s[fieldMap.stageStatusField]);
        if (mapped) stage.status = mapped;
      }
      return stage;
    });
  }

  return result;
}

/** Transforms an array of raw factory records, dropping any without an order number. */
export function transformRecords(
  records: FactoryRecord[],
  fieldMap: FieldMap
): TransformedOrder[] {
  return records.flatMap((r) => {
    const t = transformRecord(r, fieldMap);
    return t ? [t] : [];
  });
}

// ─── DB writer ────────────────────────────────────────────────────────────────

// Terminal statuses set manually — never overwrite with factory data
const PROTECTED_STATUSES: string[] = ["SHIPPED", "IN_TRANSIT", "CUSTOMS", "DELIVERED", "CANCELLED"];

/**
 * Applies transformed orders to the database.
 * Returns the number of orders successfully synced.
 */
export async function applyToDb(
  orders: TransformedOrder[],
  organizationId: string
): Promise<number> {
  let synced = 0;

  for (const transformed of orders) {
    const order = await prisma.order.findUnique({
      where: {
        organizationId_orderNumber: {
          organizationId,
          orderNumber: transformed.orderNumber,
        },
      },
      include: { stages: { orderBy: { sequence: "asc" } } },
    });

    if (!order) continue; // We don't auto-create orders from factory data

    const updates: Record<string, unknown> = {};

    if (transformed.status && !PROTECTED_STATUSES.includes(order.status)) {
      updates.status = transformed.status;
    }
    if (transformed.progress !== undefined) {
      updates.overallProgress = transformed.progress;
    }
    if (transformed.trackingNumber && transformed.trackingNumber !== order.trackingNumber) {
      updates.trackingNumber = transformed.trackingNumber;
    }

    if (Object.keys(updates).length > 0) {
      await prisma.order.update({ where: { id: order.id }, data: updates });
    }

    if (transformed.stages) {
      for (const ts of transformed.stages) {
        const stage = order.stages[ts.index];
        if (!stage) continue;

        const stageUpdates: Record<string, unknown> = {};
        if (ts.progress !== undefined) stageUpdates.progress = ts.progress;
        if (ts.status) stageUpdates.status = ts.status;

        if (Object.keys(stageUpdates).length > 0) {
          await prisma.orderStage.update({ where: { id: stage.id }, data: stageUpdates });
        }
      }
    }

    synced++;
  }

  return synced;
}
