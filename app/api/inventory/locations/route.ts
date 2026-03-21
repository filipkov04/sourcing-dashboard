import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { success, created, unauthorized, handleError, validationError, projectScope, forbidden } from "@/lib/api";
import { auth } from "@/lib/auth";
import { z } from "zod";

// GET /api/inventory/locations - List all inventory locations for the organization
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return unauthorized();
    }

    const locations = await prisma.inventoryLocation.findMany({
      where: {
        ...projectScope(session),
      },
      include: {
        _count: {
          select: { stockLevels: true },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return success(locations);
  } catch (err) {
    return handleError(err);
  }
}

// Validation schema for location creation
const createLocationSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(["WAREHOUSE", "FACTORY", "STORE", "VIRTUAL"]),
  address: z.string().max(500).optional(),
  isDefault: z.boolean().optional().default(false),
});

// POST /api/inventory/locations - Create a new inventory location
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return unauthorized();
    }

    // Only ADMIN and OWNER can create locations
    const role = session.user?.role;
    if (role !== "ADMIN" && role !== "OWNER") {
      return forbidden("Only admins can create inventory locations.");
    }

    const body = await request.json();

    // Validate request body
    const validation = createLocationSchema.safeParse(body);
    if (!validation.success) {
      return validationError(validation.error);
    }

    const data = validation.data;

    if (data.isDefault) {
      // Wrap in transaction: unset existing defaults, then create
      const location = await prisma.$transaction(async (tx) => {
        await tx.inventoryLocation.updateMany({
          where: {
            ...projectScope(session),
            isDefault: true,
          },
          data: { isDefault: false },
        });

        return tx.inventoryLocation.create({
          data: {
            name: data.name,
            type: data.type,
            address: data.address || null,
            isDefault: data.isDefault,
            ...projectScope(session),
          },
          include: {
            _count: {
              select: { stockLevels: true },
            },
          },
        });
      });

      return created(location, "Location created successfully");
    }

    // No default swap needed — simple create
    const location = await prisma.inventoryLocation.create({
      data: {
        name: data.name,
        type: data.type,
        address: data.address || null,
        isDefault: data.isDefault,
        ...projectScope(session),
      },
      include: {
        _count: {
          select: { stockLevels: true },
        },
      },
    });

    return created(location, "Location created successfully");
  } catch (err) {
    return handleError(err);
  }
}
