import { prisma } from "@/lib/db";

// Re-export types and utilities from history-utils for convenience
export type { OrderEventType, OrderEvent } from "@/lib/history-utils";
export { formatEventMessage, getEventIconType, getEventColor } from "@/lib/history-utils";

// Log an event to the order history (server-side only)
export async function logOrderEvent(
  orderId: string,
  eventType: string,
  field: string | null,
  oldValue: string | null,
  newValue: string | null,
  stageId?: string | null,
  stageName?: string | null
) {
  return prisma.orderEvent.create({
    data: {
      orderId,
      eventType,
      field,
      oldValue,
      newValue,
      stageId: stageId || null,
      stageName: stageName || null,
    },
  });
}
