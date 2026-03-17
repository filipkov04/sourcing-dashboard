import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { success, created, unauthorized, handleError, validationError, projectScope, forbidden } from "@/lib/api";
import { auth } from "@/lib/auth";
import { z } from "zod";

// GET /api/factories - Get all factories for the organization
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return unauthorized();
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    const where: { organizationId: string; projectId?: string; OR?: Array<Record<string, unknown>> } = {
      ...projectScope(session),
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } },
        { contactName: { contains: search, mode: "insensitive" } },
      ];
    }

    const factories = await prisma.factory.findMany({
      where,
      include: {
        _count: {
          select: { orders: true },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return success(factories);
  } catch (err) {
    return handleError(err);
  }
}

// Validation schema for factory creation
const createFactorySchema = z.object({
  name: z.string().min(1, "Factory name is required").max(100),
  location: z.string().min(1, "Location is required").max(100),
  address: z.string().max(500).optional(),
  contactName: z.string().max(100).optional(),
  contactEmail: z.string().email("Invalid email address").optional().or(z.literal("")),
  contactPhone: z.string().max(50).optional(),
});

// POST /api/factories - Create a new factory
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return unauthorized();
    }

    // Only ADMIN and OWNER can create factories directly
    const role = session.user?.role;
    if (role !== "ADMIN" && role !== "OWNER") {
      return forbidden("Only admins can create factories directly. Please submit a request instead.");
    }

    const body = await request.json();

    // Validate request body
    const validation = createFactorySchema.safeParse(body);
    if (!validation.success) {
      return validationError(validation.error);
    }

    const data = validation.data;

    // Create factory
    const factory = await prisma.factory.create({
      data: {
        name: data.name,
        location: data.location,
        address: data.address || null,
        contactName: data.contactName || null,
        contactEmail: data.contactEmail || null,
        contactPhone: data.contactPhone || null,
        ...projectScope(session),
      },
      include: {
        _count: {
          select: { orders: true },
        },
      },
    });

    return created(factory, "Factory created successfully");
  } catch (err) {
    return handleError(err);
  }
}
