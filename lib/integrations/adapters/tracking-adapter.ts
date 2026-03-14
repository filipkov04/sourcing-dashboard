/**
 * 17Track Carrier Tracking Adapter
 *
 * Polls 17Track API for shipment updates on orders with tracking numbers.
 * Auto-detects carrier from tracking number format.
 * Updates Order position, ETA, and creates TrackingEvent records.
 */

import { prisma } from "@/lib/db";
import { IntegrationAdapter, SyncContext, SyncResult } from "../types";
import {
  Integration,
  IntegrationType,
  OrderStatus,
  TrackingStatus,
} from "@prisma/client";

const SEVENTEENTRACK_API_BASE = "https://api.17track.net/track/v2.2";
const BATCH_SIZE = 40; // 17Track batch limit
const SYNC_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes default

// 17Track status codes → our TrackingStatus
const STATUS_MAP: Record<number, TrackingStatus> = {
  0: TrackingStatus.NOT_FOUND,
  10: TrackingStatus.INFO_RECEIVED,
  20: TrackingStatus.IN_TRANSIT,
  25: TrackingStatus.CUSTOMS,
  30: TrackingStatus.IN_TRANSIT, // "Arrived at destination country"
  35: TrackingStatus.CUSTOMS,
  40: TrackingStatus.DELIVERED,
  50: TrackingStatus.EXCEPTION,
  60: TrackingStatus.EXPIRED,
};

// Map TrackingStatus to OrderStatus for auto-updating
const TRACKING_TO_ORDER_STATUS: Partial<Record<TrackingStatus, OrderStatus>> = {
  [TrackingStatus.IN_TRANSIT]: OrderStatus.IN_TRANSIT,
  [TrackingStatus.CUSTOMS]: OrderStatus.CUSTOMS,
  [TrackingStatus.DELIVERED]: OrderStatus.DELIVERED,
};

type TrackInfo17 = {
  number: string;
  carrier: number;
  param?: { carrier_name?: string };
  track_info?: {
    latest_status?: { status: number };
    latest_event?: {
      time_iso: string;
      description: string;
      location?: string;
    };
    tracking?: {
      providers_hash?: number;
      providers?: Array<{
        events?: Array<{
          time_iso: string;
          description: string;
          location?: string;
          status: number;
          address?: {
            country?: string;
            state?: string;
            city?: string;
            street?: string;
            postal_code?: string;
            coordinates?: {
              longitude?: string;
              latitude?: string;
            };
          };
        }>;
      }>;
    };
    time_metrics?: { estimated_delivery_date?: { from?: string } };
    misc_info?: {
      latest_location?: { lat?: number; lng?: number; name?: string };
    };
  };
};

type TrackResponse17 = {
  code: number;
  data: {
    accepted: TrackInfo17[];
    rejected: Array<{ number: string; error: { code: number; message: string } }>;
  };
};

function getApiKey(): string | null {
  return process.env.SEVENTEENTRACK_API_KEY || null;
}

async function callTrackingAPI(
  trackingNumbers: string[]
): Promise<TrackInfo17[]> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("SEVENTEENTRACK_API_KEY not configured");

  const body = trackingNumbers.map((num) => ({ number: num }));

  const res = await fetch(`${SEVENTEENTRACK_API_BASE}/gettrackinfo`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "17token": apiKey,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) {
    throw new Error(`17Track API returned ${res.status}`);
  }

  const json = (await res.json()) as TrackResponse17;
  return json.data?.accepted ?? [];
}

export async function detectCarrier(
  trackingNumber: string
): Promise<{ carrierCode: string; carrierName: string } | null> {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  try {
    const res = await fetch(
      `${SEVENTEENTRACK_API_BASE.replace("gettrackinfo", "")}register`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "17token": apiKey,
        },
        body: JSON.stringify([{ number: trackingNumber }]),
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!res.ok) return null;

    const json = await res.json();
    const accepted = json?.data?.accepted?.[0];
    if (accepted?.carrier) {
      return {
        carrierCode: String(accepted.carrier),
        carrierName: accepted.param?.carrier_name ?? `Carrier ${accepted.carrier}`,
      };
    }
  } catch {
    // carrier detection is best-effort
  }

  return null;
}

export class TrackingAdapter implements IntegrationAdapter {
  type = IntegrationType.CARRIER_TRACKING;

  async testConnection(_integration: Integration): Promise<boolean> {
    const apiKey = getApiKey();
    if (!apiKey) return false;

    try {
      // Use a known test tracking number
      const res = await fetch(`${SEVENTEENTRACK_API_BASE}/gettrackinfo`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "17token": apiKey,
        },
        body: JSON.stringify([{ number: "TEST123456789" }]),
        signal: AbortSignal.timeout(10000),
      });
      return res.status === 200;
    } catch {
      return false;
    }
  }

  async sync(context: SyncContext): Promise<SyncResult> {
    const { organizationId } = context;
    const apiKey = getApiKey();

    if (!apiKey) {
      return {
        success: false,
        recordsSynced: 0,
        error: "SEVENTEENTRACK_API_KEY not configured",
      };
    }

    // Get orders with tracking numbers that need syncing
    const cutoff = new Date(Date.now() - SYNC_INTERVAL_MS);
    const orders = await prisma.order.findMany({
      where: {
        organizationId,
        trackingNumber: { not: null },
        trackingStatus: { notIn: [TrackingStatus.DELIVERED, TrackingStatus.EXPIRED] },
        OR: [
          { lastTrackingSync: null },
          { lastTrackingSync: { lt: cutoff } },
        ],
      },
      select: {
        id: true,
        trackingNumber: true,
        status: true,
        trackingStatus: true,
        estimatedArrival: true,
      },
    });

    if (orders.length === 0) {
      return { success: true, recordsSynced: 0 };
    }

    let totalSynced = 0;

    // Process in batches of 40
    for (let i = 0; i < orders.length; i += BATCH_SIZE) {
      const batch = orders.slice(i, i + BATCH_SIZE);
      const trackingNumbers = batch
        .map((o) => o.trackingNumber!)
        .filter(Boolean);

      let results: TrackInfo17[];
      try {
        results = await callTrackingAPI(trackingNumbers);
      } catch (err) {
        return {
          success: false,
          recordsSynced: totalSynced,
          error: err instanceof Error ? err.message : "17Track API error",
        };
      }

      // Map results by tracking number for quick lookup
      const resultMap = new Map<string, TrackInfo17>();
      for (const r of results) {
        resultMap.set(r.number, r);
      }

      for (const order of batch) {
        const info = resultMap.get(order.trackingNumber!);
        if (!info) continue;

        try {
          await this.processTrackingResult(order, info);
          totalSynced++;
        } catch {
          // Continue with next order on individual failure
        }
      }
    }

    return { success: true, recordsSynced: totalSynced };
  }

  private async processTrackingResult(
    order: {
      id: string;
      trackingNumber: string | null;
      status: OrderStatus;
      trackingStatus: TrackingStatus | null;
      estimatedArrival: Date | null;
    },
    info: TrackInfo17
  ) {
    const trackInfo = info.track_info;
    const latestStatus = trackInfo?.latest_status?.status ?? 0;
    let trackingStatus = STATUS_MAP[latestStatus] ?? TrackingStatus.NOT_FOUND;

    // Fallback: if 17Track says NOT_FOUND but events exist, infer from latest event
    if (trackingStatus === TrackingStatus.NOT_FOUND) {
      const providers = trackInfo?.tracking?.providers ?? [];
      for (const provider of providers) {
        const events = provider.events ?? [];
        if (events.length > 0) {
          const lastEvent = events[events.length - 1];
          trackingStatus = STATUS_MAP[lastEvent.status] ?? TrackingStatus.IN_TRANSIT;
          break;
        }
      }
    }

    // Extract carrier info — fallback to known carrier codes if 17Track doesn't provide a name
    const KNOWN_CARRIERS: Record<string, string> = {
      "190008": "YunExpress",
      "2151": "YunExpress",
      "100002": "DHL",
      "100003": "FedEx",
      "100001": "UPS",
      "7021": "Maersk",
    };
    const carrierCode = String(info.carrier);
    const carrierName =
      info.param?.carrier_name && !info.param.carrier_name.startsWith("Carrier ")
        ? info.param.carrier_name
        : KNOWN_CARRIERS[carrierCode] ?? `Carrier ${carrierCode}`;

    // Extract ETA
    const etaStr =
      trackInfo?.time_metrics?.estimated_delivery_date?.from ?? null;
    const estimatedArrival = etaStr ? new Date(etaStr) : null;

    // Upsert tracking events from carrier data, collecting coords along the way
    let latestEventLat: number | null = null;
    let latestEventLng: number | null = null;
    let latestEventLocation: string | null = null;

    const providers = trackInfo?.tracking?.providers ?? [];
    for (const provider of providers) {
      const events = provider.events ?? [];
      for (const event of events) {
        const eventTimestamp = new Date(event.time_iso);

        // Extract per-event coordinates from 17Track address field
        const eventLat = event.address?.coordinates?.latitude
          ? parseFloat(event.address.coordinates.latitude)
          : null;
        const eventLng = event.address?.coordinates?.longitude
          ? parseFloat(event.address.coordinates.longitude)
          : null;
        const hasCoords = eventLat != null && !isNaN(eventLat) && eventLng != null && !isNaN(eventLng);

        // Track latest event with valid coordinates for order position
        if (hasCoords) {
          latestEventLat = eventLat;
          latestEventLng = eventLng;
          latestEventLocation = event.location ?? null;
        }

        // Upsert by orderId + timestamp + description (avoid duplicates)
        const existing = await prisma.trackingEvent.findFirst({
          where: {
            orderId: order.id,
            timestamp: eventTimestamp,
            description: event.description,
          },
        });

        if (!existing) {
          await prisma.trackingEvent.create({
            data: {
              orderId: order.id,
              timestamp: eventTimestamp,
              location: event.location ?? null,
              latitude: hasCoords ? eventLat : null,
              longitude: hasCoords ? eventLng : null,
              description: event.description,
              statusCode: String(event.status),
              trackingStatus:
                STATUS_MAP[event.status] ?? TrackingStatus.IN_TRANSIT,
              source: "17track",
            },
          });
        } else if (hasCoords && (existing.latitude == null || existing.longitude == null)) {
          // Backfill coords on existing events that were missing them
          await prisma.trackingEvent.update({
            where: { id: existing.id },
            data: { latitude: eventLat, longitude: eventLng },
          });
        }
      }
    }

    // Determine current position: prefer misc_info.latest_location, then latest event coords
    const miscLocation = trackInfo?.misc_info?.latest_location;
    const currentLat = miscLocation?.lat ?? latestEventLat;
    const currentLng = miscLocation?.lng ?? latestEventLng;
    const currentLocation = miscLocation?.name ?? latestEventLocation;

    // Update order with latest tracking data
    const orderUpdates: Record<string, unknown> = {
      carrier: carrierName,
      carrierCode,
      trackingStatus,
      lastTrackingSync: new Date(),
    };

    if (currentLat !== null) orderUpdates.currentLat = currentLat;
    if (currentLng !== null) orderUpdates.currentLng = currentLng;
    if (currentLocation) orderUpdates.currentLocation = currentLocation;
    if (estimatedArrival) orderUpdates.estimatedArrival = estimatedArrival;

    // Auto-update order status based on tracking
    const newOrderStatus = TRACKING_TO_ORDER_STATUS[trackingStatus];
    if (newOrderStatus) {
      // Only upgrade status, don't downgrade (e.g. don't go from DELIVERED back to IN_TRANSIT)
      const statusPriority: OrderStatus[] = [
        OrderStatus.SHIPPED,
        OrderStatus.IN_TRANSIT,
        OrderStatus.CUSTOMS,
        OrderStatus.DELIVERED,
      ];
      const currentIdx = statusPriority.indexOf(order.status);
      const newIdx = statusPriority.indexOf(newOrderStatus);

      if (newIdx > currentIdx || currentIdx === -1) {
        orderUpdates.status = newOrderStatus;
      }

      // Set actualDate when delivered
      if (
        newOrderStatus === OrderStatus.DELIVERED &&
        order.status !== OrderStatus.DELIVERED
      ) {
        orderUpdates.actualDate = new Date();
      }
    }

    await prisma.order.update({
      where: { id: order.id },
      data: orderUpdates,
    });
  }
}
