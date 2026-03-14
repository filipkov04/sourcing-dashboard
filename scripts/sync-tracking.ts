/**
 * Manual tracking sync script.
 * Usage: npx tsx scripts/sync-tracking.ts [orderId]
 * If no orderId given, syncs ALL orders with tracking numbers.
 */
import { PrismaClient, TrackingStatus, OrderStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const SEVENTEENTRACK_API = "https://api.17track.net/track/v2.2/gettrackinfo";

const STATUS_MAP: Record<number, TrackingStatus> = {
  0: TrackingStatus.NOT_FOUND,
  10: TrackingStatus.INFO_RECEIVED,
  20: TrackingStatus.IN_TRANSIT,
  25: TrackingStatus.CUSTOMS,
  30: TrackingStatus.IN_TRANSIT,
  35: TrackingStatus.CUSTOMS,
  40: TrackingStatus.DELIVERED,
  50: TrackingStatus.EXCEPTION,
  60: TrackingStatus.EXPIRED,
};

const TRACKING_TO_ORDER_STATUS: Partial<Record<TrackingStatus, OrderStatus>> = {
  [TrackingStatus.IN_TRANSIT]: OrderStatus.IN_TRANSIT,
  [TrackingStatus.CUSTOMS]: OrderStatus.CUSTOMS,
  [TrackingStatus.DELIVERED]: OrderStatus.DELIVERED,
};

async function main() {
  const apiKey = process.env.SEVENTEENTRACK_API_KEY;
  if (!apiKey) {
    console.error("SEVENTEENTRACK_API_KEY not set");
    process.exit(1);
  }

  const orderId = process.argv[2];

  const where: Record<string, unknown> = {
    trackingNumber: { not: null },
  };
  if (orderId) where.id = orderId;

  const orders = await prisma.order.findMany({
    where,
    select: {
      id: true,
      orderNumber: true,
      trackingNumber: true,
      status: true,
      trackingStatus: true,
      estimatedArrival: true,
    },
  });

  console.log(`Found ${orders.length} orders to sync`);

  for (const order of orders) {
    console.log(`\nSyncing ${order.orderNumber} (${order.trackingNumber})...`);

    const res = await fetch(SEVENTEENTRACK_API, {
      method: "POST",
      headers: { "Content-Type": "application/json", "17token": apiKey },
      body: JSON.stringify([{ number: order.trackingNumber }]),
    });

    if (!res.ok) {
      console.error(`  API error: ${res.status}`);
      continue;
    }

    const json = await res.json();
    const info = json?.data?.accepted?.[0];

    if (!info) {
      console.log("  No tracking data found");
      await prisma.order.update({
        where: { id: order.id },
        data: { trackingStatus: "NOT_FOUND", lastTrackingSync: new Date() },
      });
      continue;
    }

    const trackInfo = info.track_info;
    const latestStatus = trackInfo?.latest_status?.status ?? 0;
    let trackingStatus = STATUS_MAP[latestStatus] ?? TrackingStatus.NOT_FOUND;
    const KNOWN_CARRIERS: Record<string, string> = {
      "190008": "YunExpress", "2151": "YunExpress",
      "100002": "DHL", "100003": "FedEx", "100001": "UPS", "7021": "Maersk",
    };
    const carrierCode = String(info.carrier);
    const carrierName =
      info.param?.carrier_name && !info.param.carrier_name.startsWith("Carrier ")
        ? info.param.carrier_name
        : KNOWN_CARRIERS[carrierCode] ?? `Carrier ${carrierCode}`;

    // Fallback: if 17Track overall status is NOT_FOUND but events exist, use latest event status
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

    console.log(`  Carrier: ${carrierName} (${carrierCode})`);
    console.log(`  Status: ${trackingStatus}`);

    // Extract location
    const latestLocation = trackInfo?.misc_info?.latest_location;
    const currentLat = latestLocation?.lat ?? null;
    const currentLng = latestLocation?.lng ?? null;
    const currentLocation = latestLocation?.name ?? null;
    console.log(`  Location: ${currentLocation} (${currentLat}, ${currentLng})`);

    // Extract ETA
    const etaStr = trackInfo?.time_metrics?.estimated_delivery_date?.from ?? null;
    const estimatedArrival = etaStr ? new Date(etaStr) : null;

    // Upsert tracking events
    const providers = trackInfo?.tracking?.providers ?? [];
    let eventCount = 0;
    for (const provider of providers) {
      const events = provider.events ?? [];
      for (const event of events) {
        const eventTimestamp = new Date(event.time_iso);
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
              description: event.description,
              statusCode: String(event.status),
              trackingStatus: STATUS_MAP[event.status] ?? TrackingStatus.IN_TRANSIT,
              source: "17track",
            },
          });
          eventCount++;
        }
      }
    }
    console.log(`  Created ${eventCount} new tracking events`);

    // Update order
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

    const newOrderStatus = TRACKING_TO_ORDER_STATUS[trackingStatus];
    if (newOrderStatus) {
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
    }

    await prisma.order.update({
      where: { id: order.id },
      data: orderUpdates,
    });

    console.log(`  Order updated successfully`);
  }

  await prisma.$disconnect();
}

main().catch(console.error);
