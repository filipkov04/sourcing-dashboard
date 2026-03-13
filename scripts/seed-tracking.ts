/**
 * Seeds 2 orders with fake tracking data so you can see the full tracking UI:
 * - Map markers with pulsing dots
 * - Tracking card with event timeline
 * - Status dots in orders table
 *
 * Usage: npx tsx scripts/seed-tracking.ts
 */

import { PrismaClient, TrackingStatus, OrderStatus, ShippingMethod } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Find 2 orders that aren't delivered/cancelled
  const orders = await prisma.order.findMany({
    where: { status: { notIn: ["DELIVERED", "CANCELLED"] } },
    take: 2,
    orderBy: { createdAt: "desc" },
    select: { id: true, orderNumber: true, productName: true, status: true },
  });

  if (orders.length === 0) {
    console.log("No active orders found to seed tracking data.");
    return;
  }

  console.log(`Found ${orders.length} orders to seed:\n`);

  // Order 1: In transit through Suez Canal (ocean freight)
  const order1 = orders[0];
  console.log(`  📦 ${order1.orderNumber} — ${order1.productName}`);
  console.log(`     Setting: IN_TRANSIT via Suez Canal, ETA +5 days`);

  await prisma.order.update({
    where: { id: order1.id },
    data: {
      trackingNumber: "MAEU1234567890",
      carrier: "Maersk",
      carrierCode: "2151",
      shippingMethod: ShippingMethod.OCEAN,
      trackingStatus: TrackingStatus.IN_TRANSIT,
      currentLat: 30.0,
      currentLng: 32.3,
      currentLocation: "Suez Canal, EG",
      estimatedArrival: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      lastTrackingSync: new Date(),
      status: OrderStatus.IN_TRANSIT,
    },
  });

  // Add tracking events for order 1
  const now = new Date();
  const events1 = [
    { daysAgo: 12, location: "Shanghai, CN", description: "Shipment picked up from factory", status: TrackingStatus.INFO_RECEIVED },
    { daysAgo: 10, location: "Port of Shanghai, CN", description: "Loaded on vessel MAERSK SALALAH", status: TrackingStatus.IN_TRANSIT },
    { daysAgo: 7, location: "Singapore, SG", description: "Transshipment — vessel MAERSK SALALAH", status: TrackingStatus.IN_TRANSIT },
    { daysAgo: 4, location: "Colombo, LK", description: "In transit to next port", status: TrackingStatus.IN_TRANSIT },
    { daysAgo: 1, location: "Suez Canal, EG", description: "Entering Suez Canal", status: TrackingStatus.IN_TRANSIT },
    { daysAgo: 0, location: "Suez Canal, EG", description: "Transiting Suez Canal", status: TrackingStatus.IN_TRANSIT },
  ];

  // Delete existing events for this order first
  await prisma.trackingEvent.deleteMany({ where: { orderId: order1.id } });

  for (const e of events1) {
    await prisma.trackingEvent.create({
      data: {
        orderId: order1.id,
        timestamp: new Date(now.getTime() - e.daysAgo * 24 * 60 * 60 * 1000),
        location: e.location,
        description: e.description,
        trackingStatus: e.status,
        source: "17track-seed",
      },
    });
  }

  console.log(`     ✅ ${events1.length} tracking events created\n`);

  // Order 2: Held at customs (if we have a second order)
  if (orders.length >= 2) {
    const order2 = orders[1];
    console.log(`  📦 ${order2.orderNumber} — ${order2.productName}`);
    console.log(`     Setting: CUSTOMS hold at Port of Koper, ETA +2 days`);

    await prisma.order.update({
      where: { id: order2.id },
      data: {
        trackingNumber: "CMAU9876543210",
        carrier: "CMA CGM",
        carrierCode: "4025",
        shippingMethod: ShippingMethod.OCEAN,
        trackingStatus: TrackingStatus.CUSTOMS,
        currentLat: 45.55,
        currentLng: 13.73,
        currentLocation: "Port of Koper, SI",
        estimatedArrival: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        lastTrackingSync: new Date(),
        status: OrderStatus.CUSTOMS,
      },
    });

    const events2 = [
      { daysAgo: 18, location: "Guangzhou, CN", description: "Shipment received from shipper", status: TrackingStatus.INFO_RECEIVED },
      { daysAgo: 16, location: "Port of Nansha, CN", description: "Loaded on vessel CMA CGM MARCO POLO", status: TrackingStatus.IN_TRANSIT },
      { daysAgo: 8, location: "Port Said, EG", description: "Transited Suez Canal", status: TrackingStatus.IN_TRANSIT },
      { daysAgo: 3, location: "Port of Koper, SI", description: "Arrived at port of destination", status: TrackingStatus.IN_TRANSIT },
      { daysAgo: 2, location: "Port of Koper, SI", description: "Customs inspection initiated", status: TrackingStatus.CUSTOMS },
      { daysAgo: 0, location: "Port of Koper, SI", description: "Held at customs — awaiting documentation", status: TrackingStatus.CUSTOMS },
    ];

    await prisma.trackingEvent.deleteMany({ where: { orderId: order2.id } });

    for (const e of events2) {
      await prisma.trackingEvent.create({
        data: {
          orderId: order2.id,
          timestamp: new Date(now.getTime() - e.daysAgo * 24 * 60 * 60 * 1000),
          location: e.location,
          description: e.description,
          trackingStatus: e.status,
          source: "17track-seed",
        },
      });
    }

    console.log(`     ✅ ${events2.length} tracking events created\n`);
  }

  console.log("🎉 Done! Refresh your browser to see:");
  console.log("   • Dashboard map → cyan pulsing dots at Suez Canal + Port of Koper");
  console.log("   • Orders table → tracking column with carrier + status dot");
  console.log("   • Order detail → Shipping & Tracking card with event timeline");
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
