import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import * as api from "@/lib/api";
import { geocode, parseCountry, parseCity } from "@/lib/geo";

function offsetCoordinate(
  value: number,
  seed: string,
  index: number
): number {
  let hash = 0;
  const str = seed + index;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const offset = ((hash % 200) - 100) / 10000; // +/- 0.01 deg (~1km)
  return value + offset;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return api.unauthorized();
    }

    const factories = await prisma.factory.findMany({
      where: { ...api.projectScope(session) },
      select: {
        id: true,
        name: true,
        location: true,
        address: true,
        latitude: true,
        longitude: true,
        verificationStatus: true,
        categories: true,
        capabilities: true,
        moqMin: true,
        leadTimeDays: true,
        reliabilityScore: true,
        riskLevel: true,
        isPreferred: true,
        displayPrecision: true,
        lastQcAt: true,
        contactName: true,
        contactEmail: true,
        contactPhone: true,
        orders: {
          where: {
            status: { in: ["PENDING", "IN_PROGRESS", "DELAYED", "DISRUPTED"] },
          },
          select: {
            status: true,
            quantity: true,
          },
        },
      },
    });

    const locations = factories
      .map((f) => {
        let lat = f.latitude;
        let lng = f.longitude;
        if (lat == null || lng == null) {
          const coords = geocode(f.location);
          if (!coords) return null;
          lat = coords[0];
          lng = coords[1];
        }

        // Apply display precision
        if (f.displayPrecision === "APPROXIMATE") {
          lat = offsetCoordinate(lat, f.id, 0);
          lng = offsetCoordinate(lng, f.id, 1);
        } else if (f.displayPrecision === "CITY_LEVEL") {
          const cityCoords = geocode(f.location);
          if (cityCoords) {
            lat = cityCoords[0];
            lng = cityCoords[1];
          }
        }

        // Determine worst order status (priority: DISRUPTED > DELAYED > IN_PROGRESS > PENDING)
        const statusPriority: Record<string, number> = {
          DISRUPTED: 4,
          DELAYED: 3,
          IN_PROGRESS: 2,
          PENDING: 1,
        };
        let worstOrderStatus: string | null = null;
        let worstPriority = 0;
        for (const order of f.orders) {
          const p = statusPriority[order.status] ?? 0;
          if (p > worstPriority) {
            worstPriority = p;
            worstOrderStatus = order.status;
          }
        }

        const totalOrderQuantity = f.orders.reduce((sum, o) => sum + o.quantity, 0);

        return {
          id: f.id,
          name: f.name,
          location: f.location,
          address: f.address,
          country: parseCountry(f.location),
          city: parseCity(f.location),
          lat,
          lng,
          orderCount: f.orders.length,
          verificationStatus: f.verificationStatus,
          categories: f.categories,
          capabilities: f.capabilities,
          moqMin: f.moqMin,
          leadTimeDays: f.leadTimeDays,
          reliabilityScore: f.reliabilityScore,
          riskLevel: f.riskLevel,
          isPreferred: f.isPreferred,
          lastQcAt: f.lastQcAt,
          worstOrderStatus,
          totalOrderQuantity,
          contactName: f.contactName,
          contactEmail: f.contactEmail,
          contactPhone: f.contactPhone,
        };
      })
      .filter(Boolean);

    const uniqueCountries = new Set(
      locations.map((l) => l!.country)
    ).size;
    const totalActiveOrders = locations.reduce(
      (sum, l) => sum + l!.orderCount,
      0
    );
    const verifiedCount = locations.filter(
      (l) => l!.verificationStatus === "VERIFIED"
    ).length;

    return api.success({
      factories: locations,
      stats: {
        totalManufacturers: locations.length,
        countriesCovered: uniqueCountries,
        activeProductions: totalActiveOrders,
        verifiedPercent:
          locations.length > 0
            ? Math.round((verifiedCount / locations.length) * 100)
            : 0,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Factory locations error:", error);
    return api.error("Failed to fetch factory locations");
  }
}
