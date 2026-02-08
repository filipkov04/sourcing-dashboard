import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import * as api from "@/lib/api";
import { geocode, parseCountry, parseCity } from "@/lib/geo";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return api.unauthorized();
    }

    const factories = await prisma.factory.findMany({
      where: { organizationId: session.user.organizationId },
      select: {
        id: true,
        name: true,
        location: true,
        address: true,
        latitude: true,
        longitude: true,
        _count: { select: { orders: true } },
      },
    });

    const locations = factories
      .map((f) => {
        // Prefer DB coordinates, fall back to static geocode
        let lat = f.latitude;
        let lng = f.longitude;
        if (lat == null || lng == null) {
          const coords = geocode(f.location);
          if (!coords) return null;
          lat = coords[0];
          lng = coords[1];
        }

        return {
          id: f.id,
          name: f.name,
          location: f.location,
          address: f.address,
          country: parseCountry(f.location),
          city: parseCity(f.location),
          lat,
          lng,
          orderCount: f._count.orders,
        };
      })
      .filter(Boolean);

    return api.success(locations);
  } catch (error) {
    console.error("Factory locations error:", error);
    return api.error("Failed to fetch factory locations");
  }
}
